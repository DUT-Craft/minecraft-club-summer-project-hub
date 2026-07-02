import path from "node:path";

export class AppConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppConfigError";
  }
}

export type StorageConfig =
  | {
      mode: "local";
      dataDir: string;
    }
  | {
      mode: "github";
      token: string;
      repo: string;
      branch?: string;
      dataPath: string;
    };

export function getStorageConfig(): StorageConfig {
  const mode = (process.env.DATA_STORAGE || "local").trim().toLowerCase();

  if (mode === "local") {
    return {
      mode: "local",
      dataDir: path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.LOCAL_DATA_DIR || "./data"),
    };
  }

  if (mode === "github") {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;

    if (!token || !repo) {
      throw new AppConfigError(
        "GitHub 数据存储还没配置完整：请设置 GITHUB_TOKEN 和 GITHUB_REPO。",
      );
    }

    if (!repo.includes("/")) {
      throw new AppConfigError("GITHUB_REPO 需要写成 owner/repo-name 的格式。");
    }

    return {
      mode: "github",
      token,
      repo,
      branch: process.env.GITHUB_BRANCH || undefined,
      dataPath: (process.env.GITHUB_DATA_PATH || "data").replace(/^\/+|\/+$/g, ""),
    };
  }

  throw new AppConfigError("DATA_STORAGE 只能设置为 local 或 github。");
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
