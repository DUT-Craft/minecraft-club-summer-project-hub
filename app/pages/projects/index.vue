<template>
  <main class="hub-page">
    <MinecraftHomeHeader />

    <section class="grid-paper">
      <div class="wide-shell hero-shell">
        <section class="hero-copy">
          <n-tag :bordered="false" class="voxel-chip hero-chip">
            <span class="chip-dot" aria-hidden="true" />
            暑假共创 / 审核后公开展示
          </n-tag>

          <h1>Minecraft 暑假共创项目站</h1>
          <p class="lead">
            集中展示社团项目、收集玩法灵感、处理加入申请。公开内容由管理员审核后展示。
          </p>

          <div class="tag-row" :aria-label="hotTags.length ? '公开项目标签' : '站点入口'">
            <n-tag
              v-for="tag in heroTags"
              :key="tag"
              :bordered="false"
              class="minecraft-badge"
            >
              {{ tag }}
            </n-tag>
          </div>

          <div class="actions">
            <n-button class="icon-button action-green" @click="navigateTo('/projects/groud')">
              <span class="button-icon search" aria-hidden="true" />
              浏览项目
            </n-button>
            <n-button class="icon-button action-green" @click="navigateTo('/submit')">
              <span class="button-icon clipboard" aria-hidden="true" />
              投稿项目
            </n-button>
            <n-button class="icon-button action-cream" @click="navigateTo('/submit#idea')">
              <span class="button-icon message" aria-hidden="true" />
              提交想法
            </n-button>
            <n-button class="icon-button action-cream" @click="navigateTo('/ideas')">
              <span class="button-icon light" aria-hidden="true" />
              查看想法
            </n-button>
          </div>

          <div class="stats-grid">
            <n-card :bordered="false" class="stat item-slot" content-style="padding: 14px;">
              <n-statistic label="公开项目" :value="approvedProjects.length" />
            </n-card>
            <n-card :bordered="false" class="stat item-slot" content-style="padding: 14px;">
              <n-statistic label="公开想法" :value="approvedIdeas.length" />
            </n-card>
            <n-card :bordered="false" class="stat item-slot" content-style="padding: 14px;">
              <n-statistic label="公开建议" :value="approvedComments.length" />
            </n-card>
          </div>
        </section>

        <section class="hero-art-wrap">
          <figure class="hero-art">
            <n-image
              preview-disabled
              class="hero-image"
              src="/assets/catgirl-concepts/catgirl-sky-island.png"
              alt="像素方块风格的猫娘社成员在空岛基地整理项目计划"
            />
            <figcaption>
              空岛基地已开工 · 暑假共创招募中
              <span class="redstone-dot" aria-hidden="true" />
            </figcaption>
          </figure>

          <div class="mini-grid">
            <n-card :bordered="false" class="mini-card item-slot" content-style="padding: 12px;">
              <strong>真实公开数据</strong>
              <span>{{ approvedProjects.length ? `已有 ${approvedProjects.length} 个项目通过审核` : "暂无公开项目，投稿后会先进入后台审核" }}</span>
            </n-card>
            <n-card :bordered="false" class="mini-card item-slot" content-style="padding: 12px;">
              <strong>审核说明</strong>
              <span>投稿会先进入后台，公开页面只展示通过审核的项目和想法</span>
            </n-card>
          </div>
        </section>
      </div>

      <div class="wide-shell portal-section">
        <section class="portal-grid">
          <NuxtLink
            v-for="entry in portalEntries"
            :key="entry.to"
            :to="entry.to"
            class="portal-card-link"
          >
            <n-card :bordered="false" class="portal-card item-slot" content-style="padding: 0;">
              <span class="portal-image">
                <n-image preview-disabled :src="entry.image" :alt="entry.title" />
                <n-tag :bordered="false" class="portal-kicker">{{ entry.kicker }}</n-tag>
              </span>
              <span class="portal-body">
                <span class="portal-head">
                  <strong>{{ entry.title }}</strong>
                  <n-tag :bordered="false" class="portal-icon" aria-hidden="true">
                    <span :class="entry.icon" />
                  </n-tag>
                </span>
                <span class="portal-text">{{ entry.text }}</span>
                <n-button text type="primary" class="portal-action">{{ entry.action }}</n-button>
              </span>
            </n-card>
          </NuxtLink>
        </section>

        <section class="future-panel">
          <n-image
            preview-disabled
            class="future-image"
            src="/assets/catgirl-concepts/catgirl-cave-adventure.png"
            alt="像素方块风格的猫娘社成员在洞穴中探索矿物和新路线"
          />
          <div class="future-overlay" />
          <div class="future-copy">
            <n-tag :bordered="false" class="voxel-chip future-chip">
              <span class="button-icon compass" aria-hidden="true" />
              下一步扩展
            </n-tag>
            <h2>后续可以把每周活动、长期组队和服务器玩法继续接进来</h2>
            <p>
              首页先保持入口清楚：看项目、交项目、看想法。等服务器主站功能确定后，可以继续把活动置顶、长期玩法和在线状态做成同一套方块面板。
            </p>
            <n-button class="icon-button future-button" @click="navigateTo('/submit#idea')">
              <span class="button-icon message" aria-hidden="true" />
              先提交一个点子
            </n-button>
          </div>
        </section>
      </div>

      <div class="grass-strip" />
    </section>
  </main>
