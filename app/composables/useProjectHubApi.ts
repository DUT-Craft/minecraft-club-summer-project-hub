import type {
  DataSnapshot,
  Idea,
  Project,
  ProjectComment,
  ProjectUpdate,
  ProjectUpdatePayload,
  ReviewStatus,
  SubmitCommentPayload,
  SubmitIdeaPayload,
  SubmitJoinPayload,
  SubmitProjectPayload,
  UpdateProjectPayload,
} from "~/types/projectHub";

type ApiEnvelope<T> = {
  code?: string | number;
  status?: string | number;
  msg?: string;
  message?: string;
  data?: T;
};

const emptySnapshot = (): DataSnapshot => ({
  projects: [],
  ideas: [],
  projectUpdates: [],
  projectComments: [],
});

const unwrap = <T>(response: T | ApiEnvelope<T>): T => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiEnvelope<T>).data as T;
  }

  return response as T;
};

const normalizeArray = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const normalizeProject = (project: Project): Project => ({
  ...project,
  status: project.status || project.projectStatus || "筹备中",
  ownerMinecraftId: project.ownerMinecraftId || project.submitterMinecraftId,
});

const normalizeIdea = (idea: Idea): Idea => ({
  ...idea,
  nickname: idea.nickname || idea.submitterName || "匿名同学",
});

const normalizeSnapshot = (snapshot: Partial<DataSnapshot>): DataSnapshot => ({
  projects: normalizeArray<Project>(snapshot.projects).map(normalizeProject),
  ideas: normalizeArray<Idea>(snapshot.ideas).map(normalizeIdea),
  projectUpdates: normalizeArray<ProjectUpdate>(snapshot.projectUpdates),
  projectComments: normalizeArray<ProjectComment>(snapshot.projectComments),
});

// openapi.json 中 /api/project/object-items 与 /api/project/minds 的原始实体字段名
// 与前端 Project / Idea 类型不一致，这里做一次映射
interface ObjectItemNeedMember {
  skill?: string;
  number?: number;
  context?: string;
}

interface ObjectItemResponse {
  id?: number | string;
  title?: string;
  type?: string;
  introduction?: string;
  description?: string;
  status?: string;
  leader?: string;
  leaderMcId?: string;
  needMembers?: ObjectItemNeedMember[];
  tags?: string[];
  contactInformation?: string;
  createTime?: string;
  updateTime?: string;
}

interface MindResponse {
  id?: number | string;
  title?: string;
  nickName?: string;
  content?: string;
  mcId?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
}

// 项目详情页子资源（项目动态 / 项目评论 / 加入申请）的原始实体字段名。
// 对应 openapi.json 中的 /api/project/object-items/{id}/updates|comments|join-applications。
interface ObjectItemUpdateResponse {
  id?: number | string;
  objectItemId?: number | string;
  title?: string;
  content?: string;
  imageUrl?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
}

interface ObjectItemCommentResponse {
  id?: number | string;
  objectItemId?: number | string;
  nickName?: string;
  content?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
}

export interface JoinApplicationResponse {
  id?: number | string;
  objectItemId?: number | string;
  nickName?: string;
  mcId?: string;
  contact?: string;
  reason?: string;
  skill?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
}

// 公开接口已按 status=APPROVED 过滤，能查到的都是已通过审核的内容
// 后端英文枚举（PENDING/APPROVED/REJECTED/...）→ 前端 ReviewStatus 联合，供管理端按真实状态展示
const mapReviewStatus = (status?: string): ReviewStatus => {
  switch ((status || "").toUpperCase()) {
    case "PENDING":
      return "pending";
    case "REJECTED":
      return "rejected";
    case "ACCEPTED":
      return "accepted";
    case "CONTACTED":
      return "contacted";
    case "APPROVED":
    default:
      return "approved";
  }
};

const mapObjectItemToProject = (item: ObjectItemResponse): Project => ({
  id: String(item.id ?? ""),
  title: item.title ?? "",
  type: item.type ?? "",
  summary: item.introduction,
  description: item.description ?? "",
  status: item.status,
  projectStatus: item.status,
  ownerName: item.leader ?? "",
  ownerMinecraftId: item.leaderMcId,
  skills: item.tags ? [...item.tags] : undefined,
  publicContact: item.contactInformation,
  recruitmentNeeds: normalizeArray<ObjectItemNeedMember>(item.needMembers).map((need) => ({
    skill: need.skill ?? "",
    count: need.number ?? 0,
    work: need.context ?? "",
  })),
  reviewStatus: "approved",
  createdAt: item.createTime ?? "",
  updatedAt: item.updateTime,
});

