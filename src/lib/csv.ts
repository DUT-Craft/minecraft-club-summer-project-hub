import type { DataSnapshot } from "@/lib/types";

function escapeCsv(value: unknown) {
  const text = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function rowsToCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ].join("\n");
}

export function snapshotToCsv(snapshot: DataSnapshot) {
  return [
    "# projects",
    rowsToCsv(snapshot.projects),
    "",
    "# ideas",
    rowsToCsv(snapshot.ideas),
    "",
    "# joinRequests",
    rowsToCsv(snapshot.joinRequests),
    "",
    "# projectUpdates",
    rowsToCsv(snapshot.projectUpdates),
    "",
    "# projectComments",
    rowsToCsv(snapshot.projectComments),
    "",
    "# projectEditRequests",
    rowsToCsv(snapshot.projectEditRequests),
    "",
    "# auditLogs",
    rowsToCsv(snapshot.auditLogs),
  ].join("\n");
}
