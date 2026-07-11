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
            <p class="eyebrow">{{ isSuperAdmin ? "Super Admin" : "Project Manager" }}</p>
            <h1>{{ isSuperAdmin ? "总管理控制台" : "项目管理控制台" }}</h1>
            <span>
              {{ session.username || "管理员" }}
              <n-tag :bordered="false" :type="isSuperAdmin ? 'success' : 'info'" class="role-tag" round size="small">
                {{ isSuperAdmin ? "总管理" : "项目管理" }}
              </n-tag>
              · 登录于 {{ formatTime(session.loginAt) }}
            </span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/')">返回站点</n-button>
            <n-button size="large" type="primary" @click="handleLogout">退出登录</n-button>
          </div>
        </n-card>

        <!-- 总管理专属：邀请码生成 + 项目分配 -->
        <div v-if="isSuperAdmin" class="super-grid">
          <n-card :bordered="false" class="entry-card" hoverable>
            <div class="entry-head">
              <span class="eyebrow">Invite</span>
              <h2>项目管理邀请码</h2>
            </div>
            <p class="entry-desc">生成一次性邀请码，发给项目管理用于注册账号。</p>
            <n-space :size="10" align="center" wrap>
              <n-button :loading="generatingInvite" type="primary" @click="handleGenerateInvite">
                {{ inviteCode ? "重新生成" : "生成邀请码" }}
              </n-button>
              <n-input v-if="inviteCode" :value="inviteCode" class="invite-code" readonly/>
              <n-button v-if="inviteCode" text type="primary" @click="copyInvite">复制</n-button>
            </n-space>

            <div class="invite-history">
              <div class="invite-history-head">
                <strong>历史邀请码</strong>
                <n-button :loading="loadingInvites" quaternary size="tiny" @click="loadInviteHistory">刷新</n-button>
              </div>
              <n-empty v-if="!inviteHistory.length" description="暂无邀请码记录"/>
              <div v-else class="invite-history-list">
                <div v-for="item in inviteHistory" :key="item.code" class="invite-history-row">
                  <code class="ih-code">{{ item.code }}</code>
                  <n-tag :bordered="false" :type="inviteStatusType(item.status)" round size="small">
                    {{ inviteStatusLabel(item.status) }}
                  </n-tag>
                  <span class="ih-meta">生成：{{ item.createdBy }} · {{ formatTime(item.createdAt) }}</span>
                  <span v-if="item.usedBy" class="ih-meta">
                    已注册：{{ item.usedBy }} · {{ formatTime(item.usedAt) }}
                  </span>
                </div>
              </div>
            </div>
          </n-card>

          <n-card :bordered="false" class="entry-card" hoverable>
            <div class="entry-head">
              <span class="eyebrow">Assign</span>
              <h2>项目分配</h2>
            </div>
            <p class="entry-desc">把项目分配给项目管理（每个项目管理名下上限 10 个），或收回为未分配。</p>
            <n-space :size="10" align="center" wrap>
              <n-select
                  v-model:value="assignProjectId"
                  :options="assignProjectOptions"
                  class="assign-select"
                  filterable
                  placeholder="选择项目"
              />
              <n-select
                  v-model:value="assignManagerId"
                  :options="assignManagerOptions"
                  class="assign-select"
                  filterable
                  placeholder="选择项目管理"
              />
              <n-button :disabled="assignProjectId == null" :loading="assigning" type="primary" @click="handleAssign">
                {{ assignManagerId == null ? "收回" : "分配" }}
              </n-button>
            </n-space>
          </n-card>
        </div>

        <div class="entry-grid">
          <n-card :bordered="false" class="entry-card" hoverable>
            <div class="entry-head">
              <span class="eyebrow">Projects</span>
              <h2>项目管理</h2>
            </div>
            <p class="entry-desc">
              {{
                isSuperAdmin ? "审核、批量改状态、分配项目，进入单个项目维护。" : "管理名下项目：审核加入申请、发布动态、审核评论。"
              }}
            </p>
            <n-button size="large" type="primary" @click="navigateTo('/admin/manage/projects')">进入项目管理</n-button>
          </n-card>

          <n-card v-if="isSuperAdmin" :bordered="false" class="entry-card" hoverable>
            <div class="entry-head">
              <span class="eyebrow">Ideas</span>
              <h2>想法管理</h2>
            </div>
            <p class="entry-desc">审核想法墙投稿、批量改状态、编辑或删除单个想法。</p>
            <n-button size="large" type="primary" @click="navigateTo('/admin/manage/ideas')">进入想法管理</n-button>
          </n-card>
        </div>

        <p v-if="!isSuperAdmin" class="scope-hint">
          项目管理仅能管理分配给自己的项目；如需管理全部项目或想法，请联系总管理。
        </p>
      </template>

      <n-empty v-else class="empty-state" description="尚未登录管理员账号">
        <template #extra>
          <p class="empty-subtext">管理员会话仅在当前标签页有效，关闭或刷新过久会失效。</p>
          <n-button type="primary" @click="navigateTo('/admin')">前往登录</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {AdminSession} from "~/composables/useAdminAuth";
import type {InviteHistoryItem, ManagerSummary, Project} from "~/types/projectHub";

definePageMeta({
  layout: false,
});

