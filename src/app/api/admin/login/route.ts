import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { createSessionToken } from "@/lib/auth";
import { getAdminConfig } from "@/lib/env";
import { jsonError } from "@/lib/api";
import { asRecord } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const config = getAdminConfig();
    const body = asRecord(await request.json());

    if (body.password !== config.password) {
      return NextResponse.json({ ok: false, message: "管理密码不正确。" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, message: "已登录。" });
    await writeAuditLog({
      actorRole: "admin",
      actorLabel: "全站管理员",
      action: "admin.login",
      targetType: "admin",
      targetId: "admin",
      summary: "管理员登录后台。",
    });

    response.cookies.set(config.cookieName, createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: config.maxAgeSeconds,
    });

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