</template>

<script setup lang="ts">
import type { DataSnapshot, Project } from "~/types/projectHub";

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

const portalEntries = [
  {
    to: "/projects/groud",
    image: "/assets/catgirl-concepts/catgirl-farm-base.png",
    kicker: "全部公开项目",
    title: "浏览正在招人的项目",
    text: "看项目介绍、招工需求、动态和公开评论，找到合适的项目后直接申请加入。",
    action: "进入项目列表",
    icon: "icon-blocks",
  },
  {
    to: "/submit",
    image: "/assets/catgirl-concepts/catgirl-survival-plaza.png",
    kicker: "项目投稿",
    title: "把你的暑假计划挂出来",
    text: "把项目标题、介绍和招工需求写清楚，管理员审核通过后就会公开展示。",
    action: "提交项目草案",
    icon: "icon-note",
  },
  {
    to: "/ideas",
    image: "/assets/catgirl-concepts/catgirl-campfire-planning.png",
    kicker: "灵感收集",
    title: "围着营火讨论新玩法",
    text: "还没形成项目也没关系，先把玩法点子放到想法墙，等人一起完善。",
    action: "查看想法墙",
    icon: "icon-light",
  },
];

onMounted(async () => {
  snapshot.value = await loadSnapshot();
});

const approvedProjects = computed(() => snapshot.value.projects.filter((item) => item.reviewStatus === "approved"));
const approvedIdeas = computed(() => snapshot.value.ideas.filter((item) => item.reviewStatus === "approved"));
const approvedComments = computed(() =>
  snapshot.value.projectComments.filter((item) => (item.reviewStatus ?? "approved") === "approved"),
);

const hotTags = computed(() => buildHotTags(approvedProjects.value));
const heroTags = computed(() =>
  hotTags.value.length ? hotTags.value : ["项目投稿", "想法收集", "申请加入", "公开评论"],
);

function buildHotTags(projects: Project[]) {
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const tag of [project.type, ...(project.skills ?? [])]) {
      const key = tag.trim();
      if (key) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .map(([tag]) => tag)
    .slice(0, 4);
}
</script>

<style scoped>
.hub-page {
  min-height: 100dvh;
  color: #20301f;
}

.grid-paper {
  position: relative;
  overflow: hidden;
  border-bottom: 2px solid rgba(56, 38, 23, 0.25);
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 228, 128, 0.36), transparent 21rem),
    radial-gradient(circle at 78% 18%, rgba(131, 213, 255, 0.34), transparent 26rem),
    linear-gradient(rgba(255, 255, 255, 0.42) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.38) 1px, transparent 1px),
    #eff9ff;
  background-size: auto, auto, 22px 22px, 22px 22px, auto;
}

.wide-shell {
  width: min(1360px, calc(100% - 32px));
  margin-inline: auto;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
  align-items: center;
  gap: 40px;
  min-height: 520px;
  padding-block: 32px 28px;
}

