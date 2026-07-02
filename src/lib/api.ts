import { NextResponse } from "next/server";

import { AppConfigError } from "@/lib/env";
import { ValidationError } from "@/lib/validation";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(error: unknown, fallback = "操作失败，请稍后再试。") {
  if (error instanceof ValidationError) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  if (error instanceof AppConfigError) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ ok: false, message }, { status: 500 });
}
