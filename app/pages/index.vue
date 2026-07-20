<template>
  <main class="hub-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <section class="grid-paper">
        <div class="wide-shell hero-shell">
          <section class="hero-copy">
            <n-tag :bordered="false" class="hero-chip" type="info">
              暑假共创 / 审核后公开展示
            </n-tag>

            <h1>Minecraft 暑假共创项目站</h1>
            <p class="lead">
              集中展示社团项目、收集玩法灵感、处理加入申请。公开内容由管理员审核后展示。
            </p>

            <div :aria-label="hotTags.length ? '公开项目标签' : '站点入口'" class="tag-row">
              <n-tag
                  v-for="tag in heroTags"
                  :key="tag"
                  size="small"
                  type="success"
              >
                {{ tag }}
              </n-tag>
            </div>

            <div class="actions">
              <n-button
                  v-for="action in heroActions"
                  :key="action.to"
                  :type="action.primary ? 'primary' : 'default'"
                  size="large"
                  @click="navigateTo(action.to)"
              >
                {{ action.label }}
              </n-button>
            </div>

            <div class="stats-grid">
              <n-card v-for="stat in stats" :key="stat.label" class="stat" size="small">
                <n-statistic :label="stat.label" :value="stat.value"/>
              </n-card>
            </div>
          </section>

          <section class="hero-art-wrap">
            <figure class="hero-art">
              <n-image
                  alt="像素方块风格的猫娘社成员在空岛基地整理项目计划"
                  class="hero-image"
                  preview-disabled
                  src="/assets/catgirl-concepts/catgirl-sky-island.png"
              />
              <figcaption>
                空岛基地已开工 · 暑假共创招募中
              </figcaption>
            </figure>

            <div class="mini-grid">
              <n-card class="mini-card" size="small">
                <strong>真实公开数据</strong>
                <span>{{ projectCountHint }}</span>
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
              <n-card :content-style="'padding: 0;'" class="portal-card" size="small">
                <span class="portal-image">
                  <n-image :alt="entry.title" :src="entry.image" preview-disabled/>
                  <n-tag class="portal-kicker" size="small" type="warning">{{ entry.kicker }}</n-tag>
                </span>
                <span class="portal-body">
                  <span class="portal-head">
                    <strong>{{ entry.title }}</strong>
                    <n-tag class="portal-icon" round size="small">
                      {{ entry.action }}
                    </n-tag>
                  </span>
                  <span class="portal-text">{{ entry.text }}</span>
                  <n-button class="portal-action" text type="primary">{{ entry.action }}</n-button>
                </span>
              </n-card>
            </NuxtLink>
          </section>

          <section class="future-panel">
            <n-image
                alt="像素方块风格的猫娘社成员在洞穴中探索矿物和新路线"
                class="future-image"
                preview-disabled
                src="/assets/catgirl-concepts/catgirl-cave-adventure.png"
            />
            <div class="future-overlay"/>
            <div class="future-copy">
              <n-tag class="future-chip" size="small" type="warning">
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

        <div class="grass-strip"/>
      </section>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>

import type {Project} from "~/types/projectHub";

definePageMeta({
  layout: false,
});

// Minecraft 暖色主题（草地绿主色 + 羊皮纸卡片 + 木边输入），见 useMinecraftTheme。
// app.vue 是全局暗色主题，这里用局部 n-config-provider 切回浅色，与 mall / submit 等页一致。
const {themeOverrides} = useMinecraftTheme();

// 数据源对应 openapi.json：
// - 公开项目列表：GET /api/project/object-items（后端 Tag 化后强制 PUBLIC_STATUSES，单次请求返回全部公开项目，
//   用于汇总标签 / 招募岗位 / 公开项目总数，口径与项目广场 mall 页完全一致）
// - 公开想法总数：GET /api/project/minds/count/approved
// - openapi 没有评论 / 建议接口，原"公开建议"统计改为"招募岗位"（needMembers.number 合计）
// ⚠️ 公开项目总数直接取列表 .length，不再走 /count/in-progress（只数 IN_PROGRESS 会漏掉刚审核通过的项目）
const {loadPublicProjectCatalog, loadApprovedIdeaCount} = useProjectHubApi();
const message = useMessage();