.hero-copy {
  max-width: 620px;
  padding-block: 16px;
}

.voxel-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 2px solid #382617;
  border-radius: 8px;
  background: #fff3bc;
  box-shadow: 4px 4px 0 rgba(56, 38, 23, 0.16);
  color: #5b431d;
  font-weight: 950;
}

.hero-chip {
  margin-bottom: 20px;
  padding: 7px 10px;
  font-size: 13px;
}

.chip-dot {
  width: 12px;
  height: 12px;
  display: inline-block;
  border: 2px solid #382617;
  background: #83d5ff;
  transform: rotate(45deg);
}

h1 {
  max-width: 9.6em;
  margin: 0;
  color: #173318;
  font-size: clamp(48px, 5.9vw, 86px);
  font-weight: 950;
  line-height: 0.96;
  letter-spacing: 0;
}

.lead {
  max-width: 590px;
  margin: 20px 0 0;
  color: #40563a;
  font-size: clamp(16px, 1.35vw, 19px);
  font-weight: 800;
  line-height: 1.72;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 560px;
  margin-top: 16px;
}

.minecraft-badge {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  border: 2px solid rgba(56, 38, 23, 0.42);
  border-radius: 7px;
  background: #e9ffd4;
  padding: 4px 9px;
  color: #35682b;
  font-size: 12px;
  font-weight: 950;
}

