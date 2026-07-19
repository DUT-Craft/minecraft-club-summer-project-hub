<template>
  <article class="project-card">
    <div class="card-top">
      <span v-for="tag in visibleTags" :key="tag.id" class="chip">{{ tag.name }}</span>
      <span v-if="extraTagCount > 0" class="chip muted">+{{ extraTagCount }}</span>
      <span class="chip muted">{{ formatProjectStatus(project.status) }}</span>
    </div>
    <h3>{{ project.title }}</h3>
    <img
        v-if="project.coverImageUrl"
        :alt="project.title"
        :src="project.coverImageUrl"
        class="cover"
    />
    <p class="desc">{{ intro }}</p>
    <div class="meta">
      <span>负责人：{{ project.ownerName || "未填写" }}</span>
      <span v-if="needCount > 0">招募 {{ needCount }} 人</span>
    </div>
    <div v-if="skills.length" class="skills">
      <span v-for="skill in skills" :key="skill">{{ skill }}</span>
    </div>
    <NuxtLink :to="`/projects/${project.id}`" class="card-link">查看项目</NuxtLink>
  </article>
</template>

<script lang="ts" setup>
import type {Project} from "~/types/projectHub";

const props = defineProps<{
  project: Project;
}>();

const intro = computed(() => {
  const source = props.project.description || props.project.summary || "";
  return source.length > 110 ? `${source.slice(0, 110)}...` : source || "项目发起者还没有补充详细介绍。";
});

// 卡片只展示前 4 个标签，超出部分折叠成 +N；标签为空时仅显示状态 chip
const VISIBLE_TAG_LIMIT = 4;
const visibleTags = computed(() => (props.project.tags ?? []).slice(0, VISIBLE_TAG_LIMIT));
const extraTagCount = computed(() => Math.max((props.project.tags ?? []).length - VISIBLE_TAG_LIMIT, 0));

// 招募技能始终来自 recruitmentNeeds[].skill，不再与项目标签混用
const skills = computed(() => {
  const fromNeeds = props.project.recruitmentNeeds?.map((item) => item.skill).filter(Boolean) ?? [];
  return [...new Set(fromNeeds)].slice(0, 6);
});

const needCount = computed(() => {
  const needs = props.project.recruitmentNeeds ?? [];
  if (needs.length) {
    return needs.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  }

  return Number(props.project.neededMembers) || 0;
});
</script>

<style scoped>
.project-card {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: 2px solid #5a3a21;
  border-radius: 10px;
  background: #fff5cf;
  box-shadow: 0 6px 0 #5a3a21;
}

.card-top,
.meta,
.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip,
.skills span {
  padding: 4px 8px;
  border: 2px solid #5a3a21;
  border-radius: 7px;
  background: #ffdf7e;
  font-size: 12px;
  font-weight: 800;
}

.chip.muted {
  background: #d6ecb7;
}

h3 {
  margin: 0;
  color: #2d2418;
  font-size: 22px;
  line-height: 1.25;
}

.cover {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border: 2px solid #5a3a21;
  border-radius: 8px;
}

.desc {
  margin: 0;
  min-height: 72px;
  color: #5d4328;
  line-height: 1.7;
}

.meta {
  color: #795b36;
  font-size: 13px;
  font-weight: 700;
}

.skills span {
  background: #dff0ff;
}

.card-link {
  width: fit-content;
  padding: 9px 13px;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  background: #65a844;
  color: #fffbe4;
  text-decoration: none;
  font-weight: 900;
  box-shadow: 0 4px 0 #5a3a21;
}
</style>
