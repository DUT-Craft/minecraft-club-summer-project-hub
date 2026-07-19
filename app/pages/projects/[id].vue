<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <template v-else-if="project">
        <n-card class="detail-hero" :bordered="false">
          <div class="hero-info">
            <n-space :size="8" align="center">
              <n-tag :bordered="false" type="primary">{{ project.type || "未分类" }}</n-tag>
              <n-tag :bordered="false">{{ statusLabel }}</n-tag>
            </n-space>
            <h1>{{ project.title }}</h1>
            <span>负责人：{{ project.ownerName || "未填写" }}</span>
          </div>
          <n-button size="large" type="primary" @click="navigateTo('/mall')">
            返回项目列表
          </n-button>
        </n-card>

        <n-alert
          v-if="ownerCanManage"
          :bordered="false"
          type="success"
          class="owner-banner"
        >
          <strong>你是本项目负责人。</strong>
          <span class="owner-banner-note">可编辑项目信息、修改管理密码、处理加入申请。</span>
          <n-button
            text
            type="primary"
            class="owner-banner-link"
            @click="navigateTo(`/admin/projects/${projectId}`)"
          >
            前往管理面板 →
          </n-button>
        </n-alert>

        <div class="layout">
          <n-card class="main-panel" title="项目介绍" :bordered="false">
            <img
              v-if="project.coverImageUrl"
              :src="project.coverImageUrl"
              :alt="project.title"
              class="project-cover"
            />
            <div class="progress-block">
              <div class="progress-head">
                <strong>项目进度</strong>
                <span>{{ project.progress }}%</span>
              </div>
              <n-progress
                type="line"
                :percentage="project.progress"
                :height="14"
                :border-radius="4"
                :show-indicator="false"
                color="#65a844"
                rail-color="#d9c99b"
              />
            </div>
            <p class="description">{{ project.description || project.summary || "项目发起者还没有填写项目介绍。" }}</p>
            <n-alert v-if="project.publicContact" :bordered="false" type="info" class="contact">
              <strong>联系方式：</strong>{{ project.publicContact }}
            </n-alert>
          </n-card>

          <n-card title="招工需求" :bordered="false">
            <template v-if="needs.length" #header-extra>
              <n-tag :bordered="false" size="small" round class="needs-count">
                共 {{ totalSlots }} 个名额
              </n-tag>
            </template>
            <n-empty v-if="!needs.length" description="这个项目暂时没有公开招工需求。" />
            <div v-else class="need-list">
              <article
                v-for="need in needs"
                :key="need.id || need.skill"
                class="need-card"
              >
                <div class="need-card-head">
                  <span class="need-skill">{{ need.skill }}</span>
                  <n-tag :bordered="false" size="small" round class="need-count">
                    招 {{ need.count }} 人
                  </n-tag>
                </div>
                <p class="need-work">{{ need.work }}</p>
              </article>
            </div>
          </n-card>
        </div>

        <div class="layout">
          <n-card title="项目动态" :bordered="false">
            <n-empty v-if="!updates.length" description="还没有公开动态。" />
            <n-timeline v-else size="large">
              <n-timeline-item
                v-for="update in updates"
                :key="update.id"
                :color="primaryGreen"
                :time="formatDate(update.createdAt)"
                :title="update.title"
              >
                <img v-if="update.imageUrl" :src="update.imageUrl" :alt="update.title" class="update-image" />
                <p class="update-content">{{ update.content }}</p>
              </n-timeline-item>
            </n-timeline>
          </n-card>

          <n-card title="申请加入" :bordered="false">
            <n-empty
              v-if="!needs.length"
              description="该项目暂未公开招工需求，暂时无法申请加入。"
            />
            <n-form
              v-else
              ref="joinFormRef"
              :model="joinForm"
              :rules="joinRules"
              label-placement="top"
              @submit.prevent="handleJoin"
            >
              <n-form-item label="申请岗位" path="position">
                <n-select
                  v-model:value="joinForm.position"
                  :options="positionOptions"
                  placeholder="选择你想加入的岗位"
                />
              </n-form-item>
              <n-form-item label="昵称" path="nickname">
                <n-input v-model:value="joinForm.nickname" placeholder="你的昵称" />
              </n-form-item>
              <n-form-item label="Minecraft ID" path="minecraftId">
                <n-input v-model:value="joinForm.minecraftId" placeholder="Java / 基岩版 ID" />
              </n-form-item>
              <n-form-item label="联系方式" path="contact">
                <n-input v-model:value="joinForm.contact" placeholder="QQ / Discord 等" />
              </n-form-item>
              <n-form-item label="申请理由" path="reason">
                <n-input
                  v-model:value="joinForm.reason"
                  type="textarea"
                  :rows="4"
                  placeholder="简单说说你想怎么参与"
                />
              </n-form-item>
              <n-button type="primary" attr-type="submit" :loading="submittingJoin">
                {{ submittingJoin ? "提交中..." : "提交申请" }}
              </n-button>
            </n-form>
          </n-card>
        </div>

        <n-card class="comments-panel" :bordered="false">
          <template #header>
            <div class="comments-head">
              <div class="comments-titles">
                <span class="comments-eyebrow">Public Comments</span>
                <h2>项目评论 / 建议</h2>
              </div>
              <n-tag
                v-if="comments.length"
                :bordered="false"
                size="small"
                round
                class="comments-count"
              >
                {{ comments.length }} 条
              </n-tag>
            </div>
          </template>

          <n-form
            ref="commentFormRef"
            :model="commentForm"
            :rules="commentRules"
            :show-label="false"
            class="comment-form"
            @submit.prevent="handleComment"
          >
            <n-form-item path="nickname">
              <n-input v-model:value="commentForm.nickname" placeholder="你的昵称" />
            </n-form-item>
            <n-form-item path="content">
              <n-input
                v-model:value="commentForm.content"
                type="textarea"
                :rows="3"
                placeholder="给项目组留下一条建议"
              />
            </n-form-item>
            <div class="comment-form-actions">
              <span class="comment-form-hint">处理后将公开展示</span>
              <n-button type="primary" attr-type="submit" :loading="submittingComment">
                {{ submittingComment ? "提交中..." : "发表评论" }}
              </n-button>
            </div>
          </n-form>

          <n-empty v-if="!comments.length" description="还没有评论，可以先给这个项目提一个想法。" />
          <div v-else class="comment-list">
            <article
              v-for="comment in comments"
              :key="comment.id"
              class="comment-card"
            >
              <div
                class="comment-avatar"
                :style="{ background: avatarColor(comment.nickname) }"
              >
                {{ avatarLetter(comment.nickname) }}
              </div>
              <div class="comment-body">
                <div class="comment-meta">
                  <span class="comment-author">{{ comment.nickname || "匿名访客" }}</span>
                  <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
              </div>
            </article>
          </div>
        </n-card>
      </template>

      <n-empty
        v-else
        class="empty-space"
        description="没有找到这个公开项目"
      >
        <template #extra>
          <p class="empty-subtext">项目可能还在后台处理，或已被管理员隐藏。</p>
          <n-button type="primary" @click="navigateTo('/mall')">回到项目列表</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";