.minecraft-badge :deep(.n-tag__content) {
  font-weight: 950;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.icon-button {
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 2px solid #382617;
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 950;
  text-decoration: none;
  box-shadow: 6px 6px 0 rgba(56, 38, 23, 0.22);
  --n-border: 2px solid #382617 !important;
  --n-border-hover: 2px solid #382617 !important;
  --n-border-pressed: 2px solid #382617 !important;
  --n-border-focus: 2px solid #382617 !important;
  --n-ripple-color: transparent !important;
  --n-text-color: #20301f !important;
  --n-text-color-hover: #20301f !important;
  --n-text-color-pressed: #20301f !important;
  --n-text-color-focus: #20301f !important;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

.icon-button :deep(.n-button__content) {
  gap: 9px;
  font-weight: 950;
}

.icon-button:hover {
  transform: translate(-1px, -1px);
  box-shadow: 8px 8px 0 rgba(56, 38, 23, 0.18);
}

.action-green {
  background: linear-gradient(180deg, #93d65a, #55a63a);
  color: #173318;
  --n-color: linear-gradient(180deg, #93d65a, #55a63a) !important;
  --n-color-hover: linear-gradient(180deg, #9ade68, #60ad42) !important;
  --n-color-pressed: linear-gradient(180deg, #7cbd4e, #4b9434) !important;
}

.action-cream {
  background: linear-gradient(180deg, #fff7d0, #e6c986);
  color: #20301f;
  --n-color: linear-gradient(180deg, #fff7d0, #e6c986) !important;
  --n-color-hover: linear-gradient(180deg, #fff9dc, #efd596) !important;
  --n-color-pressed: linear-gradient(180deg, #f4e7b8, #d9ba76) !important;
}

.button-icon,
.portal-icon span {
  position: relative;
  width: 18px;
  height: 18px;
  display: inline-block;
  flex: 0 0 auto;
}

.button-icon::before,
.button-icon::after,
.portal-icon span::before,
.portal-icon span::after {
  position: absolute;
  content: "";
  box-sizing: border-box;
}

.search::before {
  left: 1px;
  top: 1px;
  width: 11px;
  height: 11px;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.search::after {
  right: 1px;
  bottom: 2px;
  width: 8px;
  height: 2px;
  background: currentColor;
  transform: rotate(45deg);
}

.clipboard::before,
.icon-note::before {
  inset: 2px 3px 1px;
  border: 2px solid currentColor;
  border-radius: 2px;
}

.clipboard::after,
.icon-note::after {
  left: 6px;
  top: 6px;
  width: 7px;
  height: 2px;
  background: currentColor;
  box-shadow: 0 4px 0 currentColor;
}

.message::before {
  inset: 3px 2px 5px;
  border: 2px solid currentColor;
  border-radius: 3px;
}

.message::after {
  left: 5px;
  bottom: 2px;
  width: 6px;
  height: 6px;
  border-left: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

.light::before,
.icon-light::before {
  left: 5px;
  top: 1px;
  width: 9px;
  height: 11px;
  border: 2px solid currentColor;
  border-radius: 999px 999px 7px 7px;
}

.light::after,
.icon-light::after {
  left: 7px;
  bottom: 1px;
  width: 6px;
  height: 4px;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

.compass::before {
  inset: 1px;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.compass::after {
  left: 7px;
  top: 4px;
  width: 4px;
  height: 9px;
  background: currentColor;
  clip-path: polygon(50% 0, 100% 100%, 50% 78%, 0 100%);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 28px;
}

.item-slot {
  position: relative;
  border: 2px solid #382617;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.5), transparent 38%),
    #fff8dc;
  box-shadow: 4px 4px 0 rgba(56, 38, 23, 0.12);
}

.stat {
  min-height: 88px;
  padding: 14px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.5), transparent 38%),
    linear-gradient(135deg, #fff8d6, #ead394);
}

.stat::after {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 14px;
  height: 14px;
  content: "";
  border: 2px solid rgba(56, 38, 23, 0.25);
}

.stat strong {
  display: block;
  color: #173318;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 32px;
  font-weight: 950;
  line-height: 1;
}

.stat span {
  display: block;
  margin-top: 10px;
  color: #5d4b2a;
  font-size: 14px;
  font-weight: 950;
}

.stat :deep(.n-statistic-value__content) {
  color: #173318;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 32px;
  font-weight: 950;
  line-height: 1;
}

.stat :deep(.n-statistic) {
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
}

.stat :deep(.n-statistic__label) {
  margin-top: 10px;
  color: #5d4b2a;
  font-size: 14px;
  font-weight: 950;
}

.hero-art-wrap {
  position: relative;
  justify-self: stretch;
}

.hero-art {
  position: relative;
  overflow: hidden;
  margin: 0;
  border: 2px solid #382617;
  border-radius: 12px;
  background: #bde9ff;
  box-shadow: 12px 12px 0 rgba(56, 38, 23, 0.2);
}

.hero-image,
.hero-image :deep(img) {
  width: 100%;
  aspect-ratio: 16 / 10;
  display: block;
  object-fit: cover;
  object-position: center;
}

.hero-art figcaption {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 2px solid rgba(56, 38, 23, 0.55);
  border-radius: 8px;
  background: rgba(255, 248, 220, 0.92);
  padding: 9px 12px;
  color: #4b321b;
  font-size: 14px;
  font-weight: 950;
  box-shadow: 4px 4px 0 rgba(56, 38, 23, 0.18);
}

.redstone-dot {
  width: 10px;
  height: 10px;
  display: inline-block;
  flex: 0 0 auto;
  border: 2px solid #382617;
  background: #d4472d;
  box-shadow: 0 0 0 3px rgba(212, 71, 45, 0.18);
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.mini-card {
  border-radius: 8px;
  background: #fff8dc;
  padding: 12px;
}

.mini-card strong {
  display: block;
  color: #2f442a;
  font-size: 14px;
  font-weight: 950;
  line-height: 1.3;
}

.mini-card span {
  display: block;
  margin-top: 6px;
  color: #6a5839;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.65;
}

.portal-section {
  padding-bottom: 28px;
}

.portal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.portal-card-link {
  color: #20301f;
  text-decoration: none;
}

.portal-card {
  display: grid;
  overflow: hidden;
  border-radius: 10px;
  background: #fff8dc;
  color: #20301f;
  text-decoration: none;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.portal-card-link:hover .portal-card {
  transform: translateY(-4px);
  box-shadow: 7px 7px 0 rgba(56, 38, 23, 0.18);
}

.portal-image {
  position: relative;
  display: block;
  height: clamp(160px, 16vw, 260px);
  overflow: hidden;
  border-bottom: 2px solid #382617;
  background: #bde9ff;
}

.portal-image :deep(.n-image),
.portal-image :deep(img) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 300ms ease;
}

.portal-card-link:hover .portal-image :deep(img) {
  transform: scale(1.03);
}

.portal-kicker {
  position: absolute;
  left: 12px;
  top: 12px;
  border: 2px solid #382617;
  border-radius: 7px;
  background: rgba(255, 248, 220, 0.92);
  padding: 4px 10px;
  color: #4b321b;
  font-size: 12px;
  font-weight: 950;
  box-shadow: 3px 3px 0 rgba(56, 38, 23, 0.16);
}

.portal-kicker :deep(.n-tag__content) {
  font-weight: 950;
}

.portal-body {
  display: grid;
  gap: 9px;
  padding: 16px;
}

.portal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.portal-head strong {
  color: #173318;
  font-size: 20px;
  font-weight: 950;
  line-height: 1.25;
}

.portal-icon {
  width: 36px;
  height: 36px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border: 2px solid #382617;
  border-radius: 7px;
  background: #e9ffd4;
  color: #35682b;
  box-shadow: 3px 3px 0 rgba(56, 38, 23, 0.15);
}

.portal-icon :deep(.n-tag__content) {
  display: grid;
  place-items: center;
}

.icon-blocks::before {
  left: 1px;
  top: 1px;
  width: 7px;
  height: 7px;
  border: 2px solid currentColor;
}

.icon-blocks::after {
  right: 1px;
  bottom: 1px;
  width: 7px;
  height: 7px;
  border: 2px solid currentColor;
  box-shadow: -8px 0 0 -2px #e9ffd4, -8px 0 0 0 currentColor;
}

.portal-text {
  min-height: 56px;
  color: #52604e;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.75;
}

.portal-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  margin-top: 4px;
  color: #35682b;
  font-size: 14px;
  font-weight: 950;
  --n-text-color: #35682b !important;
  --n-text-color-hover: #35682b !important;
  --n-text-color-pressed: #2c5624 !important;
  --n-ripple-color: transparent !important;
}

.portal-action::after {
  content: "->";
}

.portal-action :deep(.n-button__content) {
  font-size: 14px;
  font-weight: 950;
}

.future-panel {
  position: relative;
  min-height: 320px;
  overflow: hidden;
  margin-top: 20px;
  border: 2px solid #382617;
  border-radius: 10px;
  background: #173318;
  box-shadow: 8px 8px 0 rgba(56, 38, 23, 0.18);
}

.future-image,
.future-image :deep(img) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 48%;
}

.future-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(23, 51, 24, 0.94), rgba(23, 51, 24, 0.62) 48%, rgba(23, 51, 24, 0.08));
}

.future-copy {
  position: relative;
  max-width: 640px;
  padding: 28px;
  color: #fffdf4;
}

.future-chip {
  margin: 0 0 14px;
  border-color: #fff8dc;
  background: #fff8dc;
  padding: 7px 10px;
  color: #4b321b;
  font-size: 12px;
}

.future-chip :deep(.n-tag__content) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 950;
}

.future-copy h2 {
  margin: 0;
  font-size: clamp(28px, 3vw, 45px);
  font-weight: 950;
  line-height: 1.12;
}

.future-copy p {
  max-width: 560px;
  margin: 14px 0 0;
  color: #fff4c9;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.75;
}

.future-button {
  margin-top: 18px;
  background: #fff7d0;
  color: #20301f;
}

.grass-strip {
  height: 12px;
  border-bottom: 2px solid #382617;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.18) 0 12px, transparent 12px 24px),
    linear-gradient(180deg, #93d65a, #55a63a);
  background-size: 24px 14px, auto;
}

@media (width <= 1020px) {
  .hero-shell {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    max-width: none;
  }

  .portal-grid {
    grid-template-columns: 1fr;
  }

}

@media (width <= 720px) {
  .hero-shell {
    min-height: 0;
    padding-block: 24px;
  }

  h1 {
    font-size: clamp(46px, 14vw, 64px);
  }

  .stats-grid,
  .mini-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .icon-button {
    padding-inline: 12px;
  }

  .future-copy {
    padding: 22px;
  }
}
</style>