const mapMindToIdea = (mind: MindResponse): Idea => ({
  id: String(mind.id ?? ""),
  title: mind.title ?? "",
  content: mind.content ?? "",
  nickname: mind.nickName,
  submitterName: mind.nickName,
  minecraftId: mind.mcId,
  reviewStatus: "approved",
  createdAt: mind.createTime ?? "",
});

const mapObjectItemUpdateToProjectUpdate = (item: ObjectItemUpdateResponse): ProjectUpdate => ({
  id: String(item.id ?? ""),
  projectId: String(item.objectItemId ?? ""),
  title: item.title ?? "",
  content: item.content ?? "",
  imageUrl: item.imageUrl,
  reviewStatus: mapReviewStatus(item.status),
  createdAt: item.createTime ?? "",
});

const mapObjectItemCommentToProjectComment = (item: ObjectItemCommentResponse): ProjectComment => ({
  id: String(item.id ?? ""),
  projectId: String(item.objectItemId ?? ""),
  nickname: item.nickName ?? "",
  content: item.content ?? "",
  reviewStatus: mapReviewStatus(item.status),
  createdAt: item.createTime ?? "",
  updatedAt: item.updateTime,
});

export const useProjectHubApi = () => {
  const runtimeConfig = useRuntimeConfig();
  const baseURL = (runtimeConfig.public.apiBase as string) || "/api";

  const request = async <T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
    const response = await $fetch<T | ApiEnvelope<T>>(url, {
      baseURL,
      ...options,
    });

    return unwrap<T>(response);
  };

  // openapi 接口通过统一 http 客户端调用（useHttp，baseURL 已含 /api）
  // httpDelete 走 query；httpRequest 用于 DELETE /files 这类需要请求体的特殊场景。
  const { get, post, put, patch, delete: httpDelete, request: httpRequest } = useHttp();

  const loadSnapshot = async (): Promise<DataSnapshot> => {
    try {
      const snapshot = await request<Partial<DataSnapshot>>("/public/snapshot");
      return normalizeSnapshot(snapshot);
    } catch {
      return emptySnapshot();
    }
  };

  // 首页公开展示：GET /api/project/object-items?status=IN_PROGRESS
  const loadPublicProjects = async (): Promise<Project[]> => {
    try {
      const items = await request<ObjectItemResponse[]>("/project/object-items", {
        query: { status: "IN_PROGRESS" },
      });
      return normalizeArray<ObjectItemResponse>(items)
        .map(mapObjectItemToProject)
        .map(normalizeProject);
    } catch {
      return [];
    }
  };

  // 想法墙 / 首页公开展示：GET /api/project/minds?status=APPROVED（openapi.json）
  // 接口已按 APPROVED 过滤；走统一 http 客户端（useHttp）拉取 ApiResult<MindVO[]> 并解包，
  // 与 loadApprovedIdeaCount / loadPublicProjectCatalog 等公开查询保持同一调用口径。
  // 这里再按创建时间倒序，方便页面直接渲染。
  const loadPublicIdeas = async (): Promise<Idea[]> => {
    try {
      const minds = await get<MindResponse[]>("/project/minds", { status: "APPROVED" });
      return normalizeArray<MindResponse>(minds)
        .map(mapMindToIdea)
        .map(normalizeIdea)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    } catch {
      return [];
    }
  };

  // 项目广场（mall 页）数据源：GET /api/project/object-items?status=...
  // 接口仅支持单个 status，并行请求各公开状态后合并；
  // 公开状态 = PREPARING（筹备中）+ RECRUITING（招募中）+ IN_PROGRESS（制作中）+ PAUSED（暂缓），
  // PENDING / REJECTED / DELETED 不对外展示
  const loadPublicProjectCatalog = async (): Promise<Project[]> => {
    const publicStatuses = ["PREPARING", "RECRUITING", "IN_PROGRESS", "PAUSED"] as const;
    try {
      const groups = await Promise.all(
        publicStatuses.map((status) =>
          get<ObjectItemResponse[]>("/project/object-items", { status }),
        ),
      );
      return groups
        .flatMap((items) => normalizeArray<ObjectItemResponse>(items))
        .map(mapObjectItemToProject)
        .map(normalizeProject);
    } catch {
      return [];
    }
  };

  // 公开总数专用接口（openapi.json）：
  // - 制作中项目总数：GET /api/project/object-items/count/in-progress
  // - 审核通过想法总数：GET /api/project/minds/count/approved
  // count 接口的 data 在 openapi 中是泛型 object，真实结构未声明，
  // 这里兼容数字直接返回 / { count } / { total } 等常见形态，解析失败降级为 0
  const pickCount = (value: unknown): number => {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      for (const key of ["count", "total", "value", "number", "num"] as const) {
        const picked = record[key];
        if (typeof picked === "number") {
          return picked;
        }
        if (typeof picked === "string") {
          const parsed = Number(picked);
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
      }
    }
    return 0;
  };

  const loadApprovedProjectCount = async (): Promise<number> => {
    try {
      const data = await get<unknown>("/project/object-items/count/in-progress");
      return pickCount(data);
    } catch {
      return 0;
    }
  };

  const loadApprovedIdeaCount = async (): Promise<number> => {
    try {
      const data = await get<unknown>("/project/minds/count/approved");
      return pickCount(data);
    } catch {
      return 0;
    }
  };

  // 项目详情页（project[id].vue）数据源：
  // - 单个项目：GET /api/project/object-items/{id}（openapi.json 已提供）
  // - 项目动态：GET /api/project/object-items/{id}/updates?status=APPROVED（openapi.json）
  // - 项目评论：GET /api/project/object-items/{id}/comments?status=APPROVED（openapi.json）
  const loadProjectById = async (id: string | number): Promise<Project | null> => {
    try {
      const item = await get<ObjectItemResponse>(`/project/object-items/${id}`);
      return normalizeProject(mapObjectItemToProject(item));
    } catch {
      return null;
    }
  };

  const loadProjectUpdates = async (projectId: string | number): Promise<ProjectUpdate[]> => {
    try {
      const items = await get<ObjectItemUpdateResponse[]>(
        `/project/object-items/${projectId}/updates`,
        { status: "APPROVED" },
      );
      return normalizeArray<ObjectItemUpdateResponse>(items)
        .map(mapObjectItemUpdateToProjectUpdate)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    } catch {
      return [];
    }
  };

  const loadProjectComments = async (projectId: string | number): Promise<ProjectComment[]> => {
    try {
      const items = await get<ObjectItemCommentResponse[]>(
        `/project/object-items/${projectId}/comments`,
        { status: "APPROVED" },
      );
      return normalizeArray<ObjectItemCommentResponse>(items)
        .map(mapObjectItemCommentToProjectComment)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    } catch {
      return [];
    }
  };

  return {
    loadSnapshot,
    loadPublicProjects,
    loadPublicIdeas,
    loadPublicProjectCatalog,
    loadApprovedProjectCount,
    loadApprovedIdeaCount,
    loadProjectById,
    loadProjectUpdates,
    loadProjectComments,
    // 投稿页：POST /api/project/object-items（ObjectItemSaveRequest）
    // 前端表单字段映射到接口字段：ownerName→leader、ownerMinecraftId→leaderMcId、
    // publicContact→contactInformation、ownerPassword→controlPassword、
    // recruitmentNeeds→needMembers（count→number、work→context）。
    // 新投稿固定 status = PENDING，由后端审核流程推进，不信任客户端传入的 status。
    submitProject: async (body: SubmitProjectPayload): Promise<Project> => {
      const item = await post<ObjectItemResponse>("/project/object-items", {
        title: body.title,
        type: body.type,
        introduction: body.introduction,
        description: body.description,
        status: "PENDING",
        leader: body.ownerName,
        leaderMcId: body.ownerMinecraftId,
        contactInformation: body.publicContact,
        controlPassword: body.ownerPassword,
        needMembers: (body.recruitmentNeeds ?? []).map((need) => ({
          skill: need.skill,
          number: need.count,
          context: need.work,
        })),
        tags: body.tags ?? [],
      }, { payloadMode: "json" });

      return normalizeProject(mapObjectItemToProject(item));
    },
    // 投稿页：POST /api/project/minds（MindSaveRequest）
    // 前端表单字段映射：nickname→nickName、minecraftId→mcId；新投稿固定 status = PENDING。
    submitIdea: async (body: SubmitIdeaPayload): Promise<Idea> => {
      const mind = await post<MindResponse>("/project/minds", {
        title: body.title,
        content: body.content,
        nickName: body.nickname,
        mcId: body.minecraftId,
        status: "PENDING",
      }, { payloadMode: "json" });

      return normalizeIdea(mapMindToIdea(mind));
    },
    // 项目详情页：POST /api/project/object-items/{id}/join-applications（openapi.json）
    // 请求体仅含 nickName / mcId / contact / reason；objectItemId 取自路径 id；
    // status 由后端固定为 PENDING，不传。
    submitJoin: async (body: SubmitJoinPayload): Promise<JoinApplicationResponse> => {
      return post<JoinApplicationResponse>(
        `/project/object-items/${body.projectId}/join-applications`,
        {
          nickName: body.nickname,
          mcId: body.minecraftId,
          contact: body.contact,
          reason: body.reason,
        },
        { payloadMode: "json" },
      );
    },
    // 项目详情页：POST /api/project/object-items/{id}/comments（openapi.json）
    // 请求体仅含 nickName / content；objectItemId 取自路径 id；
    // status 由后端固定为 PENDING，审核通过后才会在公开列表展示，因此请求体不传 status。
    submitComment: async (body: SubmitCommentPayload): Promise<ProjectComment> => {
      const item = await post<ObjectItemCommentResponse>(
        `/project/object-items/${body.projectId}/comments`,
        {
          nickName: body.nickname,
          content: body.content,
        },
        { payloadMode: "json" },
      );

      return mapObjectItemCommentToProjectComment(item);
    },
    // 项目方登录（openapi.json）：POST /api/admin/project/object-items/{id}/verify
    // 传入项目 ID（路径）+ 控制密码（请求体 controlPassword），校验通过后返回项目详情。
    // 与普通用户登录不同：项目方没有 token，后续所有 /api/admin/project/... 操作都要求每次请求
    // 带上 controlPassword，所以前端需要在会话里留存 controlPassword 明文（见 useOwnerSession）。
    verifyProjectOwner: async (projectId: string | number, controlPassword: string): Promise<Project> => {
      const item = await post<ObjectItemResponse>(
        `/admin/project/object-items/${projectId}/verify`,
        { controlPassword },
        { payloadMode: "json" },
      );

      return normalizeProject(mapObjectItemToProject(item));
    },
    // 项目方编辑项目信息：PUT /api/admin/project/object-items/{id}（openapi.json）
    // 与公开 POST 投稿不同，管理端更新请求体额外携带 controlPassword 做身份校验；
    // 字段映射沿用 submitProject 的口径（ownerName→leader 等）。
    // 不传 controlPassword 以外的敏感字段；status 仅在 4 个运营状态间切换。
    updateProject: async (
      projectId: string | number,
      controlPassword: string,
      body: UpdateProjectPayload,
    ): Promise<Project> => {
      const item = await put<ObjectItemResponse>(
        `/admin/project/object-items/${projectId}`,
        {
          controlPassword,
          title: body.title,
          type: body.type,
          introduction: body.introduction,
          description: body.description,
          status: body.status,
          leader: body.ownerName,
          leaderMcId: body.ownerMinecraftId,
          contactInformation: body.publicContact,
          needMembers: (body.recruitmentNeeds ?? []).map((need) => ({
            skill: need.skill,
            number: need.count,
            context: need.work,
          })),
          tags: body.tags ?? [],
        },
        { payloadMode: "json" },
      );

      return normalizeProject(mapObjectItemToProject(item));
    },
    // 项目方修改管理密码：PATCH /api/admin/project/object-items/{id}/password（openapi.json）
    // 校验当前 controlPassword 通过后替换为 newControlPassword；前端需同步更新会话里的明文密码。
    changeControlPassword: async (
      projectId: string | number,
      controlPassword: string,
      newControlPassword: string,
    ): Promise<void> => {
      await patch(
        `/admin/project/object-items/${projectId}/password`,
        { controlPassword, newControlPassword },
        { payloadMode: "json" },
      );
    },
    // 项目方查看加入申请列表：GET /api/admin/project/object-items/{id}/join-applications
    // ⚠️ openapi.json 缺失此接口（见 api.json「缺失接口-必要」），按 api.json 约定调用：
    // controlPassword / status 走 query（项目方无 token，GET 无法携带请求体）。
    // 后端实现前此调用可能 404，调用方需自行兜底；返回全状态申请，前端可按 status 过滤。
    loadJoinApplications: async (
      projectId: string | number,
      controlPassword: string,
      status?: string,
    ): Promise<JoinApplicationResponse[]> => {
      const items = await get<JoinApplicationResponse[]>(
        `/admin/project/object-items/${projectId}/join-applications`,
        { controlPassword, ...(status ? { status } : {}) },
      );
      return normalizeArray<JoinApplicationResponse>(items);
    },
    // 项目方同意加入申请：POST .../join-applications/{applicationId}/accept（openapi.json）
    // controlPassword 走请求体（与 accept/reject 两个接口的 openapi 定义一致）。
    acceptJoinApplication: async (
      projectId: string | number,
      applicationId: string | number,
      controlPassword: string,
    ): Promise<void> => {
      await post(
        `/admin/project/object-items/${projectId}/join-applications/${applicationId}/accept`,
        { controlPassword },
        { payloadMode: "json" },
      );
    },
    // 项目方拒绝加入申请：POST .../join-applications/{applicationId}/reject（openapi.json）
    rejectJoinApplication: async (
      projectId: string | number,
      applicationId: string | number,
      controlPassword: string,
    ): Promise<void> => {
      await post(
        `/admin/project/object-items/${projectId}/join-applications/${applicationId}/reject`,
        { controlPassword },
        { payloadMode: "json" },
      );
    },
    // 项目方软删除项目：DELETE /api/admin/project/object-items/{id}（openapi.json）
    // 注意此接口的 controlPassword 走请求体（与 verify/update 一致），不是 query，
    // 因此不能用走 query 的 httpDelete，改用 httpRequest 显式指定 method=DELETE + json body。
    deleteProject: async (projectId: string | number, controlPassword: string): Promise<void> => {
      await httpRequest<void>(
        `/admin/project/object-items/${projectId}`,
        { controlPassword },
        { method: "DELETE", payloadMode: "json" },
      );
    },
    // 项目方查看全状态动态列表：GET /api/admin/project/object-items/{id}/updates（openapi.json）
    // 含 PENDING，供项目方管理（编辑 / 删除待审动态）。controlPassword / status 走 query。
    loadProjectUpdatesAdmin: async (
      projectId: string | number,
      controlPassword: string,
      status?: string,
    ): Promise<ProjectUpdate[]> => {
      const items = await get<ObjectItemUpdateResponse[]>(
        `/admin/project/object-items/${projectId}/updates`,
        { controlPassword, ...(status ? { status } : {}) },
      );
      return normalizeArray<ObjectItemUpdateResponse>(items)
        .map(mapObjectItemUpdateToProjectUpdate)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    },
    // 项目方发布动态：POST /api/admin/project/object-items/{id}/updates（openapi.json）
    // 项目方已通过 controlPassword 身份校验，发布即公开，前端固定 status=APPROVED。
    createProjectUpdate: async (
      projectId: string | number,
      controlPassword: string,
      body: ProjectUpdatePayload,
    ): Promise<ProjectUpdate> => {
      const item = await post<ObjectItemUpdateResponse>(
        `/admin/project/object-items/${projectId}/updates`,
        {
          controlPassword,
          title: body.title,
          content: body.content,
          imageUrl: body.imageUrl,
          status: body.status ?? "APPROVED",
        },
        { payloadMode: "json" },
      );
      return mapObjectItemUpdateToProjectUpdate(item);
    },
    // 项目方修改动态：PUT /api/admin/project/object-items/{id}/updates/{updateId}（openapi.json）
    // 空值字段表示不修改；编辑表单不传 status，避免误改可见性。
    updateProjectUpdate: async (
      projectId: string | number,
      updateId: string | number,
      controlPassword: string,
      body: ProjectUpdatePayload,
    ): Promise<ProjectUpdate> => {
      const item = await put<ObjectItemUpdateResponse>(
        `/admin/project/object-items/${projectId}/updates/${updateId}`,
        {
          controlPassword,
          title: body.title,
          content: body.content,
          imageUrl: body.imageUrl,
        },
        { payloadMode: "json" },
      );
      return mapObjectItemUpdateToProjectUpdate(item);
    },
    // 项目方删除动态：DELETE /api/admin/project/object-items/{id}/updates/{updateId}（openapi.json）
    // 此接口的 controlPassword 走 query（与「删除项目」走 body 不同），用 httpDelete。
    deleteProjectUpdate: async (
      projectId: string | number,
      updateId: string | number,
      controlPassword: string,
    ): Promise<void> => {
      await httpDelete(
        `/admin/project/object-items/${projectId}/updates/${updateId}`,
        { controlPassword },
      );
    },
    // 项目方查看全状态评论列表：GET /api/admin/project/object-items/{id}/comments（openapi.json）
    // 含 PENDING，供项目方审核。controlPassword / status 走 query。
    loadProjectCommentsAdmin: async (
      projectId: string | number,
      controlPassword: string,
      status?: string,
    ): Promise<ProjectComment[]> => {
      const items = await get<ObjectItemCommentResponse[]>(
        `/admin/project/object-items/${projectId}/comments`,
        { controlPassword, ...(status ? { status } : {}) },
      );
      return normalizeArray<ObjectItemCommentResponse>(items)
        .map(mapObjectItemCommentToProjectComment)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    },
    // 项目方审核评论：PATCH /api/admin/project/object-items/{id}/comments/{commentId}/status（openapi.json）
    // 把 PENDING 评论置为 APPROVED（公开）/ REJECTED / DELETED。controlPassword + status 走请求体。
    moderateProjectComment: async (
      projectId: string | number,
      commentId: string | number,
      controlPassword: string,
      status: string,
    ): Promise<void> => {
      await patch(
        `/admin/project/object-items/${projectId}/comments/${commentId}/status`,
        { controlPassword, status },
        { payloadMode: "json" },
      );
    },
    // 通用文件上传：POST /api/files/upload（openapi.json，multipart/form-data）
    // 返回可公开访问的下载地址；openapi 的 data 是泛型 object，这里兼容字符串 / { url } 等常见形态。
    // 显式把 TPayload 声明为 FormData：useHttp 的 body 字段类型跟随 payload 泛型，
    // 这样 FormData 能作为请求体直接传入，payloadMode=json 时由 requestBase 转成 body，ofetch 自动设置 multipart 头。
    uploadFile: async (file: File): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);
      const result = await post<unknown, FormData>("/files/upload", formData, {
        payloadMode: "json",
      });
      if (typeof result === "string") {
        return result;
      }
      if (result && typeof result === "object") {
        const record = result as Record<string, unknown>;
        for (const key of ["url", "link", "path", "fileUrl", "downloadUrl", "data"]) {
          const picked = record[key];
          if (typeof picked === "string") {
            return picked;
          }
        }
      }
      return "";
    },
    /* ---------- 全局管理员（token 鉴权，管理全部项目 / 想法） ---------- */
    // 管理员登录：POST /api/auth/login（openapi.json，User-Agent 由浏览器自动带）
    // 返回 token + 用户资料；data 是泛型 object，兼容 token / accessToken / authorization 等字段名。
    adminLogin: async (username: string, password: string): Promise<{ token: string; username: string }> => {
      const data = await post<Record<string, unknown>>("/auth/login", { username, password }, { payloadMode: "json" });
      const record = (data ?? {}) as Record<string, unknown>;
      const userRecord = (record.user && typeof record.user === "object" ? record.user : {}) as Record<string, unknown>;
      const token = String(
        record.token ?? record.accessToken ?? record.access_token ?? record.authorization ?? "",
      );
      const name = String(record.username ?? userRecord.username ?? userRecord.nickname ?? username);
      return { token, username: name };
    },
    // 管理员查询项目列表（全状态）：GET /api/project/object-items?status=（openapi.json）
    // 该接口仅支持单个 status；status 为空时并行拉取全部 8 个状态后合并，让管理员看到含 PENDING 的全量。
    // 复用公开 GET（管理员 token 使后端返回非公开状态）。
    listProjectsAdmin: async (status?: string): Promise<Project[]> => {
      const fetchByStatus = (s: string) =>
        get<ObjectItemResponse[]>("/project/object-items", { status: s }).catch(() => [] as ObjectItemResponse[]);
      const groups = status
        ? [await fetchByStatus(status)]
        : await Promise.all(
            ["PENDING", "APPROVED", "REJECTED", "DELETED", "PREPARING", "RECRUITING", "IN_PROGRESS", "PAUSED"].map(
              fetchByStatus,
            ),
          );
      return groups
        .flatMap((items) => normalizeArray<ObjectItemResponse>(items))
        .map(mapObjectItemToProject)
        .map(normalizeProject);
    },
    // 管理员批量更新项目状态：PUT /api/project/object-items/batch（openapi.json）
    // 管理员走 JWT 鉴权（useHttp 自动带 Bearer），不涉及项目方的 controlPassword，items 只传 { id, status }。
    updateProjectStatusBatch: async (items: { id: string | number; status: string }[]): Promise<void> => {
      await put(
        "/project/object-items/batch",
        { items: items.map((it) => ({ id: it.id, status: it.status })) },
        { payloadMode: "json" },
      );
    },
    // 管理员批量删除项目（软删除）：DELETE /api/project/object-items/batch，controlPassword 走请求体 { ids }。
    // 注意：批量删除只需 ids，不需要每条的 controlPassword（与单条删除不同）。
    deleteProjectBatch: async (ids: (string | number)[]): Promise<void> => {
      await httpRequest("/project/object-items/batch", { ids }, { method: "DELETE", payloadMode: "json" });
    },
    // 管理员修改单个项目信息：PUT /api/project/object-items/{id}（openapi.json，全局接口）
    // 与项目方的 PUT /admin/project/object-items/{id} 不同：全局接口面向管理员，走 JWT 鉴权，
    // 不携带 controlPassword（openapi 该接口 body 里的 controlPassword 字段仅项目方自服务时使用）。
    updateProjectAdmin: async (projectId: string | number, body: UpdateProjectPayload): Promise<Project> => {
      const item = await put<ObjectItemResponse>(
        `/project/object-items/${projectId}`,
        {
          id: projectId,
          title: body.title,
          type: body.type,
          introduction: body.introduction,
          description: body.description,
          status: body.status,
          leader: body.ownerName,
          leaderMcId: body.ownerMinecraftId,
          contactInformation: body.publicContact,
          needMembers: (body.recruitmentNeeds ?? []).map((need) => ({
            skill: need.skill,
            number: need.count,
            context: need.work,
          })),
          tags: body.tags ?? [],
        },
        { payloadMode: "json" },
      );
      return normalizeProject(mapObjectItemToProject(item));
    },
    // 管理员查询想法列表（全状态）：GET /api/project/minds（openapi.json）
    // minds 的 GET 原生支持 statuses 数组参数，一次请求即可拉多状态；status 为空时拉全部 4 个状态。
    listIdeasAdmin: async (status?: string): Promise<Idea[]> => {
      const statuses = status ? [status] : ["PENDING", "APPROVED", "REJECTED", "DELETED"];
      const minds = await get<MindResponse[]>("/project/minds", { statuses });
      return normalizeArray<MindResponse>(minds)
        .map(mapMindToIdea)
        .map(normalizeIdea);
    },
    // 管理员查询单个想法：GET /api/project/minds/{id}（openapi.json）
    getIdeaAdmin: async (id: string | number): Promise<Idea | null> => {
      try {
        const mind = await get<MindResponse>(`/project/minds/${id}`);
        return normalizeIdea(mapMindToIdea(mind));
      } catch {
        return null;
      }
    },
    // 管理员修改单个想法：PUT /api/project/minds/{id}（openapi.json）
    // minds 更新不需要 controlPassword（与项目不同），管理员可直接改任意字段；空值字段不修改。
    updateIdeaAdmin: async (
      id: string | number,
      body: { title?: string; content?: string; nickName?: string; mcId?: string; status?: string },
    ): Promise<Idea> => {
      const mind = await put<MindResponse>(
        `/project/minds/${id}`,
        { id, title: body.title, content: body.content, nickName: body.nickName, mcId: body.mcId, status: body.status },
        { payloadMode: "json" },
      );
      return normalizeIdea(mapMindToIdea(mind));
    },
    // 管理员批量更新想法状态：PUT /api/project/minds/batch（openapi.json），items 只传 { id, status }。
    updateIdeaStatusBatch: async (items: { id: string | number; status: string }[]): Promise<void> => {
      await put(
        "/project/minds/batch",
        { items: items.map((it) => ({ id: it.id, status: it.status })) },
        { payloadMode: "json" },
      );
    },
    // 管理员批量删除想法：DELETE /api/project/minds/batch，请求体 { ids }。
    deleteIdeaBatch: async (ids: (string | number)[]): Promise<void> => {
      await httpRequest("/project/minds/batch", { ids }, { method: "DELETE", payloadMode: "json" });
    },
  };
};
