<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="loading" class="loading-state">
        <n-spin size="large"/>
      </div>

      <template v-else-if="session && isSuperAdmin">
        <n-card :bordered="false" class="manage-hero">
          <div class="hero-info">
            <p class="eyebrow">Tags · Dictionary</p>
            <h1>标签管理</h1>
            <span>维护全局项目标签字典：父子层级、是否可选、排序与说明，驱动投稿 / 项目墙 Cascader。</span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/admin/manage')">控制台</n-button>
            <n-button :loading="loadingTags" size="large" @click="loadTags">刷新</n-button>
            <n-button size="large" type="primary" @click="openCreate(null)">+ 新增标签</n-button>
            <n-button size="large" @click="handleLogout">退出登录</n-button>
          </div>
        </n-card>

        <n-card :bordered="false" class="toolbar">
          <n-space :size="10" align="center" wrap>
            <n-input
                v-model:value="keyword"
                class="search-input"
                clearable
                placeholder="按标签名搜索"
            />
            <span class="toolbar-count">共 {{ tags.length }} 个标签（含已删除 {{ deletedCount }} 个）</span>
          </n-space>
          <p class="toolbar-hint">
            分组节点（selectable=false）仅用于 Cascader 层级展示，项目不能直接选择；删除标签会解除其全部项目关联并软删除，活跃子节点未清空前不可删除。
          </p>
        </n-card>

        <n-card :bordered="false" class="table-panel">
          <n-data-table
              :bordered="false"
              :columns="columns"
              :data="tableData"
              :pagination="false"
              :row-key="(row: TagRow) => row.key"
              :single-line="false"
              size="small"
          >
            <template #name="{ row }">
              <span class="tag-name" :style="{ paddingLeft: row.depth * 22 + 'px' }">
                <span v-if="row.hasChildren" class="tag-branch">▸</span>
                <strong :class="{ 'is-deleted': row.deleted }">{{ row.name }}</strong>
                <n-tag v-if="row.deleted" :bordered="false" round size="tiny" type="error">已删除</n-tag>
                <n-tag v-if="!row.selectable" :bordered="false" round size="tiny" type="warning">分组</n-tag>
              </span>
              <p v-if="row.description" class="tag-desc" :style="{ paddingLeft: row.depth * 22 + 'px' }">{{ row.description }}</p>
            </template>
            <template #selectable="{ row }">
              <n-tag :bordered="false" :type="row.selectable ? 'success' : 'default'" round size="small">
                {{ row.selectable ? "可选" : "分组" }}
              </n-tag>
            </template>
            <template #sortOrder="{ row }">{{ row.sortOrder }}</template>
            <template #projectCount="{ row }">
              <n-tag :bordered="false" round size="small">{{ row.projectCount }} 个</n-tag>
            </template>
            <template #deleted="{ row }">
              <n-tag :bordered="false" :type="row.deleted ? 'error' : 'success'" round size="small">
                {{ row.deleted ? "已删除" : "活跃" }}
              </n-tag>
            </template>
            <template #actions="{ row }">
              <n-space :size="6" align="center">
                <n-button :disabled="row.deleted" size="tiny" @click="openCreate(row.id)">加子标签</n-button>
                <n-button :disabled="row.deleted" size="tiny" type="primary" ghost @click="openEdit(row)">编辑</n-button>
                <n-popconfirm @positive-click="handleDelete(row)">
                  <template #trigger>
                    <n-button :disabled="row.deleted" ghost size="tiny" type="error">删除</n-button>
                  </template>
                  {{ deleteConfirmText(row) }}
                </n-popconfirm>
              </n-space>
            </template>
          </n-data-table>
        </n-card>
      </template>

      <n-empty v-else-if="session && !isSuperAdmin" class="empty-state" description="无权访问标签管理">
        <template #extra>
          <p class="empty-subtext">标签字典属于全局配置，仅总管理（SUPER_ADMIN）可维护。</p>
          <n-button type="primary" @click="navigateTo('/admin/manage')">返回控制台</n-button>
        </template>
      </n-empty>

      <n-empty v-else class="empty-state" description="尚未登录管理员账号">
        <template #extra>
          <n-button type="primary" @click="navigateTo('/admin')">前往登录</n-button>
        </template>
      </n-empty>

      <!-- 新增 / 编辑标签 -->
      <n-modal
          v-model:show="showFormModal"
          :bordered="false"
          :mask-closable="false"
          preset="card"
          style="width: min(560px, calc(100% - 28px))"
          :title="formTitle"
      >
        <n-form
            ref="formRef"
            :model="tagForm"
            :rules="tagRules"
            :show-require-mark="false"
            label-placement="top"
            @submit.prevent="handleSubmit"
        >
          <n-form-item label="标签名" path="name">
            <n-input v-model:value="tagForm.name" :maxlength="32" placeholder="去除首尾空格后全局唯一（忽略大小写）" show-count/>
          </n-form-item>
          <n-form-item label="父标签" path="parentId">
            <n-tree-select
                v-model:value="tagForm.parentId"
                :clearable="true"
                :default-expand-all="true"
                :options="parentOptions"
                placeholder="留空为根节点；分组节点会标注（分组）"
            />
          </n-form-item>
          <div class="form-row">
            <n-form-item label="是否可选" path="selectable">
              <n-switch v-model:value="tagForm.selectable" :disabled="selectableLocked">
                <template #checked>可选（项目可关联）</template>
                <template #unchecked>仅分组</template>
              </n-switch>
            </n-form-item>
            <n-form-item label="排序" path="sortOrder">
              <n-input-number v-model:value="tagForm.sortOrder" :show-button="false" placeholder="同级内升序"/>
            </n-form-item>
          </div>
          <n-form-item label="说明" path="description">
            <n-input v-model:value="tagForm.description" :maxlength="255" placeholder="管理端备注（可选）"/>
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="edit-footer">
            <n-button @click="showFormModal = false">取消</n-button>
            <n-button :loading="submitting" type="primary" @click="handleSubmit">
              {{ submitting ? "保存中..." : "保存" }}
            </n-button>
          </div>
        </template>
      </n-modal>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {FormInst, FormRules} from "naive-ui";
