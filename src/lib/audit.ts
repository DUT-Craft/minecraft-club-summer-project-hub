import { randomUUID } from "node:crypto";

import { putRecord } from "@/lib/storage";
import type { AuditLog } from "@/lib/types";

type AuditInput = Omit<AuditLog, "id" | "createdAt">;

export async function writeAuditLog(input: AuditInput) {
  const now = new Date().toISOString();
  const log: AuditLog = {
    id: randomUUID(),
    createdAt: now,
    ...input,
  };

  try {
    await putRecord("auditLogs", log.id, log);
  } catch (error) {
    console.error("Audit log write failed", error);
  }
}
