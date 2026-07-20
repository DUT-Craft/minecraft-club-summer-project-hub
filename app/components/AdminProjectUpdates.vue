<template>
  <n-card :bordered="false" class="manager-card">
    <template #header>
      <div class="panel-head">
        <span class="eyebrow">Project Updates</span>
        <h2>项目动态管理</h2>
      </div>
    </template>
    <template #header-extra>
      <n-space :size="8" align="center" wrap>
        <n-select
            v-model:value="filter"
            :options="filterOptions"
            class="filter-select"
            size="small"
        />
        <n-button :loading="loading" size="small" @click="load">
          {{ updates.length || loaded ? "刷新" : "加载动态" }}
        </n-button>
        <n-button size="small" type="primary" @click="openCreate">发布动态</n-button>
      </n-space>
    </template>

    <n-empty
        v-if="!updates.length"
        description="暂无动态，点击「发布动态」向关注者同步项目进展。"
    />
    <div v-else class="update-list">
      <article
          v-for="item in updates"
          :key="item.id"
          class="update-card"
      >
        <div class="update-head">
          <span class="update-title">{{ item.title || "（未命名动态）" }}</span>
          <n-tag :bordered="false" :type="statusTagType(item.reviewStatus)" round size="small">
            {{ statusLabel(item.reviewStatus) }}
          </n-tag>
        </div>
        <span class="update-time">{{ formatTime(item.createdAt) }}</span>
        <img v-if="item.imageUrl" :alt="item.title" :src="item.imageUrl" class="update-image"/>
        <p v-if="item.content" class="update-content">{{ item.content }}</p>
        <div class="update-actions">
          <n-button size="small" @click="openEdit(item)">编辑</n-button>
          <n-popconfirm @positive-click="handleDelete(item)">
            <template #trigger>
              <n-button quaternary size="small" type="error">删除</n-button>
            </template>
            确定删除这条动态吗？删除后将不再公开展示。
          </n-popconfirm>
        </div>
      </article>
    </div>

    <!-- 发布 / 编辑动态：同一个弹窗，editingId 为空=新建，有值=编辑 -->
    <n-modal
        v-model:show="showModal"
        :bordered="false"
        :mask-closable="false"
        :title="editingId ? '编辑动态' : '发布动态'"
        preset="card"
        style="width: min(640px, calc(100% - 28px))"
    >
      <n-form
          ref="formRef"
          :model="form"
          :rules="rules"
          :show-require-mark="false"
          label-placement="top"
          size="medium"
          @submit.prevent="handleSubmit"
      >
        <n-form-item label="动态标题" path="title">
          <n-input v-model:value="form.title" placeholder="例如：第一周开发进展"/>
        </n-form-item>
        <n-form-item label="正文" path="content">
          <n-input
              v-model:value="form.content"
              :rows="5"
              placeholder="向关注者同步本阶段的进展、成果或调整"
              type="textarea"
          />
        </n-form-item>
        <n-form-item label="配图" path="imageUrl">
          <ImageUploader
              :url="form.imageUrl"
              button-text="上传配图"
              @update:url="form.imageUrl = $event"
          />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="modal-footer">
          <n-button @click="showModal = false">取消</n-button>
          <n-button :loading="submitting" type="primary" @click="handleSubmit">
            {{ submitting ? "保存中..." : (editingId ? "保存修改" : "立即发布") }}
          </n-button>
        </div>
      </template>
    </n-modal>
  </n-card>
</template>

<script lang="ts" setup>
import type {FormInst, FormRules} from "naive-ui";
import type {ProjectUpdate} from "~/types/projectHub";

// 由父级传入项目 ID；统一走 JWT 鉴权接口（项目 OWNER/MANAGER 或超管，由后端 AccessService 校验）。
const props = defineProps<{
  projectId: string | number;
}>();

const message = useMessage();
const {
  listProjectUpdatesAdmin,
  createProjectUpdateAdmin,
  updateProjectUpdateAdmin,
  deleteProjectUpdateAdmin,
} = useProjectHubApi();

