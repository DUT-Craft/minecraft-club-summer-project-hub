import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

type ReviewStatus = "pending" | "approved" | "rejected";
type RequestStatus = "pending" | "contacted" | "accepted" | "rejected";

export type RecruitmentNeed = {
  id?: string;
  skill: string;
  count: number;
  work: string;
};

export type Project = {
  id: string;
  title: string;
  summary: string;
  type: string;
  status?: string;
  projectStatus?: string;
  ownerName: string;
  neededMembers: number;
  skills: string[];
  recruitmentNeeds?: RecruitmentNeed[];
  description: string;
  publicContact: string;
  privateContact?: string;
  ownerPasswordHash?: string;
  ownerMinecraftId?: string;
  submitterMinecraftId?: string;
  reviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type Idea = {
  id: string;
  title: string;
  content: string;
  nickname?: string;
  submitterName?: string;
  minecraftId?: string;
  reviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt?: string;
};

export type JoinRequest = {
  id: string;
  projectId: string;
  projectTitle: string;
  applicantName: string;
  nickname?: string;
  minecraftId: string;
  contact: string;
  reason: string;
  processStatus: RequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProjectUpdate = {
  id: string;
  projectId: string;
  projectTitle?: string;
  title: string;
  content: string;
  imageUrl?: string;
  reviewStatus?: ReviewStatus;
  createdAt: string;
  updatedAt?: string;
};

export type ProjectComment = {
  id: string;
  projectId: string;
  projectTitle?: string;
  nickname: string;
  content: string;
  reviewStatus?: ReviewStatus;
  createdAt: string;
  updatedAt?: string;
};

type CollectionName = "projects" | "ideas" | "joinRequests" | "projectUpdates" | "projectComments";
type JsonRecord = Record<string, unknown> & { id: string };

const collectionDirs: Record<CollectionName, string> = {
  projects: "projects",
  ideas: "ideas",
  joinRequests: "join-requests",
  projectUpdates: "project-updates",
  projectComments: "project-comments",
};

const defaultDataDir = process.env.VERCEL ? "/tmp/minecraft-club-project-hub-data" : "data";
const dataRoot = () => path.resolve(process.env.LOCAL_DATA_DIR || defaultDataDir);

const collectionPath = (collection: CollectionName) => path.join(dataRoot(), collectionDirs[collection]);

const recordPath = (collection: CollectionName, id: string) => {
  assertSafeId(id);
  return path.join(collectionPath(collection), `${id}.json`);
};

export const nowIso = () => new Date().toISOString();
export const newId = () => randomUUID();

export const hashPassword = (value: string) => createHash("sha256").update(value).digest("hex");

export function assertSafeId(id: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "记录 ID 不合法。" });
  }
}

export async function listRecords<T extends JsonRecord>(collection: CollectionName): Promise<T[]> {
  const dir = collectionPath(collection);
  await mkdir(dir, { recursive: true });
  const files = await readdir(dir);
  const records = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => JSON.parse(await readFile(path.join(dir, file), "utf8")) as T),
  );

  return records.sort((a, b) => {
    const aTime = typeof a.createdAt === "string" ? a.createdAt : "";
    const bTime = typeof b.createdAt === "string" ? b.createdAt : "";
    return bTime.localeCompare(aTime);
  });
}

export async function getRecord<T extends JsonRecord>(collection: CollectionName, id: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(recordPath(collection, id), "utf8")) as T;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function putRecord<T extends JsonRecord>(collection: CollectionName, record: T) {
  const dir = collectionPath(collection);
  await mkdir(dir, { recursive: true });
  await writeFile(recordPath(collection, record.id), `${JSON.stringify(record, null, 2)}\n`, "utf8");
}

export function publicProject(project: Project) {
  const {
    privateContact,
    ownerPasswordHash,
    ...safeProject
  } = project;
  void privateContact;
  void ownerPasswordHash;
  return {
    ...safeProject,
    status: project.status || project.projectStatus || "筹备中",
    ownerMinecraftId: project.ownerMinecraftId || project.submitterMinecraftId,
  };
}

export function text(value: unknown, label: string, max = 120) {
  const next = typeof value === "string" ? value.trim() : "";
  if (!next) {
    throw createError({ statusCode: 400, statusMessage: `${label}不能为空。` });
  }
  if (next.length > max) {
    throw createError({ statusCode: 400, statusMessage: `${label}不能超过 ${max} 个字。` });
  }
  return next;
}

export function optionalText(value: unknown, max = 120) {
  const next = typeof value === "string" ? value.trim() : "";
  return next.slice(0, max);
}

export function recruitmentNeeds(value: unknown): RecruitmentNeed[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        id: typeof record.id === "string" && record.id.trim() ? record.id : newId(),
        skill: optionalText(record.skill, 60),
        count: Math.max(1, Number(record.count) || 1),
        work: optionalText(record.work, 300),
      };
    })
    .filter((item) => item.skill && item.work);
}

export function deriveLegacyFields(description: string, needs: RecruitmentNeed[]) {
  return {
    summary: description.length > 120 ? `${description.slice(0, 120)}...` : description,
    neededMembers: needs.reduce((sum, item) => sum + (Number(item.count) || 0), 0),
    skills: [...new Set(needs.map((item) => item.skill).filter(Boolean))],
  };
}

export function ok<T>(data: T, statusCode = 200, message = "操作成功。") {
  return {
    code: 200,
    status: statusCode,
    msg: message,
    message,
    data,
  };
}
