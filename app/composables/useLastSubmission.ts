import type {Project} from "~/types/projectHub";

export interface ProjectSubmissionRecord {
    // 后端 /api/project/object-items 创建成功后返回的项目信息（已由 useProjectHubApi 映射为前端 Project 类型）
    project: Project;
    // 提交时间，方便成功页展示「刚刚提交」之类的信息
    submittedAt: string;
}

const STORAGE_KEY = "project-submission-record";

// 模块级 ref：在 SPA 客户端导航（submit → /submit/success）期间直接可用；
// sessionStorage 兜底：刷新成功页 / 同会话再次进入时仍能读到。
// SSR 时此 ref 永远是 null，且读写都加了 import.meta.client 守卫，不会污染服务端状态。
const pending = ref<ProjectSubmissionRecord | null>(null);

const isClient = () => typeof window !== "undefined";

export const useLastSubmission = () => {
    const write = (record: ProjectSubmissionRecord) => {
        pending.value = record;
        if (isClient()) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        }
    };

    const read = (): ProjectSubmissionRecord | null => {
        if (pending.value) {
            return pending.value;
        }
        if (isClient()) {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw) as ProjectSubmissionRecord;
                    pending.value = parsed;
                    return parsed;
                } catch {
                    // 存储被外部污染时静默丢弃，避免把脏数据带到成功页
                    sessionStorage.removeItem(STORAGE_KEY);
                }
            }
        }
        return null;
    };

    const clear = () => {
        pending.value = null;
        if (isClient()) {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    };

    return {write, read, clear};
};
