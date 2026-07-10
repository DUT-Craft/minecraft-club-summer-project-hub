<template>
  <n-card class="manager-card" :bordered="false">
    <template #header>
      <div class="panel-head">
        <span class="eyebrow">Comment Moderation</span>
        <h2>评论审核</h2>
      </div>
    </template>
    <template #header-extra>
      <n-space :size="8" align="center" wrap>
        <n-select
          v-model:value="filter"
          :options="filterOptions"
          size="small"
          class="filter-select"
        />
        <n-button size="small" :loading="loading" @click="load">
          {{ comments.length || loaded ? "刷新" : "加载评论" }}
        </n-button>
      </n-space>
    </template>

    <n-empty
      v-if="!comments.length"
      description="暂无待审核评论，点击右上角「刷新」可重新拉取。"
    />
    <div v-else class="comment-list">
      <article
        v-for="item in comments"
        :key="item.id"
        class="comment-card"
      >
        <div class="comment-head">
          <span class="comment-author">{{ item.nickname || "匿名访客" }}</span>
          <n-tag :bordered="false" size="small" round :type="statusTagType(item.reviewStatus)">
            {{ statusLabel(item.reviewStatus) }}
          </n-tag>
        </div>
        <span class="comment-time">{{ formatTime(item.createdAt) }}</span>
        <p class="comment-content">{{ item.content || "（空内容）" }}</p>
        <div class="comment-actions">
          <n-button
            size="small"
            type="primary"
            :disabled="item.reviewStatus === 'approved'"
            :loading="processingId === item.id"
            @click="handleModerate(item, 'APPROVED')"
          >
            通过
          </n-button>
          <n-button
            size="small"
            :disabled="item.reviewStatus === 'rejected'"
            :loading="processingId === item.id"
            @click="handleModerate(item, 'REJECTED')"
          >
            拒绝
          </n-button>
          <n-popconfirm @positive-click="handleModerate(item, 'DELETED')">
            <template #trigger>
              <n-button
                size="small"
                quaternary
                type="error"
                :disabled="item.reviewStatus === 'deleted'"
                :loading="processingId === item.id"
              >
                删除
              </n-button>
            </template>
            确定删除这条评论吗？
          </n-popconfirm>
        </div>
      </article>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import type { ProjectComment } from "~/types/projectHub";

// 由父级（项目方管理页）传入：项目 ID + 当前会话的控制密码明文
const props = defineProps<{
  projectId: string | number;
  controlPassword: string;
}>();

const message = useMessage();
const { loadProjectCommentsAdmin, moderateProjectComment } = useProjectHubApi();

const comments = ref<ProjectComment[]>([]);
const loading = ref(false);
const loaded = ref(false);
// 默认拉全部评论；用户可按状态筛选待审核 / 已公开 / 未通过 / 已删除
const filter = ref<string>("");
// processingId 标记当前在 通过/拒绝/删除 的评论，给该行所有按钮置 loading
const processingId = ref<string | null>(null);

const filterOptions = [
  { label: "待审核", value: "PENDING" },
  { label: "已公开", value: "APPROVED" },
  { label: "未通过", value: "REJECTED" },
  { label: "已删除", value: "DELETED" },
  { label: "全部", value: "" },
];

const load = async () => {
  try {
    loading.value = true;
    const list = await loadProjectCommentsAdmin(props.projectId, props.controlPassword, filter.value || undefined);
    comments.value = list;
    loaded.value = true;
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "加载评论列表失败");
    comments.value = [];
  } finally {
    loading.value = false;
  }
};

watch(filter, () => {
  if (loaded.value) {
    load();
  }
});

// 进入页面自动拉取一次待审核评论，免去手动点「加载评论」
onMounted(() => {
  load();
});

const handleModerate = async (item: ProjectComment, status: "APPROVED" | "REJECTED" | "DELETED") => {
  try {
    processingId.value = item.id;
    await moderateProjectComment(props.projectId, item.id, props.controlPassword, status);
    const action = status === "APPROVED" ? "已通过" : status === "REJECTED" ? "已拒绝" : "已删除";
    message.success(`评论${action}`);
    // 状态变更后重新加载，保持列表与后端一致（停留在「待审核」视图时该条会离开列表）
    await load();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "操作失败，请稍后再试");
  } finally {
    processingId.value = null;
  }
};

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "未记录时间");

const statusLabel = (status?: string) => {
  switch (status) {
    case "pending": return "待审核";
    case "approved": return "已公开";
    case "rejected": return "未通过";
    case "deleted": return "已删除";
    default: return status || "未知";
  }
};

const statusTagType = (status?: string): "warning" | "success" | "error" | "default" => {
  switch (status) {
    case "pending": return "warning";
    case "approved": return "success";
    case "rejected": return "error";
    case "deleted": return "default";
    default: return "default";
  }
};
</script>

<style scoped>
.manager-card {
  width: min(1080px, calc(100% - 28px));
  margin: 16px auto 0;
}

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

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  position: relative;
  padding: 14px 16px 14px 20px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
  box-shadow: 0 3px 0 rgba(90, 58, 33, 0.18);
  overflow: hidden;
}

.comment-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #6b8f32;
}

.comment-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}

.comment-author {
  font-weight: 900;
  color: #2d2418;
  font-size: 16px;
  word-break: break-word;
}

.comment-time {
  display: block;
  margin-bottom: 8px;
  color: #795b36;
  font-size: 13px;
  font-weight: 700;
}

.comment-content {
  margin: 0;
  color: #4f3924;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
