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
          <h1>项目管理后台</h1>
          <p class="sub">选择对应身份登录后，即可进入管理面板</p>
        </header>

        <div class="tabs" role="tablist">
          <button
              :aria-selected="mode === 'admin'"
              :class="['tab', { active: mode === 'admin' }]"
              role="tab"
              type="button"
              @click="switchMode('admin')"
          >
            <span class="tab-title">管理员登录</span>
            <span class="tab-sub">账号 + 密码</span>
          </button>
          <button
              :aria-selected="mode === 'owner'"
              :class="['tab', { active: mode === 'owner' }]"
              role="tab"
              type="button"
              @click="switchMode('owner')"
          >
            <span class="tab-title">项目管理</span>
            <span class="tab-sub">登录后管理名下项目</span>
          </button>
        </div>

        <n-card :bordered="false" class="panel">
          <n-form
              v-if="mode === 'admin'"
              ref="adminFormRef"
              :model="adminForm"
              :rules="adminRules"
              :show-require-mark="false"
              label-placement="top"
              size="large"
              @submit.prevent="handleAdminLogin"
          >
            <n-form-item label="账号" path="username">
              <n-input
                  v-model:value="adminForm.username"
                  clearable
                  placeholder="输入管理员账号"
              />
            </n-form-item>
            <n-form-item label="密码" path="password">
              <n-input
                  v-model:value="adminForm.password"
                  placeholder="输入管理员密码"
                  show-password-on="click"
                  type="password"
              />
            </n-form-item>
            <n-checkbox v-model:checked="adminForm.useEmailLogin" class="email-toggle">
              使用邮箱验证登录
            </n-checkbox>
            <template v-if="adminForm.useEmailLogin">
              <n-form-item label="邮箱" path="email">
                <n-input
                    v-model:value="adminForm.email"
                    clearable
                    placeholder="输入注册邮箱"
                />
              </n-form-item>
              <n-form-item label="邮箱验证码" path="emailCode">
                <VerificationCodeInput
                    :code="adminForm.emailCode"
                    :email="adminForm.email"
                    scene="EMAIL_LOGIN"
                    @update:code="adminForm.emailCode = $event"
                />
              </n-form-item>
            </template>
            <n-button :loading="submitting" attr-type="submit" block type="primary">
              {{ submitting ? "登录中..." : "登录后台" }}
            </n-button>
          </n-form>

          <n-form
              v-else
              ref="ownerFormRef"
              :model="ownerForm"
              :rules="ownerRules"
              :show-require-mark="false"
              label-placement="top"
              size="large"
              @submit.prevent="handleOwnerLogin"
          >
            <n-form-item label="项目 ID" path="projectId">
              <n-input
                  v-model:value="ownerForm.projectId"
                  :input-props="{ inputmode: 'numeric' }"
                  clearable
                  placeholder="例如：12"
              />
            </n-form-item>
            <p class="owner-hint">凭账号登录后，直接以项目 ID 进入该项目管理页（JWT 鉴权，无需管理密码）。</p>
            <n-button :loading="submitting" attr-type="submit" block type="primary">
              {{ submitting ? "进入中..." : "进入项目管理" }}
            </n-button>
          </n-form>
        </n-card>

        <p class="hint">
          管理员可管理全部项目、想法与审核；登录用户可进入自己拥有/参与的项目管理页。
        </p>

        <p class="register-link">
          收到总管理邀请码？
          <n-button text type="primary" @click="navigateTo('/register')">前往项目管理注册</n-button>
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

type LoginMode = "admin" | "owner";

const message = useMessage();
const {themeOverrides} = useMinecraftTheme();

const mode = ref<LoginMode>("admin");
const submitting = ref(false);

const adminFormRef = ref<FormInst | null>(null);
const ownerFormRef = ref<FormInst | null>(null);

const adminForm = reactive({
  username: "",
  password: "",
  useEmailLogin: false,
  email: "",
  emailCode: "",
});

const ownerForm = reactive({
  projectId: "",
});

// 管理员登录校验：邮箱验证登录模式下额外要求邮箱 + 验证码
const adminRules = computed<FormRules>(() => {
  const rules: FormRules = {
    username: {required: true, message: "请输入账号", trigger: ["blur", "input"]},
    password: {required: true, message: "请输入密码", trigger: ["blur", "input"]},
  };
  if (adminForm.useEmailLogin) {
    rules.email = {
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
    };
    rules.emailCode = {required: true, message: "请输入邮箱验证码", trigger: ["blur", "input"]};
  }
  return rules;
});

const ownerRules: FormRules = {
  projectId: {required: true, message: "请输入项目 ID", trigger: ["blur", "input"]},
};

const switchMode = (next: LoginMode) => {
  if (mode.value === next || submitting.value) {
    return;
  }
  mode.value = next;
};

