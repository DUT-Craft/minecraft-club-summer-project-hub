<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="loading" class="loading-state">
        <n-spin size="large"/>
      </div>

      <template v-else-if="session">
        <n-card :bordered="false" class="manage-hero">
          <div class="hero-info">
            <p class="eyebrow">Projects · Batch</p>
            <h1>{{ scope === "mine" ? "我的项目" : "项目管理" }}</h1>
            <span>{{
                scope === "mine"
                    ? "管理归属给你的项目，或创建新的自有项目"
                    : "批量审核、改状态，或进入单个项目更新"
              }}</span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/admin/manage')">控制台</n-button>
            <n-button size="large" type="primary" @click="handleLogout">退出登录</n-button>
          </div>
        </n-card>

        <n-card :bordered="false" class="toolbar">
          <n-space :size="10" align="center" wrap>
            <n-select
                v-model:value="filter"
                :options="filterOptions"
                class="filter-select"
            />
            <n-button-group v-if="isSuperAdmin" class="scope-toggle">
              <n-button :type="scope === 'all' ? 'primary' : 'default'" size="medium" @click="setScope('all')">
                全部项目
              </n-button>
              <n-button :type="scope === 'mine' ? 'primary' : 'default'" size="medium" @click="setScope('mine')">
                我的项目
              </n-button>
            </n-button-group>
            <n-button :loading="loadingList" @click="load">刷新</n-button>
            <span class="toolbar-count">共 {{ projects.length }} 项</span>
            <n-button class="create-btn" type="primary" @click="openCreateModal">+ 创建项目</n-button>
          </n-space>

          <!-- 批量操作栏：选中后才出现 -->
          <div v-if="selectedIds.length" class="batch-bar">
            <span class="batch-count">已选 {{ selectedIds.length }} 项</span>
            <n-space :size="8" align="center" wrap>
              <span class="batch-label">设为</span>
              <n-select
                  v-model:value="targetStatus"
                  :options="targetStatusOptions"
                  class="target-select"
                  size="small"
              />
              <n-button :loading="applying" size="small" type="primary" @click="applyStatusBatch">应用</n-button>
              <n-popconfirm @positive-click="applyDeleteBatch">
                <template #trigger>
                  <n-button :loading="deleting" ghost size="small" type="error">批量删除</n-button>
                </template>
                确定删除选中的 {{ selectedIds.length }} 个项目吗？（软删除）
              </n-popconfirm>
              <n-button quaternary size="small" @click="clearSelection">取消选择</n-button>
            </n-space>
          </div>
        </n-card>

        <n-empty
            v-if="!loadingList && !projects.length"
            :description="scope === 'mine' ? '你还没有自己的项目，创建一个开始吧。' : '该状态下暂无项目。'"
        >
          <template v-if="scope === 'mine'" #extra>
            <n-button type="primary" @click="openCreateModal">创建项目</n-button>
          </template>
        </n-empty>

        <div v-else class="project-list">
          <article
              v-for="project in projects"
              :key="project.id"
              :class="{ selected: isChecked(project.id) }"
              class="project-card"
          >
            <n-checkbox
                :checked="isChecked(project.id)"
                class="row-check"
                @update:checked="toggleOne(project.id)"
            />
            <div class="row-main" @click="goDetail(project.id)">
              <div class="row-head">
                <span class="row-title">{{ project.title || "（未命名项目）" }}</span>
                <n-tag :bordered="false" :type="statusTagType(project.status)" round size="small">
                  {{ formatProjectStatus(project.status) }}
                </n-tag>
              </div>
              <div class="row-meta">
                <span>{{ formatTagNames(project.tags) }}</span>
                <span>负责人：{{ project.ownerName || "——" }}</span>
                <span v-if="project.ownerMinecraftId">MC：{{ project.ownerMinecraftId }}</span>
                <span class="row-id">#{{ project.id }}</span>
              </div>
              <p v-if="project.summary || project.description" class="row-desc">
                {{ (project.summary || project.description).slice(0, 80) }}
              </p>
            </div>
            <n-button class="row-action" size="small" @click="goDetail(project.id)">管理</n-button>
          </article>
        </div>
      </template>

      <n-empty v-else class="empty-state" description="尚未登录管理员账号">
        <template #extra>
          <n-button type="primary" @click="navigateTo('/admin')">前往登录</n-button>
        </template>
      </n-empty>

      <!-- 创建项目：管理员直接创建归属自己的项目。总管理可选状态（默认招募中直接上线）；
           项目管理固定 PENDING 待审，控制密码可选（留空则该项目不支持项目方控制密码自服务）。 -->
      <n-modal
          v-model:show="showCreateModal"
          :bordered="false"
          :mask-closable="false"
          preset="card"
          style="width: min(720px, calc(100% - 28px))"
          title="创建项目"
      >
        <n-form
            ref="createFormRef"
            :model="createForm"
            :rules="createRules"
            :show-require-mark="false"
            label-placement="top"
            size="medium"
            @submit.prevent="handleCreateSubmit"
        >
          <div class="edit-grid">
            <n-form-item label="项目标题" path="title">
              <n-input v-model:value="createForm.title" placeholder="项目标题"/>
            </n-form-item>
            <n-form-item label="项目标签" path="tagIds">
              <ProjectTagCascader v-model="createForm.tagIds" :max-count="10" placeholder="从预设标签里选择，最多 10 个"/>
            </n-form-item>
          </div>

          <n-form-item v-if="isSuperAdmin" label="状态" path="status">
            <n-select v-model:value="createForm.status" :options="createStatusOptions" placeholder="选择状态"/>
          </n-form-item>
          <p v-else class="form-hint">项目管理创建的项目固定为「待审核」，需总管理审核通过后才会公开。</p>

          <n-form-item label="项目简介" path="introduction">
            <n-input v-model:value="createForm.introduction" :rows="2" placeholder="一句话简介" type="textarea"/>
          </n-form-item>
          <n-form-item label="详细介绍" path="description">
            <n-input v-model:value="createForm.description" :rows="4" placeholder="详细说明" type="textarea"/>
          </n-form-item>

          <n-form-item label="项目封面图" path="coverImageUrl">
            <ImageUploader
                :url="createForm.coverImageUrl"
                button-text="上传封面图"
                @update:url="createForm.coverImageUrl = $event"
            />
          </n-form-item>

          <div class="edit-grid">
            <n-form-item label="负责人" path="ownerName">
              <n-input v-model:value="createForm.ownerName" placeholder="负责人昵称"/>
            </n-form-item>
            <n-form-item label="负责人 MC ID" path="ownerMinecraftId">
              <n-input v-model:value="createForm.ownerMinecraftId" placeholder="Java / 基岩版 ID"/>
            </n-form-item>
          </div>

          <n-form-item label="公开联系方式" path="publicContact">
            <n-input v-model:value="createForm.publicContact" placeholder="QQ 群 / Discord 等"/>
          </n-form-item>

          <n-form-item label="招工需求" path="recruitmentNeeds">
            <div class="need-editor">
              <div
                  v-for="(need, index) in createForm.recruitmentNeeds"
                  :key="index"
                  class="need-editor-row"
              >
                <n-input v-model:value="need.skill" placeholder="岗位"/>
                <n-input-number v-model:value="need.count" :min="0" class="need-editor-count" placeholder="人数"/>
                <n-input v-model:value="need.work" class="need-editor-work" placeholder="工作内容"/>
                <n-button quaternary type="error" @click="createForm.recruitmentNeeds.splice(index, 1)">删除</n-button>
              </div>
              <n-button block dashed @click="addCreateNeed">+ 添加岗位</n-button>
            </div>
          </n-form-item>
        </n-form>

        <template #footer>
          <div class="edit-footer">
            <n-button @click="showCreateModal = false">取消</n-button>
            <n-button :loading="creating" type="primary" @click="handleCreateSubmit">
              {{ creating ? "创建中..." : "创建项目" }}
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
import type {Project, RecruitmentNeed} from "~/types/projectHub";

