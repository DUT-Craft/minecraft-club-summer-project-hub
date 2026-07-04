<template>
  <main class="pve-page" :class="themeClass">
    <section class="pve-hero">
      <div class="hero-copy">
        <div class="cat-mark" aria-hidden="true">
          <span class="cat-ear cat-ear-left" />
          <span class="cat-ear cat-ear-right" />
          <span class="cat-face">
            <span class="cat-eye cat-eye-left" />
            <span class="cat-eye cat-eye-right" />
            <span class="cat-nose" />
          </span>
        </div>
        <div>
          <p>PVE CONTROL</p>
          <h1>PVE 用户管理</h1>
          <span>维护 PVE 账号、节点地址、认证域和 API Token。</span>
        </div>
      </div>

      <div class="hero-actions">
        <div class="theme-switch" aria-label="主题切换">
          <button
            type="button"
            :class="{ active: theme === 'pink' }"
            aria-label="粉色主题"
            @click="theme = 'pink'"
          >
            <span class="swatch pink" />
            粉色
          </button>
          <button
            type="button"
            :class="{ active: theme === 'blue' }"
            aria-label="蓝色主题"
            @click="theme = 'blue'"
          >
            <span class="swatch blue" />
            蓝色
          </button>
        </div>

        <n-button
          secondary
          class="soft-button"
          :loading="loading"
          @click="loadPveUsers"
        >
          刷新
        </n-button>
        <n-button type="primary" class="primary-button" @click="openCreate">
          新增 PVE 用户
        </n-button>
      </div>

      <div class="hero-art" aria-hidden="true">
        <span class="moon" />
        <span class="paw paw-one" />
        <span class="paw paw-two" />
        <span class="server-card server-card-main">
          <span />
          <span />
          <span />
        </span>
        <span class="server-card server-card-back">
          <span />
          <span />
          <span />
        </span>
      </div>
    </section>

    <section class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <p>{{ metric.label }}</p>
        <strong>{{ metric.value }}</strong>
        <span>{{ metric.hint }}</span>
      </article>
    </section>

    <section class="workbench-panel">
      <div class="section-head">
        <div>
          <p>FILTERS</p>
          <h2>检索条件</h2>
        </div>
        <div class="section-actions">
          <n-button secondary class="soft-button" @click="resetFilters">
            重置
          </n-button>
          <n-button
            type="primary"
            class="primary-button"
            :loading="loading"
            @click="handleSearch"
          >
            查询
          </n-button>
        </div>
      </div>

      <n-form :model="filters" label-placement="top" class="filter-form">
        <div class="filter-grid">
          <n-form-item label="绑定用户 ID">
            <n-input-number
              v-model:value="filters.userId"
              clearable
              :show-button="false"
              :min="1"
              placeholder="请输入用户 ID"
            />
          </n-form-item>
          <n-form-item label="PVE 用户名">
            <n-input
              v-model:value="filters.username"
              clearable
              placeholder="请输入用户名"
            />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input
              v-model:value="filters.email"
              clearable
              placeholder="请输入邮箱"
            />
          </n-form-item>
          <n-form-item label="状态">
            <n-input
              v-model:value="filters.status"
              clearable
              placeholder="请输入状态"
            />
          </n-form-item>
          <n-form-item label="节点地址">
            <n-input
              v-model:value="filters.address"
              clearable
              placeholder="请输入节点地址"
            />
          </n-form-item>
        </div>
      </n-form>
    </section>

    <section class="table-panel">
      <div class="section-head">
        <div>
          <p>PVE USERS</p>
          <h2>账号列表</h2>
        </div>
        <span class="table-count">共 {{ pveUsers.length }} 条</span>
      </div>

      <n-data-table
        :columns="columns"
        :data="pveUsers"
        :loading="loading"
        :pagination="pagination"
        :row-key="rowKey"
        :bordered="false"
        :single-line="false"
        :scroll-x="980"
        class="pve-table"
      />
    </section>

    <n-drawer v-model:show="drawerVisible" :width="drawerWidth" placement="right">
      <n-drawer-content :title="drawerTitle" closable class="pve-drawer">
        <n-spin :show="detailLoading">
          <n-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-placement="top"
            class="pve-form"
          >
            <div class="drawer-grid">
              <n-form-item label="绑定用户 ID" path="userId">
                <n-input-number
                  v-model:value="form.userId"
                  clearable
                  :show-button="false"
                  :min="1"
                  placeholder="请输入用户 ID"
                />
              </n-form-item>
              <n-form-item label="认证域" path="pam">
                <n-input
                  v-model:value="form.pam"
                  clearable
                  placeholder="例如 pam 或 pve"
                />
              </n-form-item>
            </div>

            <n-form-item label="PVE 用户名" path="username">
              <n-input
                v-model:value="form.username"
                clearable
                placeholder="请输入 PVE 用户名"
              />
            </n-form-item>

            <n-form-item label="密码" path="password">
              <n-input
                v-model:value="form.password"
                type="password"
                show-password-on="click"
                clearable
                :placeholder="editing ? '留空则不更新密码' : '请输入 PVE 密码'"
              />
            </n-form-item>

            <div class="drawer-grid">
              <n-form-item label="节点地址" path="address">
                <n-input
                  v-model:value="form.address"
                  clearable
                  placeholder="例如 10.0.0.2"
                />
              </n-form-item>
              <n-form-item label="端口" path="port">
                <n-input
                  v-model:value="form.port"
                  clearable
                  placeholder="例如 8006"
                />
              </n-form-item>
            </div>

            <n-form-item label="邮箱" path="email">
              <n-input
                v-model:value="form.email"
                clearable
                placeholder="请输入邮箱"
              />
            </n-form-item>

            <n-form-item label="状态" path="status">
              <n-select
                v-model:value="form.status"
                filterable
                tag
                clearable
                :options="statusOptions"
                placeholder="请选择或输入状态"
              />
            </n-form-item>

            <n-form-item label="API Token" path="apiToken">
              <n-input
                v-model:value="form.apiToken"
                type="textarea"
                clearable
                :autosize="{ minRows: 3, maxRows: 5 }"
                :placeholder="editing ? '留空则不更新 API Token' : '请输入 API Token'"
              />
            </n-form-item>
          </n-form>
        </n-spin>

        <template #footer>
          <div class="drawer-actions">
            <n-button @click="drawerVisible = false">取消</n-button>
            <n-button
              type="primary"
              class="primary-button"
              :loading="saving"
              @click="handleSave"
            >
              保存
            </n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </main>