// 管理员登录：两种形态共用会话写入 + 跳转逻辑
//  - 普通登录：POST /api/auth/login（账号 + 密码）
//  - 邮箱验证登录：POST /api/auth/login/email（账号 + 密码 + 邮箱 + 验证码）
// 两者都把 token 写入 chat_auth_token cookie，再取 /auth/me 拿角色，进入 /admin/manage
const enterAdminPanel = async (token: string, username: string) => {
  if (!token) {
    throw new Error("登录响应中未包含 token，请确认后端返回格式");
  }
  writeAdminSession({token, username, loginAt: new Date().toISOString()});
  let role: "SUPER_ADMIN" | "PROJECT_MANAGER" | undefined;
  let id: number | string | undefined;
  try {
    const me = await adminMe();
    role = me.role;
    id = me.id;
  } catch {
    // 取角色失败不阻塞登录，按项目管理兜底（最小权限）
  }
  writeAdminSession({token, username, role, id, loginAt: new Date().toISOString()});
  message.success(`欢迎，${username || "管理员"}！正在进入管理面板...`);
  await navigateTo("/admin/manage");
};

const handleAdminLogin = async () => {
  try {
    await adminFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    let token = "";
    let username = "";
    if (adminForm.useEmailLogin) {
      ({token, username} = await emailLogin({
        account: adminForm.username.trim(),
        password: adminForm.password,
        email: adminForm.email.trim(),
        emailCode: adminForm.emailCode.trim(),
      }));
      adminForm.emailCode = "";
    } else {
      ({token, username} = await adminLogin(adminForm.username.trim(), adminForm.password));
    }
    await enterAdminPanel(token, adminForm.username.trim() || username);
    // 跳转后清空密码字段，避免登录页 DOM 残留
    adminForm.password = "";
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "账号或密码不正确，请重试");
  } finally {
    submitting.value = false;
  }
};

const {adminLogin, adminMe, emailLogin, listProjectsAdmin} = useProjectHubApi();
const {write: writeOwnerSession, read: readOwnerSession} = useOwnerSession();
const {write: writeAdminSession, read: readAdminSession} = useAdminAuth();

// 已登录用户落到登录页会看到登录表单，误以为「登录态没保留、要重新登录」
// （典型路径：在 /admin/manage 点 header 的「项目管理后台」按钮 → 回到 /admin）。
// 挂载时按已有会话直接跳走：管理员 → /admin/manage；项目方 → 该项目管理页；
// 都没有才显示登录表单。token 若已过期，目标页 onMounted 会校验失败再跳回这里。
const checkingSession = ref(true);
onMounted(async () => {
  const admin = readAdminSession();
  if (admin?.token) {
    await navigateTo("/admin/manage");
    return;
  }
  const owner = readOwnerSession();
  if (owner?.project?.id) {
    await navigateTo(`/admin/projects/${owner.project.id}`);
    return;
  }
  checkingSession.value = false;
});

// 项目管理入口：controlPassword 已下线（设计 §14.11），改为登录态 + 项目 ID 直达项目管理页。
// 校验：必须先登录（admin 会话存在），且该项目在当前登录用户名下（mine=true）才放行进入。
const handleOwnerLogin = async () => {
  try {
    await ownerFormRef.value?.validate();
  } catch {
    return;
  }
  const admin = readAdminSession();
  if (!admin?.token) {
    message.warning("请先在「管理员登录」完成账号登录，再进入项目管理");
    switchMode("admin");
    return;
  }
  const projectId = ownerForm.projectId.trim();
  try {
    submitting.value = true;
    // 拉取名下项目，确认该项目归属当前登录用户（JWT 鉴权）
    const mine = await listProjectsAdmin(undefined, true);
    const target = mine.find((p) => String(p.id) === projectId);
    if (!target) {
      message.error("该项目不在你的名下，或 ID 不正确");
      return;
    }
    writeOwnerSession({
      project: target,
      loginAt: new Date().toISOString(),
    });
    message.success(`进入项目《${target.title}》管理页`);
    await navigateTo(`/admin/projects/${target.id || projectId}`);
  } catch (error) {
    message.error(error instanceof Error && error.message
        ? error.message
        : "项目 ID 不正确或无权访问，请重试");
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

/* 身份切换 Tab：两张并列的羊皮纸卡片，选中态用草地绿描边 + 偏移阴影呼应全局卡片语言 */
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
  padding: 14px 16px;
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
  font-size: 17px;
  color: #2d2418;
}

.tab-sub {
  font-size: 13px;
  color: #795b36;
}

.tab.active .tab-sub {
  color: #54903a;
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

.email-toggle {
  align-self: flex-start;
  font-weight: 700;
  color: #60462b;
}

.back {
  margin-top: 14px;
  text-align: center;
}

.back :deep(.n-button) {
  color: #60462b;
  font-weight: 700;
}

@media (width <= 420px) {
  .tabs {
    grid-template-columns: 1fr;
  }
}
</style>
