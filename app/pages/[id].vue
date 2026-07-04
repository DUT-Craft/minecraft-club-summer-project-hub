<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <template v-if="project">
      <section class="detail-hero">
        <div>
          <p>{{ project.type || "未分类" }} · {{ project.status || "筹备中" }}</p>
          <h1>{{ project.title }}</h1>
          <span>负责人：{{ project.ownerName || "未填写" }}</span>
        </div>
        <NuxtLink to="/groud">返回项目列表</NuxtLink>
      </section>

      <section class="layout">
        <article class="panel main-panel">
          <h2>项目介绍</h2>
          <p class="description">{{ project.description || project.summary || "项目发起者还没有填写项目介绍。" }}</p>

          <div v-if="project.publicContact" class="contact">
            <strong>联系方式</strong>
            <span>{{ project.publicContact }}</span>
          </div>
        </article>

        <aside class="panel">
          <h2>招工需求</h2>
          <div v-if="needs.length" class="needs">
            <div v-for="need in needs" :key="need.id || need.skill" class="need">
              <strong>{{ need.skill }}</strong>
              <span>{{ need.count }} 人</span>
              <p>{{ need.work }}</p>
            </div>
          </div>
          <p v-else class="muted">这个项目暂时没有公开招工需求。</p>
        </aside>
      </section>

      <section class="layout">
        <article class="panel">
          <h2>项目动态</h2>
          <div v-if="updates.length" class="stack">
            <div v-for="update in updates" :key="update.id" class="record">
              <img v-if="update.imageUrl" :src="update.imageUrl" :alt="update.title" />
              <span>{{ formatDate(update.createdAt) }}</span>
              <h3>{{ update.title }}</h3>
              <p>{{ update.content }}</p>
            </div>
          </div>
          <p v-else class="muted">还没有公开动态。</p>
        </article>

        <form class="panel" @submit.prevent="handleJoin">
          <h2>申请加入</h2>
          <label>昵称<input v-model="joinForm.nickname" required /></label>
          <label>Minecraft ID<input v-model="joinForm.minecraftId" required /></label>
          <label>联系方式<input v-model="joinForm.contact" required /></label>
          <label>申请理由<textarea v-model="joinForm.reason" required rows="4" /></label>
          <button class="submit-button" type="submit" :disabled="submittingJoin">
            {{ submittingJoin ? "提交中..." : "提交申请" }}
          </button>
        </form>
      </section>

      <section class="panel comments-panel">
        <div class="comments-head">
          <div>
            <p>Public Comments</p>
            <h2>项目评论 / 建议</h2>
          </div>
        </div>

        <form class="comment-form" @submit.prevent="handleComment">
          <input v-model="commentForm.nickname" required placeholder="昵称" />
          <textarea v-model="commentForm.content" required rows="3" placeholder="给项目组留下一条建议" />
          <button type="submit" :disabled="submittingComment">
            {{ submittingComment ? "提交中..." : "发表评论" }}
          </button>
        </form>

        <div v-if="comments.length" class="comment-list">
          <article v-for="comment in comments" :key="comment.id" class="comment">
            <strong>{{ comment.nickname || "匿名访客" }}</strong>
            <span>{{ formatDate(comment.createdAt) }}</span>
            <p>{{ comment.content }}</p>
          </article>
        </div>
        <p v-else class="muted">还没有评论，可以先给这个项目提一个想法。</p>
      </section>
    </template>

    <MinecraftEmptyState
      v-else
      class="empty-space"
      title="没有找到这个公开项目"
      text="项目可能还在审核，或已被管理员隐藏。"
    >
      <NuxtLink class="inline-action" to="/groud">回到项目列表</NuxtLink>
    </MinecraftEmptyState>
  </main>
</template>

<script setup lang="ts">
import type { DataSnapshot, RecruitmentNeed } from "app/types/projectHub";

definePageMeta({
  layout: false,
});

const route = useRoute();
const message = useMessage();
const { loadSnapshot, submitJoin, submitComment } = useProjectHubApi();
const snapshot = ref<DataSnapshot>({
  projects: [],
  ideas: [],
  projectUpdates: [],
  projectComments: [],
});
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

const projectId = computed(() => String(route.params.id));

