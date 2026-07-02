import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { createProjectOwnerSessionToken, verifyPassword } from "@/lib/auth";
import { getAdminConfig } from "@/lib/env";
import { jsonError } from "@/lib/api";
import { getRecord } from "@/lib/storage";
import type { Project } from "@/lib/types";
import { asRecord, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const config = getAdminConfig();
    const body = asRecord(await request.json());
    const projectId = text(body.projectId, "项目 ID", 80);
    const password = text(body.password, "项目管理密码", 80);
    const project = await getRecord<Project>("projects", projectId);

    if (!project || project.reviewStatus !== "approved") {
      return NextResponse.json({ ok: false, message: "这个项目暂时不能进入管理。" }, { status: 404 });
    }

    if (!verifyPassword(password, project.ownerPasswordHash)) {
      return NextResponse.json({ ok: false, message: "项目管理密码不正确。" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, message: "已进入项目管理。" });
    await writeAuditLog({
      actorRole: "project-owner",
      actorLabel: project.ownerName,
      action: "projectOwner.login",
      targetType: "project",
      targetId: project.id,
      targetTitle: project.title,
      summary: `项目发起者登录：${project.title}`,
    });

    response.cookies.set(`${config.cookieName}_project`, createProjectOwnerSessionToken(project.id), {
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
