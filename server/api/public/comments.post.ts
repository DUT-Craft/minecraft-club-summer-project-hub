import { getRecord, newId, nowIso, ok, putRecord, text, type Project, type ProjectComment } from "~~/server/utils/projectHubData";

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  const projectId = text(body.projectId, "project ID", 80);
  const project = await getRecord<Project>("projects", projectId);
  if (!project || project.reviewStatus !== "approved") {
    throw createError({ statusCode: 404, statusMessage: "This project is not open for comments." });
  }

  const now = nowIso();
  const comment: ProjectComment = {
    id: newId(),
    projectId,
    projectTitle: project.title,
    nickname: text(body.nickname, "nickname", 40),
    content: text(body.content, "comment", 800),
    reviewStatus: "approved",
    createdAt: now,
    updatedAt: now,
  };

  await putRecord("projectComments", comment);
  return ok({ record: comment }, 201, "Comment published.");
});
