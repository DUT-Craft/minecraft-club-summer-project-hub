<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="loading" class="loading-state">
        <n-spin size="large"/>
      </div>

      <template v-else-if="session && project">
        <n-card :bordered="false" class="detail-hero">
          <div class="hero-info">
            <n-space :size="8" align="center">
              <n-tag :bordered="false" type="primary">{{ project.type || "未分类" }}</n-tag>
              <n-tag :bordered="false" :type="statusTagType(project.status)">{{
                  formatProjectStatus(project.status)
                }}
              </n-tag>
              <n-tag :bordered="false" class="id-tag" round>#{{ project.id }}</n-tag>
            </n-space>
            <h1>{{ project.title }}</h1>
            <span>负责人：{{ project.ownerName || "未填写" }}</span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/admin/manage/projects')">返回列表</n-button>
            <n-button :loading="refreshing" size="large" @click="handleRefresh">
              {{ refreshing ? "同步中..." : "刷新" }}
            </n-button>
            <n-button size="large" type="primary" @click="openEditModal">编辑项目</n-button>
          </div>
        </n-card>

        <n-card :bordered="false" class="info-panel">
          <template #header>
            <div class="panel-head">
              <span class="eyebrow">Project Detail</span>
              <h2>项目信息</h2>
            </div>
          </template>

          <dl class="info-list">
            <div class="info-row">
              <dt>项目类型</dt>
              <dd>{{ project.type || "——" }}</dd>
            </div>
            <div class="info-row">
              <dt>当前状态</dt>
              <dd>
                <n-tag :bordered="false" class="status-tag" round size="small">{{
                    formatProjectStatus(project.status)
                  }}
                </n-tag>
              </dd>
            </div>
            <div class="info-row">
              <dt>负责人</dt>
              <dd>{{ project.ownerName || "——" }}</dd>
            </div>
            <div v-if="project.ownerMinecraftId" class="info-row">
              <dt>Minecraft ID</dt>
              <dd>{{ project.ownerMinecraftId }}</dd>
            </div>
            <div v-if="project.publicContact" class="info-row">
              <dt>联系方式</dt>
              <dd>{{ project.publicContact }}</dd>
            </div>
            <div v-if="project.createdAt" class="info-row">
              <dt>创建时间</dt>
              <dd>{{ formatTime(project.createdAt) }}</dd>
            </div>
          </dl>

          <div v-if="project.summary" class="info-block">
            <strong>项目简介</strong>
            <p class="info-text">{{ project.summary }}</p>
          </div>
          <div v-if="project.description" class="info-block">
            <strong>详细介绍</strong>
            <p class="info-text">{{ project.description }}</p>
          </div>

          <div v-if="needs.length" class="info-block">
            <strong>招工需求</strong>
            <div class="need-list">
              <article v-for="need in needs" :key="need.id || need.skill" class="need-card">
                <div class="need-head">
                  <span class="need-skill">{{ need.skill }}</span>
                  <n-tag :bordered="false" class="need-count" round size="small">招 {{ need.count }} 人</n-tag>
                </div>
                <p v-if="need.work" class="need-work">{{ need.work }}</p>
              </article>
            </div>
          </div>

          <div class="bottom-actions">
            <n-button quaternary @click="navigateTo(`/projects/${projectId}`)">查看公开页</n-button>
            <n-popconfirm @positive-click="handleDelete">
              <template #trigger>
                <n-button ghost type="error">删除项目</n-button>
              </template>
              确定删除该项目吗？（软删除，可在列表的「已删除」筛选中找回）
            </n-popconfirm>
          </div>
        </n-card>

        <!-- 加入申请管理：管理员可同意 / 拒绝本项目收到的加入申请（JWT 鉴权） -->
        <n-card :bordered="false" class="applications-panel">
          <template #header>
            <div class="panel-head">
              <span class="eyebrow">Join Applications</span>
              <h2>加入申请管理</h2>
            </div>
          </template>
          <template #header-extra>
            <n-space :size="8" align="center" wrap>
              <n-select
                  v-model:value="applicationFilter"
                  :options="applicationFilterOptions"
                  class="filter-select"
                  size="small"
              />
              <n-button :loading="loadingApplications" size="small" @click="loadApplications">
                {{ applications.length || loadedApplications ? "刷新" : "加载申请" }}
              </n-button>
            </n-space>
          </template>

          <n-empty
              v-if="!applications.length"
              description="暂无加入申请，点击右上角「刷新」可重新拉取。"
          />
          <div v-else class="application-list">
            <article
                v-for="app in applications"
                :key="app.id"
                class="application-card"
            >
              <div class="application-head">
                <span class="application-name">{{ app.nickName || "匿名申请人" }}</span>
                <n-tag :bordered="false" :type="applicationTagType(app.status)" round size="small">
                  {{ applicationStatusLabel(app.status) }}
                </n-tag>
              </div>
              <dl class="application-meta">
                <div>
                  <dt>Minecraft ID</dt>
                  <dd>{{ app.mcId || "——" }}</dd>
                </div>
                <div>
                  <dt>联系方式</dt>
                  <dd>{{ app.contact || "——" }}</dd>
                </div>
                <div>
                  <dt>申请时间</dt>
                  <dd>{{ formatTime(app.createTime) }}</dd>
                </div>
              </dl>
              <p v-if="app.reason" class="application-reason">{{ app.reason }}</p>
              <div v-if="(app.status || '').toUpperCase() === 'PENDING'" class="application-actions">
                <n-button
                    :loading="processingId === app.id"
                    size="small"
                    type="primary"
                    @click="handleAcceptApplication(app)"
                >
                  同意
                </n-button>
                <n-button
                    :loading="processingId === app.id"
                    size="small"
                    @click="handleRejectApplication(app)"
                >
                  拒绝
                </n-button>
              </div>
            </article>
          </div>
        </n-card>

        <!-- 动态管理：发布 / 编辑 / 删除项目动态（JWT 鉴权，无需项目控制密码） -->
        <AdminProjectUpdates
            :project-id="projectId"
            mode="admin"
        />
        <!-- 评论审核：通过 / 拒绝 / 删除待审核评论（JWT 鉴权） -->
        <AdminProjectComments
            :project-id="projectId"
            mode="admin"
        />

        <!-- 编辑项目：管理员可改任意字段，含状态（覆盖全部 8 个状态，含审核态） -->
        <n-modal
            v-model:show="showEditModal"
            :bordered="false"
            :mask-closable="false"
            preset="card"
            style="width: min(720px, calc(100% - 28px))"
            title="编辑项目（管理员）"
        >
          <n-form
              ref="formRef"
              :model="form"
              :rules="rules"
              :show-require-mark="false"
              label-placement="top"
              size="medium"
              @submit.prevent="handleEditSubmit"
          >
            <div class="edit-grid">
              <n-form-item label="项目标题" path="title">
                <n-input v-model:value="form.title" placeholder="项目标题"/>
              </n-form-item>
              <n-form-item label="项目类型" path="type">
                <n-input v-model:value="form.type" placeholder="如：建筑 / 红石 / 剧情"/>
              </n-form-item>
            </div>

            <n-form-item label="状态" path="status">
              <n-select v-model:value="form.status" :options="statusOptions" placeholder="选择状态"/>
            </n-form-item>

            <n-form-item label="项目简介" path="introduction">
              <n-input v-model:value="form.introduction" :rows="2" placeholder="一句话简介" type="textarea"/>
            </n-form-item>
            <n-form-item label="详细介绍" path="description">
              <n-input v-model:value="form.description" :rows="4" placeholder="详细说明" type="textarea"/>
            </n-form-item>

            <n-form-item label="项目封面图" path="coverImageUrl">
              <ImageUploader
                  :url="form.coverImageUrl"
                  button-text="上传封面图"
                  @update:url="form.coverImageUrl = $event"
              />
            </n-form-item>

            <div class="edit-grid">
              <n-form-item label="负责人" path="ownerName">
                <n-input v-model:value="form.ownerName" placeholder="负责人昵称"/>
              </n-form-item>
              <n-form-item label="负责人 MC ID" path="ownerMinecraftId">
                <n-input v-model:value="form.ownerMinecraftId" placeholder="Java / 基岩版 ID"/>
              </n-form-item>
            </div>

            <n-form-item label="公开联系方式" path="publicContact">
              <n-input v-model:value="form.publicContact" placeholder="QQ 群 / Discord 等"/>
            </n-form-item>
            <n-form-item label="标签" path="tagsText">
              <n-input v-model:value="form.tagsText" placeholder="用逗号分隔，如：建筑,红石"/>
            </n-form-item>

            <n-form-item label="招工需求" path="recruitmentNeeds">
              <div class="need-editor">
                <div v-for="(need, index) in form.recruitmentNeeds" :key="index" class="need-editor-row">
                  <n-input v-model:value="need.skill" placeholder="岗位"/>
                  <n-input-number v-model:value="need.count" :min="0" class="need-editor-count" placeholder="人数"/>
                  <n-input v-model:value="need.work" class="need-editor-work" placeholder="工作内容"/>
                  <n-button quaternary type="error" @click="form.recruitmentNeeds.splice(index, 1)">删除</n-button>
                </div>
                <n-button block dashed @click="addNeed">+ 添加岗位</n-button>
              </div>
            </n-form-item>
          </n-form>

          <template #footer>
            <div class="edit-footer">
              <n-button @click="showEditModal = false">取消</n-button>
              <n-button :loading="submitting" type="primary" @click="handleEditSubmit">
                {{ submitting ? "保存中..." : "保存修改" }}
              </n-button>
            </div>
          </template>
        </n-modal>
      </template>

      <n-empty v-else-if="!session" class="empty-state" description="尚未登录管理员账号">
        <template #extra>
          <n-button type="primary" @click="navigateTo('/admin')">前往登录</n-button>
        </template>
      </n-empty>

      <n-empty v-else class="empty-state" description="没有找到这个项目">
        <template #extra>
          <n-button type="primary" @click="navigateTo('/admin/manage/projects')">返回项目列表</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {FormInst, FormRules} from "naive-ui";
