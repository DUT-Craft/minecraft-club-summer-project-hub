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
            <p class="eyebrow">Users · Access</p>
            <h1>用户管理</h1>
            <span>管理全部账号：授予 / 撤销项目创建资格，查看角色与状态。</span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/admin/manage')">控制台</n-button>
            <n-button :loading="loadingUsers" size="large" @click="loadUsers">刷新</n-button>
            <n-button size="large" @click="handleLogout">退出登录</n-button>
          </div>
        </n-card>

        <n-card :bordered="false" class="toolbar">
          <n-space :size="10" align="center" wrap>
            <n-input
                v-model:value="keyword"
                class="search-input"
                clearable
                placeholder="按用户名 / 昵称 / 邮箱搜索"
                @update:value="onKeywordChange"
            />
            <span class="toolbar-count">共 {{ users.length }} 个账号</span>
          </n-space>
          <p class="toolbar-hint">
            授予项目创建资格后，该用户即可创建并管理自己的项目；撤权不影响已拥有的项目。「项目创建资格」对超级管理员恒为开启，不可撤销。
          </p>
        </n-card>

        <n-card :bordered="false" class="table-panel">
          <n-data-table
              :bordered="false"
              :columns="columns"
              :data="users"
              :pagination="{pageSize: 20}"
              :row-key="(row: UserSummary) => row.id"
              :single-line="false"
              size="small"
          >
            <template #role="{ row }">
              <n-tag
                  :bordered="false"
                  :type="roleType(row.role)"
                  round
                  size="small"
              >
                {{ roleLabel(row.role) }}
              </n-tag>
            </template>
            <template #status="{ row }">
              <n-tag
                  :bordered="false"
                  :type="statusType(row.status)"
                  round
                  size="small"
              >
                {{ statusLabel(row.status) }}
              </n-tag>
            </template>
            <template #canCreateProject="{ row }">
              <n-tag
                  :bordered="false"
                  :type="row.canCreateProject ? 'success' : 'default'"
                  round
                  size="small"
              >
                {{ row.canCreateProject ? "已授权" : "未授权" }}
              </n-tag>
            </template>
            <template #actions="{ row }">
              <n-space :size="8" align="center">
                <n-button
                    v-if="!row.canCreateProject"
                    :loading="togglingId === row.id"
                    size="small"
                    type="primary"
                    @click="handleGrant(row)"
                >
                  授予创建资格
                </n-button>
                <n-popconfirm
                    v-else-if="row.role !== 'SUPER_ADMIN'"
                    @positive-click="handleRevoke(row)"
                >
                  <template #trigger>
                    <n-button
                        :loading="togglingId === row.id"
                        size="small"
                        type="warning"
                    >
                      撤销创建资格
                    </n-button>
                  </template>
                  撤销后该用户将无法新建项目，已拥有的项目不受影响。确认撤销？
                </n-popconfirm>
                <span v-else class="super-hint">超管恒开</span>
              </n-space>
            </template>
          </n-data-table>
        </n-card>
      </template>

      <n-empty v-else class="empty-state" description="无权访问或尚未登录">
        <template #extra>
          <p class="empty-subtext">用户管理仅对超级管理员开放。</p>
          <n-button type="primary" @click="navigateTo('/admin')">前往登录</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {DataTableColumns} from "naive-ui";
import type {AdminSession} from "~/composables/useAdminAuth";
import type {UserSummary} from "~/types/projectHub";


definePageMeta({
  layout: false,
});

const message = useMessage();
const {themeOverrides} = useMinecraftTheme();
const {read, clear} = useAdminAuth();
const {listUsersAdmin, grantCreateProject, revokeCreateProject} = useProjectHubApi();

const loading = ref(true);
const loadingUsers = ref(false);
const session = ref<AdminSession | null>(null);
const isSuperAdmin = computed(() => session.value?.role === "SUPER_ADMIN");

const users = ref<UserSummary[]>([]);
const keyword = ref("");
const togglingId = ref<number | string | null>(null);

// 关键字搜索防抖：输入停顿 300ms 后再请求，避免每次按键打后端
let searchTimer: ReturnType<typeof setTimeout> | null = null;
const onKeywordChange = () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadUsers(), 300);
};

onMounted(async () => {
  const existing = read();
  session.value = existing;
  loading.value = false;
  if (!existing) {
    navigateTo("/admin");
    return;
  }
  if (isSuperAdmin.value) {
    await loadUsers();
  }
});

const loadUsers = async () => {
  try {
    loadingUsers.value = true;
    users.value = await listUsersAdmin(keyword.value);
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "用户列表加载失败");
  } finally {
    loadingUsers.value = false;
  }
};

const handleGrant = async (row: UserSummary) => {
  try {
    togglingId.value = row.id;
    await grantCreateProject(row.id);
    row.canCreateProject = true;
    message.success(`已授予 ${row.username} 项目创建资格`);
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "授权失败");
  } finally {
    togglingId.value = null;
  }
};

const handleRevoke = async (row: UserSummary) => {
  try {
    togglingId.value = row.id;
    await revokeCreateProject(row.id);
    row.canCreateProject = false;
    message.success(`已撤销 ${row.username} 项目创建资格`);
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "撤权失败");
  } finally {
    togglingId.value = null;
  }
};

const roleLabel = (role: UserSummary["role"]) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "超级管理员";
    case "USER":
      return "普通用户";
    case "PROJECT_MANAGER":
      return "项目管理（过渡）";
    default:
      return role;
  }
};
const roleType = (role: UserSummary["role"]): "success" | "info" | "default" => {
  switch (role) {
    case "SUPER_ADMIN":
      return "success";
    case "USER":
      return "info";
    default:
      return "default";
  }
};

const statusLabel = (status: UserSummary["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "正常";
    case "BANNED":
      return "已封禁";
    case "DEACTIVATED":
      return "已停用";
    case "DELETED":
      return "已注销";
    default:
      return status;
  }
};
const statusType = (status: UserSummary["status"]): "success" | "error" | "warning" | "default" => {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "BANNED":
      return "error";
    case "DEACTIVATED":
      return "warning";
    default:
      return "default";
  }
};

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "——");

const columns: DataTableColumns<UserSummary> = [
  {title: "ID", key: "id", width: 70},
  {title: "用户名", key: "username", ellipsis: {tooltip: true}},
  {title: "昵称", key: "nickname", ellipsis: {tooltip: true}},
  {title: "邮箱", key: "email", ellipsis: {tooltip: true}},
  {title: "角色", key: "role", width: 120},
  {title: "状态", key: "status", width: 100},
  {title: "创建资格", key: "canCreateProject", width: 110},
  {title: "注册时间", key: "createdAt", width: 160, render: (row) => formatTime(row.createdAt)},
  {title: "操作", key: "actions", width: 150},
];

const handleLogout = async () => {
  clear();
  session.value = null;
  message.success("已退出");
  await navigateTo("/admin");
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
  font-size: clamp(26px, 4vw, 42px);
  line-height: 1.08;
  color: #2d2418;
}

.hero-info span {
  display: block;
  margin-top: 9px;
  color: #60462b;
  font-weight: 800;
}

.hero-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  max-width: 320px;
}

.toolbar-count {
  color: #60462b;
  font-weight: 700;
  font-size: 14px;
}

.toolbar-hint {
  margin: 10px 0 0;
  color: #795b36;
  font-size: 13px;
  line-height: 1.7;
}

.super-hint {
  color: #795b36;
  font-size: 12px;
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
}
</style>
