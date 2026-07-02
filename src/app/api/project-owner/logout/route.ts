import { NextResponse } from "next/server";

import { getAdminConfig } from "@/lib/env";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST() {
  try {
    const config = getAdminConfig();
    const response = NextResponse.json({ ok: true, message: "已退出项目管理。" });
    response.cookies.set(`${config.cookieName}_project`, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
