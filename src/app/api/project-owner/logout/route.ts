import { getAdminConfig } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";

export async function POST() {
  try {
    const config = getAdminConfig();
    const response = jsonOk(null, 200, "已退出项目管理。");
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