import type { Project, ProjectComment, ProjectUpdate, RecruitmentNeed } from "~/types/projectHub";


definePageMeta({
  layout: false,
  // 仅允许纯数字 id；非数字（如 /projects/abc）直接落到 404
  validate: (to) => /^\d+$/.test(String(to.params.id)),
});

// 仅对外展示非隐藏状态的项目；PENDING / REJECTED / DELETED 视为不可见
const HIDDEN_STATUSES = new Set(["PENDING", "REJECTED", "DELETED"]);

const route = useRoute();
const message = useMessage();
const { loadProjectById, loadProjectUpdates, loadProjectComments, submitJoin, submitComment } = useProjectHubApi();
const { read: readOwnerSession } = useOwnerSession();
const { add: addAnonymousSubmission } = useAnonymousSubmissions();

const loading = ref(true);
const project = ref<Project | null>(null);
const updates = ref<ProjectUpdate[]>([]);
const comments = ref<ProjectComment[]>([]);
const submittingJoin = ref(false);
const submittingComment = ref(false);
// 当前访客若恰好是已登录的本项目负责人，展示一个跳转到管理面板的入口
const ownerCanManage = ref(false);

const joinForm = reactive({
  position: "",
  nickname: "",
  minecraftId: "",
  contact: "",
  reason: "",
});

const commentForm = reactive({
  nickname: "",
  content: "",
});

const joinFormRef = ref<FormInst | null>(null);
const commentFormRef = ref<FormInst | null>(null);

const joinRules: FormRules = {
  position: { required: true, message: "请选择申请岗位", trigger: ["change", "blur"] },
  nickname: { required: true, message: "请填写昵称", trigger: ["blur", "input"] },
  minecraftId: { required: true, message: "请填写 Minecraft ID", trigger: ["blur", "input"] },
  contact: { required: true, message: "请填写联系方式", trigger: ["blur", "input"] },
  reason: { required: true, message: "请填写申请理由", trigger: ["blur", "input"] },
};