onMounted(async () => {
  snapshot.value = await loadSnapshot();
});

const project = computed(() => snapshot.value.projects.find((item) => item.id === projectId.value && item.reviewStatus === "approved"));

const needs = computed<RecruitmentNeed[]>(() => {
  if (project.value?.recruitmentNeeds?.length) {
    return project.value.recruitmentNeeds;
  }

  return (project.value?.skills ?? []).map((skill, index) => ({
    id: `${skill}-${index}`,
    skill,
    count: index === 0 ? Number(project.value?.neededMembers) || 1 : 1,
    work: "项目发起者暂未补充具体工作内容。",
  }));
});

const updates = computed(() => snapshot.value.projectUpdates
  .filter((item) => item.projectId === projectId.value && (item.reviewStatus ?? "approved") === "approved")
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));

const comments = computed(() => snapshot.value.projectComments
  .filter((item) => item.projectId === projectId.value && (item.reviewStatus ?? "approved") === "approved")
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));

const formatDate = (value: string) => value ? new Date(value).toLocaleString("zh-CN") : "未记录时间";

const handleJoin = async () => {
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
    submittingComment.value = true;
    const created = await submitComment({
      projectId: projectId.value,
      ...commentForm,
    });
    snapshot.value.projectComments.unshift(created);
    message.success("评论已发布");
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
.empty-space {
  width: min(1180px, calc(100% - 28px));
  margin: 22px auto 0;
}

.detail-hero,
.panel {
  border: 2px solid #5a3a21;
  border-radius: 10px;
  background: rgba(255, 245, 207, 0.94);
  box-shadow: 0 6px 0 #5a3a21;
}

.detail-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
}

.detail-hero p,
.detail-hero h1 {
  margin: 0;
}

.detail-hero p,
.comments-head p {
  color: #6b8f32;
  font-weight: 900;
}

.detail-hero h1 {
  margin-top: 6px;
  font-size: clamp(32px, 4vw, 54px);
  line-height: 1.08;
}

.detail-hero span {
  display: block;
  margin-top: 9px;
  color: #60462b;
  font-weight: 800;
}

.detail-hero a,
.inline-action,
.submit-button,
.comment-form button {
  padding: 10px 14px;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  background: #65a844;
  color: #fffbe4;
  text-decoration: none;
  font-weight: 900;
  box-shadow: 0 4px 0 #5a3a21;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.42fr);
  gap: 16px;
}

.panel {
  padding: 18px;
}

h2,
h3,
p {
  margin-top: 0;
}

.description {
  color: #4f3924;
  font-size: 17px;
  line-height: 1.85;
  white-space: pre-wrap;
}

.contact,
.need,
.record,
.comment {
  border: 2px solid #8b6a3d;
  border-radius: 9px;
  background: #fff8df;
}

.contact {
  display: grid;
  gap: 6px;
  padding: 12px;
}

.needs,
.stack,
.comment-list {
  display: grid;
  gap: 12px;
}

.need,
.record,
.comment {
  padding: 12px;
}

.need span,
.record span,
.comment span,
.muted {
  color: #795b36;
  font-size: 13px;
  font-weight: 700;
}

.need p,
.record p,
.comment p {
  margin-bottom: 0;
  color: #60462b;
  line-height: 1.7;
  white-space: pre-wrap;
}

.record img {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  margin-bottom: 10px;
}

form {
  display: grid;
  gap: 12px;
}

label {
  display: grid;
  gap: 7px;
  font-weight: 900;
}

input,
textarea {
  width: 100%;
  min-width: 0;
  padding: 10px 11px;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  background: #fff8df;
  color: #2d2418;
  font: inherit;
  font-weight: 700;
}

.comments-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.comments-head p,
.comments-head h2 {
  margin: 0;
}

.comment-form {
  grid-template-columns: minmax(150px, 0.22fr) minmax(240px, 1fr) auto;
  align-items: start;
  margin: 16px 0;
}

.comment-form button {
  min-height: 45px;
}

button:disabled {
  opacity: 0.65;
  cursor: wait;
}

@media (width <= 840px) {
  .detail-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .layout,
  .comment-form {
    grid-template-columns: 1fr;
  }
}
</style>
