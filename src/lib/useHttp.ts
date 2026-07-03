import {createFetch, type FetchOptions} from "ofetch";
import type {ApiResult} from "./types/http";

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
const DEFAULT_API_BASE = "/api";

export class HttpRequestError extends Error {
    statusCode: number;
    statusMessage: string;
    data: ApiResult<unknown>;

    constructor(statusCode: number, statusMessage: string, data: ApiResult<unknown>) {
        super(statusMessage);
        this.name = "HttpRequestError";
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        this.data = data;
    }
}

export function getHttpErrorMessage(error: unknown, fallback = "Request failed") {
    if (error instanceof HttpRequestError) {
        return error.statusMessage;
    }

    return error instanceof Error ? error.message : fallback;
}

export function getHttpStatusCode(error: unknown) {
    return error instanceof HttpRequestError ? error.statusCode : 0;
}

function getResponseCode(response: ApiResult<unknown>) {
    const rawCode = response.code ?? response.status;
    if (rawCode === null || rawCode === undefined) {
        return "";
    }

    return String(rawCode);
}

function getResponseMessage(response: ApiResult<unknown>) {
    return response.msg ?? response.message ?? "Request failed";
}

export const useHttp = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE;

    const http = createFetch({
        defaults: {
            baseURL: apiBase,
            ignoreResponseError: true,
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
        const response = await http<ApiResult<TResponse>>(url, {
            method,
            ...fetchOptions,
            query,
            headers: fetchOptions.headers,
            body: requestBody,
        });

        const responseCode = getResponseCode(response);
        if (responseCode !== SUCCESS_CODE && responseCode !== SUCCESS_CODE_ALTERNATE) {
            throw new HttpRequestError(
                Number(responseCode) || 500,
                getResponseMessage(response),
                response,
            );
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
                payloadMode: "json",
                ...options,
                method: "POST",
            }),
        postRaw: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            requestBase<TResponse, TPayload>(url, payload, {
                payloadMode: "json",
                ...options,
                method: "POST",
            }),
        put: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            request<TResponse, TPayload>(url, payload, {
                payloadMode: "json",
                ...options,
                method: "PUT",
            }),
        putRaw: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            requestBase<TResponse, TPayload>(url, payload, {
                payloadMode: "json",
                ...options,
                method: "PUT",
            }),
        patch: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            request<TResponse, TPayload>(url, payload, {
                payloadMode: "json",
                ...options,
                method: "PATCH",
            }),
        patchRaw: <TResponse, TPayload = QueryParams>(url: string, payload?: TPayload, options?: Omit<HttpRequestOptions<TPayload>, "method">) =>
            requestBase<TResponse, TPayload>(url, payload, {
                payloadMode: "json",
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
