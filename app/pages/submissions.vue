<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <n-card class="page-head" :bordered="false">
        <div>
          <p>Submission Status</p>
          <h1>我的提交</h1>
        </div>
        <n-button type="primary" size="large" :loading="refreshingAll" @click="refreshAll">刷新全部</n-button>
      </n-card>

      <section v-if="items.length" class="submission-list">
        <article v-for="item in items" :key="`${item.kind}:${item.id}`" class="submission-row">
          <div class="row-main">
            <div class="row-head">
              <span class="kind">{{ item.kind === "idea" ? "想法" : "加入申请" }}</span>
              <n-tag :bordered="false" :type="statusType(item.status)">{{ statusLabel(item.status) }}</n-tag>
            </div>
            <h2>{{ item.title }}</h2>
            <div class="meta">
              <span>#{{ item.id }}</span>
              <span>{{ formatTime(item.submittedAt) }}</span>
            </div>
            <p v-if="item.rejectReason" class="reject-reason">{{ item.rejectReason }}</p>
          </div>
          <div class="row-actions">
            <n-button :loading="refreshingKey === `${item.kind}:${item.id}`" @click="refreshOne(item)">刷新</n-button>
            <n-button @click="copyToken(item.trackingToken)">复制追踪码</n-button>
            <n-popconfirm @positive-click="remove(item.kind, item.id)">
              <template #trigger>
                <n-button type="error" quaternary>移除</n-button>
              </template>
              从当前浏览器移除这条记录？
            </n-popconfirm>
          </div>
        </article>
      </section>

      <n-empty v-else class="empty-space" description="当前浏览器还没有可追踪的提交">
        <template #extra>
          <n-button type="primary" @click="navigateTo('/submit')">去提交项目或想法</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script setup lang="ts">
import type { AnonymousSubmissionRecord } from "~/types/projectHub";

definePageMeta({ layout: false });

const message = useMessage();
const { themeOverrides } = useMinecraftTheme();
const { records, read, update, remove } = useAnonymousSubmissions();
const { loadTrackedIdea, loadTrackedJoinApplication } = useProjectHubApi();
const refreshingKey = ref("");
const refreshingAll = ref(false);
const items = computed(() => [...records.value].sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt)));

onMounted(() => read());

const refreshOne = async (item: AnonymousSubmissionRecord, quiet = false) => {
  const key = `${item.kind}:${item.id}`;
  try {
    refreshingKey.value = key;
    if (item.kind === "idea") {
      const result = await loadTrackedIdea(item.id, item.trackingToken);
      update(item.kind, item.id, {
        status: result.reviewStatus,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const result = await loadTrackedJoinApplication(item.projectId || "", item.id, item.trackingToken);
      update(item.kind, item.id, {
        status: result.status || "PENDING",
        rejectReason: result.rejectReason,
        updatedAt: result.updateTime || new Date().toISOString(),
      });
    }
    if (!quiet) message.success("状态已更新");
  } catch (error) {
    if (!quiet) message.error(error instanceof Error ? error.message : "状态查询失败");
  } finally {
    refreshingKey.value = "";
  }
};

const refreshAll = async () => {
  refreshingAll.value = true;
  await Promise.all(items.value.map((item) => refreshOne(item, true)));
  refreshingAll.value = false;
  message.success("已完成状态同步");
};

const copyToken = async (token: string) => {
  await navigator.clipboard.writeText(token);
  message.success("追踪码已复制");
};

const statusLabel = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "PENDING": return "待处理";
    case "APPROVED": return "已公开";
    case "CONTACTED": return "已联系";
    case "ACCEPTED": return "已接受";
    case "REJECTED": return "未通过";
    case "DELETED": return "已删除";
    default: return status || "未知";
  }
};

const statusType = (status?: string): "warning" | "success" | "info" | "error" | "default" => {
  switch ((status || "").toUpperCase()) {
    case "PENDING": return "warning";
    case "APPROVED":
    case "ACCEPTED": return "success";
    case "CONTACTED": return "info";
    case "REJECTED":
    case "DELETED": return "error";
    default: return "default";
  }
};

const formatTime = (value?: string) => value ? new Date(value).toLocaleString("zh-CN") : "未记录时间";
</script>

<style scoped>
.mc-page {
  min-height: 100dvh;
  padding-bottom: 42px;
  color: #2d2418;
  background:
    linear-gradient(rgba(97, 153, 202, 0.17) 1px, transparent 1px),
    linear-gradient(90deg, rgba(97, 153, 202, 0.17) 1px, transparent 1px),
    #dff0ff;
  background-size: 26px 26px, 26px 26px, auto;
}

.page-head,
.submission-list,
.empty-space {
  width: min(980px, calc(100% - 28px));
  margin: 22px auto 0;
}

:deep(.n-card),
.submission-row {
  border: 2px solid #5a3a21;
  box-shadow: 0 5px 0 #5a3a21;
}

.page-head :deep(.n-card-content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-head p,
.page-head h1 {
  margin: 0;
}

.page-head p {
  color: #6b8f32;
  font-weight: 900;
}

.page-head h1 {
  margin-top: 4px;
  font-size: 38px;
}

.submission-list {
  display: grid;
  gap: 14px;
}

.submission-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  padding: 18px;
  border-radius: 8px;
  background: #fff5cf;
}

.row-main {
  min-width: 0;
}

.row-head,
.meta,
.row-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.kind {
  font-weight: 900;
  color: #6b8f32;
}

h2 {
  margin: 8px 0;
  overflow-wrap: anywhere;
}

.meta {
  color: #795b36;
  font-size: 13px;
  font-weight: 700;
}

.reject-reason {
  margin: 10px 0 0;
  color: #9b3f35;
  overflow-wrap: anywhere;
}

.row-actions {
  align-content: center;
  justify-content: flex-end;
  max-width: 210px;
}

@media (width <= 680px) {
  .page-head :deep(.n-card-content),
  .submission-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .page-head :deep(.n-card-content) {
    flex-direction: column;
  }

  .row-actions {
    justify-content: flex-start;
    max-width: none;
  }
}
</style>
