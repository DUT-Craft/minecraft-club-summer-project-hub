import { randomUUID } from "node:crypto";

import { jsonError, jsonOk } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { putRecord } from "@/lib/storage";
import type { Project } from "@/lib/types";
import { asRecord, minecraftIdValue, numberValue, optionalText, skillsValue, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      title: text(body.title, "项目标题", 80),
      summary: text(body.summary, "简介", 160),
      type: text(body.type, "项目类型", 40),
      projectStatus: text(body.projectStatus, "当前状态", 40),
      ownerName: text(body.ownerName, "负责人昵称", 40),
      neededMembers: numberValue(body.neededMembers, "还需要人数", 0, 99),
      skills: skillsValue(body.skills),
      description: text(body.description, "项目介绍", 1600),
      publicContact: optionalText(body.publicContact, 120),
      privateContact: text(body.privateContact, "后台联系方式", 120),
      ownerPasswordHash: hashPassword(text(body.ownerPassword, "项目管理密码", 80)),
      submitterMinecraftId: minecraftIdValue(body.submitterMinecraftId),
      reviewStatus: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await putRecord("projects", project.id, project);
    return jsonOk({ ok: true, id: project.id, message: "项目已提交，审核通过后会公开。" }, 201);
  } catch (error) {
    return jsonError(error);
  }
}
