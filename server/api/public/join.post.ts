import { getRecord, newId, nowIso, ok, putRecord, text, type JoinRequest, type Project } from "~~/server/utils/projectHubData";

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  const projectId = text(body.projectId, "project ID", 80);
  const project = await getRecord<Project>("projects", projectId);
  if (!project || project.reviewStatus !== "approved") {
    throw createError({ statusCode: 404, statusMessage: "This project is not open for join requests." });
  }

  const nickname = text(body.nickname || body.applicantName, "nickname", 40);
  const now = nowIso();
  const request: JoinRequest = {
    id: newId(),
    projectId,
    projectTitle: project.title,
    applicantName: nickname,
    nickname,
    minecraftId: text(body.minecraftId, "Minecraft ID", 40),
    contact: text(body.contact, "contact", 120),
    reason: text(body.reason, "reason", 800),
    processStatus: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await putRecord("joinRequests", request);
  return ok({ id: request.id }, 201, "Join request submitted.");
});
