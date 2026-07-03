import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { hashPassword, isAdminRequest } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { deleteRecord, getRecord, updateRecord } from "@/lib/storage";
import type { Idea, JoinRequest, Project, ProjectComment, ProjectUpdate } from "@/lib/types";
import {
  asRecord,
  collectionValue,
  deriveProjectLegacyFields,
  numberValue,
  optionalText,
  recruitmentNeedsValue,
  requestStatusValue,
  reviewStatusValue,
  skillsValue,
  text,
} from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ ok: false, message: "请先登录管理后台。" }, { status: 401 });
    }

    const body = asRecord(await request.json());
    const collection = collectionValue(body.collection);
    const id = text(body.id, "记录 ID", 80);
    const patchBody = asRecord(body.patch);

    if (collection === "projects") {
      const patch: Partial<Project> = {};
      if ("reviewStatus" in patchBody) patch.reviewStatus = reviewStatusValue(patchBody.reviewStatus);
      if ("title" in patchBody) patch.title = text(patchBody.title, "项目标题", 80);
      if ("summary" in patchBody) patch.summary = text(patchBody.summary, "简介", 160);
      if ("type" in patchBody) patch.type = text(patchBody.type, "项目类型", 40);
      if ("projectStatus" in patchBody) patch.projectStatus = text(patchBody.projectStatus, "当前状态", 40);
      if ("ownerName" in patchBody) patch.ownerName = text(patchBody.ownerName, "负责人昵称", 40);
      if ("neededMembers" in patchBody) patch.neededMembers = numberValue(patchBody.neededMembers, "还需要人数", 0, 99);
      if ("skills" in patchBody) patch.skills = skillsValue(patchBody.skills);
      if ("description" in patchBody) patch.description = text(patchBody.description, "项目介绍", 1600);
      if ("recruitmentNeeds" in patchBody) {
        const current = await getRecord<Project>("projects", id);
        const recruitmentNeeds = recruitmentNeedsValue(patchBody.recruitmentNeeds);
        const legacyFields = deriveProjectLegacyFields(patch.description || current?.description || "", recruitmentNeeds);
        patch.recruitmentNeeds = recruitmentNeeds;
        patch.summary = legacyFields.summary;
        patch.neededMembers = legacyFields.neededMembers;
        patch.skills = legacyFields.skills;
      }
      if ("publicContact" in patchBody) patch.publicContact = optionalText(patchBody.publicContact, 120);
      if ("ownerPassword" in patchBody) patch.ownerPasswordHash = hashPassword(text(patchBody.ownerPassword, "项目管理密码", 80));
      const next = await updateRecord<Project>("projects", id, patch);
      await writeAuditLog({
        actorRole: "admin",
        actorLabel: "全站管理员",
        action: "project.update",
        targetType: "project",
        targetId: next.id,
        targetTitle: next.title,
        summary: patch.reviewStatus
          ? `管理员将项目审核状态改为 ${patch.reviewStatus}：${next.title}`
          : `管理员编辑项目：${next.title}`,
      });
      return jsonOk({ ok: true, record: next, message: "项目已保存。" });
    }

    if (collection === "ideas") {
      const patch: Partial<Idea> = {};
      if ("reviewStatus" in patchBody) patch.reviewStatus = reviewStatusValue(patchBody.reviewStatus);
      if ("title" in patchBody) patch.title = text(patchBody.title, "想法标题", 80);
      if ("content" in patchBody) patch.content = text(patchBody.content, "想法内容", 1600);
      const next = await updateRecord<Idea>("ideas", id, patch);
      await writeAuditLog({
        actorRole: "admin",
        actorLabel: "全站管理员",
        action: "idea.update",
        targetType: "idea",
        targetId: next.id,
        targetTitle: next.title,
        summary: patch.reviewStatus
          ? `管理员将想法审核状态改为 ${patch.reviewStatus}：${next.title}`
          : `管理员编辑想法：${next.title}`,
      });
      return jsonOk({ ok: true, record: next, message: "想法已保存。" });
    }

    if (collection === "projectUpdates") {
      const patch: Partial<ProjectUpdate> = {};
      if ("reviewStatus" in patchBody) {
        const reviewStatus = reviewStatusValue(patchBody.reviewStatus);
        if (reviewStatus !== "approved" && reviewStatus !== "rejected") {
          return NextResponse.json({ ok: false, message: "项目动态只能公开或隐藏。" }, { status: 400 });
        }
        patch.reviewStatus = reviewStatus;
      }
      const next = await updateRecord<ProjectUpdate>("projectUpdates", id, patch);
      await writeAuditLog({
        actorRole: "admin",
        actorLabel: "全站管理员",
        action: "projectUpdate.update",
        targetType: "projectUpdate",
        targetId: next.id,
        targetTitle: next.title,
        summary: `管理员将项目动态状态改为 ${next.reviewStatus || "approved"}：${next.title}`,
      });
      return jsonOk({ ok: true, record: next, message: "项目动态已保存。" });
    }

    if (collection === "projectComments") {
      const patch: Partial<ProjectComment> = {};
      if ("reviewStatus" in patchBody) {
        const reviewStatus = reviewStatusValue(patchBody.reviewStatus);
        if (reviewStatus !== "approved" && reviewStatus !== "rejected") {
          return NextResponse.json({ ok: false, message: "项目评论只能公开或隐藏。" }, { status: 400 });
        }
        patch.reviewStatus = reviewStatus;
      }
      const next = await updateRecord<ProjectComment>("projectComments", id, patch);
      await writeAuditLog({
        actorRole: "admin",
        actorLabel: "全站管理员",
        action: "projectComment.update",
        targetType: "projectComment",
        targetId: next.id,
        targetTitle: next.projectTitle,
        summary: `管理员将项目评论状态改为 ${next.reviewStatus || "approved"}：${next.projectTitle} / ${next.nickname}`,
      });
      return jsonOk({ ok: true, record: next, message: "项目评论已保存。" });
    }

    const patch: Partial<JoinRequest> = {};
    if ("processStatus" in patchBody) patch.processStatus = requestStatusValue(patchBody.processStatus);
    const next = await updateRecord<JoinRequest>("joinRequests", id, patch);
    await writeAuditLog({
      actorRole: "admin",
      actorLabel: "全站管理员",
      action: "joinRequest.update",
      targetType: "joinRequest",
      targetId: next.id,
      targetTitle: next.projectTitle,
      summary: `管理员将加入申请状态改为 ${next.processStatus}：${next.applicantName}`,
    });
    return jsonOk({ ok: true, record: next, message: "申请已保存。" });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ ok: false, message: "请先登录管理后台。" }, { status: 401 });
    }

    const body = asRecord(await request.json());
    const collection = collectionValue(body.collection);
    const id = text(body.id, "记录 ID", 80);

    if (collection !== "projectUpdates") {
      return NextResponse.json({ ok: false, message: "目前只支持删除项目动态。" }, { status: 400 });
    }

    const current = await getRecord<ProjectUpdate>("projectUpdates", id);
    if (!current) {
      return NextResponse.json({ ok: false, message: "没有找到这条项目动态。" }, { status: 404 });
    }

    await deleteRecord("projectUpdates", id);
    await writeAuditLog({
      actorRole: "admin",
      actorLabel: "全站管理员",
      action: "projectUpdate.delete",
      targetType: "projectUpdate",
      targetId: current.id,
      targetTitle: current.title,
      summary: `管理员删除项目动态：${current.projectTitle} / ${current.title}`,
    });

    return jsonOk({ ok: true, message: "项目动态已删除。" });
  } catch (error) {
    return jsonError(error);
  }
}
