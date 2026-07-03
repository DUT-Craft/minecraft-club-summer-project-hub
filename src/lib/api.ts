import { NextResponse } from "next/server";

import { AppConfigError } from "@/lib/env";
import type { ApiResult } from "@/lib/types/http";
import { ValidationError } from "@/lib/validation";

const API_SUCCESS_CODE = 200;

export function jsonOk<T>(data: T, status = 200, message = "操作成功。") {
  const body: ApiResult<T> = {
    code: API_SUCCESS_CODE,
    status,
    msg: message,
    message,
    data,
  };

  return NextResponse.json(body, { status });
}

export function jsonFail(message: string, status = 400) {
  const body: ApiResult<null> = {
    code: status,
    status,
    msg: message,
    message,
    data: null,
  };

  return NextResponse.json(body, { status });
}

export function jsonError(error: unknown, fallback = "操作失败，请稍后再试。") {
  if (error instanceof ValidationError) {
    return jsonFail(error.message, 400);
  }

  if (error instanceof AppConfigError) {
    return jsonFail(error.message, 500);
  }

  const message = error instanceof Error ? error.message : fallback;
  return jsonFail(message, 500);
}