import type {AdminSession} from "~/composables/useAdminAuth";
import type {JoinApplicationResponse} from "~/composables/useProjectHubApi";
import type {Project} from "~/types/projectHub";

definePageMeta({
  layout: false,
  validate: (to) => /^\d+$/.test(String(to.params.id)),
});

// 管理员可设置全部 8 个状态（含审核态 PENDING/APPROVED/REJECTED 与运营态）
const statusOptions = [
  {label: "待审核", value: "PENDING"},
  {label: "审核通过", value: "APPROVED"},
  {label: "审核未通过", value: "REJECTED"},
  {label: "筹备中", value: "PREPARING"},
  {label: "招募中", value: "RECRUITING"},
  {label: "制作中", value: "IN_PROGRESS"},
  {label: "暂缓", value: "PAUSED"},
  {label: "已删除", value: "DELETED"},
];

const route = useRoute();
const message = useMessage();
const {themeOverrides} = useMinecraftTheme();
const {read} = useAdminAuth();
const {
  loadProjectById,
  updateProjectAdmin,
  deleteProjectBatch,
  listJoinApplicationsAdmin,
  acceptJoinApplicationAdmin,
  rejectJoinApplicationAdmin,
} = useProjectHubApi();

const loading = ref(true);
const session = ref<AdminSession | null>(null);
const project = ref<Project | null>(null);

