<template>
  <main class="vm-page" :class="themeClass">
    <section class="vm-hero">
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
          <p>VM CONTROL</p>
          <h1>VM 管理</h1>
          <span>维护虚拟机、PVE 关联、系统账号和密钥信息。</span>
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
          @click="loadVirtualMachines"
        >
          刷新
        </n-button>
        <n-button type="primary" class="primary-button" @click="openCreate">
          新增 VM
        </n-button>
      </div>

      <div class="hero-art" aria-hidden="true">
        <span class="moon" />
        <span class="paw paw-one" />
        <span class="paw paw-two" />
        <span class="vm-cube vm-cube-main">
          <span />
          <span />
          <span />
        </span>
        <span class="vm-cube vm-cube-back">
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
          <n-form-item label="PVE 用户 ID">
            <n-input-number
              v-model:value="filters.pveUserId"
              clearable
              :show-button="false"
              :min="1"
              placeholder="请输入 PVE 用户 ID"
            />
          </n-form-item>
          <n-form-item label="PVE ID">
            <n-input-number
              v-model:value="filters.pveId"
              clearable
              :show-button="false"
              :min="1"
              placeholder="请输入 PVE ID"
            />
          </n-form-item>
          <n-form-item label="VM 名称">
            <n-input
              v-model:value="filters.name"
              clearable
              placeholder="请输入虚拟机名称"
            />
          </n-form-item>
          <n-form-item label="状态">
            <n-select
              v-model:value="filters.status"
              filterable
              clearable
              :options="statusOptions"
              placeholder="请选择状态"
            />
          </n-form-item>
        </div>
      </n-form>
    </section>

    <section class="table-panel">
      <div class="section-head">
        <div>
          <p>VIRTUAL MACHINES</p>
          <h2>虚拟机列表</h2>
        </div>
        <span class="table-count">共 {{ virtualMachines.length }} 条</span>
      </div>

      <n-data-table
        :columns="columns"
        :data="virtualMachines"
        :loading="loading"
        :pagination="pagination"
        :row-key="rowKey"
        :bordered="false"
        :single-line="false"
        :scroll-x="1160"
        class="vm-table"
      />
    </section>

    <n-drawer v-model:show="drawerVisible" :width="drawerWidth" placement="right">
      <n-drawer-content :title="drawerTitle" closable class="vm-drawer">
        <n-spin :show="detailLoading">
          <n-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-placement="top"
            class="vm-form"
          >
            <div class="drawer-grid">
              <n-form-item label="PVE ID" path="pveId">
                <n-input-number
                  v-model:value="form.pveId"
                  clearable
                  :show-button="false"
                  :min="1"
                  placeholder="请输入 PVE ID"
                />
              </n-form-item>
              <n-form-item label="PVE 用户 ID" path="pveUserId">
                <n-input-number
                  v-model:value="form.pveUserId"
                  clearable
                  :show-button="false"
                  :min="1"
                  placeholder="请输入 PVE 用户 ID"
                />
              </n-form-item>
            </div>

            <n-form-item label="VM 名称" path="name">
              <n-input
                v-model:value="form.name"
                clearable
                placeholder="请输入虚拟机名称"
              />
            </n-form-item>

            <n-form-item label="描述" path="description">
              <n-input
                v-model:value="form.description"
                type="textarea"
                clearable
                :autosize="{ minRows: 2, maxRows: 4 }"
                placeholder="请输入虚拟机描述"
              />
            </n-form-item>

            <n-form-item label="状态" path="status">
              <n-select
                v-model:value="form.status"
                filterable
                clearable
                :options="statusOptions"
                placeholder="请选择状态"
              />
            </n-form-item>

            <div class="drawer-grid">
              <n-form-item label="系统用户名" path="systemUserName">
                <n-input
                  v-model:value="form.systemUserName"
                  clearable
                  placeholder="请输入系统用户名"
                />
              </n-form-item>
              <n-form-item label="系统密码" path="systemUserPassword">
                <n-input
                  v-model:value="form.systemUserPassword"
                  type="password"
                  show-password-on="click"
                  clearable
                  :placeholder="editing ? '留空则不更新系统密码' : '请输入系统密码'"
                />
              </n-form-item>
            </div>

            <n-form-item label="公钥" path="publicKey">
              <n-input
                v-model:value="form.publicKey"
                type="textarea"
                clearable
                :autosize="{ minRows: 3, maxRows: 5 }"
                placeholder="请输入 SSH 公钥"
              />
            </n-form-item>

            <n-form-item label="私钥" path="privateKey">
              <n-input
                v-model:value="form.privateKey"
                type="textarea"
                clearable
                :autosize="{ minRows: 3, maxRows: 5 }"
                :placeholder="editing ? '留空则不更新私钥' : '请输入 SSH 私钥'"
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

    <n-modal
      v-model:show="statusModalVisible"
      preset="card"
      title="更新 VM 状态"
      class="status-modal"
      :bordered="false"
      :mask-closable="false"
    >
      <n-form
        ref="statusFormRef"
        :model="statusForm"
        :rules="statusRules"
        label-placement="top"
        class="vm-form"
      >
        <n-alert type="info" :show-icon="false" class="status-alert">
          {{ statusTargetName || "当前虚拟机" }}
        </n-alert>
        <n-form-item label="状态" path="status">
          <n-select
            v-model:value="statusForm.status"
            filterable
            :options="statusOptions"
            placeholder="请选择状态"
          />
        </n-form-item>

        <div class="modal-actions">
          <n-button @click="statusModalVisible = false">取消</n-button>
          <n-button
            type="primary"
            class="primary-button"
            :loading="statusSaving"
            @click="handleSaveStatus"
          >
            保存状态
          </n-button>
        </div>
      </n-form>
    </n-modal>
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
type VmStatus =
  | "RUNNING"
  | "STOPPED"
  | "PAUSED"
  | "SUSPENDED"
  | "STARTING"
  | "STOPPING"
  | "UNKNOWN";
