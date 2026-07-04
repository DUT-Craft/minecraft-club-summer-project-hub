<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <section class="page-head">
      <div>
        <p>项目广场</p>
        <h1>全部公开项目</h1>
      </div>
      <NuxtLink to="/submit">投稿项目</NuxtLink>
    </section>

    <section class="filters">
      <input v-model="keyword" type="search" placeholder="搜索标题、介绍、类型、状态、负责人或技能" />
      <select v-model="typeFilter">
        <option value="">全部类型</option>
        <option v-for="type in typeOptions" :key="type" :value="type">{{ type }}</option>
      </select>
      <select v-model="statusFilter">
        <option value="">全部状态</option>
        <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
      </select>
      <select v-model="skillFilter">
        <option value="">全部技能</option>
        <option v-for="skill in skillOptions" :key="skill" :value="skill">{{ skill }}</option>
      </select>
    </section>

    <section v-if="filteredProjects.length" class="project-grid">
      <ProjectHubCard v-for="project in filteredProjects" :key="project.id" :project="project" />
    </section>

    <MinecraftEmptyState
      v-else
      class="empty-space"
      title="暂时没有匹配的公开项目"
    >
      <NuxtLink class="inline-action" to="/submit">投稿项目</NuxtLink>
    </MinecraftEmptyState>
  </main>
</template>

<script setup lang="ts">
import type { DataSnapshot, Project } from "app/types/projectHub";

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

const keyword = ref("");
const typeFilter = ref("");
const statusFilter = ref("");
const skillFilter = ref("");

onMounted(async () => {
  snapshot.value = await loadSnapshot();
});

const projects = computed(() => snapshot.value.projects.filter((item) => item.reviewStatus === "approved"));

const projectSkills = (project: Project) => {
  const needSkills = project.recruitmentNeeds?.map((item) => item.skill).filter(Boolean) ?? [];
  return [...new Set(needSkills.length ? needSkills : project.skills ?? [])];
};

const typeOptions = computed(() => [...new Set(projects.value.map((item) => item.type).filter(Boolean))]);
const statusOptions = computed(() => [...new Set(projects.value.map((item) => item.status).filter(Boolean))]);
const skillOptions = computed(() => [...new Set(projects.value.flatMap(projectSkills).filter(Boolean))]);

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

.filters {
  display: grid;
  grid-template-columns: minmax(230px, 1fr) repeat(3, minmax(130px, 180px));
  gap: 10px;
}

input,
select {
  min-height: 44px;
  padding: 0 12px;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  background: #fff8df;
  color: #2d2418;
  font: inherit;
  font-weight: 700;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 16px;
}

@media (width <= 760px) {
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