const projectId = computed(() => String(route.params.id));

onMounted(async () => {
  session.value = read();
  if (!session.value) {
    loading.value = false;
    navigateTo("/admin");
    return;
  }
  project.value = await loadProjectById(projectId.value);
  loading.value = false;
  // 预加载加入申请；动态 / 评论面板各自组件 onMounted 自动拉取
  loadApplications();
});

const needs = computed(() => project.value?.recruitmentNeeds ?? []);

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "未记录时间");

const statusTagType = (status?: string): "warning" | "success" | "error" | "info" | "default" => {
  switch ((status || "").toUpperCase()) {
    case "PENDING":
      return "warning";
    case "APPROVED":
    case "IN_PROGRESS":
      return "success";
    case "REJECTED":
    case "DELETED":
      return "error";
    case "RECRUITING":
      return "info";
    default:
      return "default";
  }
};

/* ---------- 刷新 ---------- */

const refreshing = ref(false);

// 重新拉取项目详情回写本地 project，避免页面停留在进入时的快照
// （例如其它管理员改了状态后，这里仍显示旧值）。loadProjectById 内部已吞异常返回 null，
// 因此用返回值判断成功与否，不依赖 catch。
const handleRefresh = async () => {
  refreshing.value = true;
  try {
    const latest = await loadProjectById(projectId.value);
    if (latest) {
      project.value = latest;
      message.success("已同步最新项目信息");
    } else {
      message.warning("未能拉取到项目信息，项目可能已被删除");
    }
  } finally {
    refreshing.value = false;
  }
};