type ApiObject = Record<string, any>;

interface VirtualMachine {
  key: string;
  id: string;
  pveId: number | null;
  name: string;
  description: string;
  status: VmStatus | string;
  pveUserId: number | null;
  systemUserName: string;
  systemUserPassword: string;
  publicKey: string;
  privateKey: string;
  raw: ApiObject;
}

interface VirtualMachineForm {
  pveId: number | null;
  name: string;
  description: string;
  status: VmStatus | null;
  pveUserId: number | null;
  systemUserName: string;
  systemUserPassword: string;
  publicKey: string;
  privateKey: string;
}

interface VirtualMachinePayload {
  pveId?: number;
  name?: string;
  description?: string;
  status?: VmStatus;
  pveUserId?: number;
  systemUserName?: string;
  systemUserPassword?: string;
  publicKey?: string;
  privateKey?: string;
}

interface VmFilters {
  pveUserId: number | null;
  pveId: number | null;
  name: string;
  status: VmStatus | null;
}

type VirtualMachineListResponse = ApiObject | ApiObject[];

const message = useMessage();
const dialog = useDialog();
const { get, postRaw, putRaw, patchRaw, deleteRaw } = useHttp();

const theme = ref<ThemeName>("pink");
const loading = ref(false);
const detailLoading = ref(false);
const saving = ref(false);
const statusSaving = ref(false);
const drawerVisible = ref(false);
const statusModalVisible = ref(false);
const editingId = ref<string>("");
const deletingId = ref<string>("");
const statusTargetId = ref<string>("");
const statusTargetName = ref<string>("");
const formRef = ref<FormInst | null>(null);
const statusFormRef = ref<FormInst | null>(null);

const virtualMachines = ref<VirtualMachine[]>([]);

const filters = reactive<VmFilters>({
  pveUserId: null,
  pveId: null,
  name: "",
  status: null,
});

const createEmptyForm = (): VirtualMachineForm => ({
  pveId: null,
  name: "",
  description: "",
  status: "UNKNOWN",
  pveUserId: null,
  systemUserName: "",
  systemUserPassword: "",
  publicKey: "",
  privateKey: "",
});

const form = reactive<VirtualMachineForm>(createEmptyForm());
const statusForm = reactive<{ status: VmStatus | null }>({
  status: "UNKNOWN",
});

const statusOptions: SelectOption[] = [
  { label: "运行中 RUNNING", value: "RUNNING" },
  { label: "已停止 STOPPED", value: "STOPPED" },
  { label: "暂停中 PAUSED", value: "PAUSED" },
  { label: "挂起中 SUSPENDED", value: "SUSPENDED" },
  { label: "启动中 STARTING", value: "STARTING" },
  { label: "停止中 STOPPING", value: "STOPPING" },
  { label: "未知 UNKNOWN", value: "UNKNOWN" },
];

const pagination = {
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
};

const themeClass = computed(() => `theme-${theme.value}`);
const editing = computed(() => Boolean(editingId.value));
const drawerTitle = computed(() => (editing.value ? "编辑 VM" : "新增 VM"));
const drawerWidth = "min(620px, 100vw)";

