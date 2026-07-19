import type {
  ChangePasswordPayload,
  CreateProjectAdminPayload,
  DataSnapshot,
  EmailLoginPayload,
  FileItem,
  FilePage,
  Idea,
  InviteHistoryItem,
  ManagerSummary,
  Project,
  ProjectComment,
  ProjectPage,
  ProjectTag,
  ProjectUpdate,
  ProjectUpdatePayload,
  RegisterManagerPayload,
  ResetPasswordPayload,
  ReviewStatus,
  SendCodePayload,
  SubmitCommentPayload,
  SubmitIdeaPayload,
  SubmitJoinPayload,
  SubmitProjectPayload,
  TagAdminItem,
  TagSavePayload,
  TagTreeNode,
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

// 管理员分页接口的 data 被 SpringDoc 泛型擦除为空 object，实际可能是：
// ① 分页包装 { list: T[], total, page, size }；② 裸数组 T[]；③ 带其它键的对象。
// 这里兼容解析，取 list / records / items / data 中第一个数组，否则直接当数组。
const extractList = <T>(value: unknown): T[] => {
    if (Array.isArray(value)) {
        return value as T[];
    }
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        for (const key of ["list", "records", "items", "data", "content"]) {
            if (Array.isArray(record[key])) {
                return record[key] as T[];
            }
        }
    }
    return [];
};

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

// 后端 TagSummaryResponse：项目响应里携带的标签（id + 名称 + 父节点）。
interface ObjectItemTag {
  id?: number | string;
  name?: string;
  parentId?: number | string | null;
}

interface ObjectItemResponse {
  id?: number | string;
  title?: string;
  introduction?: string;
  description?: string;
  status?: string;
  leader?: string;
  leaderMcId?: string;
  needMembers?: ObjectItemNeedMember[];
  tags?: ObjectItemTag[];
  contactInformation?: string;
  coverImageUrl?: string;
    ownerId?: number | string | null;
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
    case "DELETED":
      return "deleted";
    case "APPROVED":
    default:
      return "approved";
  }
};

