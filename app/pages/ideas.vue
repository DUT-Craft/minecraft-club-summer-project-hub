<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <section class="page-head">
      <div>
        <p>Idea Wall</p>
        <h1>想法墙</h1>
      </div>
      <NuxtLink to="/submit#idea">提交想法</NuxtLink>
    </section>

    <section v-if="ideas.length" class="idea-grid">
      <article v-for="idea in ideas" :key="idea.id" class="idea-card">
        <span>{{ formatDate(idea.createdAt) }}</span>
        <h2>{{ idea.title }}</h2>
        <p>{{ idea.content }}</p>
        <strong>{{ idea.nickname || "匿名同学" }} <small v-if="idea.minecraftId">/ {{ idea.minecraftId }}</small></strong>
      </article>
    </section>

    <MinecraftEmptyState
      v-else
      class="empty-space"
      title="想法墙还没有公开内容"
    >
      <NuxtLink class="inline-action" to="/submit#idea">提交想法</NuxtLink>
    </MinecraftEmptyState>
  </main>
</template>

<script setup lang="ts">
import type { DataSnapshot } from "~/types/projectHub";

definePageMeta({
  layout: false,
});

const { loadSnapshot } = useProjectHubApi();
const snapshot = ref<DataSnapshot>({
  projects: [],
  ideas: [],
  projectUpdates: [],
  projectComments: [],
});

onMounted(async () => {
  snapshot.value = await loadSnapshot();
});

const ideas = computed(() => snapshot.value.ideas
  .filter((item) => item.reviewStatus === "approved")
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));

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

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 22px;
  border: 2px solid #5a3a21;
  border-radius: 10px;
  background: rgba(255, 245, 207, 0.93);
  box-shadow: 0 6px 0 #5a3a21;
}

.page-head p,
.page-head h1 {
  margin: 0;
}

.page-head p {
  color: #6b8f32;
  font-weight: 900;
}

.page-head h1 {
  font-size: clamp(32px, 4vw, 52px);
}

.page-head a,
.inline-action {
  padding: 10px 14px;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  background: #65a844;
  color: #fffbe4;
  text-decoration: none;
  font-weight: 900;
  box-shadow: 0 4px 0 #5a3a21;
}

.inline-action {
  display: inline-flex;
  margin-top: 12px;
}

.idea-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.idea-card {
  padding: 18px;
  border: 2px solid #5a3a21;
  border-radius: 10px;
  background: #fff5cf;
  box-shadow: 0 6px 0 #5a3a21;
}

.idea-card span {
  color: #6b8f32;
  font-size: 13px;
  font-weight: 900;
}

.idea-card h2 {
  margin: 8px 0 10px;
  font-size: 22px;
}

.idea-card p {
  margin: 0;
  color: #60462b;
  line-height: 1.75;
  white-space: pre-wrap;
}

.idea-card strong {
  display: block;
  margin-top: 16px;
}

.idea-card small {
  color: #795b36;
}

@media (width <= 680px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
