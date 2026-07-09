import {createFetch, type FetchOptions} from "ofetch";
import type {ApiResult} from "~/types/http";

type ParamMode = "query" | "json";
type QueryParams = Record<string, unknown>;
type JsonBody = BodyInit | Record<string, any> | null | undefined;

export interface HttpRequestOptions<T> extends Omit<FetchOptions<"json">, "baseURL" | "query" | "params" | "body"> {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    payloadMode?: ParamMode;
    params?: QueryParams;
    body?: T;
}

const SUCCESS_CODE = "200";
const SUCCESS_CODE_ALTERNATE = "0";

// 登录态失效：后端在 token 过期 / 无效 / 缺失时统一返回 status=401，
// message 可能是「Token 过期」「Token 无效」「Unauthorized」等。
// 只要 401 就意味着当前 token 无法继续鉴权，统一清掉本地凭据，避免带坏 token 重试继续失败。
const UNAUTHORIZED_STATUS = 401;

// 防止短时间内多个并发请求同时返回 401 时，重复清会话 / 反复跳转 / 弹多次提示。
// 用模块级 flag 做一次性去重，首个命中的请求处理完毕后即释放。
let unauthorizedHandling = false;

function normalizeAuthorization(token?: string | null) {
    const rawToken = token?.trim();
    if (!rawToken) {
        return "";
    }

    if (/^bearer\s+/i.test(rawToken)) {
        return rawToken;
    }

    return `Bearer ${rawToken}`;
}

function getResponseCode(response: ApiResult<unknown>) {
    const rawCode = response.status;
    if (rawCode === null || rawCode === undefined) {
        return "";
    }

    return String(rawCode);
}

function getResponseMessage(response: ApiResult<unknown>) {
    return response.message ?? "Request failed";
}

// 后端约定：登录态失效（token 过期 / 无效 / 缺失）统一返回 status=401，
// body 形如 { status: 401, message: "Token 过期" | "Token 无效" | "Unauthorized", data: {} }。
// 只要 401 即判定为鉴权失败，统一清理本地凭据，不再细分 message。
function isUnauthorized(response: ApiResult<unknown>) {
    return getResponseCode(response) === String(UNAUTHORIZED_STATUS);
}

// 客户端环境判断：token 清理、提示、跳转都依赖浏览器 API，SSR 阶段不做处理。
const isClient = () => typeof window !== "undefined";

// 判断当前是否处于管理端页面（/admin 下）：管理端的 401 过期需清会话 + 跳登录页 + 提示；
// 公开接口（首页 / 广场 / 想法墙等）即便命中过期也只是静默清 token，不打断浏览。
function isAdminRoute() {
    if (!isClient()) {
        return false;
    }

    return window.location.pathname.startsWith("/admin");
}

// 统一处理 401 鉴权失败：
//  - 清 chat_auth_token cookie + 管理员会话快照（sessionStorage / 内存）
//  - 管理端页面（/admin 下）：提示对应状态信息并跳转 /admin 登录页
//  - 公开页面：仅提示对应状态信息，静默清 token，不跳转（不打断浏览）
//
// authToken / messageApi 都复用 useHttp 闭包里 setup 阶段取到的实例：useHttp 在组件 setup 期间被调用，
// 此时 useCookie / useMessage 都能拿到 Nuxt / NaiveUI context；而本函数在请求 await 之后的异步上下文
// 执行，重新调用这些 composable 会拿不到实例，故必须在闭包里提前取好。
function handleUnauthorized(message: string, authToken: Ref<string | null>, messageApi: ReturnType<typeof useMessage>) {
    if (unauthorizedHandling) {
        return;
    }
    unauthorizedHandling = true;

    try {
        if (!isClient()) {
            return;
        }

        // 清掉会随之附在所有请求上的 Bearer token，及管理端 UI 用的会话快照
        authToken.value = null;
        sessionStorage.removeItem("global-admin-session");

        // 提示用后端返回的原始 message（如「Token 过期」「Token 无效」），缺失时给兜底文案
        const text = message || "登录已失效，请重新登录";
        if (isAdminRoute()) {
            messageApi?.warning(text);
            // 跳回登录页：navigateTo 是 SPA 跳转、message provider 挂在 app.vue 根不会被卸载，
            // 提示仍可显示；若异步上下文拿不到 Nuxt 实例导致跳转失败，则兜底整页跳转。
            try {
                navigateTo("/admin");
            } catch {
                window.location.assign("/admin");
            }
        } else {
            // 公开接口：仅提示对应状态并静默清 token，不跳转
            messageApi?.warning(text);
        }
    } finally {
        unauthorizedHandling = false;
    }
}

