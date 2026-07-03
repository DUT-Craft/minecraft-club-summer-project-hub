import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { getProjectOwnerSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { getRecord, updateRecord } from "@/lib/storage";
import type { Project, ProjectComment } from "@/lib/types";
import { asRecord, reviewStatusValue, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const session = await getProjectOwnerSession();
    if (!session) {
      return NextResponse.json({ ok: false, message: "请先登录项目管理。" }, { status: 401 });
    }

    const body = asRecord(await request.json());
    const id = text(body.id, "评论 ID", 80);
    const reviewStatus = reviewStatusValue(body.reviewStatus);

    if (reviewStatus !== "approved" && reviewStatus !== "rejected") {
      return NextResponse.json({ ok: false, message: "项目评论只能公开或隐藏。" }, { status: 400 });
    }

    const current = await getRecord<ProjectComment>("projectComments", id);
    if (!current || current.projectId !== session.projectId) {
      return NextResponse.json({ ok: false, message: "没有权限处理这条评论。" }, { status: 403 });
    }

    const next = await updateRecord<ProjectComment>("projectComments", id, { reviewStatus });
    const project = await getRecord<Project>("projects", session.projectId);
    await writeAuditLog({
      actorRole: "project-owner",
      actorLabel: project?.ownerName || "项目发起者",
      action: "projectComment.updateByOwner",
      targetType: "projectComment",
      targetId: next.id,
      targetTitle: next.projectTitle,
      summary: `项目发起者将评论状态改为 ${reviewStatus}：${next.nickname}`,
    });

    return jsonOk({ ok: true, record: next, message: "项目评论已保存。" });
  } catch (error) {
    return jsonError(error);
  }
}
