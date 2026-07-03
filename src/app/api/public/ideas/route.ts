import { randomUUID } from "node:crypto";

import { jsonError, jsonOk } from "@/lib/api";
import { putRecord } from "@/lib/storage";
import type { Idea } from "@/lib/types";
import { asRecord, minecraftIdValue, text } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = asRecord(await request.json());
    const now = new Date().toISOString();
    const idea: Idea = {
      id: randomUUID(),
      title: text(body.title, "想法标题", 80),
      content: text(body.content, "想法内容", 1600),
      submitterName: text(body.submitterName, "昵称", 40),
      minecraftId: minecraftIdValue(body.minecraftId),
      reviewStatus: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await putRecord("ideas", idea.id, idea);
    return jsonOk({ id: idea.id }, 201, "想法已提交，审核通过后会公开。");
  } catch (error) {
    return jsonError(error);
  }
}