import type {AdminSession} from "~/composables/useAdminAuth";
import type {TagAdminItem, TagSavePayload} from "~/types/projectHub";

definePageMeta({layout: false});

// 表格行（在平铺的 TagAdminItem 基础上补 depth / hasChildren，用于缩进式树展示）
interface TagRow extends TagAdminItem {
  key: number | string;
  depth: number;
  hasChildren: boolean;
}

// n-tree-select 父标签选项节点
interface TreeOption {
  label: string;
  key: number | string;
  children?: TreeOption[];
}

const message = useMessage();
const {themeOverrides} = useMinecraftTheme();
const {read, clear} = useAdminAuth();
const {listTagsAdmin, createTagAdmin, updateTagAdmin, deleteTagAdmin, adminLogout} = useProjectHubApi();

const loading = ref(true);
const session = ref<AdminSession | null>(null);
const isSuperAdmin = computed(() => session.value?.role === "SUPER_ADMIN");

const tags = ref<TagAdminItem[]>([]);
const loadingTags = ref(false);
const keyword = ref("");

onMounted(async () => {
  session.value = read();
  loading.value = false;
  if (!session.value) {
    navigateTo("/admin");
    return;
  }
  if (isSuperAdmin.value) {
    await loadTags();
  }
});

const loadTags = async () => {
  loadingTags.value = true;
  try {
    tags.value = await listTagsAdmin();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "加载标签列表失败");
    tags.value = [];
  } finally {
    loadingTags.value = false;
  }
};

const handleLogout = async () => {
  try {
    await adminLogout();
  } catch {
    // 忽略：token 可能已过期
  }
  clear();
  session.value = null;
  message.success("已退出管理员控制台");
  await navigateTo("/admin");
};

const deletedCount = computed(() => tags.value.filter((t) => t.deleted).length);

