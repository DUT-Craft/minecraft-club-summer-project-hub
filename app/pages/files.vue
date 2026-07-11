<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <n-card :bordered="false" class="page-head">
        <div class="head-info">
          <span class="head-eyebrow">My Files</span>
          <h1>我的文件</h1>
          <span class="head-count">已上传 {{ total }} 个文件</span>
        </div>
        <n-space :size="8" align="center">
          <n-upload :custom-request="handleUpload" :show-file-list="false" multiple>
            <n-button :loading="uploading" size="large" type="primary">
              {{ uploading ? "上传中..." : "上传文件" }}
            </n-button>
          </n-upload>
          <n-button :loading="loading" size="large" @click="load">刷新</n-button>
        </n-space>
      </n-card>

      <!-- 未登录（无 JWT）：上传/列表均需登录，引导去后台登录 -->
      <n-card v-if="!hasToken" :bordered="false" class="hint-card">
        <n-empty description="查看与管理你上传的文件需要先登录">
          <template #extra>
            <n-button type="primary" @click="navigateTo('/admin')">前往登录</n-button>
          </template>
        </n-empty>
      </n-card>

      <template v-else>
        <div v-if="files.length" class="file-grid">
          <n-card v-for="item in files" :key="item.storedName" :bordered="false" class="file-card">
            <div class="file-thumb">
              <img v-if="isImage(item)" :alt="item.originalName" :src="previewUrl(item)"/>
              <span v-else class="file-ext">{{ extOf(item) || "FILE" }}</span>
            </div>
            <div class="file-meta">
              <strong :title="item.originalName" class="file-name">{{ item.originalName }}</strong>
              <span class="file-sub">
                {{ formatSize(item.size) }} · {{ item.category === "IMAGE" ? "图片" : "文档" }}
              </span>
              <span class="file-time">{{ formatTime(item.createTime) }}</span>
            </div>
            <div class="file-actions">
              <n-button size="small" @click="downloadFile(item)">下载</n-button>
              <n-button v-if="isImage(item)" quaternary size="small" @click="previewInNewTab(item)">
                预览
              </n-button>
              <n-popconfirm @positive-click="handleDelete(item)">
                <template #trigger>
                  <n-button quaternary size="small" type="error">删除</n-button>
                </template>
                删除后无法恢复，确认删除该文件？
              </n-popconfirm>
            </div>
          </n-card>
        </div>

        <n-empty v-else-if="!loading" class="empty-space" description="还没有上传任何文件"/>

        <div v-if="totalPages > 1" class="pager">
          <n-pagination
              v-model:page="page"
              :page-count="totalPages"
              :page-size="pageSize"
              @update:page="load"
          />
        </div>
      </template>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {UploadCustomRequestOptions} from "naive-ui";
import type {FileItem} from "~/types/projectHub";

definePageMeta({
  layout: false,
});

const message = useMessage();
const {listMyFiles, deleteFile, uploadFile} = useProjectHubApi();
// Minecraft 暖色主题（草地绿主色 + 羊皮纸卡片），见 useMinecraftTheme
const {themeOverrides} = useMinecraftTheme();

// 登录态：文件功能需 JWT（管理员 / 项目管理账号）。access token 存于 chat_auth_token cookie。
const authToken = useCookie<string | null>("chat_auth_token", {sameSite: "lax", path: "/"});
const hasToken = computed(() => !!authToken.value);

const files = ref<FileItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const totalPages = ref(0);
const loading = ref(false);
const uploading = ref(false);

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

const extOf = (item: FileItem) => {
  const idx = item.originalName.lastIndexOf(".");
  return idx >= 0 ? item.originalName.slice(idx + 1).toUpperCase() : "";
};
const isImage = (item: FileItem) =>
    item.category === "IMAGE" || (item.mimeType ?? "").startsWith("image/");
// 图片可匿名 inline 预览；下载用后端返回的 url（attachment）
const previewUrl = (item: FileItem) => `${item.url}?inline=true`;
const previewInNewTab = (item: FileItem) => window.open(previewUrl(item), "_blank");

const load = async () => {
  if (!hasToken.value) {
    return;
  }
  try {
    loading.value = true;
    // 后端页码从 0 开始，前端展示从 1 开始
    const data = await listMyFiles(page.value - 1, pageSize);
    files.value = data.content;
    total.value = data.totalElements;
    totalPages.value = data.totalPages;
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "加载文件列表失败");
    files.value = [];
  } finally {
    loading.value = false;
  }
};

const handleUpload = async ({file, onFinish, onError}: UploadCustomRequestOptions) => {
  const raw = file.file;
  if (!raw) {
    onError();
    return;
  }
  const ext = extOf({originalName: raw.name} as FileItem).toLowerCase();
  const type = IMAGE_EXTS.includes(ext) ? "IMAGE" : "DOCUMENT";
  try {
    uploading.value = true;
    await uploadFile(raw, type);
    message.success(`${raw.name} 上传成功`);
    onFinish();
    // 上传后回到第一页，便于立刻看到新文件
    page.value = 1;
    await load();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "上传失败");
    onError();
  } finally {
    uploading.value = false;
  }
};

const handleDelete = async (item: FileItem) => {
  try {
    await deleteFile(item.storedName);
    message.success("文件已删除");
    // 当前页删空且不是首页时，回退一页
    if (files.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }
    await load();
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "删除失败");
  }
};

// 下载：文档是私有资源，window.open 不带 Authorization 头会 401，统一走带 token 的 blob 下载。
const downloadFile = async (item: FileItem) => {
  try {
    const headers: Record<string, string> = {};
    if (authToken.value) {
      headers.Authorization = `Bearer ${authToken.value}`;
    }
    const blob = await $fetch(item.url, {responseType: "blob", headers});
    const objectUrl = URL.createObjectURL(blob as Blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = item.originalName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "下载失败");
  }
};

const formatSize = (bytes?: number) => {
  if (!bytes && bytes !== 0) {
    return "未知大小";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatTime = (value?: string) =>
    value ? new Date(value).toLocaleString("zh-CN") : "未记录时间";

onMounted(() => {
  load();
});
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

.page-head,
.file-grid,
.empty-space,
.hint-card,
.pager {
  width: min(1180px, calc(100% - 28px));
  margin: 22px auto 0;
}

:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 6px 0 #5a3a21;
}

.page-head :deep(.n-card__content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.head-eyebrow {
  display: block;
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
}

.head-info h1 {
  margin: 6px 0 0;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.08;
  color: #2d2418;
}

.head-count {
  display: block;
  margin-top: 6px;
  color: #795b36;
  font-size: 13px;
  font-weight: 700;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.file-card :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-thumb {
  height: 140px;
  display: grid;
  place-items: center;
  border: 2px solid #8b6a3d;
  border-radius: 8px;
  background: rgba(255, 248, 223, 0.72);
  overflow: hidden;
}

.file-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-ext {
  color: #795b36;
  font-weight: 900;
  font-size: 22px;
  letter-spacing: 0.08em;
}

.file-meta {
  display: grid;
  gap: 3px;
}

.file-name {
  color: #2d2418;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-sub {
  color: #60462b;
  font-size: 13px;
  font-weight: 700;
}

.file-time {
  color: #795b36;
  font-size: 12px;
}

.file-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (width <= 680px) {
  .page-head :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
