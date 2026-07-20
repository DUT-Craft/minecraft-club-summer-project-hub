export type ReviewStatus = "pending" | "approved" | "rejected" | "contacted" | "accepted" | "withdrawn" | "deleted";

export interface RecruitmentNeed {
  id?: string;
  skill: string;
  count: number;
  work: string;
}

// 全局标签字典里的单个标签（项目响应里携带的轻量形态，对标后端 TagSummaryResponse）。
// 改造后「项目分类 / 项目类型」已并入这套 Tag 字典，不再有独立的 type 字段。
export interface ProjectTag {
  id: number | string;
  name: string;
  parentId?: number | string | null;
}

// 公开 Tag 树节点（GET /api/project/tags/tree）：驱动投稿 / 编辑 / 项目墙的 Cascader。
// selectable=false 的节点仅用于分组展示，不能被项目直接选择。
export interface TagTreeNode extends ProjectTag {
  selectable: boolean;
  sortOrder: number;
  children: TagTreeNode[];
}

// 管理端 Tag 列表项（GET /api/admin/tags）：含关联项目数与软删除状态，平铺返回，前端按 parentId 组树。
export interface TagAdminItem extends ProjectTag {
  selectable: boolean;
  sortOrder: number;
  description?: string | null;
  projectCount: number;
  deleted: boolean;
  createTime?: string | null;
  updateTime?: string | null;
}

// 管理端新增 / 修改 Tag 的请求体（对标后端 TagSaveRequest）。
export interface TagSavePayload {
  name: string;
  parentId?: number | string | null;
  selectable: boolean;
  sortOrder: number;
  description?: string | null;
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
  // 项目标签（对标后端 ObjectItemResponse.tags: TagSummaryResponse[]）。
  // 原 type（项目类型）与自由字符串 tags 已统一并入这套由后台维护的 Tag 字典。
  tags: ProjectTag[];
  status?: string;
  projectStatus?: string;
  ownerName: string;
  ownerMinecraftId?: string;
  submitterMinecraftId?: string;
    // 后端 ObjectItem.ownerId：负责该项目的「项目管理」账号 id（由总管理分配），未分配为 null/undefined。
    managerId?: number | string | null;
  neededMembers?: number;
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
  // 标签 ID（0~10 个，仅能从管理员预设的 Tag 字典里选择）；后端统一校验数量 / 去重 / 存在性。
  tagIds: Array<number | string>;
  introduction?: string;
  ownerName: string;
  ownerMinecraftId: string;
  description: string;
  publicContact: string;
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
// 与 SubmitProjectPayload 的区别：投稿是全新创建，编辑是增量修改已存在项目。
export interface UpdateProjectPayload {
  title?: string;
  // 标签 ID：null/undefined = 不修改；空数组 = 清空全部标签；非空数组 = 完整替换。
  // 与后端 ObjectItemUpdateRequest.tagIds 的 PATCH/PUT 语义对齐。
  tagIds?: Array<number | string>;
  introduction?: string;
  description?: string;
  // 仅允许在 4 个运营状态间切换（PREPARING/RECRUITING/IN_PROGRESS/PAUSED）；
  // 审核类状态（PENDING/APPROVED/REJECTED/DELETED）由管理员侧推进，前端不直接设置
  status?: string;
  ownerName?: string;
  ownerMinecraftId?: string;
  publicContact?: string;
    coverImageUrl?: string;
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
// 含拥有项目创建资格的用户与超级管理员，role 用于在下拉里标注身份。
export interface ManagerSummary {
    id: number | string;
    username: string;
    nickname: string;
    role: "SUPER_ADMIN" | "USER" | "PROJECT_MANAGER";
}

// 管理员直接创建归属自己的项目（POST /api/admin/object-items）。
// 归属人为当前登录用户（后端按 JWT 写入 ownerId），status 可由总管理指定（默认后端 RECRUITING 上线），
// 普通用户固定 PENDING 由后端强制。
export interface CreateProjectAdminPayload {
    title: string;
    // 标签 ID（0~10 个，仅能从管理员预设的 Tag 字典里选择）；与匿名投稿同一套后端校验。
    tagIds: Array<number | string>;
    introduction?: string;
    ownerName?: string;
    ownerMinecraftId?: string;
    description?: string;
    publicContact?: string;
    coverImageUrl?: string;
    recruitmentNeeds?: RecruitmentNeed[];
    status?: string;
}

// 项目管理凭一次性邀请码注册的请求体（POST /api/auth/register/manager）。
export interface RegisterManagerPayload {
    inviteCode: string;
    username: string;
    password: string;
    confirmPassword: string;
    email: string;
    emailCode: string;
}

// 普通用户公开注册请求体（POST /api/auth/register，无需邀请码，设计 §4.1）。
export interface RegisterUserPayload {
    username: string;
    password: string;
    confirmPassword: string;
    email: string;
    emailCode: string;
}

// 邮箱验证码场景（与后端 VerificationCodeService.Scene 枚举一致）。
export type VerificationScene = "REGISTER" | "CHANGE_PASSWORD" | "RESET_PASSWORD" | "EMAIL_LOGIN" | "RECOVER_USERNAME" | "REACTIVATE";

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

// 修改密码请求（POST /api/auth/change-password，已登录）：旧密码 + 新密码 + 确认密码 + 本人邮箱验证码。
// 后端只认已认证用户绑定邮箱的验证码（设计 §6.2），请求体不再携带 email。
export interface ChangePasswordPayload {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
    emailCode: string;
}

// 找回密码请求（POST /api/auth/reset-password，匿名）：邮箱 + 验证码 + 新密码 + 确认密码。
export interface ResetPasswordPayload {
    email: string;
    emailCode: string;
    newPassword: string;
    confirmPassword: string;
}

// 找回用户名请求（POST /api/auth/username/recover，匿名）：邮箱 + 验证码。
// 验证通过后用户名发送到绑定邮箱，接口不回显用户名（设计 §6.3）。
export interface RecoverUsernamePayload {
    email: string;
    emailCode: string;
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

// 项目内角色（与后端 ProjectRole 枚举一致，设计 §2.3）。
export type ProjectRole = "OWNER" | "MANAGER" | "MEMBER";

// 成员关系状态（与后端 MemberStatus 枚举一致）。
export type MemberStatus = "ACTIVE" | "LEFT" | "REMOVED";

// 项目成员（GET /api/project/object-items/{id}/members）。
export interface ProjectMemberItem {
    id?: number | string;
    projectId?: number | string;
    userId?: number | string;
    role?: ProjectRole;
    status?: MemberStatus;
    joinedAt?: string;
    leftAt?: string | null;
}

// 添加成员请求（POST /api/project/object-items/{id}/members）。
export interface AddMemberPayload {
    userId: number | string;
    role?: ProjectRole;
}

// 转交所有权请求（POST /api/project/object-items/{id}/transfer）。
export interface TransferOwnerPayload {
    newOwnerId: number | string;
}

// 公开项目分页结果（GET /api/project/object-items 带 page/size 时返回）。
// 不带 page/size 时后端返回裸数组 Project[]，由 composable 分别处理。
export interface ProjectPage {
    content: Project[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}