definePageMeta({layout: false});

// 状态过滤选项：覆盖项目全部 8 个状态 + 全部
const filterOptions = [
  {label: "待审核", value: "PENDING"},
  {label: "审核通过", value: "APPROVED"},
  {label: "审核未通过", value: "REJECTED"},
  {label: "筹备中", value: "PREPARING"},
  {label: "招募中", value: "RECRUITING"},
  {label: "制作中", value: "IN_PROGRESS"},
  {label: "暂缓", value: "PAUSED"},
  {label: "已删除", value: "DELETED"},
  {label: "全部", value: ""},
];
// 批量改状态的目标选项：排除 PENDING（无意义）与 DELETED（用「批量删除」走专用接口更可靠）
const targetStatusOptions = [
  {label: "审核通过", value: "APPROVED"},
  {label: "审核未通过", value: "REJECTED"},
  {label: "筹备中", value: "PREPARING"},
  {label: "招募中", value: "RECRUITING"},
  {label: "制作中", value: "IN_PROGRESS"},
  {label: "暂缓", value: "PAUSED"},
];

const message = useMessage();
const route = useRoute();
const {themeOverrides} = useMinecraftTheme();
const {read, clear} = useAdminAuth();
const {
  listProjectsAdmin,
  createProjectAdmin,
  updateProjectStatusBatch,
  deleteProjectBatch,
  adminLogout
} = useProjectHubApi();

const loading = ref(true);
const session = ref<AdminSession | null>(null);