/* ---------- 编辑 ---------- */

const formRef = ref<FormInst | null>(null);
const showEditModal = ref(false);
const submitting = ref(false);

const form = reactive({
  title: "",
  type: "",
  status: "PENDING",
  introduction: "",
  description: "",
  coverImageUrl: "",
  ownerName: "",
  ownerMinecraftId: "",
  publicContact: "",
  tagsText: "",
  recruitmentNeeds: [] as { skill: string; count: number; work: string }[],
});

const rules: FormRules = {
  title: {required: true, message: "请填写项目标题", trigger: ["blur", "input"]},
  type: {required: true, message: "请填写项目类型", trigger: ["blur", "input"]},
};

const addNeed = () => {
  form.recruitmentNeeds.push({skill: "", count: 1, work: ""});
};

const openEditModal = () => {
  const current = project.value;
  if (!current) {
    return;
  }
  form.title = current.title ?? "";
  form.type = current.type ?? "";
  form.status = current.status ?? "PENDING";
  form.introduction = current.summary ?? "";
  form.description = current.description ?? "";
  form.coverImageUrl = current.coverImageUrl ?? "";
  form.ownerName = current.ownerName ?? "";
  form.ownerMinecraftId = current.ownerMinecraftId ?? "";
  form.publicContact = current.publicContact ?? "";
  form.tagsText = (current.skills ?? []).join(", ");
  form.recruitmentNeeds = (current.recruitmentNeeds ?? []).map((need) => ({
    skill: need.skill ?? "",
    count: need.count ?? 0,
    work: need.work ?? "",
  }));
  showEditModal.value = true;
};

const handleEditSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    const updated = await updateProjectAdmin(projectId.value, {
      title: form.title.trim(),
      type: form.type.trim(),
      status: form.status,
      introduction: form.introduction.trim(),
      description: form.description,
      coverImageUrl: form.coverImageUrl || undefined,
      ownerName: form.ownerName.trim(),
      ownerMinecraftId: form.ownerMinecraftId.trim(),
      publicContact: form.publicContact.trim(),
      tags: form.tagsText.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      recruitmentNeeds: form.recruitmentNeeds
          .map((need) => ({skill: need.skill.trim(), count: Number(need.count) || 0, work: need.work.trim()}))
          .filter((need) => need.skill),
    });
    project.value = updated;
    message.success("项目已更新");
    showEditModal.value = false;
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "保存失败，请稍后再试");
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async () => {
  try {
    await deleteProjectBatch([projectId.value]);
    message.success("项目已删除");
    navigateTo("/admin/manage/projects");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "删除失败，请稍后再试");
  }
};

/* ---------- 加入申请管理（管理员 JWT，对标项目方后台） ---------- */

const applications = ref<JoinApplicationResponse[]>([]);
const loadingApplications = ref(false);
const loadedApplications = ref(false);
// processingId 标记当前正在 同意/拒绝 的申请，给对应行两个按钮同时置 loading
const processingId = ref<string | number | null>(null);
// 默认拉全部申请；用户可按状态筛选待处理 / 已同意 / 已联系 / 已拒绝
const applicationFilter = ref<string>("");

const applicationFilterOptions = [
  {label: "待处理", value: "PENDING"},
  {label: "已同意", value: "ACCEPTED"},
  {label: "已联系", value: "CONTACTED"},
  {label: "已拒绝", value: "REJECTED"},
  {label: "全部", value: ""},
];

