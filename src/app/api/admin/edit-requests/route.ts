import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isAdminRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { getRecord, updateRecord } from "@/lib/storage";
import type { Project, ProjectEditRequest } from "@/lib/types";
import { asRecord, reviewStatusValue, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ ok: false, message: "请先登录管理后台。" }, { status: 401 });
    }

    const body = asRecord(await request.json());
    const id = text(body.id, "修改申请 ID", 80);
    const reviewStatus = reviewStatusValue(body.reviewStatus);

    if (reviewStatus !== "approved" && reviewStatus !== "rejected") {
      return NextResponse.json({ ok: false, message: "修改申请只能通过或拒绝。" }, { status: 400 });
    }

    const editRequest = await getRecord<ProjectEditRequest>("projectEditRequests", id);
    if (!editRequest) {
      return NextResponse.json({ ok: false, message: "没有找到这条修改申请。" }, { status: 404 });
    }

    if (editRequest.reviewStatus !== "pending") {
      return NextResponse.json({ ok: false, message: "这条修改申请已经处理过。" }, { status: 400 });
    }

    const project = await getRecord<Project>("projects", editRequest.projectId);
    if (!project) {
      return NextResponse.json({ ok: false, message: "没有找到对应项目。" }, { status: 404 });
    }

    if (reviewStatus === "approved") {
      await updateRecord<Project>("projects", project.id, editRequest.payload);
    }

    const next = await updateRecord<ProjectEditRequest>("projectEditRequests", id, {
      reviewStatus,
      reviewedAt: new Date().toISOString(),
    });

    await writeAuditLog({
      actorRole: "admin",
      actorLabel: "全站管理员",
      action: "projectEditRequest.review",
      targetType: "projectEditRequest",
      targetId: next.id,
      targetTitle: next.projectTitle,
      summary: `管理员${reviewStatus === "approved" ? "通过" : "拒绝"}项目资料修改申请：${next.projectTitle}`,
    });

    return jsonOk({ ok: true, record: next, message: reviewStatus === "approved" ? "修改申请已通过，项目内容已更新。" : "修改申请已拒绝。" });
  } catch (error) {
    return jsonError(error);
  }
}
