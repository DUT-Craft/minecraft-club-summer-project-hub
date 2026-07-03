import { randomUUID } from "node:crypto";

import { writeAuditLog } from "@/lib/audit";
import { getProjectOwnerSession } from "@/lib/auth";
import { jsonError, jsonFail, jsonOk } from "@/lib/api";
import { getRecord, putRecord } from "@/lib/storage";
import type { Project, ProjectEditRequest } from "@/lib/types";
import { asRecord, deriveProjectLegacyFields, optionalText, recruitmentNeedsValue, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getProjectOwnerSession();
    if (!session) {
      return jsonFail("请先登录项目管理。", 401);
    }

    const project = await getRecord<Project>("projects", session.projectId);
    if (!project || project.reviewStatus !== "approved") {
      return jsonFail("这个项目暂时不能提交修改。", 403);
    }

    const body = asRecord(await request.json());
    const now = new Date().toISOString();
    const description = text(body.description, "项目介绍", 1600);
    const recruitmentNeeds = recruitmentNeedsValue(body.recruitmentNeeds);
    const legacyFields = deriveProjectLegacyFields(description, recruitmentNeeds);
    const editRequest: ProjectEditRequest = {
      id: randomUUID(),
      projectId: project.id,
      projectTitle: project.title,
      requesterName: project.ownerName,
      payload: {
        title: text(body.title, "项目标题", 80),
        summary: legacyFields.summary,
        type: text(body.type, "项目类型", 40),
        projectStatus: text(body.projectStatus, "当前状态", 40),
        neededMembers: legacyFields.neededMembers,
        skills: legacyFields.skills,
        recruitmentNeeds,
        description,
        publicContact: optionalText(body.publicContact, 120),
      },
      reviewStatus: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await putRecord("projectEditRequests", editRequest.id, editRequest);
    await writeAuditLog({
      actorRole: "project-owner",
      actorLabel: project.ownerName,
      action: "projectEditRequest.create",
      targetType: "projectEditRequest",
      targetId: editRequest.id,
      targetTitle: project.title,
      summary: `提交项目资料修改申请：${project.title}`,
    });

    return jsonOk({ record: editRequest }, 201, "修改申请已提交，管理员审核后会公开更新。");
  } catch (error) {
    return jsonError(error);
  }
}
