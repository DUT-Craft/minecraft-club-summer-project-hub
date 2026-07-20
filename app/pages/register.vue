<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <section class="login-shell">
        <header class="login-head">
          <p class="eyebrow">Sign Up</p>
          <h1>注册账号</h1>
          <p class="sub">公开注册为普通用户，创建项目需总管理授权</p>
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
            <n-form-item label="账号" path="username">
              <n-input
                  v-model:value="form.username"
                  clearable
                  placeholder="3-32 位，字母/数字/下划线/短横线"
              />
            </n-form-item>
            <n-form-item label="密码" path="password">
              <n-input
                  v-model:value="form.password"
                  placeholder="8-64 位，含大写/小写/数字/特殊字符三类"
                  show-password-on="click"
                  type="password"
              />
            </n-form-item>
            <n-form-item label="确认密码" path="confirmPassword">
              <n-input
                  v-model:value="form.confirmPassword"
                  placeholder="再次输入密码"
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
            <n-form-item label="邮箱验证码" path="emailCode">
              <VerificationCodeInput
                  :code="form.emailCode"
                  :email="form.email"
                  scene="REGISTER"
                  @update:code="form.emailCode = $event"
              />
            </n-form-item>
            <n-button :loading="submitting" attr-type="submit" block type="primary">
              {{ submitting ? "注册中..." : "注册" }}
            </n-button>
          </n-form>
        </n-card>

        <p class="hint">
          注册为普通用户，可投稿想法 / 评论 / 加入申请；创建项目需总管理在用户管理页授权。
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
const {registerUser} = useProjectHubApi();

const submitting = ref(false);

const formRef = ref<FormInst | null>(null);

const form = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  emailCode: "",
});

const rules = computed<FormRules>(() => {
  const base: FormRules = {
    username: {required: true, message: "请输入账号", trigger: ["blur", "input"]},
    password: {
      required: true,
      trigger: ["blur", "input"],
      validator: (_rule, value) => {
        if (!value) return new Error("请输入密码");
        if (value.length < 8 || value.length > 64) return new Error("密码长度需为 8-64 位");
        return true;
      },
    },
    confirmPassword: {
      required: true,
      trigger: ["blur", "input"],
      validator: (_rule, value) => {
        if (!value) return new Error("请再次输入密码");
        if (value !== form.password) return new Error("两次密码不一致");
        return true;
      },
    },
    emailCode: {required: true, message: "请输入邮箱验证码", trigger: ["blur", "input"]},
    email: {
      required: true,
      trigger: ["blur", "input"],
      validator: (_rule, value) => {
        if (!value) return new Error("请输入邮箱");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return new Error("邮箱格式不正确");
        return true;
      },
    },
  };
  return base;
});

// 公开注册（POST /api/auth/register）
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    const result = await registerUser({
      username: form.username.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      email: form.email.trim(),
      emailCode: form.emailCode.trim(),
    });
    message.success(`注册成功：${result.username}，请登录`);
    form.password = "";
    form.confirmPassword = "";
    form.emailCode = "";
    await navigateTo("/admin");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "注册失败，请检查输入或稍后再试");
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
