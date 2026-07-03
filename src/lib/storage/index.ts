import type {
  AuditLog,
  DataSnapshot,
  Idea,
  JoinRequest,
  Project,
  ProjectComment,
  ProjectEditRequest,
  ProjectUpdate,
  CollectionName,
} from "@/lib/types";
import { BackendApiStore } from "./api";
import type { DataStore, JsonRecord } from "./store";

export function getStore(): DataStore {
  return new BackendApiStore();
}

export async function listAllData(): Promise<DataSnapshot> {
  const store = getStore();
  const [projects, ideas, joinRequests, projectUpdates, projectComments, projectEditRequests, auditLogs] = await Promise.all([
    store.list<Project>("projects"),
    store.list<Idea>("ideas"),
    store.list<JoinRequest>("joinRequests"),
    store.list<ProjectUpdate>("projectUpdates"),
    store.list<ProjectComment>("projectComments"),
    store.list<ProjectEditRequest>("projectEditRequests"),
    store.list<AuditLog>("auditLogs"),
  ]);

  return { projects, ideas, joinRequests, projectUpdates, projectComments, projectEditRequests, auditLogs };
}

export async function putRecord<T extends JsonRecord>(
  collection: CollectionName,
  id: string,
  data: T,
) {
  await getStore().put(collection, id, data);
}

export async function getRecord<T extends JsonRecord>(collection: CollectionName, id: string) {
  return getStore().get<T>(collection, id);
}

export async function deleteRecord(collection: CollectionName, id: string) {
  await getStore().delete(collection, id);
}

export async function updateRecord<T extends JsonRecord>(
  collection: CollectionName,
  id: string,
  patch: Partial<T>,
) {
  const store = getStore();
  const current = await store.get<T>(collection, id);

  if (!current) {
    throw new Error("没有找到这条记录。");
  }

  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  } as T;

  await store.put(collection, id, next);
  return next;
}