</template>

<script setup lang="ts">
import { h } from "vue";
import type {
  DataTableColumns,
  FormInst,
  FormRules,
  SelectOption,
} from "naive-ui";
import { NButton, NSpace, NTag } from "naive-ui";

type ThemeName = "pink" | "blue";
type ApiObject = Record<string, any>;

interface PveUser {
  key: string;
  id: string;
  userId: number | null;
  username: string;
  password: string;
  address: string;
  port: string;
  pam: string;
  email: string;
  status: string;
  apiToken: string;
  raw: ApiObject;
}

interface PveUserForm {
  userId: number | null;
  username: string;
  password: string;
  address: string;
  port: string;
  pam: string;
  email: string;
  status: string | null;
  apiToken: string;
}

interface PveUserPayload {
  userId?: number;
  username?: string;
  password?: string;
  address?: string;
  port?: string;
  pam?: string;
  email?: string;
  status?: string;
  apiToken?: string;
}

interface PveUserFilters {
  userId: number | null;
  username: string;
  email: string;
  status: string;
  address: string;
}

type PveUserListResponse = ApiObject | ApiObject[];

const message = useMessage();
const dialog = useDialog();
const { get, postRaw, putRaw, deleteRaw } = useHttp();

const theme = ref<ThemeName>("pink");
const loading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const drawerVisible = ref(false);
const editingId = ref<string>("");
const deletingId = ref<string>("");
const formRef = ref<FormInst | null>(null);

const pveUsers = ref<PveUser[]>([]);

const filters = reactive<PveUserFilters>({
  userId: null,
  username: "",
  email: "",
  status: "",
  address: "",
});