const projects = ref<Project[]>([]);
const loadingList = ref(false);
// 默认展示全部项目，覆盖所有状态
const filter = ref<string>("");

const selectedIds = ref<string[]>([]);
const targetStatus = ref<string>("APPROVED");
const applying = ref(false);
const deleting = ref(false);

// 列表归属范围：all=全部（仅总管理可选），mine=仅自己名下项目。
// 项目管理恒为 mine（后端按 ownerId 过滤），总管理默认 all，可手动切换或经 ?scope=mine 预置。
const isSuperAdmin = computed(() => session.value?.role === "SUPER_ADMIN");
const scope = ref<"all" | "mine">("all");

const setScope = (next: "all" | "mine") => {
  if (scope.value === next) {
    return;
  }
  scope.value = next;
  selectedIds.value = [];
  load();
};

onMounted(async () => {
  session.value = read();
  loading.value = false;
  if (!session.value) {
    navigateTo("/admin");
    return;
  }
  // 项目管理只能看名下，强制 mine；总管理可由 query ?scope=mine 预置为「我的项目」
  if (!isSuperAdmin.value) {
    scope.value = "mine";
  } else if (route.query.scope === "mine") {
    scope.value = "mine";
  }
  await load();
});

// 切换筛选后重新拉取（保持选中与列表一致：清空选中）
watch(filter, () => {
  if (session.value) {
    selectedIds.value = [];
    load();
  }
});

const load = async () => {
  try {
    loadingList.value = true;
    projects.value = await listProjectsAdmin(filter.value || undefined, scope.value === "mine");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "加载项目列表失败");
    projects.value = [];
  } finally {
    loadingList.value = false;
  }
};

const isChecked = (id: string) => selectedIds.value.includes(id);

const toggleOne = (id: string) => {
  selectedIds.value = isChecked(id)
      ? selectedIds.value.filter((item) => item !== id)
      : [...selectedIds.value, id];
};

const clearSelection = () => {
  selectedIds.value = [];
};

// 批量改状态：调用 PUT /object-items/batch（只传 {id, status}）
const applyStatusBatch = async () => {
  if (!selectedIds.value.length) {
    return;
  }
  try {
    applying.value = true;
    await updateProjectStatusBatch(selectedIds.value.map((id) => ({id, status: targetStatus.value})));
    message.success(`已将 ${selectedIds.value.length} 个项目设为「${labelOf(targetStatus.value)}」`);
    clearSelection();
    await load();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "批量更新失败，请稍后再试");
  } finally {
    applying.value = false;
  }
};

// 批量删除：走 DELETE /object-items/batch（只需 ids，不涉及 controlPassword，比改状态更可靠）
const applyDeleteBatch = async () => {
  if (!selectedIds.value.length) {
    return;
  }
  try {
    deleting.value = true;
    await deleteProjectBatch(selectedIds.value);
    message.success(`已删除 ${selectedIds.value.length} 个项目`);
    clearSelection();
    await load();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "批量删除失败，请稍后再试");
  } finally {
    deleting.value = false;
  }
};

const goDetail = (id: string) => navigateTo(`/admin/manage/projects/${id}`);

const handleLogout = async () => {
  try {
    await adminLogout();
  } catch {
    // 忽略：token 可能已过期，继续清本地会话
  }
  clear();
  session.value = null;
  message.success("已退出管理员控制台");
  await navigateTo("/admin");
};

/* ---------- 创建项目（管理员直接归属自己） ---------- */
// 总管理可选状态（默认招募中直接上线）；项目管理固定 PENDING（后端强制，前端不传 status）。
const createStatusOptions = [
  {label: "待审核", value: "PENDING"},
  {label: "审核通过", value: "APPROVED"},
  {label: "筹备中", value: "PREPARING"},
  {label: "招募中", value: "RECRUITING"},
  {label: "制作中", value: "IN_PROGRESS"},
  {label: "暂缓", value: "PAUSED"},
];

const createFormRef = ref<FormInst | null>(null);
const showCreateModal = ref(false);
const creating = ref(false);

const newCreateNeed = (): RecruitmentNeed => ({
  id: String(Date.now() + Math.random()),
  skill: "",
  count: 1,
  work: "",
});

const createForm = reactive({
  title: "",
  tagIds: [] as Array<number | string>,
  status: "RECRUITING",
  introduction: "",
  description: "",
  coverImageUrl: "",
  ownerName: "",
  ownerMinecraftId: "",
  publicContact: "",
  recruitmentNeeds: [newCreateNeed()] as RecruitmentNeed[],
});

const createRules: FormRules = {
  title: {required: true, message: "请填写项目标题", trigger: ["blur", "input"]},
};

const addCreateNeed = () => {
  createForm.recruitmentNeeds.push(newCreateNeed());
};

