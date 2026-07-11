<template>
  <div class="image-uploader">
    <n-space :size="8" align="center" wrap>
      <n-upload
          :accept="accept"
          :custom-request="handleUpload"
          :show-file-list="false"
      >
        <n-button :loading="uploading">{{ uploading ? "上传中..." : buttonText }}</n-button>
      </n-upload>
      <n-input
          v-model:value="innerUrl"
          class="url-input"
          clearable
          placeholder="或直接粘贴图片地址"
          @update:value="emit('update:url', $event)"
      />
      <n-button v-if="innerUrl" quaternary size="small" type="error" @click="clear">清除</n-button>
    </n-space>
    <img v-if="innerUrl" :src="innerUrl" alt="图片预览" class="preview"/>
  </div>
</template>

<script lang="ts" setup>
import type {UploadCustomRequestOptions} from "naive-ui";

// 通用图片上传组件：上传到 /api/files 后把可访问 url 通过 v-model:url 回传给父级。
// 用于项目封面图、项目动态配图等场景；内置粘贴地址 + 预览 + 清除。
const props = withDefaults(defineProps<{
  url: string;
  buttonText?: string;
  // 可选：关联项目 id，上传时一并带给后端做归属记录
  objectItemId?: number | string;
  accept?: string;
}>(), {
  buttonText: "上传图片",
  accept: "image/*",
});

const emit = defineEmits<{
  (e: "update:url", value: string): void;
  (e: "uploaded", url: string): void;
}>();

const message = useMessage();
const {uploadFile} = useProjectHubApi();

const uploading = ref(false);
const innerUrl = ref(props.url);

// 父级外部更新 url（如编辑回填）时同步到内部输入框
watch(
    () => props.url,
    (value) => {
      innerUrl.value = value ?? "";
    },
);

const clear = () => {
  innerUrl.value = "";
  emit("update:url", "");
};

const handleUpload = async ({file, onFinish, onError}: UploadCustomRequestOptions) => {
  const raw = file.file;
  if (!raw) {
    onError();
    return;
  }
  try {
    uploading.value = true;
    const result = await uploadFile(raw, "IMAGE", props.objectItemId);
    if (result?.url) {
      innerUrl.value = result.url;
      emit("update:url", result.url);
      emit("uploaded", result.url);
      onFinish();
    } else {
      message.error("上传成功但未解析到图片地址");
      onError();
    }
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "图片上传失败");
    onError();
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.image-uploader {
  display: grid;
  gap: 8px;
}

.url-input {
  min-width: 220px;
  flex: 1;
}

.preview {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border: 2px solid #5a3a21;
  border-radius: 8px;
}
</style>
