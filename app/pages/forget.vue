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

        <div class="tabs" role="tablist">
          <button
              :aria-selected="mode === 'password'"
              :class="['tab', { active: mode === 'password' }]"
              role="tab"
              type="button"
              @click="switchMode('password')"
          >
            <span class="tab-title">找回密码</span>
            <span class="tab-sub">邮箱验证码重置</span>
          </button>
          <button
              :aria-selected="mode === 'username'"
              :class="['tab', { active: mode === 'username' }]"
              role="tab"
              type="button"
              @click="switchMode('username')"
          >
            <span class="tab-title">找回用户名</span>
            <span class="tab-sub">发送至绑定邮箱</span>
          </button>
        </div>

        <n-card :bordered="false" class="panel">
          <n-form
              v-if="mode === 'password'"
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
                  placeholder="8-64 位，含大写/小写/数字/特殊字符三类"
                  show-password-on="click"
                  type="password"
              />
            </n-form-item>
            <n-form-item label="确认密码" path="confirmPassword">
              <n-input
                  v-model:value="form.confirmPassword"
                  placeholder="再次输入新密码"
                  show-password-on="click"
                  type="password"
              />
            </n-form-item>
            <n-button :loading="submitting" attr-type="submit" block type="primary">
              {{ submitting ? "重置中..." : "重置密码" }}
            </n-button>
          </n-form>

          <n-form
              v-else
              ref="usernameFormRef"
              :model="usernameForm"
              :rules="usernameRules"
              :show-require-mark="false"
              label-placement="top"
              size="large"
              @submit.prevent="handleRecoverUsername"
          >
            <n-form-item label="注册邮箱" path="email">
              <n-input
                  v-model:value="usernameForm.email"
                  clearable
                  placeholder="输入注册时使用的邮箱"
              />
            </n-form-item>
            <n-form-item label="邮箱验证码" path="emailCode">
              <VerificationCodeInput
                  :code="usernameForm.emailCode"
                  :email="usernameForm.email"
                  scene="RECOVER_USERNAME"
                  @update:code="usernameForm.emailCode = $event"
              />
            </n-form-item>
            <n-button :loading="submitting" attr-type="submit" block type="primary">
              {{ submitting ? "发送中..." : "发送用户名" }}
            </n-button>
          </n-form>
        </n-card>

        <p class="hint">
          重置 / 找回成功后，相关信息将发送至绑定邮箱。重置密码后所有登录会话将失效。
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
const {resetPassword, recoverUsername} = useProjectHubApi();

type ForgetMode = "password" | "username";
const mode = ref<ForgetMode>("password");
const submitting = ref(false);

const switchMode = (next: ForgetMode) => {
  if (mode.value === next || submitting.value) return;
  mode.value = next;
};

const formRef = ref<FormInst | null>(null);
const usernameFormRef = ref<FormInst | null>(null);

const form = reactive({
  email: "",
  emailCode: "",
  newPassword: "",
  confirmPassword: "",
});

const usernameForm = reactive({
  email: "",
  emailCode: "",
});

const emailValidator = (_rule: unknown, value: unknown) => {
  if (!value) {
    return new Error("请输入邮箱");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    return new Error("邮箱格式不正确");
  }
  return true;
};

const rules: FormRules = {
  email: {required: true, trigger: ["blur", "input"], validator: emailValidator},
  emailCode: {required: true, message: "请输入邮箱验证码", trigger: ["blur", "input"]},
  newPassword: {
    required: true,
    trigger: ["blur", "input"],
    validator: (_rule, value) => {
      if (!value) return new Error("请输入新密码");
      if (value.length < 8 || value.length > 64) return new Error("密码长度需为 8-64 位");
      return true;
    },
  },
  confirmPassword: {
    required: true,
    trigger: ["blur", "input"],
    validator: (_rule, value) => {
      if (!value) return new Error("请再次输入新密码");
      if (value !== form.newPassword) return new Error("两次密码不一致");
      return true;
    },
  },
};

const usernameRules: FormRules = {
  email: {required: true, trigger: ["blur", "input"], validator: emailValidator},
  emailCode: {required: true, message: "请输入邮箱验证码", trigger: ["blur", "input"]},
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
      confirmPassword: form.confirmPassword,
    });
    message.success("密码已重置，请用新密码登录");
    await navigateTo("/admin");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "重置失败，请稍后再试");
  } finally {
    submitting.value = false;
  }
};

// 找回用户名：POST /api/auth/username/recover（匿名，用户名发送至绑定邮箱，不回显）
const handleRecoverUsername = async () => {
  try {
    await usernameFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    await recoverUsername({
      email: usernameForm.email.trim(),
      emailCode: usernameForm.emailCode.trim(),
    });
    message.success("若该邮箱已注册，用户名已发送至该邮箱");
    usernameForm.emailCode = "";
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "发送失败，请稍后再试");
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

.tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px 14px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: rgba(255, 248, 223, 0.6);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.tab:hover {
  background: #fff8df;
  border-color: #6b8f32;
}

.tab.active {
  background: #fff8df;
  border-color: #6b8f32;
  box-shadow: 0 4px 0 #6b8f32;
}

.tab-title {
  font-weight: 900;
  font-size: 16px;
  color: #2d2418;
}

.tab-sub {
  font-size: 12px;
  color: #795b36;
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
