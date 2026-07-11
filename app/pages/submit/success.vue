<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="record" class="success-shell">
        <n-card :bordered="false" class="success-hero">
          <div aria-hidden="true" class="hero-check">✓</div>
          <div class="hero-text">
            <span class="eyebrow">Submitted</span>
            <h1>项目已提交，等待审核</h1>
            <p class="hero-sub">
              管理员审核通过后，项目会出现在公开列表里。请先记好下面的项目 ID 和管理密码——这是后续登录项目方后台的唯一凭据。
            </p>
          </div>
        </n-card>

        <n-card :bordered="false" class="credentials">
          <template #header>
            <div class="card-head">
              <span class="card-eyebrow">Credentials</span>
              <h2>登录凭据 · 请立刻保存</h2>
            </div>
          </template>

          <div class="credential-list">
            <div class="credential-row">
              <span class="credential-label">项目 ID</span>
              <code class="credential-value">{{ record.project.id || "——" }}</code>
              <n-button
                  :disabled="!record.project.id"
                  size="small"
                  @click="copy(record.project.id)"
              >
                复制
              </n-button>
            </div>
            <div class="credential-row">
              <span class="credential-label">管理密码</span>
              <code class="credential-value password">{{ record.ownerPassword || "——" }}</code>
              <n-button
                  :disabled="!record.ownerPassword"
                  size="small"
                  @click="copy(record.ownerPassword)"
              >
                复制
              </n-button>
            </div>
          </div>

          <n-alert :bordered="false" class="credential-alert" type="warning">
            密码以明文显示这一次，离开本页后会自动清除；后端只保存加密后的密文，无法找回，请现在就抄走。
          </n-alert>

          <n-button size="large" type="primary" @click="navigateTo('/admin')">
            前往项目方后台
          </n-button>
        </n-card>

        <n-card :bordered="false" title="已提交的项目信息">
          <dl class="info-list">
            <div class="info-row">
              <dt>项目标题</dt>
              <dd>{{ record.project.title || "——" }}</dd>
            </div>
            <div class="info-row">
              <dt>项目类型</dt>
              <dd>{{ record.project.type || "——" }}</dd>
            </div>
            <div v-if="record.project.summary" class="info-row">
              <dt>项目简介</dt>
              <dd>{{ record.project.summary }}</dd>
            </div>
            <div class="info-row">
              <dt>负责人</dt>
              <dd>{{ record.project.ownerName || "——" }}</dd>
            </div>
            <div v-if="record.project.ownerMinecraftId" class="info-row">
              <dt>Minecraft ID</dt>
              <dd>{{ record.project.ownerMinecraftId }}</dd>
            </div>
            <div v-if="record.project.publicContact" class="info-row">
              <dt>联系方式</dt>
              <dd>{{ record.project.publicContact }}</dd>
            </div>
            <div class="info-row">
              <dt>审核状态</dt>
              <dd>
                <n-tag :bordered="false" class="status-tag" round size="small">{{ statusLabel }}</n-tag>
              </dd>
            </div>
          </dl>

          <div v-if="record.project.description" class="info-block">
            <strong>项目详细介绍</strong>
            <p class="info-text">{{ record.project.description }}</p>
          </div>

          <div v-if="needs.length" class="info-block">
            <strong>招工需求</strong>
            <div class="need-list">
              <article
                  v-for="need in needs"
                  :key="need.id || need.skill"
                  class="need-card"
              >
                <div class="need-head">
                  <span class="need-skill">{{ need.skill }}</span>
                  <n-tag :bordered="false" class="need-count" round size="small">招 {{ need.count }} 人</n-tag>
                </div>
                <p v-if="need.work" class="need-work">{{ need.work }}</p>
              </article>
            </div>
          </div>
        </n-card>

        <div class="actions">
          <n-button size="large" @click="navigateTo('/submit')">再投一个项目</n-button>
          <n-button size="large" @click="navigateTo('/mall')">浏览公开项目</n-button>
        </div>
      </div>

      <n-empty v-else class="empty-state" description="没有可展示的投稿记录">
        <template #extra>
          <p class="empty-subtext">
            投稿成功后会自动跳到这里并展示项目信息。直接访问本页、或离开后再次进入，记录都会被清除。
          </p>
          <n-button type="primary" @click="navigateTo('/submit')">去投稿</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {ProjectSubmissionRecord} from "~/composables/useLastSubmission";