// 平铺列表 → 缩进树行：根节点 parentId=null，子节点按 (sortOrder, id) 升序挂在父节点下
const buildTreeRows = (items: TagAdminItem[]): TagRow[] => {
  const byParent = new Map<number | string | null, TagAdminItem[]>();
  for (const it of items) {
    const key = it.parentId ?? null;
    const arr = byParent.get(key) ?? [];
    arr.push(it);
    byParent.set(key, arr);
  }
  const sortFn = (a: TagAdminItem, b: TagAdminItem) =>
      (a.sortOrder - b.sortOrder) || (Number(a.id) - Number(b.id));
  const rows: TagRow[] = [];
  const walk = (parentId: number | string | null, depth: number) => {
    for (const c of (byParent.get(parentId) ?? []).slice().sort(sortFn)) {
      rows.push({
        ...c,
        key: c.id,
        depth,
        hasChildren: (byParent.get(c.id)?.length ?? 0) > 0,
      });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return rows;
};

// 搜索：按名称命中（忽略大小写）时退化为扁平列表，避免匹配项的父链丢失导致缩进错乱
const tableData = computed<TagRow[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) {
    return buildTreeRows(tags.value);
  }
  return tags.value
      .filter((t) => (t.name ?? "").toLowerCase().includes(kw))
      .map((t) => ({...t, key: t.id, depth: 0, hasChildren: false}));
});

const columns = [
  {title: "标签名", key: "name"},
  {title: "是否可选", key: "selectable", width: 110},
  {title: "排序", key: "sortOrder", width: 80},
  {title: "关联项目", key: "projectCount", width: 110},
  {title: "状态", key: "deleted", width: 100},
  {title: "操作", key: "actions", width: 230},
];

// 父标签选项：仅活跃节点，编辑时排除自身（避免选自己做父节点；后端仍会兜底防环）
const buildParentOptions = (items: TagAdminItem[]): TreeOption[] => {
  const byParent = new Map<number | string | null, TagAdminItem[]>();
  for (const it of items) {
    const key = it.parentId ?? null;
    const arr = byParent.get(key) ?? [];
    arr.push(it);
    byParent.set(key, arr);
  }
  const sortFn = (a: TagAdminItem, b: TagAdminItem) =>
      (a.sortOrder - b.sortOrder) || (Number(a.id) - Number(b.id));
  const build = (parentId: number | string | null): TreeOption[] =>
      (byParent.get(parentId) ?? []).slice().sort(sortFn).map((it) => ({
        label: it.name + (it.selectable ? "" : "（分组）"),
        key: it.id,
        ...(byParent.get(it.id)?.length ? {children: build(it.id)} : {}),
      }));
  return build(null);
};

const parentOptions = computed(() =>
    buildParentOptions(tags.value.filter((t) => !t.deleted && t.id !== tagForm.id)),
);

/* ---------- 新增 / 编辑表单 ---------- */
const formRef = ref<FormInst | null>(null);
const showFormModal = ref(false);
const submitting = ref(false);

const tagForm = reactive({
  id: null as number | string | null,
  name: "",
  parentId: null as number | string | null,
  selectable: true,
  sortOrder: 0,
  description: "",
});

const tagRules: FormRules = {
  name: {required: true, message: "请填写标签名", trigger: ["blur", "input"]},
};

const formTitle = computed(() => (tagForm.id == null ? "新增标签" : "编辑标签"));
const editingTag = computed(() => tags.value.find((tag) => tag.id === tagForm.id));
const selectableLocked = computed(() =>
    Boolean(editingTag.value?.selectable && editingTag.value.projectCount > 0),
);

const resetForm = () => {
  Object.assign(tagForm, {
    id: null,
    name: "",
    parentId: null,
    selectable: true,
    sortOrder: 0,
    description: "",
  });
};

const openCreate = (presetParentId: number | string | null) => {
  if (presetParentId != null && tags.value.find((tag) => tag.id === presetParentId)?.deleted) {
    return;
  }
  resetForm();
  tagForm.parentId = presetParentId;
  showFormModal.value = true;
};

