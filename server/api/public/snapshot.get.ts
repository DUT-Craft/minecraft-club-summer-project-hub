import { listRecords, ok, publicProject, type Idea, type Project, type ProjectComment, type ProjectUpdate } from "~~/server/utils/projectHubData";

export default defineEventHandler(async () => {
  const [projects, ideas, projectUpdates, projectComments] = await Promise.all([
    listRecords<Project>("projects"),
    listRecords<Idea>("ideas"),
    listRecords<ProjectUpdate>("projectUpdates"),
    listRecords<ProjectComment>("projectComments"),
  ]);
  const approvedProjectIds = new Set(projects.filter((item) => item.reviewStatus === "approved").map((item) => item.id));

  return ok({
    projects: projects.filter((item) => item.reviewStatus === "approved").map(publicProject),
    ideas: ideas.filter((item) => item.reviewStatus === "approved"),
    projectUpdates: projectUpdates.filter((item) => approvedProjectIds.has(item.projectId) && item.reviewStatus !== "rejected"),
    projectComments: projectComments.filter((item) => approvedProjectIds.has(item.projectId) && item.reviewStatus !== "rejected"),
  });
});

