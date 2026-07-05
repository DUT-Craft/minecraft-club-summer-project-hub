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

        <div class="layout">
          <n-card class="main-panel" title="项目介绍" :bordered="false">
            <p class="description">{{ project.description || project.summary || "项目发起者还没有填写项目介绍。" }}</p>
            <n-alert v-if="project.publicContact" :bordered="false" type="info" class="contact">
              <strong>联系方式：</strong>{{ project.publicContact }}
            </n-alert>
          </n-card>

          <n-card title="招工需求" :bordered="false">
            <n-empty v-if="!needs.length" description="这个项目暂时没有公开招工需求。" />
            <n-list v-else hoverable>
              <n-list-item v-for="need in needs" :key="need.id || need.skill">
                <n-thing>
                  <template #header>
                    <span class="need-skill">{{ need.skill }}</span>
                  </template>
                  <template #header-extra>
                    <n-tag :bordered="false" size="small">{{ need.count }} 人</n-tag>
                  </template>
                  <p class="need-work">{{ need.work }}</p>
                </n-thing>
              </n-list-item>
            </n-list>
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
            <n-form
              ref="joinFormRef"
              :model="joinForm"
              :rules="joinRules"
              label-placement="top"
              @submit.prevent="handleJoin"
            >
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
              <span class="comments-eyebrow">Public Comments</span>
              <h2>项目评论 / 建议</h2>
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
              <n-input v-model:value="commentForm.nickname" placeholder="昵称" />
            </n-form-item>
            <n-form-item path="content">
              <n-input
                v-model:value="commentForm.content"
                type="textarea"
                :rows="3"
                placeholder="给项目组留下一条建议"
              />
            </n-form-item>
            <n-button type="primary" attr-type="submit" :loading="submittingComment">
              {{ submittingComment ? "提交中..." : "发表评论" }}
            </n-button>
          </n-form>

          <n-empty v-if="!comments.length" description="还没有评论，可以先给这个项目提一个想法。" />
          <n-list v-else class="comment-list">
            <n-list-item v-for="comment in comments" :key="comment.id">
              <n-thing>
                <template #header>
                  <span class="comment-author">{{ comment.nickname || "匿名访客" }}</span>
                </template>
                <template #header-extra>
                  <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                </template>
                <p class="comment-text">{{ comment.content }}</p>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </template>

      <n-empty
        v-else
        class="empty-space"
        description="没有找到这个公开项目"
      >
        <template #extra>
          <p class="empty-subtext">项目可能还在审核，或已被管理员隐藏。</p>
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

const loading = ref(true);
const project = ref<Project | null>(null);
const updates = ref<ProjectUpdate[]>([]);
const comments = ref<ProjectComment[]>([]);
const submittingJoin = ref(false);
const submittingComment = ref(false);

const joinForm = reactive({
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

const formatDate = (value: string) => value ? new Date(value).toLocaleString("zh-CN") : "未记录时间";

const handleJoin = async () => {
  try {
    await joinFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submittingJoin.value = true;
    await submitJoin({
      projectId: projectId.value,
      ...joinForm,
    });
    message.success("申请已提交，等待项目发起者或管理员处理");
    Object.assign(joinForm, {
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
    // 新评论 status=PENDING，需审核通过后才会出现在公开列表，这里不直接插入
    message.success("评论已提交，审核通过后将展示");
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

.detail-hero :deep(.n-card__content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.hero-info {
  min-width: 0;
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

.contact {
  border: 2px solid #8b6a3d;
  border-radius: 9px;
  background: #fff8df;
}

.contact strong {
  margin-right: 4px;
}

.need-skill,
.comment-author {
  font-weight: 900;
  color: #2d2418;
}

.need-work,
.comment-text,
.update-content {
  margin: 0;
  color: #60462b;
  line-height: 1.7;
  white-space: pre-wrap;
}

.comment-time {
  color: #795b36;
  font-size: 13px;
  font-weight: 700;
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
  flex-direction: column;
  gap: 4px;
}

.comments-eyebrow {
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
}

.comments-head h2 {
  margin: 0;
  color: #2d2418;
}

.comment-form {
  display: grid;
  grid-template-columns: minmax(150px, 0.22fr) minmax(240px, 1fr) auto;
  gap: 12px;
  align-items: start;
  margin: 0 0 16px;
}

.comment-form :deep(.n-form-item) {
  margin-bottom: 0;
}

.comment-list {
  margin-top: 8px;
}

.empty-subtext {
  margin: 8px 0 16px;
  color: #60462b;
  line-height: 1.7;
}

@media (width <= 840px) {
  .detail-hero :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }

  .layout,
  .comment-form {
    grid-template-columns: 1fr;
  }
}
</style>
