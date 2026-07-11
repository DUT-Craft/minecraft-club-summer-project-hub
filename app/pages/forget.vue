<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <section class="login-shell">
        <header class="login-head">
          <p class="eyebrow">Reset Password</p>
          <h1>找回密码</h1>
          <p class="sub">通过邮箱验证码重置账号密码</p>
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
            <n-form-item label="注册邮箱" path="email">
              <n-input
                  v-model:value="form.email"
                  clearable
                  placeholder="输入注册时使用的邮箱"
              />
            </n-form-item>
            <n-form-item label="邮箱验证码" path="emailCode">
              <VerificationCodeInput
                  :code="form.emailCode"
                  :email="form.email"
                  scene="RESET_PASSWORD"
                  @update:code="form.emailCode = $event"
              />
            </n-form-item>
            <n-form-item label="新密码" path="newPassword">
              <n-input
                  v-model:value="form.newPassword"
                  placeholder="设置新的登录密码"
                  show-password-on="click"
                  type="password"
              />
            </n-form-item>
            <n-button :loading="submitting" attr-type="submit" block type="primary">
              {{ submitting ? "重置中..." : "重置密码" }}
            </n-button>
          </n-form>
        </n-card>

        <p class="hint">
          重置成功后，该账号的所有登录会话将失效，请用新密码重新登录。
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
const {resetPassword} = useProjectHubApi();

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

const form = reactive({
  email: "",
  emailCode: "",
  newPassword: "",
});

const rules: FormRules = {
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
  emailCode: {required: true, message: "请输入邮箱验证码", trigger: ["blur", "input"]},
  newPassword: {required: true, message: "请输入新密码", trigger: ["blur", "input"]},
};

// 找回密码：POST /api/auth/reset-password（匿名，凭邮箱验证码重置）
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    await resetPassword({
      email: form.email.trim(),
      emailCode: form.emailCode.trim(),
      newPassword: form.newPassword,
    });
    message.success("密码已重置，请用新密码登录");
    await navigateTo("/admin");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "重置失败，请稍后再试");
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