const message = useMessage();
const {themeOverrides} = useMinecraftTheme();
const {read, clear, write} = useAdminAuth();
const {
  adminLogout,
  adminMe,
  generateInviteCode,
  listInviteCodes,
  listProjectsAdmin,
  listManagers,
  assignProjectOwner
} = useProjectHubApi();

const loading = ref(true);
const session = ref<AdminSession | null>(null);

const isSuperAdmin = computed(() => session.value?.role === "SUPER_ADMIN");

// 恢复会话后立刻拉一次 /auth/me 同步角色：登录时可能取角色失败 / 旧会话缺角色，
// 这里以保证「总管理专属入口」显隐正确（取不到角色按项目管理兜底）。
onMounted(async () => {
  const existing = read();
  session.value = existing;
  if (!existing) {
    loading.value = false;
    navigateTo("/admin");
    return;
  }
  try {
    const me = await adminMe();
    const updated = {...existing, role: me.role};
    session.value = updated;
    write(updated);
  } catch {
    // token 失效等：useHttp 已处理清会话 + 跳转，这里不阻塞渲染
  }
  loading.value = false;
  if (session.value?.role === "SUPER_ADMIN") {
    void loadAssignData();
    void loadInviteHistory();
  }
});

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "未记录时间");

/* ---------- 邀请码 ---------- */
const inviteCode = ref("");
const generatingInvite = ref(false);
const inviteHistory = ref<InviteHistoryItem[]>([]);
const loadingInvites = ref(false);

const inviteStatusLabel = (status?: string) => {
  switch (status) {
    case "UNUSED":
      return "未使用";
    case "USED":
      return "已使用";
    case "EXPIRED":
      return "已过期";
    default:
      return status || "未知";
  }
};

const inviteStatusType = (status?: string): "success" | "warning" | "default" => {
  switch (status) {
    case "UNUSED":
      return "warning";
    case "USED":
      return "success";
    default:
      return "default";
  }
};

const loadInviteHistory = async () => {
  try {
    loadingInvites.value = true;
    inviteHistory.value = await listInviteCodes();
  } catch {
    // 忽略：历史拉取失败不阻塞页面
  } finally {
    loadingInvites.value = false;
  }
};

const handleGenerateInvite = async () => {
  try {
    generatingInvite.value = true;
    inviteCode.value = await generateInviteCode();
    message.success("邀请码已生成，请复制后发给项目管理（仅一次有效）");
    void loadInviteHistory();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "生成邀请码失败");
  } finally {
    generatingInvite.value = false;
  }
};

const copyInvite = async () => {
  if (!inviteCode.value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(inviteCode.value);
    message.success("邀请码已复制");
  } catch {
    message.warning("复制失败，请手动选中复制");
  }
};

/* ---------- 项目分配 ---------- */
const assignProjects = ref<Project[]>([]);
const assignManagers = ref<ManagerSummary[]>([]);
const assignProjectId = ref<string | number | null>(null);
const assignManagerId = ref<string | number | null>(null);
const assigning = ref(false);

const assignProjectOptions = computed(() =>
    assignProjects.value.map((p) => ({label: `#${p.id} ${p.title || "未命名项目"}`, value: p.id})),
);
// 首项「未分配」用于收回项目（ownerId=null）；其余为项目管理账号。
const assignManagerOptions = computed(() => [
  {label: "（未分配）", value: null},
  ...assignManagers.value.map((m) => ({label: `${m.nickname}（${m.username}）`, value: m.id})),
]);

const loadAssignData = async () => {
  try {
    const [projects, managers] = await Promise.all([listProjectsAdmin(), listManagers()]);
    assignProjects.value = projects;
    assignManagers.value = managers;
  } catch {
    // 下拉数据缺失时用户可稍后重试（进入页面时不阻塞）
  }
};

const handleAssign = async () => {
  if (assignProjectId.value == null) {
    message.warning("请先选择要分配的项目");
    return;
  }
  try {
    assigning.value = true;
    await assignProjectOwner(assignProjectId.value, assignManagerId.value);
    message.success(assignManagerId.value == null ? "已收回项目（未分配）" : "项目已分配给所选项目管理");
    assignProjectId.value = null;
    assignManagerId.value = null;
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "分配失败，请稍后再试");
  } finally {
    assigning.value = false;
  }
};

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
.super-grid,
.entry-grid,
.scope-hint,
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
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.08;
  color: #2d2418;
}

.hero-info span {
  display: block;
  margin-top: 9px;
  color: #60462b;
  font-weight: 800;
}

.role-tag {
  margin-left: 6px;
  vertical-align: middle;
}

.hero-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
}

.super-grid,
.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.entry-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.entry-head h2 {
  margin: 0;
  color: #2d2418;
}

.entry-desc {
  margin: 0 0 16px;
  color: #60462b;
  line-height: 1.7;
}

.invite-code {
  max-width: 280px;
  font-family: monospace;
}

.invite-history {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 2px dashed #8b6a3d;
}

.invite-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #5a3a21;
  font-size: 14px;
}

.invite-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.invite-history-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #8b6a3d;
  border-radius: 8px;
  background: #fff8df;
}

.ih-code {
  font-family: monospace;
  font-size: 13px;
  color: #2d2418;
  word-break: break-all;
}

.ih-meta {
  color: #795b36;
  font-size: 12px;
}

.assign-select {
  min-width: 220px;
}

.scope-hint {
  margin-top: 16px;
  padding: 0 6px;
  color: #795b36;
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
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

  .super-grid,
  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
