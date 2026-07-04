<template>
  <main class="hub-page">
    <MinecraftHomeHeader />

    <section class="grid-paper">
      <div class="wide-shell hero-shell">
        <section class="hero-copy">
          <n-tag class="hero-chip" type="info" :bordered="false">
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
              type="success"
              size="small"
            >
              {{ tag }}
            </n-tag>
          </div>

          <div class="actions">
            <n-button type="primary" size="large" @click="navigateTo('/projects/groud')">
              浏览项目
            </n-button>
            <n-button type="primary" size="large" @click="navigateTo('/submit')">
              投稿项目
            </n-button>
            <n-button size="large" @click="navigateTo('/submit#idea')">
              提交想法
            </n-button>
            <n-button size="large" @click="navigateTo('/ideas')">
              查看想法
            </n-button>
          </div>

          <div class="stats-grid">
            <n-card class="stat" size="small">
              <n-statistic label="公开项目" :value="approvedProjects.length" />
            </n-card>
            <n-card class="stat" size="small">
              <n-statistic label="公开想法" :value="approvedIdeas.length" />
            </n-card>
            <n-card class="stat" size="small">
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
            </figcaption>
          </figure>

          <div class="mini-grid">
            <n-card class="mini-card" size="small">
              <strong>真实公开数据</strong>
              <span>{{ approvedProjects.length ? `已有 ${approvedProjects.length} 个项目通过审核` : "暂无公开项目，投稿后会先进入后台审核" }}</span>
            </n-card>
            <n-card class="mini-card" size="small">
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
            <n-card class="portal-card" size="small" :content-style="'padding: 0;'">
              <span class="portal-image">
                <n-image preview-disabled :src="entry.image" :alt="entry.title" />
                <n-tag class="portal-kicker" type="warning" size="small">{{ entry.kicker }}</n-tag>
              </span>
              <span class="portal-body">
                <span class="portal-head">
                  <strong>{{ entry.title }}</strong>
                  <n-tag class="portal-icon" size="small" round>
                    {{ entry.action }}
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
            <n-tag class="future-chip" type="warning" size="small">
              下一步扩展
            </n-tag>
            <h2>后续可以把每周活动、长期组队和服务器玩法继续接进来</h2>
            <p>
              首页先保持入口清楚：看项目、交项目、看想法。等服务器主站功能确定后，可以继续把活动置顶、长期玩法和在线状态做成同一套方块面板。
            </p>
            <n-button class="future-button" size="large" @click="navigateTo('/submit#idea')">
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
  color: rgba(255, 255, 255, 0.82);
  background: #101014;
}

.grid-paper {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(circle at 18% 12%, rgba(64, 128, 255, 0.10), transparent 21rem),
    radial-gradient(circle at 78% 18%, rgba(255, 200, 120, 0.06), transparent 26rem),
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    #101014;
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

.hero-chip {
  margin-bottom: 20px;
}

h1 {
  max-width: 9.6em;
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(48px, 5.9vw, 86px);
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: 0;
}

.lead {
  max-width: 590px;
  margin: 20px 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: clamp(16px, 1.35vw, 19px);
  font-weight: 400;
  line-height: 1.72;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 560px;
  margin-top: 16px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
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

.stat {
  min-height: 88px;
}

.hero-art-wrap {
  position: relative;
  justify-self: stretch;
}

.hero-art {
  position: relative;
  overflow: hidden;
  margin: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: #18181c;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(24, 24, 28, 0.82);
  backdrop-filter: blur(8px);
  padding: 9px 12px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  font-weight: 500;
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.mini-card strong {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.mini-card span {
  display: block;
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
  font-weight: 400;
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
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
}

.portal-card {
  display: grid;
  overflow: hidden;
  background: transparent;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  transition: transform 160ms ease;
}

.portal-card-link:hover .portal-card {
  transform: translateY(-4px);
}

.portal-image {
  position: relative;
  display: block;
  height: clamp(160px, 16vw, 260px);
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #18181c;
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
  color: rgba(255, 255, 255, 0.92);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.25;
}

.portal-icon {
  flex: 0 0 auto;
}

.portal-text {
  min-height: 56px;
  color: rgba(255, 255, 255, 0.52);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.75;
}

.portal-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  margin-top: 4px;
}

.portal-action::after {
  content: "->";
}

.future-panel {
  position: relative;
  min-height: 320px;
  overflow: hidden;
  margin-top: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: #18181c;
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
  background: linear-gradient(90deg, rgba(16, 16, 20, 0.94), rgba(16, 16, 20, 0.62) 48%, rgba(16, 16, 20, 0.08));
}

.future-copy {
  position: relative;
  max-width: 640px;
  padding: 28px;
  color: rgba(255, 255, 255, 0.82);
}

.future-chip {
  margin: 0 0 14px;
}

.future-copy h2 {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: clamp(28px, 3vw, 45px);
  font-weight: 700;
  line-height: 1.12;
}

.future-copy p {
  max-width: 560px;
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.75;
}

.future-button {
  margin-top: 18px;
}

.grass-strip {
  height: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
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

  .future-copy {
    padding: 22px;
  }
}
</style>
