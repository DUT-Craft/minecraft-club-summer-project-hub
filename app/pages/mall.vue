<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <n-card :bordered="false" class="page-head">
        <div>
          <p>项目广场</p>
          <h1>全部公开项目</h1>
        </div>
        <n-button size="large" type="primary" @click="navigateTo('/submit')">投稿项目</n-button>
      </n-card>

      <section class="filters">
        <n-input
            v-model:value="keyword"
            :placeholder="searchPlaceholder"
            class="filters-keyword"
            clearable
        />
        <ProjectTagCascader
            v-model="tagIds"
            :max-count="20"
            :show-count="false"
            class="filters-tags"
            placeholder="按标签筛选"
        />
        <n-select v-model:value="tagMatch" :options="tagMatchOptions" class="filters-match"/>
        <n-select v-model:value="statusFilter" :options="statusSelectOptions"/>
        <n-select v-model:value="skillFilter" :options="skillSelectOptions"/>
      </section>

      <section v-if="filteredProjects.length" class="project-grid">
        <ProjectHubCard v-for="project in filteredProjects" :key="project.id" :project="project"/>
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

<script lang="ts" setup>
import type {Project} from "~/types/projectHub";


definePageMeta({
  layout: false,
});

// 数据源对应：GET /api/project/object-items（后端 Tag 化改造后强制 PUBLIC_STATUSES，单次请求）
// 后端支持 keyword（命中标题/简介/描述/负责人/标签名）+ tagIds + tagMatch(ANY/ALL) 筛选；
// 关键字与标签筛选走后端，状态 / 技能在前端对返回结果做二次过滤（返回的是全量公开项目，口径一致）。
const {loadPublicProjects} = useProjectHubApi();
const projects = ref<Project[]>([]);
const loading = ref(false);

const keyword = ref("");
const tagIds = ref<Array<number | string>>([]);
const tagMatch = ref<"ANY" | "ALL">("ANY");
const statusFilter = ref("");
const skillFilter = ref("");

// 关键字占位提示用户可搜标签名
const searchPlaceholder = "搜索项目标题、介绍、负责人或标签";

// 标签匹配方式：ANY=满足任一标签即展示；ALL=需同时包含全部选中标签
const tagMatchOptions = [
  {label: "满足任一标签", value: "ANY"},
  {label: "满足全部标签", value: "ALL"},
];

const fetchProjects = async () => {
  loading.value = true;
  try {
    projects.value = await loadPublicProjects({
      keyword: keyword.value,
      tagIds: tagIds.value,
      tagMatch: tagMatch.value,
    });
  } catch {
    projects.value = [];
  } finally {
    loading.value = false;
  }
};

// 关键字 / 标签 / 匹配方式变化 → 约 300ms 防抖后重新查询后端（避免每次按键都请求）
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch([keyword, tagIds, tagMatch], () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    void fetchProjects();
  }, 300);
}, {deep: true});

onMounted(() => {
  void fetchProjects();
});

// 招募技能始终来自 recruitmentNeeds[].skill，不再回退到项目标签
const projectSkills = (project: Project) => {
  const needSkills = project.recruitmentNeeds?.map((item) => item.skill).filter(Boolean) ?? [];
  return [...new Set(needSkills)];
};

const statusOptions = computed(() => [
  ...new Set(projects.value.map((item) => item.status).filter((value): value is string => Boolean(value))),
]);
const skillOptions = computed(() => [...new Set(projects.value.flatMap(projectSkills).filter(Boolean))]);

// n-select 需要 { label, value } 形式的选项；首项 value="" 代表"全部"，与原 <option value=""> 行为一致
const toSelectOptions = (values: string[], allLabel: string) => [
  {label: allLabel, value: ""},
  ...values.map((value) => ({label: value, value})),
];
// 状态下拉展示中文文案，value 仍是英文枚举，与 project.status 过滤匹配口径一致
const statusSelectOptions = computed(() => [
  {label: "全部状态", value: ""},
  ...statusOptions.value.map((value) => ({label: formatProjectStatus(value), value})),
]);
const skillSelectOptions = computed(() => toSelectOptions(skillOptions.value, "全部技能"));

// 关键字与标签已由后端筛选；这里只在前端按状态 / 技能再窄化
const filteredProjects = computed(() => projects.value.filter((project) => {
  const skills = projectSkills(project);
  return (!statusFilter.value || project.status === statusFilter.value)
      && (!skillFilter.value || skills.includes(skillFilter.value));
}));

// Minecraft 暖色主题（草地绿主色 + 羊皮纸卡片 + 木边输入/下拉），见 useMinecraftTheme
const {themeOverrides} = useMinecraftTheme();
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
  grid-template-columns: minmax(220px, 1.4fr) minmax(200px, 1.4fr) repeat(3, minmax(120px, 1fr));
  gap: 10px;
}

/* 让 grid 子项可收缩，避免 Cascader / Select 标签过长撑破列宽 */
.filters > * {
  min-width: 0;
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
