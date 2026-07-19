<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <template v-else-if="session">
        <n-card class="manage-hero" :bordered="false">
          <div class="hero-info">
            <p class="eyebrow">Projects · Batch</p>
            <h1>项目管理</h1>
            <span>批量审核、改状态，或进入单个项目更新</span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/admin/manage')">控制台</n-button>
            <n-button size="large" type="primary" @click="handleLogout">退出登录</n-button>
          </div>
        </n-card>

        <n-card class="toolbar" :bordered="false">
          <n-space :size="10" align="center" wrap>
            <n-select
              v-model:value="filter"
              :options="filterOptions"
              class="filter-select"
            />
            <n-button :loading="loadingList" @click="load">刷新</n-button>
            <span class="toolbar-count">共 {{ projects.length }} 项</span>
          </n-space>

          <!-- 批量操作栏：选中后才出现 -->
          <div v-if="selectedIds.length" class="batch-bar">
            <span class="batch-count">已选 {{ selectedIds.length }} 项</span>
            <n-space :size="8" align="center" wrap>
              <span class="batch-label">设为</span>
              <n-select
                v-model:value="targetStatus"
                :options="targetStatusOptions"
                size="small"
                class="target-select"
              />
              <n-button size="small" type="primary" :loading="applying" @click="applyStatusBatch">应用</n-button>
              <n-popconfirm @positive-click="applyDeleteBatch">
                <template #trigger>
                  <n-button size="small" type="error" ghost :loading="deleting">批量删除</n-button>
                </template>
                确定删除选中的 {{ selectedIds.length }} 个项目吗？（软删除）
              </n-popconfirm>
              <n-button size="small" quaternary @click="clearSelection">取消选择</n-button>
            </n-space>
          </div>
        </n-card>

        <n-empty v-if="!loadingList && !projects.length" description="该状态下暂无项目。" />

        <div v-else class="project-list">
          <article
            v-for="project in projects"
            :key="project.id"
            class="project-card"
            :class="{ selected: isChecked(project.id) }"
          >
            <n-checkbox
              :checked="isChecked(project.id)"
              class="row-check"
              @update:checked="toggleOne(project.id)"
            />
            <div class="row-main" @click="goDetail(project.id)">
              <div class="row-head">
                <span class="row-title">{{ project.title || "（未命名项目）" }}</span>
                <n-tag :bordered="false" size="small" round :type="statusTagType(project.status)">
                  {{ formatProjectStatus(project.status) }}
                </n-tag>
              </div>
              <div class="row-meta">
                <span>{{ project.type || "未分类" }}</span>
                <span>负责人：{{ project.ownerName || "——" }}</span>
                <span v-if="project.ownerMinecraftId">MC：{{ project.ownerMinecraftId }}</span>
                <span class="row-id">#{{ project.id }}</span>
              </div>
              <p v-if="project.summary || project.description" class="row-desc">
                {{ (project.summary || project.description).slice(0, 80) }}
              </p>
            </div>
            <n-button size="small" class="row-action" @click="goDetail(project.id)">管理</n-button>
          </article>
        </div>
      </template>

      <n-empty v-else class="empty-state" description="尚未登录管理员账号">
        <template #extra>
          <n-button type="primary" @click="navigateTo('/admin')">前往登录</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script setup lang="ts">
import type { AdminSession } from "~/composables/useAdminAuth";
import type { Project } from "~/types/projectHub";

definePageMeta({ layout: false });

// 审核态只保留后台队列；公开运营状态不再显示“审核通过”。
const filterOptions = [
  { label: "待审核", value: "PENDING" },
  { label: "审核未通过", value: "REJECTED" },
  { label: "筹备中", value: "PREPARING" },
  { label: "招募中", value: "RECRUITING" },
  { label: "制作中", value: "IN_PROGRESS" },
  { label: "暂缓", value: "PAUSED" },
  { label: "已删除", value: "DELETED" },
  { label: "全部", value: "" },
];
// 批量改状态的目标选项：排除 PENDING（无意义）与 DELETED（用「批量删除」走专用接口更可靠）
const targetStatusOptions = [
  { label: "审核未通过", value: "REJECTED" },
  { label: "筹备中", value: "PREPARING" },
  { label: "招募中", value: "RECRUITING" },
  { label: "制作中", value: "IN_PROGRESS" },
  { label: "暂缓", value: "PAUSED" },
];

const message = useMessage();
const { themeOverrides } = useMinecraftTheme();
const { read, clear } = useAdminAuth();
const { listProjectsAdmin, updateProjectStatusBatch, deleteProjectBatch } = useProjectHubApi();

const loading = ref(true);
const session = ref<AdminSession | null>(null);

const projects = ref<Project[]>([]);
const loadingList = ref(false);
// 默认看待审核队列（管理员最常做的事就是放行 PENDING 项目）
const filter = ref<string>("PENDING");

const selectedIds = ref<string[]>([]);
const targetStatus = ref<string>("PREPARING");
const applying = ref(false);
const deleting = ref(false);

onMounted(async () => {
  session.value = read();
  loading.value = false;
  if (!session.value) {
    navigateTo("/admin");
    return;
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
    projects.value = await listProjectsAdmin(filter.value || undefined);
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
    await updateProjectStatusBatch(selectedIds.value.map((id) => ({ id, status: targetStatus.value })));
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

const handleLogout = () => {
  clear();
  session.value = null;
  message.success("已退出管理员控制台");
  navigateTo("/admin");
};

const labelOf = (value: string) => filterOptions.find((opt) => opt.value === value)?.label ?? value;

const statusTagType = (status?: string): "warning" | "success" | "error" | "info" | "default" => {
  switch ((status || "").toUpperCase()) {
    case "PENDING": return "warning";
    case "APPROVED":
    case "IN_PROGRESS": return "success";
    case "REJECTED":
    case "DELETED": return "error";
    case "RECRUITING": return "info";
    default: return "default";
  }
};
</script>

<style scoped>
.mc-page {
  min-height: 100dvh;
  padding-bottom: 42px;
  color: #2d2418;
  background:
    radial-gradient(circle at 80% 8%, rgba(255, 215, 101, 0.44), transparent 21%),
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

.manage-hero :deep(.n-card-content) {
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

.toolbar :deep(.n-card-content) {
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

.row-meta span {
  min-width: 0;
  overflow-wrap: anywhere;
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
  overflow-wrap: anywhere;
  word-break: break-word;
}

.empty-state {
  width: min(560px, calc(100% - 28px));
  margin: 80px auto 0;
}

@media (width <= 720px) {
  .manage-hero :deep(.n-card-content) {
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
}
</style>
