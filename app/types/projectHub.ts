export type ReviewStatus = "pending" | "approved" | "rejected" | "contacted" | "accepted";

export interface RecruitmentNeed {
  id?: string;
  skill: string;
  count: number;
  work: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  projectTitle?: string;
  title: string;
  content: string;
  imageUrl?: string;
  reviewStatus?: ReviewStatus;
  createdAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  projectTitle?: string;
  nickname: string;
  content: string;
  reviewStatus?: ReviewStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  summary?: string;
  type: string;
  status?: string;
  projectStatus?: string;
  ownerName: string;
  ownerMinecraftId?: string;
  submitterMinecraftId?: string;
  neededMembers?: number;
  skills?: string[];
  description: string;
  publicContact?: string;
  privateContact?: string;
  reviewStatus: ReviewStatus;
  recruitmentNeeds?: RecruitmentNeed[];
  createdAt: string;
  updatedAt?: string;
}

export interface Idea {
  id: string;
  title: string;
  content: string;
  nickname?: string;
  submitterName?: string;
  minecraftId?: string;
  reviewStatus: ReviewStatus;
  createdAt: string;
}

export interface DataSnapshot {
  projects: Project[];
  ideas: Idea[];
  projectUpdates: ProjectUpdate[];
  projectComments: ProjectComment[];
}

export interface SubmitProjectPayload {
  title: string;
  type: string;
  introduction?: string;
  tags?: string[];
  ownerName: string;
  ownerMinecraftId: string;
  description: string;
  publicContact: string;
  ownerPassword: string;
  recruitmentNeeds: RecruitmentNeed[];
}

export interface SubmitIdeaPayload {
  title: string;
  content: string;
  nickname: string;
  submitterName?: string;
  minecraftId: string;
}

export interface SubmitJoinPayload {
  projectId: string;
  nickname: string;
  minecraftId: string;
  contact: string;
  reason: string;
}

export interface SubmitCommentPayload {
  projectId: string;
  nickname: string;
  content: string;
}
