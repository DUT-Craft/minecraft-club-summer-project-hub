import { randomUUID } from "node:crypto";

import { writeAuditLog } from "@/lib/audit";
import { getProjectOwnerSession } from "@/lib/auth";
import { jsonError, jsonFail, jsonOk } from "@/lib/api";
import { getRecord, putRecord } from "@/lib/storage";
import type { Project, ProjectUpdate } from "@/lib/types";
import { asRecord, optionalHttpUrl, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getProjectOwnerSession();
    if (!session) {
      return jsonFail("请先登录项目管理。", 401);
    }

    const project = await getRecord<Project>("projects", session.projectId);
    if (!project || project.reviewStatus !== "approved") {
      return jsonFail("这个项目暂时不能发布动态。", 403);
    }

    const body = asRecord(await request.json());
    const now = new Date().toISOString();
    const update: ProjectUpdate = {
      id: randomUUID(),
      projectId: project.id,
      projectTitle: project.title,
      title: text(body.title, "动态标题", 80),
      content: text(body.content, "动态内容", 1200),
      imageUrl: optionalHttpUrl(body.imageUrl, "动态图片链接", 500) || undefined,
      reviewStatus: "approved",
      createdAt: now,
      updatedAt: now,
    };

    await putRecord("projectUpdates", update.id, update);
    await writeAuditLog({
      actorRole: "project-owner",
      actorLabel: project.ownerName,
      action: "projectUpdate.create",
      targetType: "projectUpdate",
      targetId: update.id,
      targetTitle: update.title,
      summary: `发布项目动态：${project.title} / ${update.title}`,
    });

    return jsonOk({ record: update }, 201, "项目动态已发布。");
  } catch (error) {
    return jsonError(error);
  }
}