const commentRules: FormRules = {
  nickname: { required: true, message: "请填写昵称", trigger: ["blur", "input"] },
  content: { required: true, message: "请填写评论内容", trigger: ["blur", "input"] },
};

// Minecraft 暖色主题（草地绿主色 + 羊皮纸卡片 + 木边输入），见 useMinecraftTheme
const { themeOverrides, primaryGreen } = useMinecraftTheme();

// route.params.id 来自文件名 projects/[id].vue（已在 definePageMeta.validate 限制为纯数字）
const projectId = computed(() => String(route.params.id));

onMounted(async () => {
  const id = projectId.value;
  // 三个数据源并行拉取：项目本体（openapi.json 已有）+ 动态 / 评论（api.json 补充）
  const [found, projectUpdates, projectComments] = await Promise.all([
    loadProjectById(id),
    loadProjectUpdates(id),
    loadProjectComments(id),
  ]);

  // 仅在项目处于对外可见状态时展示，否则落到“未找到”空态
  if (found && found.status && !HIDDEN_STATUSES.has(found.status.toUpperCase())) {
    project.value = found;
  }
  updates.value = projectUpdates;
  comments.value = projectComments;
  // 命中本项目负责人的会话时，开放管理面板入口（编辑信息 / 改密 / 处理申请）
  const ownerSession = readOwnerSession();
  ownerCanManage.value = !!ownerSession && String(ownerSession.project.id) === id;
  loading.value = false;
});

// 状态文案走共享映射（useProjectStatus），后端原始英文枚举仍保存在 project.value.status
const statusLabel = computed(() => formatProjectStatus(project.value?.status));

const needs = computed<RecruitmentNeed[]>(() => {
  const current = project.value;
  if (!current) {
    return [];
  }

  if (current.recruitmentNeeds?.length) {
    return current.recruitmentNeeds;
  }

  return (current.skills ?? []).map((skill, index) => ({
    id: `${skill}-${index}`,
    skill,
    count: index === 0 ? Number(current.neededMembers) || 1 : 1,
    work: "项目发起者暂未补充具体工作内容。",
  }));
});

// 招工总名额：把每条 need.count 相加，给卡片头部做一个汇总徽标
const totalSlots = computed(() =>
  needs.value.reduce((sum, need) => sum + (Number(need.count) || 0), 0),
);

// 申请加入表单的岗位下拉选项：只能从该项目招工需求里选
const positionOptions = computed(() =>
  needs.value.map((need) => ({
    label: need.count > 0 ? `${need.skill} · 招 ${need.count} 人` : need.skill,
    value: need.skill,
  })),
);

const formatDate = (value: string) => value ? new Date(value).toLocaleString("zh-CN") : "未记录时间";

// 评论头像：用昵称首字符 + 基于昵称哈希的 Minecraft 风格配色，给每条评论一点辨识度
const AVATAR_COLORS = [
  "#6b8f32", // 草地绿
  "#7a5a36", // 木板棕
  "#a6732b", // 琥珀
  "#3f6e94", // 水
  "#963c30", // 红石
  "#6a4ea0", // 紫水晶
  "#2f6b56", // 青苔
];

const avatarLetter = (name?: string) => {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
};

const avatarColor = (name?: string) => {
  const source = (name || "").trim() || "匿名访客";
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const handleJoin = async () => {
  try {
    await joinFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submittingJoin.value = true;
    const submitted = await submitJoin({
      projectId: projectId.value,
      nickname: joinForm.nickname,
      minecraftId: joinForm.minecraftId,
      contact: joinForm.contact,
      reason: joinForm.reason,
      skill: joinForm.position,
    });
    if (submitted.id && submitted.trackingToken) {
      addAnonymousSubmission({
        kind: "join",
        id: String(submitted.id),
        projectId: projectId.value,
        title: `申请加入：${project.value?.title || `项目 #${projectId.value}`}`,
        trackingToken: submitted.trackingToken,
        status: submitted.status || "PENDING",
        submittedAt: submitted.createTime || new Date().toISOString(),
      });
    }
    message.success("申请已提交，可在“我的提交”查看状态");
    Object.assign(joinForm, {
      position: "",
      nickname: "",
      minecraftId: "",
      contact: "",
      reason: "",
    });
  } catch (error) {
    message.error(error instanceof Error ? error.message : "提交失败，请确认后端接口是否已配置");
  } finally {
    submittingJoin.value = false;
  }
};

const handleComment = async () => {
  try {
    await commentFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submittingComment.value = true;
    await submitComment({
      projectId: projectId.value,
      ...commentForm,
    });
    // 新评论 status=PENDING，处理后才会出现在公开列表，这里不直接插入
    message.success("评论已提交，处理后将展示");
    Object.assign(commentForm, {
      nickname: "",
      content: "",
    });
  } catch (error) {
    message.error(error instanceof Error ? error.message : "提交失败，请确认后端接口是否已配置");
  } finally {
    submittingComment.value = false;
  }
};
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

.detail-hero,
.owner-banner,
.layout,
.comments-panel,
.empty-space,
.loading-state {
  width: min(1180px, calc(100% - 28px));
  margin: 22px auto 0;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 80px 0;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.42fr);
  gap: 16px;
}

