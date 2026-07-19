import type { AnonymousSubmissionRecord } from "~/types/projectHub";

const STORAGE_KEY = "anonymous-submission-records";
const records = ref<AnonymousSubmissionRecord[]>([]);
let loaded = false;

const isClient = () => typeof window !== "undefined";

export const useAnonymousSubmissions = () => {
  const persist = () => {
    if (isClient()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value));
    }
  };

  const read = (): AnonymousSubmissionRecord[] => {
    if (!isClient()) return records.value;
    if (!loaded) {
      loaded = true;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          records.value = Array.isArray(parsed) ? parsed : [];
        } catch {
          localStorage.removeItem(STORAGE_KEY);
          records.value = [];
        }
      }
    }
    return records.value;
  };

  const add = (record: AnonymousSubmissionRecord) => {
    read();
    const key = `${record.kind}:${record.id}`;
    records.value = [
      record,
      ...records.value.filter((item) => `${item.kind}:${item.id}` !== key),
    ];
    persist();
  };

  const update = (kind: AnonymousSubmissionRecord["kind"], id: string, patch: Partial<AnonymousSubmissionRecord>) => {
    read();
    records.value = records.value.map((item) =>
      item.kind === kind && item.id === id ? { ...item, ...patch } : item,
    );
    persist();
  };

  const remove = (kind: AnonymousSubmissionRecord["kind"], id: string) => {
    read();
    records.value = records.value.filter((item) => item.kind !== kind || item.id !== id);
    persist();
  };

  return { records: readonly(records), read, add, update, remove };
};
