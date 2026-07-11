<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="loading" class="loading-state">
        <n-spin size="large"/>
      </div>

      <template v-else-if="session && idea">
        <n-card :bordered="false" class="detail-hero">
          <div class="hero-info">
            <n-space :size="8" align="center">
              <n-tag :bordered="false" :type="statusTagType(idea.reviewStatus)">{{
                  ideaStatusLabel(idea.reviewStatus)
                }}
              </n-tag>
              <n-tag :bordered="false" class="id-tag" round>#{{ idea.id }}</n-tag>
            </n-space>
            <h1>{{ idea.title }}</h1>
            <span>{{
                idea.nickname || idea.submitterName || "匿名"
              }}{{ idea.minecraftId ? ` · MC：${idea.minecraftId}` : "" }}</span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/admin/manage/ideas')">返回列表</n-button>
            <n-button size="large" type="primary" @click="openEditModal">编辑想法</n-button>
          </div>
        </n-card>

        <n-card :bordered="false" class="info-panel">
          <template #header>
            <div class="panel-head">
              <span class="eyebrow">Idea Detail</span>
              <h2>想法内容</h2>
            </div>
          </template>
          <template #header-extra>
            <n-popconfirm @positive-click="handleDelete">
              <template #trigger>
                <n-button ghost size="small" type="error">删除</n-button>
              </template>
              确定删除这条想法吗？
            </n-popconfirm>
          </template>

          <p class="idea-content">{{ idea.content || "（作者没有填写正文）" }}</p>

          <dl class="info-list">
            <div class="info-row">
              <dt>提交者</dt>
              <dd>{{ idea.nickname || idea.submitterName || "——" }}</dd>
            </div>
            <div class="info-row">
              <dt>Minecraft ID</dt>
              <dd>{{ idea.minecraftId || "——" }}</dd>
            </div>
            <div class="info-row">
              <dt>当前状态</dt>
              <dd>{{ ideaStatusLabel(idea.reviewStatus) }}</dd>
            </div>
            <div v-if="idea.createdAt" class="info-row">
              <dt>提交时间</dt>
              <dd>{{ formatTime(idea.createdAt) }}</dd>
            </div>
          </dl>
        </n-card>

        <n-modal
            v-model:show="showEditModal"
            :bordered="false"
            :mask-closable="false"
            preset="card"
            style="width: min(620px, calc(100% - 28px))"
            title="编辑想法（管理员）"
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
            <n-form-item label="标题" path="title">
              <n-input v-model:value="form.title" placeholder="想法标题"/>
            </n-form-item>
            <n-form-item label="状态" path="status">
              <n-select v-model:value="form.status" :options="statusOptions" placeholder="选择状态"/>
            </n-form-item>
            <div class="edit-grid">
              <n-form-item label="提交者昵称" path="nickName">
                <n-input v-model:value="form.nickName" placeholder="昵称"/>
              </n-form-item>
              <n-form-item label="Minecraft ID" path="mcId">
                <n-input v-model:value="form.mcId" placeholder="MC ID"/>
              </n-form-item>
            </div>
            <n-form-item label="正文" path="content">
              <n-input v-model:value="form.content" :rows="6" placeholder="想法正文" type="textarea"/>
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

      <n-empty v-else class="empty-state" description="没有找到这条想法">
        <template #extra>
          <n-button type="primary" @click="navigateTo('/admin/manage/ideas')">返回想法列表</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {FormInst, FormRules} from "naive-ui";
import type {AdminSession} from "~/composables/useAdminAuth";
import type {Idea} from "~/types/projectHub";

definePageMeta({
  layout: false,
  validate: (to) => /^\d+$/.test(String(to.params.id)),
});

const statusOptions = [
  {label: "待审核", value: "PENDING"},
  {label: "审核通过", value: "APPROVED"},
  {label: "审核未通过", value: "REJECTED"},
  {label: "已删除", value: "DELETED"},
];

const route = useRoute();
const message = useMessage();
const {themeOverrides} = useMinecraftTheme();
const {read} = useAdminAuth();
const {getIdeaAdmin, updateIdeaAdmin, deleteIdeaBatch} = useProjectHubApi();

const loading = ref(true);
const session = ref<AdminSession | null>(null);
const idea = ref<Idea | null>(null);

const ideaId = computed(() => String(route.params.id));

onMounted(async () => {
  session.value = read();
  if (!session.value) {
    loading.value = false;
    navigateTo("/admin");
    return;
  }
  // 想法为全局内容，仅总管理可管理；项目管理重定向回控制台
  if (session.value.role === "PROJECT_MANAGER") {
    loading.value = false;
    message.warning("仅总管理可管理想法");
    navigateTo("/admin/manage");
    return;
  }
  idea.value = await getIdeaAdmin(ideaId.value);
  loading.value = false;
});

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "未记录时间");

const ideaStatusLabel = (status?: string) => {
  switch (status) {
    case "pending":
      return "待审核";
    case "approved":
      return "审核通过";
    case "rejected":
      return "审核未通过";
    default:
      return status || "未知";
  }
};

const statusTagType = (status?: string): "warning" | "success" | "error" | "default" => {
  switch (status) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "error";
    default:
      return "default";
  }
};

/* ---------- 编辑 ---------- */

const formRef = ref<FormInst | null>(null);
const showEditModal = ref(false);
const submitting = ref(false);

const form = reactive({
  title: "",
  status: "PENDING",
  nickName: "",
  mcId: "",
  content: "",
});

const rules: FormRules = {
  title: {required: true, message: "请填写标题", trigger: ["blur", "input"]},
  content: {required: true, message: "请填写正文", trigger: ["blur", "input"]},
};

const openEditModal = () => {
  const current = idea.value;
  if (!current) {
    return;
  }
  form.title = current.title ?? "";
  form.status = ideaStatusToEnum(current.reviewStatus);
  form.nickName = current.nickname ?? current.submitterName ?? "";
  form.mcId = current.minecraftId ?? "";
  form.content = current.content ?? "";
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
    const updated = await updateIdeaAdmin(ideaId.value, {
      title: form.title.trim(),
      content: form.content.trim(),
      nickName: form.nickName.trim(),
      mcId: form.mcId.trim(),
      status: form.status,
    });
    idea.value = updated;
    message.success("想法已更新");
    showEditModal.value = false;
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "保存失败，请稍后再试");
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async () => {
  try {
    await deleteIdeaBatch([ideaId.value]);
    message.success("想法已删除");
    navigateTo("/admin/manage/ideas");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "删除失败，请稍后再试");
  }
};

// 前端 ReviewStatus（pending/approved/rejected）→ 后端英文枚举，回填编辑表单用
const ideaStatusToEnum = (status?: string): string => {
  switch (status) {
    case "pending":
      return "PENDING";
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    default:
      return "PENDING";
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
  font-size: clamp(24px, 3.2vw, 40px);
  line-height: 1.1;
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

.idea-content {
  margin: 0 0 16px;
  padding: 14px 16px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: rgba(255, 248, 223, 0.7);
  color: #4f3924;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
}

.info-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
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

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.edit-grid :deep(.n-form-item) {
  margin-bottom: 0;
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
  .edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