// 接口层已按状态过滤，这里保存的就是可直接公开展示的数据
const publicProjects = ref<Project[]>([]);
// 公开想法总数仍走专用 count 接口；公开项目总数 = publicProjects.length，与项目广场同源
const approvedIdeaCount = ref(0);

// 首页入口按钮：label 与路由集中维护，避免模板里散落多个 navigateTo
const heroActions = [
  {label: "浏览项目", to: "/mall", primary: true},
  {label: "投稿项目", to: "/submit", primary: true},
  {label: "提交想法", to: "/submit", primary: false},
  {label: "查看想法", to: "/ideas", primary: false},
];

const portalEntries = [
  {
    to: "/mall",
    image: "/assets/catgirl-concepts/catgirl-farm-base.png",
    kicker: "全部公开项目",
    title: "浏览正在招人的项目",
    text: "看项目介绍、招工需求、动态和公开评论，找到合适的项目后直接申请加入。",
    action: "进入项目列表",
  },
  {
    to: "/submit",
    image: "/assets/catgirl-concepts/catgirl-survival-plaza.png",
    kicker: "项目投稿",
    title: "把你的暑假计划挂出来",
    text: "把项目标题、介绍和招工需求写清楚，管理员审核通过后就会公开展示。",
    action: "提交项目草案",
  },
  {
    to: "/ideas",
    image: "/assets/catgirl-concepts/catgirl-campfire-planning.png",
    kicker: "灵感收集",
    title: "围着营火讨论新玩法",
    text: "还没形成项目也没关系，先把玩法点子放到想法墙，等人一起完善。",
    action: "查看想法墙",
  },
];

onMounted(async () => {
  const [projectsResult, ideaCountResult] = await Promise.allSettled([
    loadPublicProjectCatalog(),
    loadApprovedIdeaCount(),
  ]);

  if (projectsResult.status === "fulfilled") {
    publicProjects.value = projectsResult.value;
  } else {
    message.error(
        projectsResult.reason instanceof Error && projectsResult.reason.message
            ? projectsResult.reason.message
            : "加载公开项目失败，请稍后重试",
    );
  }
  if (ideaCountResult.status === "fulfilled") {
    approvedIdeaCount.value = ideaCountResult.value;
  }
});

// 招募岗位 = 所有公开项目 recruitmentNeeds.count 之和（由 needMembers.number 映射）
const openPositions = computed(() =>
    publicProjects.value
        .flatMap((project) => project.recruitmentNeeds ?? [])
        .reduce((total, need) => total + (need.count || 0), 0),
);

// 汇总项目标签（project.tags[].name），按 normalized 名称去重统计，取出现次数最多的 4 个
const hotTags = computed(() => buildHotTags(publicProjects.value));
const heroTags = computed(() =>
    hotTags.value.length ? hotTags.value : ["项目投稿", "想法收集", "制作中项目", "招募岗位"],
);

const projectCountHint = computed(() =>
    publicProjects.value.length
        ? `已有 ${publicProjects.value.length} 个项目通过审核`
        : "暂无公开项目，投稿后会先进入后台审核",
);

// 顶部三张统计卡：标签与取值放在一起，模板直接 v-for 渲染
const stats = computed(() => [
  {label: "公开项目", value: publicProjects.value.length},
  {label: "公开想法", value: approvedIdeaCount.value},
  {label: "招募岗位", value: openPositions.value},
]);

function buildHotTags(projects: Project[]) {
  // 按标签名 trim + 忽略大小写归并（后端 normalizedName 唯一，这里同口径避免大小写重复计数）
  const counts = new Map<string, { name: string; count: number }>();
  for (const project of projects) {
    for (const tag of project.tags ?? []) {
      const key = (tag.name ?? "").trim().toLowerCase();
      if (!key) {
        continue;
      }
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, {name: tag.name || String(tag.id), count: 1});
      }
    }
  }

  return Array.from(counts.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"))
      .map((info) => info.name)
      .slice(0, 4);
}
</script>

