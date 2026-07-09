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
            <p class="eyebrow">Global Admin</p>
            <h1>管理员控制台</h1>
            <span>{{ session.username || "管理员" }} · 登录于 {{ formatTime(session.loginAt) }}</span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/')">返回站点</n-button>
            <n-button size="large" type="primary" @click="handleLogout">退出登录</n-button>
          </div>
        </n-card>

        <div class="entry-grid">
          <n-card class="entry-card" :bordered="false" hoverable>
            <div class="entry-head">
              <span class="eyebrow">Projects</span>
              <h2>项目管理</h2>
            </div>
            <p class="entry-desc">审核、批量改状态、进入单个项目更新信息与状态。</p>
            <n-button type="primary" size="large" @click="navigateTo('/admin/manage/projects')">进入项目管理</n-button>
          </n-card>

          <n-card class="entry-card" :bordered="false" hoverable>
            <div class="entry-head">
              <span class="eyebrow">Ideas</span>
              <h2>想法管理</h2>
            </div>
            <p class="entry-desc">审核想法墙投稿、批量改状态、编辑或删除单个想法。</p>
            <n-button type="primary" size="large" @click="navigateTo('/admin/manage/ideas')">进入想法管理</n-button>
          </n-card>
        </div>
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

<script setup lang="ts">
import type { AdminSession } from "~/composables/useAdminAuth";

definePageMeta({
  layout: false,
});

const message = useMessage();
const { themeOverrides } = useMinecraftTheme();
const { read, clear } = useAdminAuth();

const loading = ref(true);
const session = ref<AdminSession | null>(null);

// 与项目方管理页一致：onMounted（仅客户端）恢复会话，避免 SSR 阶段误判未登录而重定向
onMounted(() => {
  session.value = read();
  loading.value = false;
  if (!session.value) {
    navigateTo("/admin");
  }
});

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "未记录时间");

const handleLogout = () => {
  clear();
  session.value = null;
  message.success("已退出管理员控制台");
  navigateTo("/admin");
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
.entry-grid,
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

.hero-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
}

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

  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
