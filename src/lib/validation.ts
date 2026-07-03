import type { CollectionName, RecruitmentNeed, ReviewStatus, RequestStatus } from "@/lib/types";
import { requestStatuses, reviewStatuses } from "@/lib/types";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

type UnknownRecord = Record<string, unknown>;

export function asRecord(input: unknown): UnknownRecord {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("提交内容格式不正确。");
  }
  return input as UnknownRecord;
}

export function text(input: unknown, label: string, maxLength = 500) {
  if (typeof input !== "string") {
    throw new ValidationError(`${label}不能为空。`);
  }

  const value = input.trim();
  if (!value) {
    throw new ValidationError(`${label}不能为空。`);
  }

  if (value.length > maxLength) {
    throw new ValidationError(`${label}太长了，最多 ${maxLength} 个字。`);
  }

  return value;
}

export function optionalText(input: unknown, maxLength = 500) {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim().slice(0, maxLength);
}

export function optionalHttpUrl(input: unknown, label: string, maxLength = 500) {
  const value = optionalText(input, maxLength);
  if (!value) {
    return "";
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ValidationError(`${label}需要是完整链接。`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ValidationError(`${label}只支持 http 或 https 链接。`);
  }

  return url.toString();
}

export function numberValue(input: unknown, label: string, min = 0, max = 99) {
  const value = Number(input);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ValidationError(`${label}需要是 ${min} 到 ${max} 之间的数字。`);
  }

  return Math.round(value);
}

export function skillsValue(input: unknown) {
  const source = Array.isArray(input) ? input.join(",") : String(input || "");
  return source
    .split(/[,，、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function recruitmentNeedsValue(input: unknown) {
  let source: unknown = input;
  if (typeof input === "string") {
    try {
      source = JSON.parse(input);
    } catch {
      throw new ValidationError("招工需求格式不正确。");
    }
  }

  if (!Array.isArray(source)) {
    throw new ValidationError("招工需求不能为空。");
  }

  const needs: RecruitmentNeed[] = [];
  for (const [index, item] of source.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const skill = optionalText(record.skill, 40);
    const work = optionalText(record.work, 400);
    const rawCount = record.count === "" || record.count === undefined || record.count === null ? 0 : Number(record.count);

    if (!skill && !work && !rawCount) {
      continue;
    }

    if (!skill) {
      throw new ValidationError("招工需求需要填写技能或人才方向。");
    }

    if (!work) {
      throw new ValidationError("招工需求需要填写大概工作内容。");
    }

    if (!Number.isFinite(rawCount) || rawCount < 1 || rawCount > 99) {
      throw new ValidationError("招工需求人数需要是 1 到 99 之间的数字。");
    }

    needs.push({
      id: optionalText(record.id, 80) || `need-${index + 1}`,
      skill,
      count: Math.round(rawCount),
      work,
    });
  }

  if (!needs.length) {
    throw new ValidationError("至少填写一条招工需求。");
  }

  return needs.slice(0, 12);
}

export function deriveProjectLegacyFields(description: string, recruitmentNeeds: RecruitmentNeed[]) {
  return {
    summary: description.replace(/\s+/g, " ").trim().slice(0, 120) || "暂无介绍",
    neededMembers: recruitmentNeeds.reduce((sum, need) => sum + need.count, 0),
    skills: Array.from(new Set(recruitmentNeeds.map((need) => need.skill).filter(Boolean))).slice(0, 12),
  };
}

export function reviewStatusValue(input: unknown): ReviewStatus {
  if (reviewStatuses.includes(input as ReviewStatus)) {
    return input as ReviewStatus;
  }

  throw new ValidationError("审核状态不正确。");
}

export function requestStatusValue(input: unknown): RequestStatus {
  if (requestStatuses.includes(input as RequestStatus)) {
    return input as RequestStatus;
  }

  throw new ValidationError("申请状态不正确。");
}

export function collectionValue(input: unknown): CollectionName {
  if (
    input === "projects" ||
    input === "ideas" ||
    input === "joinRequests" ||
    input === "projectUpdates" ||
    input === "projectComments"
  ) {
    return input;
  }

  throw new ValidationError("记录类型不正确。");
}

export function minecraftIdValue(input: unknown) {
  const value = text(input, "Minecraft ID", 32);
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(value)) {
    throw new ValidationError("Minecraft ID 只能包含字母、数字和下划线，长度 3 到 32 位。");
  }
  return value;
}
