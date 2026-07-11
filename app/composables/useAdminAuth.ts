// 全局管理员会话。与项目方（useOwnerSession，按项目 + controlPassword）不同：
// 管理员用账号密码登录拿到 token，可管理全部项目 / 想法，没有单项目限制。
//
// token 写入 chat_auth_token cookie：useHttp 会自动把它作为 Bearer 头带上，
// 这样所有走 useHttp 的管理端请求都自动鉴权，无需每个调用手动传 token。
// 会话快照（username / loginAt）另存 sessionStorage，刷新后仍能恢复管理页 UI 状态。
export type AdminRole = "SUPER_ADMIN" | "PROJECT_MANAGER";

export interface AdminSession {
  token: string;
  username: string;
    // 由 /auth/me 拉取，驱动总管理专属入口（邀请码生成 / 项目分配）的显隐；
    // 登录时拉取失败或旧会话缺失时为 undefined，按「项目管理」权限兜底（最小权限）。
    role?: AdminRole;
  loginAt: string;
}

const STORAGE_KEY = "global-admin-session";
const TOKEN_COOKIE = "chat_auth_token";

// 模块级 ref：SPA 客户端导航期间直接可用；SSR 时永远为 null（管理页用 onMounted 兜底，避免服务端重定向）
const pending = ref<AdminSession | null>(null);

const isClient = () => typeof window !== "undefined";

export const useAdminAuth = () => {
  // 与 useHttp 读取的同一个 cookie：写它即等于给所有 useHttp 请求装上 Bearer token
  const tokenCookie = useCookie<string | null>(TOKEN_COOKIE, {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    path: "/",
  });

  const write = (session: AdminSession) => {
    pending.value = session;
    tokenCookie.value = session.token;
    if (isClient()) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  };

  const read = (): AdminSession | null => {
    if (pending.value) {
      return pending.value;
    }
    if (isClient()) {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AdminSession;
          pending.value = parsed;
          // 刷新后 sessionStorage 还在但 cookie 可能过期：若 cookie 缺失则用 session 里的 token 补回，
          // 否则后续 useHttp 请求会因无 token 被后端判为未登录
          if (!tokenCookie.value && parsed.token) {
            tokenCookie.value = parsed.token;
          }
          return parsed;
        } catch {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    }
    return null;
  };

  const clear = () => {
    pending.value = null;
    tokenCookie.value = null;
    if (isClient()) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  };

  return {write, read, clear};
};
