import type { CollectionName } from "@/lib/types";

export type JsonRecord = Record<string, unknown> & { id: string };

export interface DataStore {
  list<T extends JsonRecord>(collection: CollectionName): Promise<T[]>;
  get<T extends JsonRecord>(collection: CollectionName, id: string): Promise<T | null>;
  put<T extends JsonRecord>(collection: CollectionName, id: string, data: T): Promise<void>;
}

export const collectionFolders: Record<CollectionName, string> = {
  projects: "projects",
  ideas: "ideas",
  joinRequests: "join-requests",
  projectUpdates: "project-updates",
  projectEditRequests: "project-edit-requests",
  auditLogs: "audit-logs",
};

export function assertSafeId(id: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error("记录 ID 不合法。");
  }
}
