import { AppConfigError } from "@/lib/env";
import { listAllData } from "@/lib/storage";
import type { Project, PublicProject, PublicSnapshot } from "@/lib/types";

export function toPublicProject(project: Project): PublicProject {
  const { privateContact, ownerPasswordHash, submitterMinecraftId, ...publicProject } = project;
  void privateContact;
  void ownerPasswordHash;
  void submitterMinecraftId;
  return publicProject;
}

export async function getPublicSnapshot(): Promise<PublicSnapshot> {
  try {
    const data = await listAllData();
    const approvedProjectIds = new Set(data.projects.filter((project) => project.reviewStatus === "approved").map((project) => project.id));
    return {
      projects: data.projects
        .filter((project) => project.reviewStatus === "approved")
        .map(toPublicProject),
      ideas: data.ideas.filter((idea) => idea.reviewStatus === "approved"),
      projectUpdates: data.projectUpdates
        .filter((update) => approvedProjectIds.has(update.projectId) && update.reviewStatus !== "rejected")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      projectComments: data.projectComments
        .filter((comment) => approvedProjectIds.has(comment.projectId) && comment.reviewStatus !== "rejected")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    };
  } catch (error) {
    if (error instanceof AppConfigError) {
      return { projects: [], ideas: [], projectUpdates: [], projectComments: [], setupError: error.message };
    }

    throw error;
  }
}