/* 把 Naive UI 的卡片包成 Minecraft 风格的木边面板 */
:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 6px 0 #5a3a21;
}

.detail-hero :deep(.n-card-content) {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.hero-info {
  min-width: 0;
}

.hero-info h1,
.description,
.need-work,
.update-content {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.hero-info h1 {
  margin: 6px 0 0;
  font-size: clamp(32px, 4vw, 54px);
  line-height: 1.08;
  color: #2d2418;
}

.hero-info span {
  display: block;
  margin-top: 9px;
  color: #60462b;
  font-weight: 800;
}

.description {
  margin: 0 0 12px;
  color: #4f3924;
  font-size: 17px;
  line-height: 1.85;
  white-space: pre-wrap;
}

.project-cover {
  width: 100%;
  max-height: 420px;
  display: block;
  margin-bottom: 16px;
  object-fit: cover;
  border: 2px solid #5a3a21;
  border-radius: 8px;
}

.progress-block {
  margin-bottom: 18px;
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
  color: #4f3924;
}

.contact {
  border: 2px solid #8b6a3d;
  border-radius: 9px;
  background: #fff8df;
}

.contact strong {
  margin-right: 4px;
}

/* 负责人入口横幅：仅当前访客持有本项目 owner 会话时出现 */
.owner-banner {
  border: 2px solid #6b8f32 !important;
  border-radius: 9px;
  background: #f0f8d8;
  margin-top: 16px;
}

.owner-banner-note {
  margin: 0 6px;
  color: #54712f;
}

.owner-banner-link {
  font-weight: 900;
}

.need-skill {
  font-weight: 900;
  color: #2d2418;
  font-size: 17px;
}

.need-work,
.update-content {
  margin: 0;
  color: #60462b;
  line-height: 1.7;
  white-space: pre-wrap;
}

.needs-count {
  background: #fff8df;
  color: #5a3a21;
  font-weight: 800;
}

/* 招工需求列表：每条做成左侧带绿条强调的羊皮纸便签 */
.need-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.need-card {
  position: relative;
  padding: 14px 16px 14px 20px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
  box-shadow: 0 3px 0 rgba(90, 58, 33, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  overflow: hidden;
}

.need-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #6b8f32;
}

.need-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 0 rgba(90, 58, 33, 0.22);
}

.need-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.need-count {
  background: #6b8f32;
  color: #fff8df;
  font-weight: 800;
  white-space: nowrap;
}

.update-image {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  margin-bottom: 10px;
}

.comments-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.comments-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comments-eyebrow {
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.08em;
}

.comments-head h2 {
  margin: 0;
  color: #2d2418;
}

.comments-count {
  background: #fff8df;
  color: #5a3a21;
  font-weight: 800;
}

/* 评论输入区：用虚线木边把表单圈成一张便签 */
.comment-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 0 20px;
  padding: 16px;
  border: 2px dashed #8b6a3d;
  border-radius: 10px;
  background: rgba(255, 248, 223, 0.55);
}

.comment-form :deep(.n-form-item) {
  margin-bottom: 0;
}

.comment-form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.comment-form-hint {
  color: #795b36;
  font-size: 13px;
}

/* 评论列表：每条评论做成带头像的羊皮纸卡片 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.comment-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
  box-shadow: 0 3px 0 rgba(90, 58, 33, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.comment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 0 rgba(90, 58, 33, 0.22);
}

.comment-avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 2px solid #2d2418;
  border-radius: 8px;
  color: #fff8df;
  font-weight: 900;
  font-size: 20px;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25);
  user-select: none;
}

.comment-body {
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 900;
  color: #2d2418;
}

.comment-time {
  color: #795b36;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.comment-text {
  margin: 0;
  color: #4f3924;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-subtext {
  margin: 8px 0 16px;
  color: #60462b;
  line-height: 1.7;
}

@media (width <= 840px) {
  .detail-hero :deep(.n-card-content) {
    flex-direction: column;
    align-items: flex-start;
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .comment-meta {
    flex-direction: column;
    gap: 2px;
  }
}
</style>
