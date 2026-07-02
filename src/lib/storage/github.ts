import { collectionFolders, type DataStore, type JsonRecord, assertSafeId } from "./store";
import type { CollectionName } from "@/lib/types";
import type { StorageConfig } from "@/lib/env";

type GitHubFile = {
  name: string;
  path: string;
  type: string;
  sha: string;
  content?: string;
  encoding?: string;
};

export class GitHubStore implements DataStore {
  private readonly owner: string;
  private readonly repoName: string;

  constructor(private readonly config: Extract<StorageConfig, { mode: "github" }>) {
    const [owner, repoName] = config.repo.split("/");
    this.owner = owner;
    this.repoName = repoName;
  }

  async list<T extends JsonRecord>(collection: CollectionName): Promise<T[]> {
    const folder = this.collectionPath(collection);
    const response = await this.request(`/contents/${encodeURI(folder)}${this.refQuery()}`);

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(await this.githubError(response));
    }

    const items = (await response.json()) as GitHubFile[] | GitHubFile;
    if (!Array.isArray(items)) {
      return [];
    }

    const records: T[] = [];
    for (const item of items.filter((entry) => entry.type === "file" && entry.name.endsWith(".json"))) {
      const record = await this.getByPath<T>(item.path);
      if (record) {
        records.push(record);
      }
    }

    return records.sort((a, b) => {
        const aTime = typeof a.createdAt === "string" ? a.createdAt : "";
        const bTime = typeof b.createdAt === "string" ? b.createdAt : "";
        return bTime.localeCompare(aTime);
      });
  }

  async get<T extends JsonRecord>(collection: CollectionName, id: string): Promise<T | null> {
    assertSafeId(id);
    return this.getByPath<T>(this.recordPath(collection, id));
  }

  async put<T extends JsonRecord>(collection: CollectionName, id: string, data: T): Promise<void> {
    assertSafeId(id);
    const filePath = this.recordPath(collection, id);
    const existing = await this.fileMeta(filePath);
    const body: Record<string, unknown> = {
      message: `Update ${filePath}`,
      content: Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8").toString("base64"),
    };

    if (this.config.branch) {
      body.branch = this.config.branch;
    }

    if (existing?.sha) {
      body.sha = existing.sha;
    }

    const response = await this.request(`/contents/${encodeURI(filePath)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(await this.githubError(response));
    }
  }

  private async getByPath<T extends JsonRecord>(filePath: string): Promise<T | null> {
    const response = await this.request(`/contents/${encodeURI(filePath)}${this.refQuery()}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(await this.githubError(response));
    }

    const file = (await response.json()) as GitHubFile;
    if (!file.content) {
      return null;
    }

    const raw = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8");
    return JSON.parse(raw) as T;
  }

  private async fileMeta(filePath: string): Promise<GitHubFile | null> {
    const response = await this.request(`/contents/${encodeURI(filePath)}${this.refQuery()}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(await this.githubError(response));
    }

    return (await response.json()) as GitHubFile;
  }

  private collectionPath(collection: CollectionName) {
    return `${this.config.dataPath}/${collectionFolders[collection]}`;
  }

  private recordPath(collection: CollectionName, id: string) {
    return `${this.collectionPath(collection)}/${id}.json`;
  }

  private refQuery() {
    return this.config.branch ? `?ref=${encodeURIComponent(this.config.branch)}` : "";
  }

  private request(pathname: string, init: RequestInit = {}) {
    return fetch(`https://api.github.com/repos/${this.owner}/${this.repoName}${pathname}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.config.token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...init.headers,
      },
    });
  }

  private async githubError(response: Response) {
    const text = await response.text();
    return `GitHub 数据读写失败（${response.status}）：${text}`;
  }
}
