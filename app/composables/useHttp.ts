import {createFetch, type FetchOptions, FetchError} from "ofetch";
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

// 登录态失效：后端在 token 过期 / 无效 / 缺失时统一返回 HTTP 401（body 形如 {status:401,message,data}）。
const UNAUTHORIZED_STATUS = 401;

// 防止短时间内多个并发请求同时返回 401 时，重复清会话 / 反复跳转 / 弹多次提示。
// 用模块级 flag 做一次性去重，首个命中的请求处理完毕后即释放。
let unauthorizedHandling = false;

// 单飞刷新：多个请求同时撞 401 时，只发起一次 /auth/refresh，其余共用同一个 Promise。
// 模块级而非组件级——刷新是全局唯一的，跨组件实例也要共享。
let refreshPromise: Promise<string | null> | null = null;

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
    // access token：JS 可读的 cookie，useHttp 自动作为 Bearer 头带上。
    // refresh token 在 HttpOnly cookie（后端 Set-Cookie 下发），JS 不可读，浏览器随请求自动携带。
    // Cookie 选项与 useAdminAuth 保持一致（7 天）：刷新后写回的新 token 才不会退化成会话 Cookie，
    // 否则首次刷新（约 2h）后浏览器一关闭 access token 就丢了，破坏「7 天内保持登录」。
    const authToken = useCookie<string | null>("chat_auth_token", {
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
        path: "/",
    });
    // 在 setup 阶段取一次 NaiveUI message 实例：401 处理发生在请求返回后的异步上下文，
    // 那时再调 useMessage 会拿不到注入的 provider，故提前取到闭包里复用。
    const messageApi = useMessage();
    // 后端 API 基址来自运行时配置（NUXT_PUBLIC_API_BASE），开发/生产通过 .env 切换。
    const apiBase = useRuntimeConfig().public.apiBase;

    const http = createFetch({
        defaults: {
            baseURL: apiBase,
            // 携带跨域 Cookie：刷新令牌走 HttpOnly Cookie，登录/刷新/登出与业务请求都要带上，
            // 否则后端收不到 refresh cookie，也写不回新的。
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        },
    });

    // 用 refresh cookie 换取新的 access token。走 $fetch 而非上面的 http 实例，
    // 避免再次进入 requestBase 的 401 重试逻辑造成递归。失败（refresh 也 401）返回 null。
    const refreshAccessToken = (): Promise<string | null> => {
        if (refreshPromise) {
            return refreshPromise;
        }
        refreshPromise = (async () => {
            try {
                const res = await $fetch<ApiResult<{ accessToken: string; tokenType: string; expiresIn: number }>>(
                    "/auth/refresh",
                    { baseURL: apiBase, method: "POST", credentials: "include" },
                );
                const token = res?.data?.accessToken;
                if (token) {
                    // 写回 access token cookie：后续请求（含本次重放）自动带上新令牌
                    authToken.value = token;
                    return token;
                }
                return null;
            } catch {
                return null;
            } finally {
                refreshPromise = null;
            }
        })();
        return refreshPromise;
    };

    // 把 ofetch 抛出的 FetchError 转成统一的 createError，并在 401 时触发 handleUnauthorized。
    // 返回 never，便于上层 catch 中「调用即抛出」的控制流推断。
    const handleFailure = (err: unknown): never => {
        if (err instanceof FetchError) {
            const body = err.data as ApiResult<unknown> | undefined;
            const status = err.response?.status ?? body?.status ?? 500;
            const message = body?.message ?? err.message ?? "Request failed";
            if (status === UNAUTHORIZED_STATUS) {
                handleUnauthorized(message, authToken, messageApi);
            }
            throw createError({
                statusCode: Number(status) || 500,
                statusMessage: message,
                data: body ?? { status, message },
            });
        }
        throw err;
    };

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

        // 每次发送都重新读 token：刷新成功后重放时能拿到新令牌
        const buildHeaders = () => {
            const requestHeaders = new Headers(fetchOptions.headers as HeadersInit | undefined);
            const authorization = normalizeAuthorization(authToken.value);
            if (authorization && !requestHeaders.has("Authorization")) {
                requestHeaders.set("Authorization", authorization);
            }
            return requestHeaders;
        };

        const send = () => http<ApiResult<TResponse>>(url, {
            method,
            ...fetchOptions,
            query,
            headers: buildHeaders(),
            body: requestBody,
        });

        // 先发请求；若命中 HTTP 401（access token 过期/失效），用 refresh cookie 换新令牌后重放一次。
        // 用 .catch 处理器集中处理错误：handleFailure 返回 never（内部必抛），各分支 return 它即可。
        const response = await send().catch(async (err: unknown): Promise<ApiResult<TResponse>> => {
            // 非 401 错误直接转 createError 抛出
            if (!(err instanceof FetchError) || err.response?.status !== UNAUTHORIZED_STATUS) {
                return handleFailure(err);
            }
            // HTTP 401：access token 过期 / 失效，尝试用 refresh cookie 换新令牌后重放一次
            const newToken = await refreshAccessToken();
            if (!newToken) {
                // refresh 也失败（refresh cookie 不存在 / 过期）→ 清会话 + 跳登录页
                return handleFailure(err);
            }
            try {
                return await send();
            } catch (retryErr) {
                // 重放仍失败：按真实错误抛出，不再二次刷新
                return handleFailure(retryErr);
            }
        });

        const responseCode = getResponseCode(response);
        if (responseCode !== SUCCESS_CODE && responseCode !== SUCCESS_CODE_ALTERNATE) {
            // 兜底：极少数情况下 HTTP 为 2xx 但 body.status 标记失败（含 401）的情况
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
