import { newId, nowIso, ok, putRecord, text, type Idea } from "~~/server/utils/projectHubData";

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  const nickname = text(body.nickname || body.submitterName, "nickname", 40);
  const now = nowIso();
  const idea: Idea = {
    id: newId(),
    title: text(body.title, "title", 80),
    content: text(body.content, "content", 1600),
    nickname,
    submitterName: nickname,
    minecraftId: text(body.minecraftId, "Minecraft ID", 40),
    reviewStatus: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await putRecord("ideas", idea);
  return ok({ id: idea.id }, 201, "Idea submitted.");
});
