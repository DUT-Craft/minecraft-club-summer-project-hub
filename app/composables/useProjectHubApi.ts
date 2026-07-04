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

  const loadSnapshot = async (): Promise<DataSnapshot> => {
    try {
      const snapshot = await request<Partial<DataSnapshot>>("/public/snapshot");
      return normalizeSnapshot(snapshot);
    } catch {
      return emptySnapshot();
    }
  };

  return {
    loadSnapshot,
    submitProject: (body: SubmitProjectPayload) => request<Project>("/public/projects", {
      method: "POST",
      body: {
        ...body,
        projectStatus: body.projectStatus || body.status,
        submitterMinecraftId: body.submitterMinecraftId || body.ownerMinecraftId,
      },
    }),
    submitIdea: (body: SubmitIdeaPayload) => request<Idea>("/public/ideas", {
      method: "POST",
      body: {
        ...body,
        submitterName: body.submitterName || body.nickname,
      },
    }),
    submitJoin: (body: SubmitJoinPayload) => request("/public/join", {
      method: "POST",
      body,
    }),
    submitComment: async (body: SubmitCommentPayload) => {
      const response = await request<ProjectComment | { record: ProjectComment }>("/public/comments", {
        method: "POST",
        body,
      });

      return "record" in response ? response.record : response;
    },
  };
};