const createEmptyForm = (): PveUserForm => ({
  userId: null,
  username: "",
  password: "",
  address: "",
  port: "8006",
  pam: "pam",
  email: "",
  status: "ACTIVE",
  apiToken: "",
});

const form = reactive<PveUserForm>(createEmptyForm());

const statusOptions: SelectOption[] = [
  { label: "已启用 ACTIVE", value: "ACTIVE" },
  { label: "已禁用 DISABLED", value: "DISABLED" },
  { label: "在线 ONLINE", value: "ONLINE" },
  { label: "离线 OFFLINE", value: "OFFLINE" },
  { label: "未知 UNKNOWN", value: "UNKNOWN" },
];

const pagination = {
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
};

const themeClass = computed(() => `theme-${theme.value}`);
const editing = computed(() => Boolean(editingId.value));
const drawerTitle = computed(() => (editing.value ? "编辑 PVE 用户" : "新增 PVE 用户"));
const drawerWidth = "min(560px, 100vw)";

const rules: FormRules = {
  username: {
    required: true,
    message: "请输入 PVE 用户名",
    trigger: ["input", "blur"],
  },
  password: {
    validator: (_rule, value: string) => {
      if (!editing.value && !value?.trim()) {
        return new Error("请输入 PVE 密码");
      }

      return true;
    },
    trigger: ["input", "blur"],
  },
  address: {
    required: true,
    message: "请输入节点地址",
    trigger: ["input", "blur"],
  },
  port: {
    required: true,
    message: "请输入端口",
    trigger: ["input", "blur"],
  },
  email: {
    type: "email",
    message: "请输入正确的邮箱格式",
    trigger: ["input", "blur"],
  },
};

const readValue = (source: ApiObject, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return "";
};

const readString = (source: ApiObject, keys: string[]) => {
  const value = readValue(source, keys);

  return value === "" ? "" : String(value);
};

const readNumber = (source: ApiObject, keys: string[]) => {
  const value = readValue(source, keys);
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && value !== "" ? numberValue : null;
};

const hasPveUserShape = (source: unknown) => {
  if (!source || typeof source !== "object") {
    return false;
  }

  const data = source as ApiObject;

  return [
    "id",
    "userId",
    "username",
    "address",
    "port",
    "pam",
    "email",
    "status",
    "apiToken",
  ].some((key) => key in data);
};

const normalizePveUser = (source: ApiObject, index = 0): PveUser => {
  const id = readString(source, ["id", "pveUserId", "pve_user_id"]);
  const userId = readNumber(source, ["userId", "user_id"]);
  const username = readString(source, ["username", "userName", "name"]);
  const address = readString(source, ["address", "host", "hostname", "ip"]);
  const port = readString(source, ["port"]);
  const pam = readString(source, ["pam", "realm"]);
  const email = readString(source, ["email", "mail"]);
  const status = readString(source, ["status"]);
  const apiToken = readString(source, ["apiToken", "api_token", "token"]);

  return {
    key: id || `${userId ?? "row"}-${username || address || index}`,
    id,
    userId,
    username,
    password: readString(source, ["password"]),
    address,
    port,
    pam,
    email,
    status,
    apiToken,
    raw: source,
  };
};

const extractList = (source: unknown): ApiObject[] => {
  if (Array.isArray(source)) {
    return source.filter((item): item is ApiObject => Boolean(item) && typeof item === "object");
  }

  if (!source || typeof source !== "object") {
    return [];
  }

  const data = source as ApiObject;
  const listKeys = ["records", "list", "rows", "items", "content", "data"];

  for (const key of listKeys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return extractList(value);
    }

    if (value && typeof value === "object" && !hasPveUserShape(data)) {
      const nested = extractList(value);
      if (nested.length) {
        return nested;
      }
    }
  }

  return hasPveUserShape(data) ? [data] : [];
};

const extractSingle = (source: unknown): ApiObject => {
  if (!source || typeof source !== "object") {
    return {};
  }

  if (hasPveUserShape(source)) {
    return source as ApiObject;
  }

  const data = source as ApiObject;
  for (const key of ["pveUser", "record", "item", "user", "data"]) {
    const value = data[key];
    if (value && typeof value === "object") {
      return extractSingle(value);
    }
  }

  return data;
};

