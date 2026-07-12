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
    coverImageUrl?: string;
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
    coverImageUrl?: string;
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
    coverImageUrl?: string;
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

// 总管理分配项目时下拉用的可归属账号摘要（GET /api/admin/users/managers）。
// 含项目管理与总管理（总管理也可拥有并管理自有项目），role 用于在下拉里标注身份。
export interface ManagerSummary {
    id: number | string;
    username: string;
    nickname: string;
    role: "SUPER_ADMIN" | "PROJECT_MANAGER";
}

// 管理员直接创建归属自己的项目（POST /api/admin/object-items）。
// 与匿名投稿 SubmitProjectPayload 的区别：归属人为当前管理员（后端按 JWT 写入 ownerId），
// status 可由总管理指定（默认后端 RECRUITING 上线），项目管理固定 PENDING 由后端强制；
// controlPassword 可选——留空则该项目不支持「项目方控制密码自服务」，仅管理员 JWT 管理。
export interface CreateProjectAdminPayload {
    title: string;
    type: string;
    introduction?: string;
    tags?: string[];
    ownerName?: string;
    ownerMinecraftId?: string;
    description?: string;
    publicContact?: string;
    coverImageUrl?: string;
    recruitmentNeeds?: RecruitmentNeed[];
    status?: string;
    controlPassword?: string;
}

// 项目管理凭一次性邀请码注册的请求体（POST /api/auth/register/manager）。
export interface RegisterManagerPayload {
    inviteCode: string;
    username: string;
    password: string;
    email: string;
    emailCode: string;
}

// 邮箱验证码场景（与后端 VerificationCodeService.Scene 枚举一致）。
export type VerificationScene = "REGISTER" | "CHANGE_PASSWORD" | "RESET_PASSWORD" | "EMAIL_LOGIN";

// 发送邮箱验证码请求（POST /api/auth/verification-code）。
export interface SendCodePayload {
    email: string;
    scene: VerificationScene;
    userId?: number | string | null;
}

// 邮箱验证登录请求（POST /api/auth/login/email）：账号 + 密码 + 邮箱 + 邮箱验证码。
export interface EmailLoginPayload {
    account: string;
    password: string;
    email: string;
    emailCode: string;
}

// 修改密码请求（POST /api/auth/change-password，已登录）：旧密码 + 新密码 + 邮箱 + 验证码。
export interface ChangePasswordPayload {
    oldPassword: string;
    newPassword: string;
    email: string;
    emailCode: string;
}

// 找回密码请求（POST /api/auth/reset-password，匿名）：邮箱 + 验证码 + 新密码。
export interface ResetPasswordPayload {
    email: string;
    emailCode: string;
    newPassword: string;
}

// 总管理历史邀请码记录（GET /api/admin/invites）。status 为后端枚举：UNUSED / USED / EXPIRED。
export interface InviteHistoryItem {
  code: string;
  status: "UNUSED" | "USED" | "EXPIRED";
  createdById: number;
  createdBy: string;
  createdAt: string;
  usedById?: number | null;
  usedBy?: string | null;
  usedAt?: string | null;
  expiresAt: string;
}

// 文件分类（与后端 FileCategory 枚举一致）：图片 / 文档。
export type FileCategory = "IMAGE" | "DOCUMENT";

// 单个已上传文件的元数据（POST /api/files 返回 / 我的文件列表项）。
export interface FileItem {
    id?: number;
    storedName: string;
    originalName: string;
    mimeType?: string;
    size?: number;
    category: FileCategory;
    url: string;
    createTime?: string;
}

// 我的文件分页结果（GET /api/files/mine）。
export interface FilePage {
    content: FileItem[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}