import type {RecruitmentNeed} from "~/types/projectHub";


definePageMeta({
  layout: false,
});

const message = useMessage();
const {themeOverrides} = useMinecraftTheme();
const {read, clear} = useLastSubmission();

const record = ref<ProjectSubmissionRecord | null>(null);

const needs = computed<RecruitmentNeed[]>(() => record.value?.project.recruitmentNeeds ?? []);

const statusLabel = computed(() => formatProjectStatus(record.value?.project.status));

onMounted(() => {
  // 进入成功页才从存储里读出记录；离开即清除（见 onUnmounted），避免明文密码长期留存
  record.value = read();
});

onUnmounted(() => {
  clear();
});

const copy = async (value?: string) => {
  if (!value) {
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    message.success("已复制到剪贴板");
  } catch {
    message.error("复制失败，请手动选中复制");
  }
};
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

.success-shell {
  width: min(880px, calc(100% - 28px));
  margin: 22px auto 0;
  display: grid;
  gap: 16px;
}

/* Naive UI 卡片统一包成 Minecraft 风格的木边面板 */
:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 6px 0 #5a3a21;
}

/* 成功头部：绿勾 + 标题 */
.success-hero :deep(.n-card__content) {
  display: flex;
  align-items: center;
  gap: 18px;
}

.hero-check {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border: 2px solid #2d2418;
  border-radius: 12px;
  background: #6b8f32;
  color: #fff8df;
  font-size: 34px;
  font-weight: 900;
  box-shadow: 0 4px 0 #2d2418;
}

.hero-text {
  min-width: 0;
}

.eyebrow {
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.12em;
}

.hero-text h1 {
  margin: 4px 0 0;
  font-size: clamp(26px, 3.4vw, 38px);
  color: #2d2418;
}

.hero-sub {
  margin: 8px 0 0;
  color: #60462b;
  font-weight: 500;
  line-height: 1.7;
}

/* 凭据卡：最关键的信息，做成羊皮纸便签 + 等宽大字 */
.card-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-eyebrow {
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.12em;
}

.card-head h2 {
  margin: 0;
  color: #2d2418;
}

.credential-list {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
}

.credential-row {
  display: grid;
  grid-template-columns: minmax(92px, 0.4fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
}

.credential-label {
  color: #795b36;
  font-weight: 800;
  font-size: 14px;
}

.credential-value {
  min-width: 0;
  overflow-x: auto;
  color: #2d2418;
  font-family: "SFMono-Regular", "Consolas", "Courier New", monospace;
  font-size: 18px;
  font-weight: 900;
  white-space: nowrap;
}

.credential-value.password {
  color: #a14a3b;
  letter-spacing: 0.04em;
}

.credential-alert {
  margin-bottom: 16px;
  border: 2px solid #c28e3c !important;
  border-radius: 9px;
  background: #fff3d4;
}

/* 项目信息：自定义 dl 网格，比 n-descriptions 更可控主题 */
.info-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 16px;
}

.info-row {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border: 2px solid #8b6a3d;
  border-radius: 8px;
  background: rgba(255, 248, 223, 0.7);
}

.info-row dt {
  color: #795b36;
  font-weight: 800;
  font-size: 12px;
}

.info-row dd {
  margin: 0;
  color: #2d2418;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
}

.status-tag {
  background: #fff3d4;
  color: #8a5a1c;
  font-weight: 800;
}

.info-block {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.info-block strong {
  color: #2d2418;
  font-weight: 900;
}

.info-text {
  margin: 0;
  padding: 12px 14px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: rgba(255, 248, 223, 0.7);
  color: #4f3924;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 招工需求卡：复用项目详情页的左绿条便签风格 */
.need-list {
  display: grid;
  gap: 10px;
}

.need-card {
  position: relative;
  padding: 12px 14px 12px 18px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
  overflow: hidden;
}

.need-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #6b8f32;
}

.need-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.need-skill {
  font-weight: 900;
  color: #2d2418;
  font-size: 16px;
}

.need-count {
  background: #6b8f32;
  color: #fff8df;
  font-weight: 800;
}

.need-work {
  margin: 0;
  color: #60462b;
  line-height: 1.7;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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
  .success-hero :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-list {
    grid-template-columns: 1fr;
  }

  .credential-row {
    grid-template-columns: 1fr auto;
  }

  .credential-row .credential-label {
    grid-column: 1 / -1;
  }
}
</style>
