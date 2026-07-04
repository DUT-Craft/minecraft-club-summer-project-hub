import { listRecords, ok, type Idea } from "~~/server/utils/projectHubData";

export default defineEventHandler(async () => {
  const ideas = await listRecords<Idea>("ideas");
  return ok(ideas.filter((item) => item.reviewStatus === "approved"));
});