const mapObjectItemToProject = (item: ObjectItemResponse): Project => ({
  id: String(item.id ?? ""),
  title: item.title ?? "",
  tags: normalizeArray<ObjectItemTag>(item.tags).map((tag) => ({
    id: tag.id ?? "",
    name: tag.name ?? "",
    parentId: tag.parentId ?? null,
  })),
  summary: item.introduction,
  description: item.description ?? "",
  status: item.status,
  projectStatus: item.status,
  ownerName: item.leader ?? "",
  ownerMinecraftId: item.leaderMcId,
    managerId: item.ownerId ?? null,
  publicContact: item.contactInformation,
  coverImageUrl: item.coverImageUrl,
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
  const {get, post, put, patch, delete: httpDelete, request: httpRequest} = useHttp();

  const loadSnapshot = async (): Promise<DataSnapshot> => {
    try {
      const snapshot = await request<Partial<DataSnapshot>>("/public/snapshot");
      return normalizeSnapshot(snapshot);
    } catch {
      return emptySnapshot();
    }
  };

  // 想法墙 / 首页公开展示：GET /api/project/minds?status=APPROVED（openapi.json）
  // 接口已按 APPROVED 过滤；走统一 http 客户端（useHttp）拉取 ApiResult<MindVO[]> 并解包，
  // 与 loadApprovedIdeaCount / loadPublicProjectCatalog 等公开查询保持同一调用口径。
  // 这里再按创建时间倒序，方便页面直接渲染。
  const loadPublicIdeas = async (): Promise<Idea[]> => {
    try {
      const minds = await get<MindResponse[]>("/project/minds", {status: "APPROVED"});
      return normalizeArray<MindResponse>(minds)
          .map(mapMindToIdea)
          .map(normalizeIdea)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    } catch {
      return [];
    }
  };

  // 项目广场（mall 页）/ 首页数据源：GET /api/project/object-items
  // 后端 Tag 化改造后：关键字命中 标题/简介/描述/负责人/标签名；tagIds + tagMatch(ANY/ALL) 做 Cascader 筛选；
  // 公开端固定只返回 PUBLIC_STATUSES（APPROVED/PREPARING/RECRUITING/IN_PROGRESS/PAUSED）内的项目，
  // 不再需要前端并发请求五个状态。不传 page/size 时后端返回裸数组（全量），便于内存侧二次筛选状态/技能。
  const loadPublicProjects = async (query: {
    keyword?: string;
    tagIds?: Array<number | string>;
    tagMatch?: "ANY" | "ALL";
  } = {}): Promise<Project[]> => {
    try {
      const params: Record<string, unknown> = {};
      if (query.keyword?.trim()) {
        params.keyword = query.keyword.trim();
      }
      if (query.tagIds?.length) {
        params.tagIds = query.tagIds;
        if (query.tagMatch) {
          params.tagMatch = query.tagMatch;
        }
      }
      const items = await get<ObjectItemResponse[]>("/project/object-items", params);
      return normalizeArray<ObjectItemResponse>(items)
          .map(mapObjectItemToProject)
          .map(normalizeProject);
    } catch {
      return [];
    }
  };

  // 不带筛选的公开项目全集（首页 hot tags / 公开项目总数等场景的便捷入口）
  const loadPublicProjectCatalog = (): Promise<Project[]> => loadPublicProjects();

  // 公开总数专用接口（openapi.json）：审核通过想法总数 GET /api/project/minds/count/approved。
  // （项目侧「公开项目」总数不再走 count 接口——loadPublicProjectCatalog 拉的就是全部公开项目，
  //   调用方 index.vue 直接取 .length 即可，口径与项目广场 mall 页一致，避免与列表展示数对不上。）
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
          {status: "APPROVED"},
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
          {status: "APPROVED"},
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
    loadPublicIdeas,
    loadPublicProjects,
    loadPublicProjectCatalog,
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
        tagIds: body.tagIds ?? [],
        introduction: body.introduction,
        description: body.description,
        status: "PENDING",
        leader: body.ownerName,
        leaderMcId: body.ownerMinecraftId,
        contactInformation: body.publicContact,
        coverImageUrl: body.coverImageUrl,
        controlPassword: body.ownerPassword,
        needMembers: (body.recruitmentNeeds ?? []).map((need) => ({
          skill: need.skill,
          number: need.count,
          context: need.work,
        })),
      }, {payloadMode: "json"});

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
      }, {payloadMode: "json"});

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
          {payloadMode: "json"},
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
          {payloadMode: "json"},
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
          {controlPassword},
          {payloadMode: "json"},
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
            tagIds: body.tagIds,
            introduction: body.introduction,
            description: body.description,
            status: body.status,
            leader: body.ownerName,
            leaderMcId: body.ownerMinecraftId,
            contactInformation: body.publicContact,
            coverImageUrl: body.coverImageUrl,
            needMembers: (body.recruitmentNeeds ?? []).map((need) => ({
              skill: need.skill,
              number: need.count,
              context: need.work,
            })),
          },
          {payloadMode: "json"},
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
          {controlPassword, newControlPassword},
          {payloadMode: "json"},
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
          {controlPassword, ...(status ? {status} : {})},
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
          {controlPassword},
          {payloadMode: "json"},
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
          {controlPassword},
          {payloadMode: "json"},
      );
    },
    // 项目方软删除项目：DELETE /api/admin/project/object-items/{id}（openapi.json）
    // 注意此接口的 controlPassword 走请求体（与 verify/update 一致），不是 query，
    // 因此不能用走 query 的 httpDelete，改用 httpRequest 显式指定 method=DELETE + json body。
    deleteProject: async (projectId: string | number, controlPassword: string): Promise<void> => {
      await httpRequest<void>(
          `/admin/project/object-items/${projectId}`,
          {controlPassword},
          {method: "DELETE", payloadMode: "json"},
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
          {controlPassword, ...(status ? {status} : {})},
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
          {payloadMode: "json"},
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
          {payloadMode: "json"},
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
          {controlPassword},
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
          {controlPassword, ...(status ? {status} : {})},
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
          {controlPassword, status},
          {payloadMode: "json"},
      );
    },
    // 通用文件上传：POST /api/files（multipart/form-data）。
    // 字段：file（二进制）+ type（IMAGE|DOCUMENT）+ 可选 objectItemId（关联项目）。
    // 需 JWT（匿名投稿场景由后端按 uploaderId 为空处理）；返回完整 FileItem（含 url/storedName）。
    // 显式把 TPayload 声明为 FormData：useHttp 的 body 字段类型跟随 payload 泛型，
    // 这样 FormData 能作为请求体直接传入，payloadMode=json 时由 requestBase 转成 body，ofetch 自动设置 multipart 头。
    uploadFile: async (
        file: File,
        type: "IMAGE" | "DOCUMENT" = "IMAGE",
        objectItemId?: number | string,
    ): Promise<FileItem> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      if (objectItemId !== undefined && objectItemId !== null && objectItemId !== "") {
        formData.append("objectItemId", String(objectItemId));
      }
      return post<FileItem, FormData>("/files", formData, {
        payloadMode: "json",
      });
    },
    // 我的文件列表：GET /api/files/mine（JWT 鉴权，按上传时间倒序分页）。
    listMyFiles: async (page = 0, size = 20): Promise<FilePage> => {
      return get<FilePage>("/files/mine", {page, size});
    },
    // 删除文件：DELETE /api/files/{storedName}（JWT 鉴权，仅上传者本人或总管理）。
    deleteFile: async (storedName: string): Promise<void> => {
      await httpDelete(`/files/${storedName}`);
    },
    /* ---------- 全局管理员（token 鉴权，管理全部项目 / 想法） ---------- */
    // 管理员登录：POST /api/auth/login（openapi.json，User-Agent 由浏览器自动带）
    // 后端返回 { accessToken, tokenType, expiresIn }；refreshToken 通过 HttpOnly Set-Cookie 下发，
    // 浏览器在 useHttp 的 credentials:'include' 下自动保存，前端 JS 不可读。
    // 响应不含 username，直接复用输入值（与后端签发 JWT 的 username claim 一致）。
    adminLogin: async (username: string, password: string): Promise<{ token: string; username: string }> => {
      const data = await post<{ accessToken: string; tokenType: string; expiresIn: number }>(
          "/auth/login",
          {username, password},
          {payloadMode: "json"},
      );
      return {
        token: data?.accessToken ?? "",
        username,
      };
    },
    // 邮箱验证登录：POST /api/auth/login/email（账号 + 密码 + 邮箱 + 邮箱验证码）
    // User-Agent 由浏览器自动带，后端按 email+UA 绑定校验验证码。返回结构与普通登录一致。
    emailLogin: async (body: EmailLoginPayload): Promise<{ token: string; username: string }> => {
      const data = await post<{ accessToken: string; tokenType: string; expiresIn: number }>(
          "/auth/login/email",
          body,
          {payloadMode: "json"},
      );
      return {
        token: data?.accessToken ?? "",
        username: body.account,
      };
    },
    // 发送邮箱验证码：POST /api/auth/verification-code（公开，User-Agent 浏览器自动带）
    // 后端按 scene+email(+userId)+UA 绑定存 Redis，60s 间隔 + 每日 10 次限流。
    sendVerificationCode: async (body: SendCodePayload): Promise<void> => {
      await post<void>("/auth/verification-code", body, {payloadMode: "json"});
    },
    // 修改密码（已登录）：POST /api/auth/change-password（旧密码 + 新密码 + 邮箱 + 验证码）
    changePassword: async (body: ChangePasswordPayload): Promise<void> => {
      await post<void>("/auth/change-password", body, {payloadMode: "json"});
    },
    // 找回密码（匿名）：POST /api/auth/reset-password（邮箱 + 验证码 + 新密码）
    resetPassword: async (body: ResetPasswordPayload): Promise<void> => {
      await post<void>("/auth/reset-password", body, {payloadMode: "json"});
    },
    // 管理员登出：POST /api/auth/logout（JWT 鉴权，Authorization 头由 useHttp 自动带）
    // 后端驱逐当前 access token 的 jti（Redis 白名单）并清除 refresh cookie（Set-Cookie Max-Age=0）。
    // 调用方应捕获异常后继续清前端会话：token 已失效时此调用会 401，不应阻塞登出。
    adminLogout: async (): Promise<void> => {
      await post<void>("/auth/logout", undefined);
    },
    // 管理员查询项目列表（全状态）：GET /api/admin/object-items?statuses=（openapi.json）
    // 后端已提供管理员专用分页接口：statuses[] 多状态过滤，一次请求即可拿到含 PENDING 的全量。
    // mine=true 仅取自己名下项目（总管理也可拥有自有项目）；data 按分页包装或裸数组两种形态兼容解析。
    listProjectsAdmin: async (status?: string, mine?: boolean): Promise<Project[]> => {
      const params = {
        ...(status ? {statuses: [status]} : {}),
        ...(mine ? {mine: true} : {}),
        size: 500,
      };
      const data = await get<unknown>("/admin/object-items", params).catch(() => null);
      const items = extractList<ObjectItemResponse>(data);
      return items.map(mapObjectItemToProject).map(normalizeProject);
    },
    // 管理员批量更新项目状态：PUT /api/admin/object-items/batch/status（openapi.json）
    // 后端已提供专用接口：body 为 { ids, status }，JWT 鉴权，无需 controlPassword。
    updateProjectStatusBatch: async (items: { id: string | number; status: string }[]): Promise<void> => {
      // 同一状态才能批量，按 status 分组各发一次请求
      const groups = new Map<string, (string | number)[]>();
      for (const it of items) {
        const arr = groups.get(it.status) ?? [];
        arr.push(it.id);
        groups.set(it.status, arr);
      }
      await Promise.all(
          [...groups.entries()].map(([status, ids]) =>
              put("/admin/object-items/batch/status", {ids, status}, {payloadMode: "json"}),
          ),
      );
    },
    // 管理员批量删除项目（软删除）：DELETE /api/project/object-items/batch，controlPassword 走请求体 { ids }。
    // 注意：批量删除只需 ids，不需要每条的 controlPassword（与单条删除不同）。
    deleteProjectBatch: async (ids: (string | number)[]): Promise<void> => {
      await httpRequest("/project/object-items/batch", {ids}, {method: "DELETE", payloadMode: "json"});
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
            tagIds: body.tagIds,
            introduction: body.introduction,
            description: body.description,
            status: body.status,
            leader: body.ownerName,
            leaderMcId: body.ownerMinecraftId,
            contactInformation: body.publicContact,
            coverImageUrl: body.coverImageUrl,
            needMembers: (body.recruitmentNeeds ?? []).map((need) => ({
              skill: need.skill,
              number: need.count,
              context: need.work,
            })),
          },
          {payloadMode: "json"},
      );
      return normalizeProject(mapObjectItemToProject(item));
    },
    // 管理员创建归属自己的项目：POST /api/admin/object-items（JWT 鉴权，openapi.json 新增）
    // 后端按当前登录账号写入 ownerId；总管理可传 status（默认后端 RECRUITING 上线），
    // 项目管理固定 PENDING 由后端强制。controlPassword 可选——留空则不支持项目方控制密码自服务。
    // 字段映射沿用 submitProject 口径（ownerName→leader、ownerMinecraftId→leaderMcId 等）。
    createProjectAdmin: async (body: CreateProjectAdminPayload): Promise<Project> => {
      const item = await post<ObjectItemResponse>("/admin/object-items", {
        title: body.title,
        tagIds: body.tagIds ?? [],
        introduction: body.introduction,
        description: body.description,
        status: body.status,
        leader: body.ownerName,
        leaderMcId: body.ownerMinecraftId,
        contactInformation: body.publicContact,
        coverImageUrl: body.coverImageUrl,
        controlPassword: body.controlPassword,
        needMembers: (body.recruitmentNeeds ?? []).map((need) => ({
          skill: need.skill,
          number: need.count,
          context: need.work,
        })),
      }, {payloadMode: "json"});
      return normalizeProject(mapObjectItemToProject(item));
    },
    // 后端已提供管理员专用分页接口：statuses[] 多状态过滤，一次请求拿全量。
    // data 按分页包装 { list, ... } 或裸数组兼容解析。
    listIdeasAdmin: async (status?: string): Promise<Idea[]> => {
      const params = {...(status ? {statuses: [status]} : {}), size: 500};
      const data = await get<unknown>("/admin/minds", params).catch(() => null);
      const minds = extractList<MindResponse>(data);
      return minds.map(mapMindToIdea).map(normalizeIdea);
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
          {
            id,
            title: body.title,
            content: body.content,
            nickName: body.nickName,
            mcId: body.mcId,
            status: body.status
          },
          {payloadMode: "json"},
      );
      return normalizeIdea(mapMindToIdea(mind));
    },
    // 管理员批量更新想法状态：PUT /api/admin/minds/batch/status（openapi.json），body 为 { ids, status }，JWT 鉴权。
    updateIdeaStatusBatch: async (items: { id: string | number; status: string }[]): Promise<void> => {
      const groups = new Map<string, (string | number)[]>();
      for (const it of items) {
        const arr = groups.get(it.status) ?? [];
        arr.push(it.id);
        groups.set(it.status, arr);
      }
      await Promise.all(
          [...groups.entries()].map(([status, ids]) =>
              put("/admin/minds/batch/status", {ids, status}, {payloadMode: "json"}),
          ),
      );
    },
    // 管理员审核项目评论：PATCH /api/admin/object-items/{id}/comments/{commentId}/status（openapi.json）
    // 后端已提供 JWT 版审核接口，body 只含 status（APPROVED/REJECTED/DELETED），无需 controlPassword。
    moderateProjectCommentAdmin: async (
        projectId: string | number,
        commentId: string | number,
        status: string,
    ): Promise<void> => {
      await patch(
          `/admin/object-items/${projectId}/comments/${commentId}/status`,
          {status},
          {payloadMode: "json"},
      );
    },
    // 管理员审核项目动态：PATCH /api/admin/object-items/{id}/updates/{updateId}/status（openapi.json）
    // JWT 鉴权，body 只含 status（APPROVED/REJECTED/DELETED），无需 controlPassword。
    moderateProjectUpdateAdmin: async (
        projectId: string | number,
        updateId: string | number,
        status: string,
    ): Promise<void> => {
      await patch(
          `/admin/object-items/${projectId}/updates/${updateId}/status`,
          {status},
          {payloadMode: "json"},
      );
    },
    /* ---------- 管理员「单个项目维护」（JWT 鉴权，无需项目控制密码，对标项目方自服务） ----------
       命名约定区分两套同形接口：
        - list*Admin / *Admin  = 管理员（JWT）专用接口，走 /api/admin/object-items/{id}/...
        - load*Admin / 同名    = 项目方（controlPassword）接口，走 /api/admin/project/object-items/{id}/... */
    // 管理员查看加入申请：GET /api/admin/object-items/{id}/join-applications?status=（JWT 鉴权，返回全状态）
    listJoinApplicationsAdmin: async (
        projectId: string | number,
        status?: string,
    ): Promise<JoinApplicationResponse[]> => {
      const items = await get<JoinApplicationResponse[]>(
          `/admin/object-items/${projectId}/join-applications`,
          status ? {status} : undefined,
      );
      return normalizeArray<JoinApplicationResponse>(items);
    },
    // 管理员同意加入申请：POST /api/admin/object-items/{id}/join-applications/{applicationId}/accept
    acceptJoinApplicationAdmin: async (
        projectId: string | number,
        applicationId: string | number,
    ): Promise<void> => {
      await post(`/admin/object-items/${projectId}/join-applications/${applicationId}/accept`, undefined, {
        payloadMode: "json",
      });
    },
    // 管理员拒绝加入申请：POST .../reject，请求体可携带 rejectReason（可选）
    rejectJoinApplicationAdmin: async (
        projectId: string | number,
        applicationId: string | number,
        rejectReason?: string,
    ): Promise<void> => {
      await post(
          `/admin/object-items/${projectId}/join-applications/${applicationId}/reject`,
          rejectReason ? {rejectReason} : undefined,
          {payloadMode: "json"},
      );
    },
    // 管理员查看项目动态：GET /api/admin/object-items/{id}/updates?status=（JWT 鉴权，返回全状态）
    listProjectUpdatesAdmin: async (
        projectId: string | number,
        status?: string,
    ): Promise<ProjectUpdate[]> => {
      const items = await get<ObjectItemUpdateResponse[]>(
          `/admin/object-items/${projectId}/updates`,
          status ? {status} : undefined,
      );
      return normalizeArray<ObjectItemUpdateResponse>(items)
          .map(mapObjectItemUpdateToProjectUpdate)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    },
    // 管理员发布项目动态：POST /api/admin/object-items/{id}/updates（管理员发布默认 APPROVED 立即公开）
    createProjectUpdateAdmin: async (
        projectId: string | number,
        body: ProjectUpdatePayload,
    ): Promise<ProjectUpdate> => {
      const item = await post<ObjectItemUpdateResponse>(
          `/admin/object-items/${projectId}/updates`,
          {
            title: body.title,
            content: body.content,
            imageUrl: body.imageUrl,
            status: body.status ?? "APPROVED",
          },
          {payloadMode: "json"},
      );
      return mapObjectItemUpdateToProjectUpdate(item);
    },
    // 管理员修改项目动态：PUT /api/admin/object-items/{id}/updates/{updateId}（空值字段不修改）
    updateProjectUpdateAdmin: async (
        projectId: string | number,
        updateId: string | number,
        body: ProjectUpdatePayload,
    ): Promise<ProjectUpdate> => {
      const item = await put<ObjectItemUpdateResponse>(
          `/admin/object-items/${projectId}/updates/${updateId}`,
          {
            title: body.title,
            content: body.content,
            imageUrl: body.imageUrl,
          },
          {payloadMode: "json"},
      );
      return mapObjectItemUpdateToProjectUpdate(item);
    },
    // 管理员删除项目动态：DELETE /api/admin/object-items/{id}/updates/{updateId}
    deleteProjectUpdateAdmin: async (
        projectId: string | number,
        updateId: string | number,
    ): Promise<void> => {
      await httpDelete(`/admin/object-items/${projectId}/updates/${updateId}`);
    },
    // 管理员查看项目评论：GET /api/admin/object-items/{id}/comments?status=（JWT 鉴权，返回全状态）
    listProjectCommentsAdmin: async (
        projectId: string | number,
        status?: string,
    ): Promise<ProjectComment[]> => {
      const items = await get<ObjectItemCommentResponse[]>(
          `/admin/object-items/${projectId}/comments`,
          status ? {status} : undefined,
      );
      return normalizeArray<ObjectItemCommentResponse>(items)
          .map(mapObjectItemCommentToProjectComment)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    },
    // 管理员批量删除想法：DELETE /api/project/minds/batch，请求体 { ids }。
    deleteIdeaBatch: async (ids: (string | number)[]): Promise<void> => {
      await httpRequest("/project/minds/batch", {ids}, {method: "DELETE", payloadMode: "json"});
    },
    /* ---------- 账号等级：角色 / 邀请码 / 项目分配 ---------- */
    // 当前管理员信息：GET /api/auth/me（JWT 鉴权）。登录后取角色（总管理 / 项目管理），
    // 驱动总管理专属入口（邀请码生成、项目分配）的显隐。
    adminMe: async (): Promise<{
      id: number | string;
      username: string;
      role: "SUPER_ADMIN" | "PROJECT_MANAGER"
    }> => {
      return get("/auth/me");
    },
    // 项目管理注册（公开，凭一次性邀请码）：POST /api/auth/register/manager
    registerManager: async (body: RegisterManagerPayload): Promise<{
      id: number | string;
      username: string;
      role: string
    }> => {
      return post("/auth/register/manager", {
        inviteCode: body.inviteCode,
        username: body.username,
        password: body.password,
        email: body.email,
        emailCode: body.emailCode,
      }, {payloadMode: "json"});
    },
    // 总管理生成项目管理邀请码：POST /api/admin/invites（仅总管理），返回一次性明文码。
    generateInviteCode: async (): Promise<string> => {
      const data = await post<{ inviteCode: string }>("/admin/invites", undefined, {payloadMode: "json"});
      return data?.inviteCode ?? "";
    },
    // 总管理查看历史邀请码（含状态 / 创建者 / 消费者）：GET /api/admin/invites
    listInviteCodes: async (): Promise<InviteHistoryItem[]> => {
      const data = await get<unknown>("/admin/invites").catch(() => null);
      return extractList<InviteHistoryItem>(data);
    },
    // 总管理列出项目管理账号（分配项目下拉用）：GET /api/admin/users/managers（仅总管理）
    listManagers: async (): Promise<ManagerSummary[]> => {
      const data = await get<unknown>("/admin/users/managers").catch(() => null);
      return extractList<ManagerSummary>(data);
    },
    // 总管理把项目分配给项目管理（ownerId=null 收回为未分配）：PUT /api/admin/object-items/{id}/owner
    assignProjectOwner: async (projectId: string | number, ownerId: number | string | null): Promise<Project> => {
      const item = await put<ObjectItemResponse>(
          `/admin/object-items/${projectId}/owner`,
          {ownerId},
          {payloadMode: "json"},
      );
      return normalizeProject(mapObjectItemToProject(item));
    },
    /* ---------- 标签字典（Tag 字典驱动项目分类 / Cascader） ----------
       公开 GET 任何人可读；管理端 CRUD 仅总管理（SUPER_ADMIN），后端用 AccessService.requireSuperAdmin 兜底。 */
    // 公开 Tag 树：GET /api/project/tags/tree（匿名可读，仅活跃节点，已按 sortOrder/id 排序）。
    // 投稿 / 编辑 / 项目墙 Cascader 共用；后端组装父子层级，前端直接喂给 n-cascader。
    loadTagTree: async (): Promise<TagTreeNode[]> => {
      const items = await get<unknown>("/project/tags/tree").catch(() => null);
      return extractList<TagTreeNode>(items);
    },
    // 管理端 Tag 列表：GET /api/admin/tags（仅总管理，含已删除节点 + 每个 Tag 的关联项目数 projectCount）。
    // 平铺返回（带 parentId），前端按需组树展示。
    listTagsAdmin: async (): Promise<TagAdminItem[]> => {
      const data = await get<unknown>("/admin/tags").catch(() => null);
      return extractList<TagAdminItem>(data);
    },
    // 新增 Tag：POST /api/admin/tags（仅总管理）。名称 trim 后全局唯一（忽略大小写）；parentId 不存在或已删除时后端 400/404。
    createTagAdmin: async (body: TagSavePayload): Promise<TagAdminItem> => {
      return post<TagAdminItem>("/admin/tags", {
        name: body.name,
        parentId: body.parentId ?? null,
        selectable: body.selectable,
        sortOrder: body.sortOrder,
        description: body.description ?? null,
      }, {payloadMode: "json"});
    },
    // 修改 Tag：PUT /api/admin/tags/{id}（仅总管理）。可改名 / 换父节点 / 改是否可选 / 排序 / 说明；
    // 移动到自己或后代节点下会被后端拒绝（400）。
    updateTagAdmin: async (id: number | string, body: TagSavePayload): Promise<TagAdminItem> => {
      return put<TagAdminItem>(`/admin/tags/${id}`, {
        name: body.name,
        parentId: body.parentId ?? null,
        selectable: body.selectable,
        sortOrder: body.sortOrder,
        description: body.description ?? null,
      }, {payloadMode: "json"});
    },
    // 软删除 Tag：DELETE /api/admin/tags/{id}（仅总管理）。同事务解除全部项目关联并标记删除；
    // 存在活跃子节点时后端返回 409。返回 { id, affectedProjects } 供前端回显受影响范围。
    deleteTagAdmin: async (id: number | string): Promise<{ id: number | string; affectedProjects: number }> => {
      return await httpDelete<{ id: number | string; affectedProjects: number }>(`/admin/tags/${id}`);
    },
  };
};
