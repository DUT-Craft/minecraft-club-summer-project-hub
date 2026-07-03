import { NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isAdminRequest } from "@/lib/auth";
import { jsonError, jsonFail } from "@/lib/api";
import { snapshotToCsv } from "@/lib/csv";
import { listAllData } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest())) {
      return jsonFail("请先登录管理后台。", 401);
    }

    const format = new URL(request.url).searchParams.get("format");
    await writeAuditLog({
      actorRole: "admin",
      actorLabel: "全站管理员",
      action: "data.export",
      targetType: "data",
      targetId: "snapshot",
      summary: `管理员导出 ${format === "csv" ? "CSV" : "JSON"} 数据。`,
    });
    const snapshot = await listAllData();

    if (format === "csv") {
      return new NextResponse(snapshotToCsv(snapshot), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="minecraft-club-data.csv"',
        },
      });
    }

    return new NextResponse(JSON.stringify(snapshot, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="minecraft-club-data.json"',
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
