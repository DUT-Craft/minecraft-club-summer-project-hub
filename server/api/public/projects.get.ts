import { listRecords, ok, publicProject, type Project } from "~~/server/utils/projectHubData";

export default defineEventHandler(async () => {
  const projects = await listRecords<Project>("projects");
  return ok(projects.filter((item) => item.reviewStatus === "approved").map(publicProject));
});

