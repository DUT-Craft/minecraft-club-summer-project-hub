<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <section class="login-shell">
        <header class="login-head">
          <p class="eyebrow">Project Manager</p>
          <h1>项目管理注册</h1>
          <p class="sub">凭总管理发放的一次性邀请码注册项目管理账号</p>
        </header>

        <n-card :bordered="false" class="panel">
          <n-form
              ref="formRef"
              :model="form"
              :rules="rules"
              :show-require-mark="false"
              label-placement="top"
              size="large"
              @submit.prevent="handleSubmit"
          >
            <n-form-item label="邀请码" path="inviteCode">
              <n-input
                  v-model:value="form.inviteCode"
                  clearable
                  placeholder="总管理生成的一次性邀请码"
              />
            </n-form-item>
            <n-form-item label="账号" path="username">
              <n-input
                  v-model:value="form.username"
                  clearable
                  placeholder="设置登录账号"
              />
            </n-form-item>
            <n-form-item label="密码" path="password">
              <n-input
                  v-model:value="form.password"
                  placeholder="设置登录密码"
                  show-password-on="click"
                  type="password"
              />
            </n-form-item>
            <n-form-item label="邮箱" path="email">
              <n-input
                  v-model:value="form.email"
                  clearable
                  placeholder="用于找回与通知"
              />
            </n-form-item>
            <n-button :loading="submitting" attr-type="submit" block type="primary">
              {{ submitting ? "注册中..." : "注册并登录" }}
            </n-button>
          </n-form>
        </n-card>

        <p class="hint">
          邀请码仅可使用一次，注册成功后即可登录后台管理名下项目。没有邀请码请联系总管理获取。
        </p>

        <div class="back">
          <n-button text @click="navigateTo('/admin')">← 返回登录</n-button>
        </div>
      </section>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {FormInst, FormRules} from "naive-ui";

definePageMeta({
  layout: false,
});

const message = useMessage();
const {themeOverrides} = useMinecraftTheme();
const {registerManager} = useProjectHubApi();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

const form = reactive({
  inviteCode: "",
  username: "",
  password: "",
  email: "",
});

const rules: FormRules = {
  inviteCode: {required: true, message: "请输入邀请码", trigger: ["blur", "input"]},
  username: {required: true, message: "请输入账号", trigger: ["blur", "input"]},
  password: {required: true, message: "请输入密码", trigger: ["blur", "input"]},
  email: {
    required: true,
    trigger: ["blur", "input"],
    validator: (_rule, value) => {
      if (!value) {
        return new Error("请输入邮箱");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return new Error("邮箱格式不正确");
      }
      return true;
    },
  },
};

// 项目管理注册：POST /api/auth/register/manager（公开，凭一次性邀请码）
// 邀请码由后端原子消费（一码一次）；注册成功后跳转登录页，用刚注册的账号登录。
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    const result = await registerManager({
      inviteCode: form.inviteCode.trim(),
      username: form.username.trim(),
      password: form.password,
      email: form.email.trim(),
    });
    message.success(`注册成功：${result.username}，请登录`);
    form.password = "";
    form.inviteCode = "";
    await navigateTo("/admin");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "注册失败，请检查邀请码或稍后再试");
  } finally {
    submitting.value = false;
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

.login-shell {
  width: min(480px, calc(100% - 28px));
  margin: 28px auto 0;
}

.login-head {
  text-align: center;
  margin-bottom: 18px;
}

.login-head .eyebrow {
  margin: 0;
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.12em;
}

.login-head h1 {
  margin: 6px 0 0;
  font-size: clamp(28px, 4vw, 42px);
  color: #2d2418;
}

.login-head .sub {
  margin: 8px 0 0;
  color: #60462b;
  font-weight: 600;
}

:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 7px 0 #5a3a21;
}

.panel :deep(.n-card__content) {
  padding: 22px;
}

.panel :deep(.n-form) {
  display: grid;
  gap: 16px;
}

.panel :deep(.n-form-item) {
  margin-bottom: 0;
}

.panel :deep(.n-form-item-label) {
  font-weight: 900;
}

.hint {
  margin: 16px 0 0;
  padding: 0 6px;
  color: #795b36;
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
}

.back {
  margin-top: 14px;
  text-align: center;
}

.back :deep(.n-button) {
  color: #60462b;
  font-weight: 700;
}
</style>
