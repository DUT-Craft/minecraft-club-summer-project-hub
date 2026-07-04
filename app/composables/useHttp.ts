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

export const useHttp = () => {
    const authToken = useCookie<string | null>("chat_auth_token");
    const apiBase = "http://127.0.0.1:8080/api";

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
