<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="checkingSession" class="session-check">
        <n-spin size="large"/>
      </div>

      <section v-else class="login-shell">
        <header class="login-head">
          <p class="eyebrow">Admin Console</p>
          <h1>登录后台</h1>
          <p class="sub">使用账号登录，进入管理面板</p>
        </header>

        <n-card :bordered="false" class="panel">
          <n-form
              ref="formRef"
              :model="form"
              :rules="rules"
              :show-require-mark="false"
              label-placement="top"
              size="large"
              @submit.prevent="handleLogin"
          >
            <n-form-item label="账号" path="account">
              <n-input
                  v-model:value="form.account"
                  clearable
                  placeholder="用户名或邮箱"
              />
            </n-form-item>
            <n-form-item label="密码" path="password">
              <n-input
                  v-model:value="form.password"
                  placeholder="输入密码"
                  show-password-on="click"
                  type="password"
              />
            </n-form-item>
            <n-button :loading="submitting" attr-type="submit" block type="primary">
              {{ submitting ? "登录中..." : "登录" }}
            </n-button>
          </n-form>
        </n-card>

        <p class="hint">
          登录后按角色进入对应后台：管理员可管理全部项目、想法与审核；有项目创建资格的用户可创建并管理自己的项目。
        </p>

        <p class="register-link">
          还没有账号？
          <n-button text type="primary" @click="navigateTo('/register')">前往注册</n-button>
        </p>

        <p class="register-link">
          忘记密码？
          <n-button text type="primary" @click="navigateTo('/forget')">邮箱找回密码</n-button>
        </p>

        <div class="back">
          <n-button text @click="navigateTo('/')">← 返回首页</n-button>
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

const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

const form = reactive({
  account: "",
  password: "",
});

const rules: FormRules = {
  account: {required: true, message: "请输入账号", trigger: ["blur", "input"]},
  password: {required: true, message: "请输入密码", trigger: ["blur", "input"]},
};

// 统一账号登录：POST /api/auth/login（账号可为用户名或邮箱，大小写不敏感）
// 后端返回 { accessToken, tokenType, expiresIn }；refreshToken 通过 HttpOnly Set-Cookie 下发。
// 登录成功后把 token 写入会话，取 /auth/me 拿角色，进入 /admin/manage。
const handleLogin = async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    const account = form.account.trim();
    const {token, username} = await adminLogin(account, form.password);
    writeAdminSession({token, username: account || username, loginAt: new Date().toISOString()});
    // 取角色分流：管理员 → /admin/manage；非管理员（有项目创建资格）也先进 /admin/manage，
    // 由该页按角色决定展示哪些管理入口。token 已过期会在目标页 onMounted 校验失败跳回这里。
    try {
      const me = await adminMe();
      writeAdminSession({
        token,
        username: account || username,
        role: me.role,
        id: me.id,
        email: me.email,
        canCreateProject: me.canCreateProject,
        loginAt: new Date().toISOString(),
      });
    } catch {
      // 取角色失败不阻塞登录，按最小权限兜底
    }
    message.success(`欢迎，${account || "用户"}！正在进入后台...`);
    await navigateTo("/admin/manage");
    form.password = "";
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "账号或密码不正确，请重试");
  } finally {
    submitting.value = false;
  }
};

const {adminLogin, adminMe} = useProjectHubApi();
const {write: writeAdminSession, read: readAdminSession} = useAdminAuth();

// 已登录用户落到登录页会看到登录表单，误以为「登录态没保留、要重新登录」
// （典型路径：在 /admin/manage 点 header 的「项目管理后台」按钮 → 回到 /admin）。
// 挂载时按已有会话直接跳走；token 若已过期，目标页 onMounted 会校验失败再跳回这里。
const checkingSession = ref(true);
onMounted(async () => {
  const admin = readAdminSession();
  if (admin?.token) {
    await navigateTo("/admin/manage");
    return;
  }
  checkingSession.value = false;
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

.session-check {
  display: grid;
  place-items: center;
  padding: 96px 0;
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

/* Naive UI 卡片包成 Minecraft 风格的木边面板 */
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

/* n-form-item 默认带 margin-bottom，这里由 n-form 的 grid gap 统一控制间距 */
.panel :deep(.n-form-item) {
  margin-bottom: 0;
}

/* 标签字重对齐其它页面的 font-weight: 900 */
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

.register-link {
  margin: 6px 0 0;
  text-align: center;
  color: #60462b;
  font-size: 13px;
  font-weight: 700;
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
