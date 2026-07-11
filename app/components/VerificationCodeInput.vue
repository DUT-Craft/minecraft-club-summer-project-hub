<template>
  <div class="verification-code-input">
    <n-input
        v-model:value="innerCode"
        :placeholder="placeholder"
        clearable
        @update:value="emit('update:code', $event)"
    />
    <n-button
        :disabled="counting || !canSend"
        :loading="sending"
        class="send-btn"
        type="primary"
        @click="handleSend"
    >
      {{ counting ? `${remain}s` : "发送验证码" }}
    </n-button>
  </div>
</template>

<script lang="ts" setup>
import type {VerificationScene} from "~/types/projectHub";

// 通用邮箱验证码输入组件：输入框 + 发送按钮（60s 倒计时）。
// 发送时调 /api/auth/verification-code，scene/email/userId 由父级传入。
// User-Agent 由浏览器自动带，后端按 email+UA 绑定验证码。
const props = withDefaults(defineProps<{
  code: string;
  email: string;
  scene: VerificationScene;
  userId?: number | string | null;
  placeholder?: string;
}>(), {
  placeholder: "输入邮箱验证码",
});

const emit = defineEmits<{
  (e: "update:code", value: string): void;
  (e: "sent"): void;
}>();

const message = useMessage();
const {sendVerificationCode} = useProjectHubApi();

const innerCode = ref(props.code);
const sending = ref(false);
const counting = ref(false);
const remain = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

// 父级外部更新 code（如表单重置）时同步到内部
watch(
    () => props.code,
    (value) => {
      innerCode.value = value ?? "";
    },
);

// 邮箱合法且非倒计时中才可发送
const canSend = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email));

const startCountdown = () => {
  counting.value = true;
  remain.value = 60;
  timer = setInterval(() => {
    remain.value -= 1;
    if (remain.value <= 0) {
      stopCountdown();
    }
  }, 1000);
};

const stopCountdown = () => {
  counting.value = false;
  remain.value = 0;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const handleSend = async () => {
  if (!canSend.value) {
    message.warning("请先填写有效的邮箱");
    return;
  }
  try {
    sending.value = true;
    await sendVerificationCode({
      email: props.email.trim(),
      scene: props.scene,
      userId: props.userId ?? null,
    });
    message.success("验证码已发送，请查收邮件");
    startCountdown();
    emit("sent");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "验证码发送失败");
  } finally {
    sending.value = false;
  }
};

onBeforeUnmount(() => {
  stopCountdown();
});
</script>

<style scoped>
.verification-code-input {
  display: flex;
  gap: 8px;
  align-items: center;
}

.send-btn {
  flex: 0 0 auto;
  white-space: nowrap;
}
</style>