const openEdit = (row: TagRow) => {
  if (row.deleted) {
    return;
  }
  Object.assign(tagForm, {
    id: row.id,
    name: row.name ?? "",
    parentId: row.parentId ?? null,
    selectable: row.selectable,
    sortOrder: row.sortOrder,
    description: row.description ?? "",
  });
  showFormModal.value = true;
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (selectableLocked.value && !tagForm.selectable) {
    message.warning("有关联项目的标签不能改为仅分组");
    tagForm.selectable = true;
    return;
  }
  const payload: TagSavePayload = {
    name: tagForm.name.trim(),
    parentId: tagForm.parentId,
    selectable: tagForm.selectable,
    sortOrder: Number(tagForm.sortOrder) || 0,
    description: tagForm.description.trim() || null,
  };
  try {
    submitting.value = true;
    if (tagForm.id == null) {
      await createTagAdmin(payload);
      message.success(`标签「${payload.name}」已新增`);
    } else {
      await updateTagAdmin(tagForm.id, payload);
      message.success(`标签「${payload.name}」已更新`);
    }
    showFormModal.value = false;
    await loadTags();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "保存失败，请稍后再试");
  } finally {
    submitting.value = false;
  }
};

const deleteConfirmText = (row: TagRow) =>
    row.projectCount > 0
        ? `该标签当前关联 ${row.projectCount} 个项目，删除将解除这些关联，且不可在前端恢复。确定删除「${row.name}」吗？`
        : `确定删除标签「${row.name}」吗？`;

const handleDelete = async (row: TagRow) => {
  try {
    const res = await deleteTagAdmin(row.id);
    message.success(`已删除标签「${row.name}」，解除 ${res.affectedProjects} 个项目关联`);
    await loadTags();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "删除失败，请稍后再试");
  }
};
</script>

<style scoped>
.mc-page {
  min-height: 100dvh;
  padding-bottom: 42px;
  color: #2d2418;
  background: radial-gradient(circle at 80% 8%, rgba(255, 215, 101, 0.44), transparent 21%),
  linear-gradient(rgba(97, 153, 202, 0.17) 1px, transparent 1px),
  linear-gradient(90deg, rgba(97, 153, 202, 0.17) 1px, transparent 1px),
  #dff0ff;
  background-size: auto, 26px 26px, 26px 26px, auto;
}

.manage-hero,
.toolbar,
.table-panel,
.empty-state,
.loading-state {
  width: min(1080px, calc(100% - 28px));
  margin: 22px auto 0;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 80px 0;
}

:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 6px 0 #5a3a21;
}

.manage-hero :deep(.n-card__content) {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.hero-info {
  min-width: 0;
}

.eyebrow {
  margin: 0;
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.12em;
}

.hero-info h1 {
  margin: 6px 0 0;
  font-size: clamp(26px, 3.4vw, 40px);
  line-height: 1.08;
  color: #2d2418;
}

.hero-info span {
  display: block;
  margin-top: 8px;
  color: #60462b;
  font-weight: 700;
}

.hero-actions {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-input {
  width: 240px;
}

.toolbar-count {
  color: #795b36;
  font-weight: 700;
  font-size: 14px;
}

.toolbar-hint {
  margin: 10px 0 0;
  color: #795b36;
  font-size: 13px;
  line-height: 1.7;
}

/* 表格内的标签名单元格：缩进 + 分支符 + 状态标签 */
.tag-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tag-branch {
  color: #6b8f32;
  font-weight: 900;
}

.tag-name strong.is-deleted {
  color: #a14a3b;
  text-decoration: line-through;
}

.tag-desc {
  margin: 4px 0 0;
  color: #795b36;
  font-size: 12px;
  line-height: 1.5;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-row :deep(.n-form-item) {
  margin-bottom: 0;
}

.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty-state {
  width: min(560px, calc(100% - 28px));
  margin: 80px auto 0;
}

.empty-subtext {
  margin: 8px 0 16px;
  color: #60462b;
  line-height: 1.7;
}

@media (width <= 720px) {
  .manage-hero :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
