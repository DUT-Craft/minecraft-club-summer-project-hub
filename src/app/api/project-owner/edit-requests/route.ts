import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { getProjectOwnerSession } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { getRecord, putRecord } from "@/lib/storage";
import type { Project, ProjectEditRequest } from "@/lib/types";
import { asRecord, numberValue, optionalText, skillsValue, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getProjectOwnerSession();
    if (!session) {
      return NextResponse.json({ ok: false, message: "请先登录项目管理。" }, { status: 401 });
    }

    const project = await getRecord<Project>("projects", session.projectId);
    if (!project || project.reviewStatus !== "approved") {
      return NextResponse.json({ ok: false, message: "这个项目暂时不能提交修改。" }, { status: 403 });
    }

    const body = asRecord(await request.json());
    const now = new Date().toISOString();
    const editRequest: ProjectEditRequest = {
      id: randomUUID(),
      projectId: project.id,
      projectTitle: project.title,
      requesterName: project.ownerName,
      payload: {
        title: text(body.title, "项目标题", 80),
        summary: text(body.summary, "简介", 160),
        type: text(body.type, "项目类型", 40),
        projectStatus: text(body.projectStatus, "当前状态", 40),
        neededMembers: numberValue(body.neededMembers, "还需要人数", 0, 99),
        skills: skillsValue(body.skills),
        description: text(body.description, "项目介绍", 1600),
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

    return jsonOk({ ok: true, record: editRequest, message: "修改申请已提交，管理员审核后会公开更新。" }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
