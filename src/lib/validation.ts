import type { CollectionName, ReviewStatus, RequestStatus } from "@/lib/types";
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
  if (input === "projects" || input === "ideas" || input === "joinRequests" || input === "projectUpdates") {
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