const rules: FormRules = {
  pveId: {
    required: true,
    type: "number",
    message: "请输入 PVE ID",
    trigger: ["input", "blur", "change"],
  },
  name: {
    required: true,
    message: "请输入虚拟机名称",
    trigger: ["input", "blur"],
  },
  status: {
    required: true,
    message: "请选择状态",
    trigger: ["change", "blur"],
  },
  pveUserId: {
    required: true,
    type: "number",
    message: "请输入 PVE 用户 ID",
    trigger: ["input", "blur", "change"],
  },
  systemUserPassword: {
    validator: (_rule, value: string) => {
      if (!editing.value && !value?.trim()) {
        return new Error("请输入系统密码");
      }

      return true;
    },
    trigger: ["input", "blur"],
  },
};

const statusRules: FormRules = {
  status: {
    required: true,
    message: "请选择状态",
    trigger: ["change", "blur"],
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

const normalizeStatus = (value: string): VmStatus | string => {
  return value.trim().toUpperCase() || "UNKNOWN";
};

const hasVmShape = (source: unknown) => {
  if (!source || typeof source !== "object") {
    return false;
  }

  const data = source as ApiObject;

  return [
    "id",
    "pveId",
    "name",
    "description",
    "status",
    "pveUserId",
    "systemUserName",
    "systemUserPassword",
    "publicKey",
    "privateKey",
  ].some((key) => key in data);
};

const normalizeVm = (source: ApiObject, index = 0): VirtualMachine => {
  const id = readString(source, ["id", "vmId", "virtualMachineId", "virtual_machine_id"]);
  const pveId = readNumber(source, ["pveId", "pve_id"]);
  const name = readString(source, ["name", "vmName", "vm_name"]);
  const pveUserId = readNumber(source, ["pveUserId", "pve_user_id"]);

  return {
    key: id || `${pveId ?? "pve"}-${pveUserId ?? "user"}-${name || index}`,
    id,
    pveId,
    name,
    description: readString(source, ["description", "desc"]),
    status: normalizeStatus(readString(source, ["status"])),
    pveUserId,
    systemUserName: readString(source, ["systemUserName", "system_user_name"]),
    systemUserPassword: readString(source, ["systemUserPassword", "system_user_password"]),
    publicKey: readString(source, ["publicKey", "public_key"]),
    privateKey: readString(source, ["privateKey", "private_key"]),
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

    if (value && typeof value === "object" && !hasVmShape(data)) {
      const nested = extractList(value);
      if (nested.length) {
        return nested;
      }
    }
  }

  return hasVmShape(data) ? [data] : [];
};

const extractSingle = (source: unknown): ApiObject => {
  if (!source || typeof source !== "object") {
    return {};
  }

  if (hasVmShape(source)) {
    return source as ApiObject;
  }

  const data = source as ApiObject;
  for (const key of ["virtualMachine", "vm", "record", "item", "data"]) {
    const value = data[key];
    if (value && typeof value === "object") {
      return extractSingle(value);
    }
  }

  return data;
};

const cleanFilters = () => {
  const query: Record<string, string | number> = {};
  if (filters.pveUserId) {
    query.pveUserId = filters.pveUserId;
  }

  if (filters.pveId) {
    query.pveId = filters.pveId;
  }

  const name = filters.name.trim();
  if (name) {
    query.name = name;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  return query;
};

const statusLabel = (status: string) => {
  const normalized = normalizeStatus(status);
  const map: Record<string, string> = {
    RUNNING: "运行中",
    STOPPED: "已停止",
    PAUSED: "暂停中",
    SUSPENDED: "挂起中",
    STARTING: "启动中",
    STOPPING: "停止中",
    UNKNOWN: "未知",
  };

  return map[normalized] ?? (status || "未知");
};

const statusTagType = (status: string) => {
  const normalized = normalizeStatus(status);
  if (normalized === "RUNNING") {
    return "success";
  }

  if (normalized === "STARTING" || normalized === "STOPPING") {
    return "info";
  }

  if (normalized === "STOPPED" || normalized === "PAUSED" || normalized === "SUSPENDED") {
    return "warning";
  }

  return "default";
};

const metrics = computed(() => {
  const runningCount = virtualMachines.value.filter((item) => item.status === "RUNNING").length;
  const stoppedCount = virtualMachines.value.filter((item) => item.status === "STOPPED").length;
  const pveCount = new Set(virtualMachines.value.map((item) => item.pveId).filter(Boolean)).size;

  return [
    {
      label: "VM 总数",
      value: virtualMachines.value.length,
      hint: "当前查询结果",
    },
    {
      label: "运行中",
      value: runningCount,
      hint: "RUNNING",
    },
    {
      label: "已停止",
      value: stoppedCount,
      hint: "STOPPED",
    },
    {
      label: "PVE 节点",
      value: pveCount,
      hint: "关联的 PVE ID",
    },
  ];
});

const rowKey = (row: VirtualMachine) => row.key;

const columns = computed<DataTableColumns<VirtualMachine>>(() => [
  {
    title: "VM",
    key: "name",
    minWidth: 220,
    render(row) {
      return h("div", { class: "user-cell" }, [
        h("strong", row.name || "-"),
        h("span", row.description || "未填写描述"),
      ]);
    },
  },
  {
    title: "PVE ID",
    key: "pveId",
    width: 110,
    render(row) {
      return row.pveId ?? "-";
    },
  },
  {
    title: "PVE 用户 ID",
    key: "pveUserId",
    width: 128,
    render(row) {
      return row.pveUserId ?? "-";
    },
  },
  {
    title: "系统用户",
    key: "systemUserName",
    minWidth: 150,
    render(row) {
      return row.systemUserName || "-";
    },
  },
  {
    title: "状态",
    key: "status",
    width: 126,
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
    title: "密钥",
    key: "keys",
    width: 138,
    render(row) {
      const configured = Boolean(row.publicKey || row.privateKey);

      return h(
        NTag,
        {
          bordered: false,
          round: true,
          type: configured ? "success" : "default",
        },
        { default: () => (configured ? "已配置" : "未配置") },
      );
    },
  },
  {
    title: "操作",
    key: "actions",
    width: 230,
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
                onClick: () => openStatus(row),
              },
              { default: () => "状态" },
            ),
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

const assignForm = (data: VirtualMachine | null = null) => {
  const next = data
    ? {
        pveId: data.pveId,
        name: data.name,
        description: data.description,
        status: normalizeStatus(data.status) as VmStatus,
        pveUserId: data.pveUserId,
        systemUserName: data.systemUserName,
        systemUserPassword: "",
        publicKey: data.publicKey,
        privateKey: "",
      }
    : createEmptyForm();

  Object.assign(form, next);
};

const buildPayload = () => {
  const payload: VirtualMachinePayload = {
    name: form.name.trim(),
    description: form.description.trim(),
    systemUserName: form.systemUserName.trim(),
    publicKey: form.publicKey.trim(),
  };

  if (form.pveId) {
    payload.pveId = form.pveId;
  }

  if (form.pveUserId) {
    payload.pveUserId = form.pveUserId;
  }

  if (form.status) {
    payload.status = form.status;
  }

  const systemUserPassword = form.systemUserPassword.trim();
  if (systemUserPassword || !editing.value) {
    payload.systemUserPassword = systemUserPassword;
  }

  const privateKey = form.privateKey.trim();
  if (privateKey || !editing.value) {
    payload.privateKey = privateKey;
  }

  return payload;
};

const loadVirtualMachines = async () => {
  try {
    loading.value = true;
    const data = await get<VirtualMachineListResponse>("/admin/virtual-machines", cleanFilters());
    virtualMachines.value = extractList(data).map((item, index) => normalizeVm(item, index));
  } catch (error) {
    message.error(error instanceof Error ? error.message : "VM 列表加载失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  return loadVirtualMachines();
};

const resetFilters = () => {
  filters.pveUserId = null;
  filters.pveId = null;
  filters.name = "";
  filters.status = null;
  return loadVirtualMachines();
};

const openCreate = async () => {
  editingId.value = "";
  assignForm();
  drawerVisible.value = true;
  await nextTick();
  formRef.value?.restoreValidation();
};

const openEdit = async (row: VirtualMachine) => {
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
    const data = await get<ApiObject>(`/admin/virtual-machines/${row.id}`);
    assignForm(normalizeVm(extractSingle(data)));
  } catch (error) {
    message.warning(error instanceof Error ? error.message : "详情加载失败，已使用列表数据");
  } finally {
    detailLoading.value = false;
  }
};

const openStatus = async (row: VirtualMachine) => {
  if (!row.id) {
    message.warning("当前记录缺少 id，无法更新状态");
    return;
  }

  statusTargetId.value = row.id;
  statusTargetName.value = row.name || row.id;
  statusForm.status = normalizeStatus(row.status) as VmStatus;
  statusModalVisible.value = true;
  await nextTick();
  statusFormRef.value?.restoreValidation();
};

const handleSave = async () => {
  try {
    await formRef.value?.validate();
    saving.value = true;

    const payload = buildPayload();
    const response = editing.value
      ? await putRaw<ApiObject, VirtualMachinePayload>(
          `/admin/virtual-machines/${editingId.value}`,
          payload,
          { payloadMode: "json" },
        )
      : await postRaw<ApiObject, VirtualMachinePayload>(
          "/admin/virtual-machines",
          payload,
          { payloadMode: "json" },
        );

    message.success(response.message ?? response.msg ?? "VM 已保存");
    drawerVisible.value = false;
    await loadVirtualMachines();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "VM 保存失败");
  } finally {
    saving.value = false;
  }
};

const handleSaveStatus = async () => {
  try {
    await statusFormRef.value?.validate();
    if (!statusTargetId.value || !statusForm.status) {
      message.warning("请选择需要更新的 VM 状态");
      return;
    }

    statusSaving.value = true;
    const response = await patchRaw<ApiObject, { status: VmStatus }>(
      `/admin/virtual-machines/${statusTargetId.value}/status`,
      {
        status: statusForm.status,
      },
      {
        payloadMode: "json",
      },
    );

    message.success(response.message ?? response.msg ?? "VM 状态已更新");
    statusModalVisible.value = false;
    await loadVirtualMachines();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "VM 状态更新失败");
  } finally {
    statusSaving.value = false;
  }
};

const confirmDelete = (row: VirtualMachine) => {
  if (!row.id) {
    message.warning("当前记录缺少 id，无法删除");
    return;
  }

  dialog.warning({
    title: "删除 VM",
    content: `确认删除 ${row.name || row.id} 吗？此操作不可恢复。`,
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: async () => {
      try {
        deletingId.value = row.id;
        const response = await deleteRaw<ApiObject>(`/admin/virtual-machines/${row.id}`);
        message.success(response.message ?? response.msg ?? "VM 已删除");
        await loadVirtualMachines();
      } catch (error) {
        message.error(error instanceof Error ? error.message : "VM 删除失败");
      } finally {
        deletingId.value = "";
      }
    },
  });
};

onMounted(loadVirtualMachines);
</script>

<style scoped>
.vm-page {
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

.vm-hero,
.workbench-panel,
.table-panel,
.metric-card {
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.vm-hero {
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
.vm-cube,
.vm-cube span {
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

.vm-cube {
  width: 174px;
  height: 128px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.52)),
    var(--accent-soft);
  box-shadow: var(--shadow);
}

.vm-cube-main {
  right: 58px;
  bottom: 52px;
}

.vm-cube-back {
  right: 140px;
  bottom: 12px;
  transform: rotate(-8deg) scale(0.84);
  opacity: 0.72;
}

.vm-cube span {
  left: 24px;
  height: 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 42%, #ffffff);
}

.vm-cube span:nth-child(1) {
  top: 28px;
  width: 92px;
}

.vm-cube span:nth-child(2) {
  top: 58px;
  width: 126px;
}

.vm-cube span:nth-child(3) {
  top: 88px;
  width: 64px;
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
  grid-template-columns: 170px 150px minmax(180px, 1fr) 190px;
  gap: 0 14px;
}

.filter-form :deep(.n-input),
.filter-form :deep(.n-input-number),
.filter-form :deep(.n-base-selection),
.vm-form :deep(.n-input),
.vm-form :deep(.n-input-number),
.vm-form :deep(.n-base-selection) {
  --n-border-radius: 14px !important;
}

.filter-form :deep(.n-input.n-input--focus),
.filter-form :deep(.n-input-number.n-input-number--focus),
.vm-form :deep(.n-input.n-input--focus),
.vm-form :deep(.n-input-number.n-input-number--focus) {
  --n-border: 1px solid var(--accent) !important;
  --n-border-hover: 1px solid var(--accent) !important;
  --n-border-focus: 1px solid var(--accent) !important;
  --n-box-shadow-focus: 0 0 0 2px color-mix(in srgb, var(--accent) 18%, transparent) !important;
}

.filter-form :deep(.n-form-item-label__text),
.vm-form :deep(.n-form-item-label__text) {
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

.vm-table :deep(.n-data-table-th) {
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

.vm-drawer :deep(.n-drawer-header__main) {
  font-weight: 800;
}

.drawer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.drawer-actions,
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.status-modal {
  width: min(440px, calc(100vw - 32px));
}

.status-alert {
  margin-bottom: 16px;
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
  .vm-page {
    padding: 14px;
    border-radius: 18px;
  }

  .vm-hero {
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
