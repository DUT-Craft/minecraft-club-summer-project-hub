import { writeAuditLog } from "@/lib/audit";
import { getProjectOwnerSession } from "@/lib/auth";
import { jsonError, jsonFail, jsonOk } from "@/lib/api";
import { getRecord, updateRecord } from "@/lib/storage";
import type { JoinRequest, Project } from "@/lib/types";
import { asRecord, requestStatusValue, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const session = await getProjectOwnerSession();
    if (!session) {
      return jsonFail("请先登录项目管理。", 401);
    }

    const body = asRecord(await request.json());
    const id = text(body.id, "申请 ID", 80);
    const processStatus = requestStatusValue(body.processStatus);
    const current = await getRecord<JoinRequest>("joinRequests", id);

    if (!current || current.projectId !== session.projectId) {
      return jsonFail("没有权限处理这条申请。", 403);
    }

    if (processStatus !== "contacted" && processStatus !== "accepted" && processStatus !== "rejected") {
      return jsonFail("项目发起者只能标记联系、通过或拒绝。", 400);
    }

    const next = await updateRecord<JoinRequest>("joinRequests", id, { processStatus });
    const project = await getRecord<Project>("projects", session.projectId);
    await writeAuditLog({
      actorRole: "project-owner",
      actorLabel: project?.ownerName || "项目发起者",
      action: "joinRequest.updateByOwner",
      targetType: "joinRequest",
      targetId: next.id,
      targetTitle: next.projectTitle,
      summary: `项目发起者将加入申请标记为 ${processStatus}：${next.applicantName}`,
    });

    return jsonOk({ record: next }, 200, "申请状态已更新。");
  } catch (error) {
    return jsonError(error);
  }
}
