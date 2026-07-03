import { getBackendConfig } from "@/lib/env";
import type { CollectionName } from "@/lib/types";

import { assertSafeId, type DataStore, type JsonRecord } from "./store";

/**
 * 通过后端 API 读写数据。后端需要提供以下 REST 接口：
 *
 *   GET    {base}/collections/{collection}          列出集合里的全部记录
 *   GET    {base}/collections/{collection}/{id}     读取一条记录（找不到返回 404）
 *   PUT    {base}/collections/{collection}/{id}     创建或覆盖一条记录，请求体为记录本身
 *   DELETE {base}/collections/{collection}/{id}     删除一条记录（找不到返回 404）
 *
 * 响应体可以是 { code, status, msg, data } 形式（取 data），也可以直接是记录/数组。
 * 如果配置了 BACKEND_API_TOKEN，会以 Bearer 形式带在请求头里。
 */
export class BackendApiStore implements DataStore {
  async list<T extends JsonRecord>(collection: CollectionName): Promise<T[]> {
    const response = await this.request("GET", this.collectionUrl(collection));
    if (response.status === 404) {
      return [];
    }
    this.ensureOk(response, collection);

    const data = await this.readData<T[]>(response);
    const records = Array.isArray(data) ? data : [];
    return records.sort((a, b) => {
      const aTime = typeof a.createdAt === "string" ? a.createdAt : "";
      const bTime = typeof b.createdAt === "string" ? b.createdAt : "";
      return bTime.localeCompare(aTime);
    });
  }

  async get<T extends JsonRecord>(collection: CollectionName, id: string): Promise<T | null> {
    assertSafeId(id);
    const response = await this.request("GET", this.recordUrl(collection, id));
    if (response.status === 404) {
      return null;
    }
    this.ensureOk(response, collection, id);
    return (await this.readData<T>(response)) ?? null;
  }

  async put<T extends JsonRecord>(collection: CollectionName, id: string, data: T): Promise<void> {
    assertSafeId(id);
    const response = await this.request("PUT", this.recordUrl(collection, id), data);
    this.ensureOk(response, collection, id);
  }

  async delete(collection: CollectionName, id: string): Promise<void> {
    assertSafeId(id);
    const response = await this.request("DELETE", this.recordUrl(collection, id));
    if (response.status === 404) {
      throw new Error("没有找到这条记录。");
    }
    this.ensureOk(response, collection, id);
  }

  private collectionUrl(collection: CollectionName) {
    return `collections/${encodeURIComponent(collection)}`;
  }

  private recordUrl(collection: CollectionName, id: string) {
    return `${this.collectionUrl(collection)}/${encodeURIComponent(id)}`;
  }

  private async request(method: string, pathname: string, body?: JsonRecord) {
    const { baseUrl, token } = getBackendConfig();
    return fetch(`${baseUrl}/${pathname}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  }

  private async readData<T>(response: Response): Promise<T | null> {
    const text = await response.text();
    if (!text) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return null;
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      "data" in parsed &&
      ("code" in parsed || "status" in parsed || "msg" in parsed || "message" in parsed)
    ) {
      return (parsed as { data: T }).data ?? null;
    }

    return parsed as T;
  }

  private async ensureOk(response: Response, collection: CollectionName, id?: string) {
    if (response.ok) {
      return;
    }

    const detail = (await this.readData<unknown>(response)) ?? "";
    const location = id ? `${collection}/${id}` : collection;
    throw new Error(
      `后端数据读写失败（${location}, HTTP ${response.status}）：${typeof detail === "string" ? detail : JSON.stringify(detail)}`,
    );
  }
}
