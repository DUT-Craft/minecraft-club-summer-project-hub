export class AppConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppConfigError";
  }
}

export type BackendConfig = {
  baseUrl: string;
  token?: string;
};

export function getBackendConfig(): BackendConfig {
  const baseUrl = (process.env.BACKEND_API_BASE || "").trim().replace(/\/+$/, "");

  if (!baseUrl) {
    throw new AppConfigError("后端 API 还没配置：请设置 BACKEND_API_BASE。");
  }

  const token = (process.env.BACKEND_API_TOKEN || "").trim();

  return {
    baseUrl,
    token: token || undefined,
  };
}

export function getAdminConfig() {
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!password || !sessionSecret) {
    throw new AppConfigError(
      "管理后台还没配置完整：请设置 ADMIN_PASSWORD 和 ADMIN_SESSION_SECRET。",
    );
  }

  return {
    password,
    sessionSecret,
    cookieName: "mcss_admin",
    maxAgeSeconds: 60 * 60 * 8,
  };
}