const resetCreateForm = () => {
  Object.assign(createForm, {
    title: "",
    tagIds: [],
    status: "RECRUITING",
    introduction: "",
    description: "",
    coverImageUrl: "",
    ownerName: "",
    ownerMinecraftId: "",
    publicContact: "",
    recruitmentNeeds: [newCreateNeed()],
  });
};

const openCreateModal = () => {
  resetCreateForm();
  showCreateModal.value = true;
};

const handleCreateSubmit = async () => {
  try {
    await createFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    creating.value = true;
    const created = await createProjectAdmin({
      title: createForm.title.trim(),
      tagIds: createForm.tagIds,
      status: isSuperAdmin.value ? createForm.status : undefined,
      introduction: createForm.introduction.trim() || undefined,
      description: createForm.description || undefined,
      coverImageUrl: createForm.coverImageUrl || undefined,
      ownerName: createForm.ownerName.trim() || undefined,
      ownerMinecraftId: createForm.ownerMinecraftId.trim() || undefined,
      publicContact: createForm.publicContact.trim() || undefined,
      recruitmentNeeds: createForm.recruitmentNeeds
          .map((need) => ({skill: need.skill.trim(), count: Number(need.count) || 0, work: need.work.trim()}))
          .filter((need) => need.skill),
    });
    message.success(`项目《${created.title}》已创建`);
    showCreateModal.value = false;
    // 创建的是自有项目：切到「我的项目」视角确保立即可见（总管理 all 视角也能看到，mine 更聚焦）。
    if (isSuperAdmin.value && scope.value !== "mine") {
      setScope("mine");
    } else {
      await load();
    }
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "创建失败，请稍后再试");
  } finally {
    creating.value = false;
  }
};

const labelOf = (value: string) => filterOptions.find((opt) => opt.value === value)?.label ?? value;

// 标签名称拼接（无标签时回退占位文案）
const formatTagNames = (tags?: { name?: string }[]) =>
    (tags ?? []).map((tag) => tag.name).filter(Boolean).join("、") || "未设置标签";

const statusTagType = (status?: string): "warning" | "success" | "error" | "info" | "default" => {
  switch ((status || "").toUpperCase()) {
    case "PENDING":
      return "warning";
    case "APPROVED":
    case "IN_PROGRESS":
      return "success";
    case "REJECTED":
    case "DELETED":
      return "error";
    case "RECRUITING":
      return "info";
    default:
      return "default";
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
.empty-state,
.loading-state {
  width: min(1080px, calc(100% - 28px));
  margin: 22px auto 0;
}

.project-list {
  width: min(1080px, calc(100% - 28px));
  margin: 14px auto 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  gap: 10px;
}

.toolbar :deep(.n-card__content) {
  padding: 14px 18px;
}

.filter-select {
  width: 160px;
}

.toolbar-count {
  color: #795b36;
  font-weight: 700;
  font-size: 14px;
}

/* 批量操作栏 */
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px dashed #8b6a3d;
}

.batch-count {
  font-weight: 900;
  color: #5a3a21;
}

.batch-label {
  color: #60462b;
  font-weight: 700;
  font-size: 14px;
}

.target-select {
  width: 150px;
}

/* 项目行 */
.project-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
  box-shadow: 0 3px 0 rgba(90, 58, 33, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.project-card.selected {
  border-color: #6b8f32;
  box-shadow: 0 3px 0 #6b8f32;
}

.row-check {
  align-self: center;
}

.row-main {
  min-width: 0;
  cursor: pointer;
}

.row-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.row-title {
  font-weight: 900;
  color: #2d2418;
  font-size: 16px;
  word-break: break-word;
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #795b36;
  font-size: 13px;
  font-weight: 700;
}

.row-id {
  color: #a6732b;
}

.row-desc {
  margin: 6px 0 0;
  color: #60462b;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-state {
  width: min(560px, calc(100% - 28px));
  margin: 80px auto 0;
}

/* 归属范围切换 + 创建按钮 */
.scope-toggle {
  flex: 0 0 auto;
}

.create-btn {
  margin-left: auto;
}

.form-hint {
  margin: 0;
  color: #795b36;
  font-size: 13px;
  line-height: 1.7;
}

/* 创建项目弹窗：复用 [id].vue 编辑弹窗的两列 / 招工编辑器布局 */
.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.edit-grid :deep(.n-form-item) {
  margin-bottom: 0;
}

.need-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.need-editor-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px minmax(0, 1.4fr) auto;
  align-items: flex-start;
  gap: 8px;
}

.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (width <= 720px) {
  .manage-hero :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }

  .project-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .row-action {
    grid-column: 1 / -1;
    width: 100%;
  }

  .need-editor-row,
  .edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
