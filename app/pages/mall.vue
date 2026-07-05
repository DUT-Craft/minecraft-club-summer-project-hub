<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <n-card class="page-head" :bordered="false">
        <div>
          <p>项目广场</p>
          <h1>全部公开项目</h1>
        </div>
        <n-button size="large" type="primary" @click="navigateTo('/submit')">投稿项目</n-button>
      </n-card>

      <section class="filters">
        <n-input v-model:value="keyword" placeholder="搜索标题、介绍、类型、状态、负责人或技能" clearable />
        <n-select v-model:value="typeFilter" :options="typeSelectOptions" />
        <n-select v-model:value="statusFilter" :options="statusSelectOptions" />
        <n-select v-model:value="skillFilter" :options="skillSelectOptions" />
      </section>

      <section v-if="filteredProjects.length" class="project-grid">
        <ProjectHubCard v-for="project in filteredProjects" :key="project.id" :project="project" />
      </section>

      <n-empty
        v-else
        class="empty-space"
        description="暂时没有匹配的公开项目"
      >
        <template #extra>
          <n-button type="primary" @click="navigateTo('/submit')">投稿项目</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script setup lang="ts">
import type { Project } from "~/types/projectHub";


definePageMeta({
  layout: false,
});

// 数据源对应 openapi.json：GET /api/project/object-items?status=...
// （接口仅支持单个 status，在 useProjectHubApi 内并行请求 PREPARING / RECRUITING / IN_PROGRESS / PAUSED 四个公开状态后合并）
const { loadPublicProjectCatalog } = useProjectHubApi();
const projects = ref<Project[]>([]);

const keyword = ref("");
const typeFilter = ref("");
const statusFilter = ref("");
const skillFilter = ref("");

onMounted(async () => {
  projects.value = await loadPublicProjectCatalog();
});

const projectSkills = (project: Project) => {
  const needSkills = project.recruitmentNeeds?.map((item) => item.skill).filter(Boolean) ?? [];
  return [...new Set(needSkills.length ? needSkills : project.skills ?? [])];
};

const typeOptions = computed(() => [...new Set(projects.value.map((item) => item.type).filter(Boolean))]);
const statusOptions = computed(() => [
  ...new Set(projects.value.map((item) => item.status).filter((value): value is string => Boolean(value))),
]);
const skillOptions = computed(() => [...new Set(projects.value.flatMap(projectSkills).filter(Boolean))]);

// n-select 需要 { label, value } 形式的选项；首项 value="" 代表"全部"，与原 <option value=""> 行为一致
const toSelectOptions = (values: string[], allLabel: string) => [
  { label: allLabel, value: "" },
  ...values.map((value) => ({ label: value, value })),
];
const typeSelectOptions = computed(() => toSelectOptions(typeOptions.value, "全部类型"));
const statusSelectOptions = computed(() => toSelectOptions(statusOptions.value, "全部状态"));
const skillSelectOptions = computed(() => toSelectOptions(skillOptions.value, "全部技能"));

const filteredProjects = computed(() => {
  const key = keyword.value.trim().toLowerCase();
  return projects.value.filter((project) => {
    const skills = projectSkills(project);
    const haystack = [
      project.title,
      project.description,
      project.summary,
      project.type,
      project.status,
      project.ownerName,
      ...skills,
    ].join(" ").toLowerCase();

    return (!key || haystack.includes(key))
      && (!typeFilter.value || project.type === typeFilter.value)
      && (!statusFilter.value || project.status === statusFilter.value)
      && (!skillFilter.value || skills.includes(skillFilter.value));
  });
});

// Minecraft 暖色主题（草地绿主色 + 羊皮纸卡片 + 木边输入/下拉），见 useMinecraftTheme
const { themeOverrides } = useMinecraftTheme();
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
.filters,
.project-grid,
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
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 22px;
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

.filters {
  display: grid;
  grid-template-columns: minmax(230px, 1fr) repeat(3, minmax(130px, 180px));
  gap: 10px;
}

/* n-input / n-select 对齐原 input/select 的 44px 最小高度 */
.filters :deep(.n-input),
.filters :deep(.n-base-selection) {
  min-height: 44px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 16px;
}

@media (width <= 760px) {
  .page-head :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