const loadApplications = async () => {
  try {
    loadingApplications.value = true;
    const list = await listJoinApplicationsAdmin(projectId.value, applicationFilter.value || undefined);
    // 按 createTime 倒序，最新的申请排在最前
    applications.value = list.sort(
        (a, b) => Date.parse(b.createTime ?? "") - Date.parse(a.createTime ?? ""),
    );
    loadedApplications.value = true;
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "加载申请列表失败");
    applications.value = [];
  } finally {
    loadingApplications.value = false;
  }
};

// 切换筛选时若已加载过，自动刷新；未加载过不打扰用户
watch(applicationFilter, () => {
  if (loadedApplications.value) {
    loadApplications();
  }
});

const handleAcceptApplication = async (app: JoinApplicationResponse) => {
  if (app.id == null) {
    return;
  }
  try {
    processingId.value = app.id;
    await acceptJoinApplicationAdmin(projectId.value, app.id);
    message.success(`已同意 ${app.nickName || "申请人"} 的加入申请`);
    await loadApplications();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "操作失败，请稍后再试");
  } finally {
    processingId.value = null;
  }
};

const handleRejectApplication = async (app: JoinApplicationResponse) => {
  if (app.id == null) {
    return;
  }
  try {
    processingId.value = app.id;
    await rejectJoinApplicationAdmin(projectId.value, app.id);
    message.success(`已拒绝 ${app.nickName || "申请人"} 的加入申请`);
    await loadApplications();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "操作失败，请稍后再试");
  } finally {
    processingId.value = null;
  }
};

const applicationStatusLabel = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "PENDING":
      return "待处理";
    case "ACCEPTED":
      return "已同意";
    case "CONTACTED":
      return "已联系";
    case "REJECTED":
      return "已拒绝";
    case "DELETED":
      return "已删除";
    default:
      return status || "未知";
  }
};

const applicationTagType = (status?: string): "warning" | "success" | "info" | "error" | "default" => {
  switch ((status || "").toUpperCase()) {
    case "PENDING":
      return "warning";
    case "ACCEPTED":
      return "success";
    case "CONTACTED":
      return "info";
    case "REJECTED":
      return "error";
    default:
      return "default";
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

.detail-hero,
.info-panel,
.applications-panel,
.empty-state,
.loading-state {
  width: min(1080px, calc(100% - 28px));
  margin: 22px auto 0;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 80px 0;
}

:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 6px 0 #5a3a21;
}

.detail-hero :deep(.n-card__content) {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.hero-info {
  min-width: 0;
}

.hero-info h1 {
  margin: 6px 0 0;
  font-size: clamp(26px, 3.4vw, 44px);
  line-height: 1.08;
  color: #2d2418;
}

.hero-info span {
  display: block;
  margin-top: 9px;
  color: #60462b;
  font-weight: 800;
}

.id-tag {
  background: #fff8df;
  color: #5a3a21;
  font-weight: 800;
}

.hero-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
}

.panel-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.12em;
}

.panel-head h2 {
  margin: 0;
  color: #2d2418;
}

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

.bottom-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
}

.filter-select {
  width: 130px;
}

/* 加入申请列表：复用项目方管理页的左绿条羊皮纸卡片风格 */
.application-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.application-card {
  position: relative;
  padding: 14px 16px 14px 20px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
  box-shadow: 0 3px 0 rgba(90, 58, 33, 0.18);
  overflow: hidden;
}

.application-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #6b8f32;
}

.application-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.application-name {
  font-weight: 900;
  color: #2d2418;
  font-size: 16px;
  word-break: break-word;
}

.application-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 8px;
}

.application-meta div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.application-meta dt {
  color: #795b36;
  font-weight: 800;
  font-size: 12px;
}

.application-meta dd {
  margin: 0;
  color: #2d2418;
  font-weight: 700;
  word-break: break-word;
}

.application-reason {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  color: #4f3924;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.application-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.edit-grid :deep(.n-form-item) {
  margin-bottom: 0;
}

.need-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.need-editor-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px minmax(0, 1.4fr) auto;
  align-items: flex-start;
  gap: 8px;
}

.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty-state {
  width: min(560px, calc(100% - 28px));
  margin: 80px auto 0;
}

@media (width <= 720px) {
  .detail-hero :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-list,
  .application-meta {
    grid-template-columns: 1fr;
  }

  .need-editor-row,
  .edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
