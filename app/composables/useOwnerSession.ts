import type {Project} from "~/types/projectHub";

export interface OwnerSession {
    // 进入项目管理页时回填的项目信息（已映射为前端 Project 类型），
    // 管理页直接展示，避免重复请求公开接口（公开接口还会过滤掉非 APPROVED 的项目）。
    project: Project;
    // 登录时间，方便管理页展示「登录于 xx」与做超时提示
    loginAt: string;
}

const STORAGE_KEY = "project-owner-session";

// 模块级 ref：在 SPA 客户端导航（/admin 登录 → /admin/projects/:id 管理）期间直接可用；
// sessionStorage 兜底：刷新管理页时仍能读到，避免因刷新丢会话而被踢回登录页。
// SSR 时此 ref 永远是 null，且读写都加了 import.meta.client 守卫，不会污染服务端状态。
// 实现思路与 useLastSubmission 保持一致。
const pending = ref<OwnerSession | null>(null);

const isClient = () => typeof window !== "undefined";

export const useOwnerSession = () => {
    const write = (session: OwnerSession) => {
        pending.value = session;
        if (isClient()) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        }
    };

    const read = (): OwnerSession | null => {
        if (pending.value) {
            return pending.value;
        }
        if (isClient()) {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw) as OwnerSession;
                    pending.value = parsed;
                    return parsed;
                } catch {
                    // 存储被外部污染时静默丢弃，避免把脏数据带到管理页
                    sessionStorage.removeItem(STORAGE_KEY);
                }
            }
        }
        return null;
    };

    // 仅替换 project 字段（编辑保存后回写最新详情，loginAt 保持不变）
    const updateProject = (project: Project) => {
        const current = pending.value;
        if (!current) {
            return;
        }
        const next: OwnerSession = {...current, project};
        write(next);
    };

    const clear = () => {
        pending.value = null;
        if (isClient()) {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    };

    // session：暴露共享响应式 ref，组件直接绑定即可随 write / updateProject / clear 自动同步。
    // 切勿再用本地 ref 拷贝 read() 的返回值——updateProject 会把 pending.value 整体替换成新对象，
    // 本地副本仍指向旧对象，UI 不会刷新（admin/projects/[id].vue 的「刷新」按钮曾因此点完不更新）。
    return {session: pending, write, read, updateProject, clear};
};