<style scoped>
/* 与 mall / submit / ideas 等页一致的浅色网格底：蓝白格子 + 暖色光晕 */
.hub-page {
  min-height: 100dvh;
  padding-bottom: 24px;
  color: #4f3924;
  background: radial-gradient(circle at 80% 8%, rgba(255, 215, 101, 0.44), transparent 21%),
  linear-gradient(rgba(97, 153, 202, 0.17) 1px, transparent 1px),
  linear-gradient(90deg, rgba(97, 153, 202, 0.17) 1px, transparent 1px),
  #dff0ff;
  background-size: auto, 26px 26px, 26px 26px, auto;
}

.grid-paper {
  position: relative;
  overflow: hidden;
}

/* 站点头部默认 1180px，首页内容区是 1360px，这里把头部拉到与 .wide-shell 同宽对齐 */
:deep(.mc-header) {
  width: min(1360px, calc(100% - 32px));
}

/* 统一给 Naive UI 卡片加上木边 + 偏移阴影，和 mall / submit 等页保持同一套卡片语言 */
:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 4px 0 rgba(90, 58, 33, 0.45);
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
  color: #2d2418;
  font-size: clamp(48px, 5.9vw, 86px);
  font-weight: 900;
  line-height: 0.96;
  letter-spacing: 0;
}

.lead {
  max-width: 590px;
  margin: 20px 0 0;
  color: #60462b;
  font-size: clamp(16px, 1.35vw, 19px);
  font-weight: 500;
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
  border: 2px solid #5a3a21;
  border-radius: 10px;
  background: #fff8df;
  box-shadow: 0 6px 0 rgba(90, 58, 33, 0.5);
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
  border: 2px solid #5a3a21;
  border-radius: 8px;
  background: rgba(255, 248, 223, 0.94);
  backdrop-filter: blur(8px);
  padding: 9px 12px;
  color: #4f3924;
  font-size: 14px;
  font-weight: 800;
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.mini-card strong {
  display: block;
  color: #2d2418;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.3;
}

.mini-card span {
  display: block;
  margin-top: 6px;
  color: #795b36;
  font-size: 12px;
  font-weight: 500;
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
  color: #4f3924;
  text-decoration: none;
}

.portal-card {
  display: grid;
  overflow: hidden;
  color: #4f3924;
  text-decoration: none;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.portal-card-link:hover .portal-card {
  transform: translateY(-4px);
  box-shadow: 0 8px 0 rgba(90, 58, 33, 0.5);
}

.portal-image {
  position: relative;
  display: block;
  height: clamp(160px, 16vw, 260px);
  overflow: hidden;
  background: #fff8df;
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
  color: #2d2418;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.25;
}

.portal-icon {
  flex: 0 0 auto;
}

.portal-text {
  min-height: 56px;
  color: #795b36;
  font-size: 14px;
  font-weight: 500;
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
  content: "→";
}

.future-panel {
  position: relative;
  min-height: 320px;
  overflow: hidden;
  margin-top: 20px;
  border: 2px solid #5a3a21;
  border-radius: 10px;
  background: #fff8df;
  box-shadow: 0 6px 0 rgba(90, 58, 33, 0.5);
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

/* 浅色版遮罩：左侧羊皮纸实底托住深色文字，右侧渐隐露出底图 */
.future-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 248, 223, 0.96), rgba(255, 248, 223, 0.74) 48%, rgba(255, 248, 223, 0.12));
}

.future-copy {
  position: relative;
  max-width: 640px;
  padding: 28px;
  color: #4f3924;
}

.future-chip {
  margin: 0 0 14px;
}

.future-copy h2 {
  margin: 0;
  color: #2d2418;
  font-size: clamp(28px, 3vw, 45px);
  font-weight: 900;
  line-height: 1.12;
}

.future-copy p {
  max-width: 560px;
  margin: 14px 0 0;
  color: #60462b;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.75;
}

.future-button {
  margin-top: 18px;
}

/* 底部草地块，呼应 Minecraft 草方块顶面 */
.grass-strip {
  height: 14px;
  margin-top: 8px;
  border-top: 2px solid #2d2418;
  border-bottom: 2px solid #2d2418;
  background: linear-gradient(#76b850, #54903a);
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
