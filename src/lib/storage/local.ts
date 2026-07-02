import fs from "node:fs/promises";
import path from "node:path";

import { collectionFolders, type DataStore, type JsonRecord, assertSafeId } from "./store";
import type { CollectionName } from "@/lib/types";

export class LocalFileStore implements DataStore {
  constructor(private readonly dataDir: string) {}

  async list<T extends JsonRecord>(collection: CollectionName): Promise<T[]> {
    const dir = this.collectionDir(collection);

    try {
      const files = await fs.readdir(dir);
      const records = await Promise.all(
        files
          .filter((file) => file.endsWith(".json"))
          .map(async (file) => {
            const raw = await fs.readFile(path.join(dir, file), "utf8");
            return JSON.parse(raw) as T;
          }),
      );

      return records.sort((a, b) => {
        const aTime = typeof a.createdAt === "string" ? a.createdAt : "";
        const bTime = typeof b.createdAt === "string" ? b.createdAt : "";
        return bTime.localeCompare(aTime);
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async get<T extends JsonRecord>(collection: CollectionName, id: string): Promise<T | null> {
    assertSafeId(id);

    try {
      const raw = await fs.readFile(this.filePath(collection, id), "utf8");
      return JSON.parse(raw) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async put<T extends JsonRecord>(collection: CollectionName, id: string, data: T): Promise<void> {
    assertSafeId(id);
    await fs.mkdir(this.collectionDir(collection), { recursive: true });
    await fs.writeFile(this.filePath(collection, id), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }

  private collectionDir(collection: CollectionName) {
    return path.join(this.dataDir, collectionFolders[collection]);
  }

  private filePath(collection: CollectionName, id: string) {
    return path.join(this.collectionDir(collection), `${id}.json`);
  }
}
