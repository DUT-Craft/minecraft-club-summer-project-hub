export type ReviewStatus = "pending" | "approved" | "rejected" | "contacted" | "accepted" | "deleted";

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
    // 后端 ObjectItem.ownerId：负责该项目的「项目管理」账号 id（由总管理分配），未分配为 null/undefined。
    managerId?: number | string | null;
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

// 项目方后台「编辑项目信息」表单：字段全部可选，只更新被改动的展示类属性。
// 与 SubmitProjectPayload 的区别：投稿是全新创建（含 ownerPassword），编辑是增量修改已存在项目。
export interface UpdateProjectPayload {
  title?: string;
  type?: string;
  introduction?: string;
  description?: string;
  // 仅允许在 4 个运营状态间切换（PREPARING/RECRUITING/IN_PROGRESS/PAUSED）；
  // 审核类状态（PENDING/APPROVED/REJECTED/DELETED）由管理员侧推进，前端不直接设置
  status?: string;
  ownerName?: string;
  ownerMinecraftId?: string;
  publicContact?: string;
  tags?: string[];
  recruitmentNeeds?: RecruitmentNeed[];
}

// 项目方发布 / 编辑项目动态的请求体（对应后端 ObjectItemUpdateSaveRequest）。
// 发布时 title / content 必填；编辑时空值字段表示不修改对应属性。
export interface ProjectUpdatePayload {
  title?: string;
  content?: string;
  imageUrl?: string;
  // 动态状态：项目方发布时前端固定置 APPROVED（立即公开展示），编辑时不传 status 以免误改可见性。
  status?: string;
}

// 总管理分配项目时下拉用的项目管理账号摘要（GET /api/admin/users/managers）。
export interface ManagerSummary {
    id: number | string;
    username: string;
    nickname: string;
}

// 项目管理凭一次性邀请码注册的请求体（POST /api/auth/register/manager）。
export interface RegisterManagerPayload {
    inviteCode: string;
    username: string;
    password: string;
    email: string;
}