export const useHttp = () => {
    const authToken = useCookie<string | null>("chat_auth_token");
    // 在 setup 阶段取一次 NaiveUI message 实例：401 处理发生在请求返回后的异步上下文，
    // 那时再调 useMessage 会拿不到注入的 provider，故提前取到闭包里复用。
    const messageApi = useMessage();
    const apiBase = "http://192.168.1.35:8080/api";

    const http = createFetch({
        defaults: {
            baseURL: apiBase,
            headers: {
                Accept: "application/json",
            },
        },
    });

    const requestBase = async <TResponse, TPayload = Record<string, unknown>>(
        url: string,
        payload?: TPayload,
        options: HttpRequestOptions<TPayload> = {},
    ): Promise<ApiResult<TResponse>> => {
        const {payloadMode = "query", method = "GET", params, body, ...fetchOptions} = options;
        const query = payloadMode === "query"
            ? (params ?? (payload as QueryParams | undefined))
            : params;
        const requestBody = payloadMode === "json"
            ? ((body ?? payload) as JsonBody)
            : undefined;
        const requestHeaders = new Headers(fetchOptions.headers as HeadersInit | undefined);
        const authorization = normalizeAuthorization(authToken.value);
        if (authorization && !requestHeaders.has("Authorization")) {
            requestHeaders.set("Authorization", authorization);
        }

        const response = await http<ApiResult<TResponse>>(url, {
            method,
            ...fetchOptions,
            query,
            headers: requestHeaders,
            body: requestBody,
        });

        const responseCode = getResponseCode(response);
        if (responseCode !== SUCCESS_CODE && responseCode !== SUCCESS_CODE_ALTERNATE) {
            // 401 鉴权失败单独处理：清凭据 + （管理端）跳登录页，避免带坏 token 重试继续失败
            if (isUnauthorized(response)) {
                handleUnauthorized(getResponseMessage(response), authToken, messageApi);
            }

            throw createError({
                statusCode: Number(responseCode) || 500,
                statusMessage: getResponseMessage(response),
                data: response,
            });
        }

        return response;
    };

    const request = async <TResponse, TPayload = Record<string, unknown>>(
        url: string,
        payload?: TPayload,
        options: HttpRequestOptions<TPayload> = {},
    ): Promise<TResponse> => {
        const response = await requestBase<TResponse, TPayload>(url, payload, options);

        return response.data;
    };

    return {
        request,
        requestRaw: requestBase,
        get: <TResponse>(url: string, params?: QueryParams, options?: Omit<HttpRequestOptions<QueryParams>, "method" | "payloadMode" | "params" | "body">) =>
            request<TResponse>(url, params, {
                ...options,
                method: "GET",
                payloadMode: "query",
            }),
        getRaw: <TResponse>(url: string, params?: QueryParams, options?: Omit<HttpRequestOptions<QueryParams>, "method" | "payloadMode" | "params" | "body">) =>
            requestBase<TResponse>(url, params, {
                ...options,
                method: "GET",
                payloadMode: "query",
            }),
        post: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            request<TResponse, TPayload>(url, payload, {
                ...options,
                method: "POST",
            }),
        postRaw: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            requestBase<TResponse, TPayload>(url, payload, {
                ...options,
                method: "POST",
            }),
        put: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            request<TResponse, TPayload>(url, payload, {
                ...options,
                method: "PUT",
            }),
        putRaw: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            requestBase<TResponse, TPayload>(url, payload, {
                ...options,
                method: "PUT",
            }),
        patch: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            request<TResponse, TPayload>(url, payload, {
                ...options,
                method: "PATCH",
            }),
        patchRaw: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            requestBase<TResponse, TPayload>(url, payload, {
                ...options,
                method: "PATCH",
            }),
        delete: <TResponse>(url: string, params?: QueryParams, options?: Omit<HttpRequestOptions<QueryParams>, "method" | "payloadMode" | "params" | "body">) =>
            request<TResponse>(url, params, {
                ...options,
                method: "DELETE",
                payloadMode: "query",
            }),
        deleteRaw: <TResponse>(url: string, params?: QueryParams, options?: Omit<HttpRequestOptions<QueryParams>, "method" | "payloadMode" | "params" | "body">) =>
            requestBase<TResponse>(url, params, {
                ...options,
                method: "DELETE",
                payloadMode: "query",
            }),
    };
};
