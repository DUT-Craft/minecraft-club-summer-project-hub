export const reviewStatuses = ["pending", "approved", "rejected"] as const;
export const requestStatuses = ["pending", "contacted", "accepted", "rejected"] as const;
export const allAdminStatuses = ["pending", "approved", "rejected", "contacted", "accepted"] as const;

export type ReviewStatus = (typeof reviewStatuses)[number];
export type RequestStatus = (typeof requestStatuses)[number];
export type AdminStatus = (typeof allAdminStatuses)[number];

export type CollectionName =
  | "projects"
  | "ideas"
  | "joinRequests"
  | "projectUpdates"
  | "projectEditRequests"
  | "auditLogs";

export type Project = {
  id: string;
  title: string;
  summary: string;
  type: string;
  projectStatus: string;
  ownerName: string;
  neededMembers: number;
  skills: string[];
  description: string;
  publicContact: string;
  privateContact: string;
  ownerPasswordHash: string;
  submitterMinecraftId: string;
  reviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type PublicProject = Omit<Project, "privateContact" | "ownerPasswordHash" | "submitterMinecraftId">;

export type ProjectEditableFields = Pick<
  Project,
  "title" | "summary" | "type" | "projectStatus" | "neededMembers" | "skills" | "description" | "publicContact"
>;

export type Idea = {
  id: string;
  title: string;
  content: string;
  submitterName: string;
  minecraftId: string;
  reviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type JoinRequest = {
  id: string;
  projectId: string;
  projectTitle: string;
  applicantName: string;
  minecraftId: string;
  contact: string;
  reason: string;
  processStatus: RequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProjectUpdate = {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  content: string;
  imageUrl?: string;
  reviewStatus?: "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type ProjectEditRequest = {
  id: string;
  projectId: string;
  projectTitle: string;
  requesterName: string;
  payload: ProjectEditableFields;
  reviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
};

export type AuditActorRole = "admin" | "project-owner";

export type AuditLog = {
  id: string;
  actorRole: AuditActorRole;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId: string;
  targetTitle?: string;
  summary: string;
  createdAt: string;
};

export type DataSnapshot = {
  projects: Project[];
  ideas: Idea[];
  joinRequests: JoinRequest[];
  projectUpdates: ProjectUpdate[];
  projectEditRequests: ProjectEditRequest[];
  auditLogs: AuditLog[];
};

export type PublicSnapshot = {
  projects: PublicProject[];
  ideas: Idea[];
  projectUpdates: ProjectUpdate[];
  setupError?: string;
};