const cleanFilters = () => {
  const query: Record<string, string | number> = {};
  if (filters.userId) {
    query.userId = filters.userId;
  }

  for (const key of ["username", "email", "status", "address"] as const) {
    const value = filters[key].trim();
    if (value) {
      query[key] = value;
    }
  }

  return query;
};

const activePattern = /^(active|enabled|online|running|normal|success|1|true|启用|正常|在线)$/i;
const inactivePattern = /^(inactive|disabled|offline|stopped|locked|0|false|禁用|停用|离线|锁定)$/i;

const statusLabel = (status: string) => {
  const normalized = status.trim().toUpperCase();
  const map: Record<string, string> = {
    ACTIVE: "已启用",
    ENABLED: "已启用",
    INACTIVE: "未启用",
    DISABLED: "已禁用",
    LOCKED: "已锁定",
    ONLINE: "在线",
    OFFLINE: "离线",
    UNKNOWN: "未知",
  };

  return map[normalized] ?? (status || "未设置");
};

const statusTagType = (status: string) => {
  const normalized = status.trim();
  if (activePattern.test(normalized)) {
    return "success";
  }

  if (/disabled|locked|禁用|停用|锁定/i.test(normalized)) {
    return "error";
  }

  if (inactivePattern.test(normalized)) {
    return "warning";
  }

  return "default";
};

const endpointText = (row: PveUser) => {
  if (!row.address) {
    return "-";
  }

  return row.port ? `${row.address}:${row.port}` : row.address;
};

const metrics = computed(() => {
  const nodeCount = new Set(pveUsers.value.map((item) => item.address).filter(Boolean)).size;
  const activeCount = pveUsers.value.filter((item) => activePattern.test(item.status)).length;
  const boundCount = pveUsers.value.filter((item) => item.userId).length;

  return [
    {
      label: "账号总数",
      value: pveUsers.value.length,
      hint: "当前查询结果",
    },
    {
      label: "可用状态",
      value: activeCount,
      hint: "ACTIVE / ONLINE",
    },
    {
      label: "节点地址",
      value: nodeCount,
      hint: "已覆盖的 PVE 节点",
    },
    {
      label: "已绑定用户",
      value: boundCount,
      hint: "存在 userId 的记录",
    },
  ];
});

const rowKey = (row: PveUser) => row.key;

const columns = computed<DataTableColumns<PveUser>>(() => [
  {
    title: "PVE 用户",
    key: "username",
    minWidth: 180,
    render(row) {
      return h("div", { class: "user-cell" }, [
        h("strong", row.username || "-"),
        h("span", row.email || "未配置邮箱"),
      ]);
    },
  },
  {
    title: "节点地址",
    key: "address",
    minWidth: 190,
    render(row) {
      return h("span", { class: "mono-text" }, endpointText(row));
    },
  },
  {
    title: "认证域",
    key: "pam",
    width: 110,
    render(row) {
      return row.pam || "-";
    },
  },
  {
    title: "绑定用户 ID",
    key: "userId",
    width: 128,
    render(row) {
      return row.userId ?? "-";
    },
  },
  {
    title: "状态",
    key: "status",
    width: 120,
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          round: true,
          type: statusTagType(row.status),
        },
        { default: () => statusLabel(row.status) },
      );
    },
  },
  {
    title: "API Token",
    key: "apiToken",
    minWidth: 130,
    render(row) {
      return h(
        NTag,
        {
          bordered: false,
          round: true,
          type: row.apiToken ? "success" : "default",
        },
        { default: () => (row.apiToken ? "已配置" : "未配置") },
      );
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 170,
    fixed: "right",
    render(row) {
      const canOperate = Boolean(row.id);

      return h(
        NSpace,
        {
          size: 8,
          wrap: false,
        },
        {
          default: () => [
            h(
              NButton,
              {
                size: "small",
                secondary: true,
                disabled: !canOperate,
                onClick: () => openEdit(row),
              },
              { default: () => "编辑" },
            ),
            h(
              NButton,
              {
                size: "small",
                type: "error",
                secondary: true,
                loading: deletingId.value === row.id,
                disabled: !canOperate,
                onClick: () => confirmDelete(row),
              },
              { default: () => "删除" },
            ),
          ],
        },
      );
    },
  },
]);

