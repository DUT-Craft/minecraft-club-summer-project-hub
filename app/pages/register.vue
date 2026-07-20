<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <section class="login-shell">
        <header class="login-head">
          <p class="eyebrow">Sign Up</p>
          <h1>注册账号</h1>
          <p class="sub">公开注册为普通用户；凭邀请码注册可创建项目</p>
        </header>

        <div class="tabs" role="tablist">
          <button
              :aria-selected="mode === 'public'"
              :class="['tab', { active: mode === 'public' }]"
              role="tab"
              type="button"
              @click="switchMode('public')"
          >
            <span class="tab-title">公开注册</span>
            <span class="tab-sub">无需邀请码</span>
          </button>
          <button
              :aria-selected="mode === 'invite'"
              :class="['tab', { active: mode === 'invite' }]"
              role="tab"
              type="button"
              @click="switchMode('invite')"
          >
            <span class="tab-title">邀请码注册</span>
            <span class="tab-sub">可创建项目</span>
          </button>
        </div>

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
            <n-form-item v-if="mode === 'invite'" label="邀请码" path="inviteCode">
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
              {{ submitting ? "注册中..." : "注册并登录" }}
            </n-button>
          </n-form>
        </n-card>

        <p class="hint">
          {{ mode === "invite"
            ? "邀请码注册的用户拥有项目创建资格。邀请码仅可使用一次。"
            : "公开注册为普通用户，可投稿想法 / 评论 / 加入申请；创建项目需邀请码或总管理授权。" }}
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
const {registerManager, registerUser} = useProjectHubApi();

type RegisterMode = "public" | "invite";
const mode = ref<RegisterMode>("public");
const submitting = ref(false);

const switchMode = (next: RegisterMode) => {
  if (mode.value === next || submitting.value) return;
  mode.value = next;
};

const formRef = ref<FormInst | null>(null);

const form = reactive({
  inviteCode: "",
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
  if (mode.value === "invite") {
    base.inviteCode = {required: true, message: "请输入邀请码", trigger: ["blur", "input"]};
  }
  return base;
});

// 注册：公开注册（POST /api/auth/register）或邀请码注册（POST /api/auth/register/manager）
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    const payload = {
      username: form.username.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      email: form.email.trim(),
      emailCode: form.emailCode.trim(),
    };
    const result = mode.value === "invite"
      ? await registerManager({inviteCode: form.inviteCode.trim(), ...payload})
      : await registerUser(payload);
    message.success(`注册成功：${result.username}，请登录`);
    form.password = "";
    form.confirmPassword = "";
    form.inviteCode = "";
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