const updates = ref<ProjectUpdate[]>([]);
const loading = ref(false);
const loaded = ref(false);
// 默认拉全部，让管理者一眼看到刚发布的 PENDING 与已公开的 APPROVED
const filter = ref<string>("");

const filterOptions = [
  {label: "全部", value: ""},
  {label: "待审核", value: "PENDING"},
  {label: "已公开", value: "APPROVED"},
  {label: "未通过", value: "REJECTED"},
];

const load = async () => {
  try {
    loading.value = true;
    const list = await listProjectUpdatesAdmin(props.projectId, filter.value || undefined);
    updates.value = list;
    loaded.value = true;
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "加载动态列表失败");
    updates.value = [];
  } finally {
    loading.value = false;
  }
};

// 切换筛选时若已加载过则自动刷新，避免空列表悄悄请求
watch(filter, () => {
  if (loaded.value) {
    load();
  }
});

// 进入页面自动拉取一次动态列表，免去手动点「加载动态」
onMounted(() => {
  load();
});

/* ---------- 发布 / 编辑 ---------- */

const formRef = ref<FormInst | null>(null);
const showModal = ref(false);
const submitting = ref(false);
// editingId 为 null 表示新建；有值表示编辑对应 updateId
const editingId = ref<string | null>(null);

const form = reactive({
  title: "",
  content: "",
  imageUrl: "",
});

const rules: FormRules = {
  title: {required: true, message: "请填写动态标题", trigger: ["blur", "input"]},
  content: {required: true, message: "请填写动态正文", trigger: ["blur", "input"]},
};

const resetForm = () => {
  form.title = "";
  form.content = "";
  form.imageUrl = "";
  editingId.value = null;
};

const openCreate = () => {
  resetForm();
  showModal.value = true;
};

const openEdit = (item: ProjectUpdate) => {
  editingId.value = item.id;
  form.title = item.title ?? "";
  form.content = item.content ?? "";
  form.imageUrl = item.imageUrl ?? "";
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      imageUrl: form.imageUrl.trim(),
    };
    if (editingId.value) {
      await updateProjectUpdateAdmin(props.projectId, editingId.value, payload);
      message.success("动态已更新");
    } else {
      await createProjectUpdateAdmin(props.projectId, payload);
      message.success("动态已发布");
    }
    showModal.value = false;
    await load();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "保存失败，请稍后再试");
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (item: ProjectUpdate) => {
  try {
    await deleteProjectUpdateAdmin(props.projectId, item.id);
    message.success("动态已删除");
    await load();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "删除失败，请稍后再试");
  }
};

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "未记录时间");

// reviewStatus 是前端 ReviewStatus 联合（pending/approved/...），这里映射为动态展示文案与配色
const statusLabel = (status?: string) => {
  switch (status) {
    case "pending":
      return "待审核";
    case "approved":
      return "已公开";
    case "rejected":
      return "未通过";
    case "deleted":
      return "已删除";
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
    case "deleted":
      return "default";
    default:
      return "default";
  }
};
</script>

<style scoped>
.manager-card {
  width: min(1080px, calc(100% - 28px));
  margin: 16px auto 0;
}

/* 与项目方管理页一致的 Minecraft 木边面板 */
:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 6px 0 #5a3a21;
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

.filter-select {
  width: 120px;
}

.update-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.update-card {
  position: relative;
  padding: 14px 16px 14px 20px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
  box-shadow: 0 3px 0 rgba(90, 58, 33, 0.18);
  overflow: hidden;
}

.update-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #6b8f32;
}

.update-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}

.update-title {
  font-weight: 900;
  color: #2d2418;
  font-size: 16px;
  word-break: break-word;
}

.update-time {
  display: block;
  margin-bottom: 8px;
  color: #795b36;
  font-size: 13px;
  font-weight: 700;
}

.update-image {
  width: 100%;
  max-height: 220px;
  margin-bottom: 8px;
  object-fit: cover;
  border: 2px solid #5a3a21;
  border-radius: 8px;
}

.update-content {
  margin: 0;
  color: #4f3924;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.update-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
