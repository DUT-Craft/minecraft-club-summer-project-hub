import { deriveLegacyFields, hashPassword, newId, nowIso, ok, optionalText, putRecord, recruitmentNeeds, text, type Project } from "~~/server/utils/projectHubData";

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event);
  const description = text(body.description, "description", 1600);
  const needs = recruitmentNeeds(body.recruitmentNeeds);
  const legacy = deriveLegacyFields(description, needs);
  const status = text(body.status || body.projectStatus, "status", 40);
  const minecraftId = text(body.ownerMinecraftId || body.submitterMinecraftId, "Minecraft ID", 40);
  const now = nowIso();
  const project: Project = {
    id: newId(),
    title: text(body.title, "title", 80),
    summary: legacy.summary,
    type: text(body.type, "type", 40),
    status,
    projectStatus: status,
    ownerName: text(body.ownerName, "owner name", 40),
    ownerMinecraftId: minecraftId,
    submitterMinecraftId: minecraftId,
    neededMembers: legacy.neededMembers,
    skills: legacy.skills,
    recruitmentNeeds: needs,
    description,
    publicContact: optionalText(body.publicContact, 120),
    privateContact: "",
    ownerPasswordHash: hashPassword(text(body.ownerPassword, "owner password", 80)),
    reviewStatus: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await putRecord("projects", project);
  return ok({ id: project.id }, 201, "Project submitted.");
});
