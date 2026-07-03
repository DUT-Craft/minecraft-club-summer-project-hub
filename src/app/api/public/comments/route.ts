import { randomUUID } from "node:crypto";

import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonFail, jsonOk } from "@/lib/api";
import { getRecord, putRecord } from "@/lib/storage";
import type { Project, ProjectComment } from "@/lib/types";
import { asRecord, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const projectId = text(body.projectId, "项目 ID", 80);
    const project = await getRecord<Project>("projects", projectId);

    if (!project || project.reviewStatus !== "approved") {
      return jsonFail("这个项目暂时不能评论。", 404);
    }

    const now = new Date().toISOString();
    const comment: ProjectComment = {
      id: randomUUID(),
      projectId: project.id,
      projectTitle: project.title,
      nickname: text(body.nickname, "昵称", 40),
      content: text(body.content, "评论内容", 800),
      reviewStatus: "approved",
      createdAt: now,
      updatedAt: now,
    };

    await putRecord("projectComments", comment.id, comment);
    await writeAuditLog({
      actorRole: "visitor",
      actorLabel: comment.nickname,
      action: "projectComment.create",
      targetType: "projectComment",
      targetId: comment.id,
      targetTitle: project.title,
      summary: `访客给项目留言：${project.title} / ${comment.nickname}`,
    });

    return jsonOk({ record: comment }, 201, "评论已公开发布。");
  } catch (error) {
    return jsonError(error);
  }
}