const assignForm = (data: PveUser | null = null) => {
  const next = data
    ? {
        userId: data.userId,
        username: data.username,
        password: "",
        address: data.address,
        port: data.port || "8006",
        pam: data.pam || "pam",
        email: data.email,
        status: data.status || null,
        apiToken: "",
      }
    : createEmptyForm();

  Object.assign(form, next);
};

const buildPayload = () => {
  const payload: PveUserPayload = {
    username: form.username.trim(),
    address: form.address.trim(),
    port: form.port.trim(),
    pam: form.pam.trim(),
    email: form.email.trim(),
  };

  if (form.userId) {
    payload.userId = form.userId;
  }

  const status = form.status?.trim();
  if (status) {
    payload.status = status;
  }

  const password = form.password.trim();
  if (password || !editing.value) {
    payload.password = password;
  }

  const apiToken = form.apiToken.trim();
  if (apiToken || !editing.value) {
    payload.apiToken = apiToken;
  }

  return payload;
};

const loadPveUsers = async () => {
  try {
    loading.value = true;
    const data = await get<PveUserListResponse>("/admin/pve-users", cleanFilters());
    pveUsers.value = extractList(data).map((item, index) => normalizePveUser(item, index));
  } catch (error) {
    message.error(error instanceof Error ? error.message : "PVE 用户列表加载失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  return loadPveUsers();
};

const resetFilters = () => {
  filters.userId = null;
  filters.username = "";
  filters.email = "";
  filters.status = "";
  filters.address = "";
  return loadPveUsers();
};

const openCreate = async () => {
  editingId.value = "";
  assignForm();
  drawerVisible.value = true;
  await nextTick();
  formRef.value?.restoreValidation();
};

const openEdit = async (row: PveUser) => {
  if (!row.id) {
    message.warning("当前记录缺少 id，无法编辑");
    return;
  }

  editingId.value = row.id;
  assignForm(row);
  drawerVisible.value = true;
  await nextTick();
  formRef.value?.restoreValidation();

  try {
    detailLoading.value = true;
    const data = await get<ApiObject>(`/admin/pve-users/${row.id}`);
    assignForm(normalizePveUser(extractSingle(data)));
  } catch (error) {
    message.warning(error instanceof Error ? error.message : "详情加载失败，已使用列表数据");
  } finally {
    detailLoading.value = false;
  }
};

const handleSave = async () => {
  try {
    await formRef.value?.validate();
    saving.value = true;

    const payload = buildPayload();
    const response = editing.value
      ? await putRaw<ApiObject, PveUserPayload>(
          `/admin/pve-users/${editingId.value}`,
          payload,
          { payloadMode: "json" },
        )
      : await postRaw<ApiObject, PveUserPayload>(
          "/admin/pve-users",
          payload,
          { payloadMode: "json" },
        );

    message.success(response.message ?? response.msg ?? "PVE 用户已保存");
    drawerVisible.value = false;
    await loadPveUsers();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "PVE 用户保存失败");
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (row: PveUser) => {
  if (!row.id) {
    message.warning("当前记录缺少 id，无法删除");
    return;
  }

  dialog.warning({
    title: "删除 PVE 用户",
    content: `确认删除 ${row.username || row.id} 吗？此操作不可恢复。`,
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: async () => {
      try {
        deletingId.value = row.id;
        const response = await deleteRaw<ApiObject>(`/admin/pve-users/${row.id}`);
        message.success(response.message ?? response.msg ?? "PVE 用户已删除");
        await loadPveUsers();
      } catch (error) {
        message.error(error instanceof Error ? error.message : "PVE 用户删除失败");
      } finally {
        deletingId.value = "";
      }
    },
  });
};

onMounted(loadPveUsers);
</script>

<style scoped>
.pve-page {
  --accent: #f36ca7;
  --accent-strong: #e83f8c;
  --accent-soft: #ffe1ef;
  --accent-tint: #fff4fa;
  --ink: #2b2430;
  --muted: #756b7c;
  --line: rgba(93, 69, 91, 0.14);
  --panel: rgba(255, 255, 255, 0.84);
  --shadow: 0 24px 80px rgba(166, 76, 128, 0.16);
  min-height: calc(100dvh - 169px);
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: 24px;
  background:
    radial-gradient(circle at 20% 12%, var(--accent-soft), transparent 28%),
    linear-gradient(135deg, #fff8fc 0%, var(--accent-tint) 54%, #ffffff 100%);
  color: var(--ink);
}

.theme-blue {
  --accent: #59a8ff;
  --accent-strong: #267fe8;
  --accent-soft: #dcefff;
  --accent-tint: #f1f8ff;
  --ink: #1f2a3d;
  --muted: #667085;
  --line: rgba(47, 104, 176, 0.14);
  --shadow: 0 24px 80px rgba(44, 119, 204, 0.16);
}

.pve-hero,
.workbench-panel,
.table-panel,
.metric-card {
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.pve-hero {
  position: relative;
  min-height: 220px;
  padding: clamp(22px, 4vw, 38px);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
  border-radius: 24px;
  overflow: hidden;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 620px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-copy p,
.section-head p,
.metric-card p {
  margin: 0;
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
}

.hero-copy h1 {
  margin: 4px 0 0;
  font-size: clamp(32px, 4vw, 56px);
  line-height: 1.05;
  letter-spacing: 0;
}

.hero-copy span {
  display: block;
  margin-top: 12px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.7;
}

.hero-actions {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.theme-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
}

.theme-switch button {
  min-width: 78px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}

.theme-switch button.active {
  color: #ffffff;
  background: var(--accent);
  box-shadow: 0 10px 22px color-mix(in srgb, var(--accent) 32%, transparent);
}

.swatch {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: currentColor;
}

.swatch.pink {
  background: #f36ca7;
}

.swatch.blue {
  background: #59a8ff;
}

.cat-mark {
  position: relative;
  width: 62px;
  height: 58px;
  flex: 0 0 auto;
}

.cat-ear,
.cat-face,
.cat-eye,
.cat-nose,
.moon,
.paw,
.server-card,
.server-card span {
  position: absolute;
  display: block;
}

.cat-ear {
  top: 4px;
  width: 26px;
  height: 28px;
  background: var(--accent);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.cat-ear-left {
  left: 6px;
  transform: rotate(-18deg);
}

.cat-ear-right {
  right: 6px;
  transform: rotate(18deg);
}

.cat-face {
  left: 6px;
  bottom: 0;
  width: 50px;
  height: 42px;
  border-radius: 22px 22px 20px 20px;
  background: #ffffff;
  box-shadow: inset 0 0 0 2px var(--accent), var(--shadow);
}

.cat-eye {
  top: 17px;
  width: 6px;
  height: 8px;
  border-radius: 999px;
  background: var(--ink);
}

.cat-eye-left {
  left: 15px;
}

.cat-eye-right {
  right: 15px;
}

.cat-nose {
  left: 22px;
  top: 27px;
  width: 7px;
  height: 5px;
  border-radius: 999px;
  background: var(--accent);
}

.hero-art {
  position: absolute;
  right: 12px;
  bottom: -32px;
  width: min(42vw, 460px);
  height: 220px;
  pointer-events: none;
}

.moon {
  right: 60px;
  top: 2px;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: -14px 14px 0 var(--accent), var(--shadow);
  opacity: 0.82;
}

.paw {
  width: 42px;
  height: 34px;
  border-radius: 24px 24px 20px 20px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow:
    8px -14px 0 -8px var(--accent),
    -8px -14px 0 -8px var(--accent),
    0 -17px 0 -8px var(--accent);
}

.paw-one {
  left: 50px;
  bottom: 62px;
  transform: rotate(-14deg);
}

.paw-two {
  right: 168px;
  top: 42px;
  transform: rotate(17deg) scale(0.78);
}

.server-card {
  width: 190px;
  height: 116px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.52)),
    var(--accent-soft);
  box-shadow: var(--shadow);
}

.server-card-main {
  right: 56px;
  bottom: 58px;
}

.server-card-back {
  right: 128px;
  bottom: 18px;
  transform: rotate(-7deg) scale(0.86);
  opacity: 0.72;
}

.server-card span {
  left: 24px;
  right: 24px;
  height: 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 42%, #ffffff);
}

.server-card span:nth-child(1) {
  top: 26px;
}

.server-card span:nth-child(2) {
  top: 52px;
}

.server-card span:nth-child(3) {
  top: 78px;
  right: 72px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  min-height: 126px;
  display: grid;
  align-content: center;
  gap: 6px;
  padding: 20px;
  border-radius: 18px;
}

.metric-card strong {
  font-size: 32px;
  line-height: 1;
}

.metric-card span,
.table-count {
  color: var(--muted);
  font-size: 13px;
}

.workbench-panel,
.table-panel {
  padding: 20px;
  border-radius: 20px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-head h2 {
  margin: 4px 0 0;
  font-size: 22px;
  letter-spacing: 0;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 160px repeat(4, minmax(150px, 1fr));
  gap: 0 14px;
}

.filter-form :deep(.n-input),
.filter-form :deep(.n-input-number),
.pve-form :deep(.n-input),
.pve-form :deep(.n-input-number),
.pve-form :deep(.n-base-selection) {
  --n-border-radius: 14px !important;
}

.filter-form :deep(.n-input.n-input--focus),
.filter-form :deep(.n-input-number.n-input-number--focus),
.pve-form :deep(.n-input.n-input--focus),
.pve-form :deep(.n-input-number.n-input-number--focus) {
  --n-border: 1px solid var(--accent) !important;
  --n-border-hover: 1px solid var(--accent) !important;
  --n-border-focus: 1px solid var(--accent) !important;
  --n-box-shadow-focus: 0 0 0 2px color-mix(in srgb, var(--accent) 18%, transparent) !important;
}

.filter-form :deep(.n-form-item-label__text),
.pve-form :deep(.n-form-item-label__text) {
  color: var(--ink);
  font-weight: 700;
}

.primary-button {
  --n-border-radius: 14px !important;
  --n-color: var(--accent) !important;
  --n-color-hover: var(--accent-strong) !important;
  --n-color-pressed: var(--accent-strong) !important;
  --n-color-focus: var(--accent) !important;
  --n-border: 1px solid var(--accent) !important;
  --n-border-hover: 1px solid var(--accent-strong) !important;
  --n-border-pressed: 1px solid var(--accent-strong) !important;
  --n-border-focus: 1px solid var(--accent) !important;
  font-weight: 800;
}

.soft-button {
  --n-border-radius: 14px !important;
  --n-text-color: var(--accent-strong) !important;
  --n-text-color-hover: var(--accent-strong) !important;
  --n-text-color-pressed: var(--accent-strong) !important;
  --n-border: 1px solid var(--line) !important;
  --n-border-hover: 1px solid var(--accent) !important;
  --n-border-pressed: 1px solid var(--accent) !important;
  --n-border-focus: 1px solid var(--accent) !important;
  font-weight: 800;
}

.pve-table :deep(.n-data-table-th) {
  background: color-mix(in srgb, var(--accent) 8%, #ffffff);
  color: var(--ink);
  font-weight: 800;
}

.user-cell {
  display: grid;
  gap: 4px;
}

.user-cell strong {
  color: var(--ink);
}

.user-cell span {
  color: var(--muted);
  font-size: 12px;
}

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 13px;
}

.pve-drawer :deep(.n-drawer-header__main) {
  font-weight: 800;
}

.drawer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (width <= 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-art {
    opacity: 0.34;
  }
}

@media (width <= 760px) {
  .pve-page {
    padding: 14px;
    border-radius: 18px;
  }

  .pve-hero {
    flex-direction: column;
    min-height: 280px;
  }

  .hero-copy {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .theme-switch {
    width: 100%;
  }

  .metric-grid,
  .filter-grid,
  .drawer-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .section-actions {
    width: 100%;
  }

  .section-actions :deep(.n-button) {
    flex: 1;
  }
}
</style>
