import type {
  DataSnapshot,
  Idea,
  Project,
  ProjectComment,
  ProjectUpdate,
  SubmitCommentPayload,
  SubmitIdeaPayload,
  SubmitJoinPayload,
  SubmitProjectPayload,
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

interface JoinApplicationResponse {
  id?: number | string;
  objectItemId?: number | string;
  nickName?: string;
  mcId?: string;
  contact?: string;
  reason?: string;
  status?: string;
  createTime?: string;
  updateTime?: string;
}

// 公开接口已按 status=APPROVED 过滤，能查到的都是已通过审核的内容
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
  reviewStatus: "approved",
  createdAt: item.createTime ?? "",
});

const mapObjectItemCommentToProjectComment = (item: ObjectItemCommentResponse): ProjectComment => ({
  id: String(item.id ?? ""),
  projectId: String(item.objectItemId ?? ""),
  nickname: item.nickName ?? "",
  content: item.content ?? "",
  reviewStatus: "approved",
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
  const { get, post } = useHttp();

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
  // 接口已按 APPROVED 过滤；这里按创建时间倒序，方便页面直接渲染。
  const loadPublicIdeas = async (): Promise<Idea[]> => {
    try {
      const minds = await request<MindResponse[]>("/project/minds", {
        query: { status: "APPROVED" },
      });
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
  };
};
