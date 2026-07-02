import { randomUUID } from "node:crypto";

import { jsonError, jsonOk } from "@/lib/api";
import { getRecord, putRecord } from "@/lib/storage";
import type { JoinRequest, Project } from "@/lib/types";
import { asRecord, minecraftIdValue, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const projectId = text(body.projectId, "项目 ID", 80);
    const project = await getRecord<Project>("projects", projectId);

    if (!project || project.reviewStatus !== "approved") {
      return jsonOk({ ok: false, message: "这个项目暂时不能申请。" }, 404);
    }

    const now = new Date().toISOString();
    const joinRequest: JoinRequest = {
      id: randomUUID(),
      projectId,
      projectTitle: project.title,
      applicantName: text(body.applicantName, "昵称", 40),
      minecraftId: minecraftIdValue(body.minecraftId),
      contact: text(body.contact, "联系方式", 120),
      reason: text(body.reason, "申请理由", 800),
      processStatus: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await putRecord("joinRequests", joinRequest.id, joinRequest);
    return jsonOk({ ok: true, id: joinRequest.id, message: "申请已提交，管理员会在后台查看。" }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
