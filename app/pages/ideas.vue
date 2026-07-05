<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <n-card class="page-head" :bordered="false">
        <div class="head-info">
          <span class="head-eyebrow">Idea Wall</span>
          <h1>想法墙</h1>
        </div>
        <n-button size="large" type="primary" @click="navigateTo('/submit#idea')">
          提交想法
        </n-button>
      </n-card>

      <div v-if="ideas.length" class="idea-grid">
        <n-card v-for="idea in ideas" :key="idea.id" class="idea-card" :bordered="false">
          <span class="idea-date">{{ formatDate(idea.createdAt) }}</span>
          <h2 class="idea-title">{{ idea.title }}</h2>
          <p class="idea-content">{{ idea.content }}</p>
          <strong class="idea-author">
            {{ idea.nickname || "匿名同学" }}
            <small v-if="idea.minecraftId">/ {{ idea.minecraftId }}</small>
          </strong>
        </n-card>
      </div>

      <n-empty
        v-else
        class="empty-space"
        description="想法墙还没有公开内容"
      >
        <template #extra>
          <n-button type="primary" @click="navigateTo('/submit#idea')">提交想法</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script setup lang="ts">
import type { Idea } from "~/types/projectHub";


definePageMeta({
  layout: false,
});

// 数据源：GET /api/project/minds?status=APPROVED（openapi.json）
// 接口已按 APPROVED 过滤、组合式函数内已按创建时间倒序，页面直接渲染即可。
const { loadPublicIdeas } = useProjectHubApi();
const ideas = ref<Idea[]>([]);

onMounted(async () => {
  ideas.value = await loadPublicIdeas();
});

// Minecraft 暖色主题（草地绿主色 + 羊皮纸卡片），见 useMinecraftTheme
const { themeOverrides } = useMinecraftTheme();

const formatDate = (value: string) => value ? new Date(value).toLocaleDateString("zh-CN") : "未记录日期";
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

.page-head,
.idea-grid,
.empty-space {
  width: min(1180px, calc(100% - 28px));
  margin: 22px auto 0;
}

/* 把 Naive UI 卡片包成 Minecraft 风格的木边面板 */
:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 6px 0 #5a3a21;
}

.page-head :deep(.n-card__content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.head-eyebrow {
  display: block;
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
}

.head-info h1 {
  margin: 6px 0 0;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1.08;
  color: #2d2418;
}

.idea-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.idea-date {
  display: block;
  color: #6b8f32;
  font-size: 13px;
  font-weight: 900;
}

.idea-title {
  margin: 8px 0 10px;
  font-size: 22px;
  color: #2d2418;
}

.idea-content {
  margin: 0;
  color: #60462b;
  line-height: 1.75;
  white-space: pre-wrap;
}

.idea-author {
  display: block;
  margin-top: 16px;
  color: #2d2418;
}

.idea-author small {
  color: #795b36;
}

@media (width <= 680px) {
  .page-head :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
