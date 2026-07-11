<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <section class="login-shell">
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
            <span class="tab-title">项目方登录</span>
            <span class="tab-sub">项目 ID + 管理密码</span>
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
            <n-form-item label="项目管理密码" path="controlPassword">
              <n-input
                  v-model:value="ownerForm.controlPassword"
                  placeholder="投稿时设置的管理密码"
                  show-password-on="click"
                  type="password"
                  @keyup.enter="handleOwnerLogin"
              />
            </n-form-item>
            <n-button :loading="submitting" attr-type="submit" block type="primary">
              {{ submitting ? "登录中..." : "登录后台" }}
            </n-button>
          </n-form>
        </n-card>

        <p class="hint">
          项目方登录仅能管理自己提交的项目；管理员可管理全部项目、想法与审核。
        </p>

        <p class="register-link">
          收到总管理邀请码？
          <n-button text type="primary" @click="navigateTo('/register')">前往项目管理注册</n-button>
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
});

const ownerForm = reactive({
  projectId: "",
  controlPassword: "",
});

const adminRules: FormRules = {
  username: {required: true, message: "请输入账号", trigger: ["blur", "input"]},
  password: {required: true, message: "请输入密码", trigger: ["blur", "input"]},
};

const ownerRules: FormRules = {
  projectId: {required: true, message: "请输入项目 ID", trigger: ["blur", "input"]},
  controlPassword: {required: true, message: "请输入项目管理密码", trigger: ["blur", "input"]},
};

const switchMode = (next: LoginMode) => {
  if (mode.value === next || submitting.value) {
    return;
  }
  mode.value = next;
};

// 管理员登录：POST /api/auth/login（openapi.json）→ 拿 token 写入 chat_auth_token cookie
// （useHttp 后续自动带 Bearer），会话快照存 sessionStorage，随后进入全局管理面板 /admin/manage
const handleAdminLogin = async () => {
  try {
    await adminFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    const {token, username} = await adminLogin(adminForm.username.trim(), adminForm.password);
    if (!token) {
      throw new Error("登录响应中未包含 token，请确认后端 /api/auth/login 返回格式");
    }
    // 先写入 token（cookie 随之设置），再取 /auth/me 拿角色一并写入会话，
    // 供管理面板按角色显隐总管理专属入口（邀请码 / 项目分配）。
    writeAdminSession({token, username, loginAt: new Date().toISOString()});
    let role: "SUPER_ADMIN" | "PROJECT_MANAGER" | undefined;
    try {
      role = (await adminMe()).role;
    } catch {
      // 取角色失败不阻塞登录，按项目管理兜底（最小权限）
    }
    writeAdminSession({token, username, role, loginAt: new Date().toISOString()});
    message.success(`欢迎，${username || "管理员"}！正在进入管理面板...`);
    // 跳转后清空密码字段，避免登录页 DOM 残留
    adminForm.password = "";
    await navigateTo("/admin/manage");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "账号或密码不正确，请重试");
  } finally {
    submitting.value = false;
  }
};

const {verifyProjectOwner, adminLogin, adminMe} = useProjectHubApi();
const {write: writeOwnerSession} = useOwnerSession();
const {write: writeAdminSession} = useAdminAuth();

// 项目方登录：POST /api/admin/project/object-items/{id}/verify（openapi.json）
// 校验通过后把项目详情 + controlPassword 写入会话（后续管理操作每次都要带 controlPassword），
// 随后跳转到该项目专属的管理页 /admin/projects/{id}
const handleOwnerLogin = async () => {
  try {
    await ownerFormRef.value?.validate();
  } catch {
    return;
  }
  const projectId = ownerForm.projectId.trim();
  const controlPassword = ownerForm.controlPassword;
  try {
    submitting.value = true;
    const project = await verifyProjectOwner(projectId, controlPassword);
    writeOwnerSession({
      project,
      controlPassword,
      loginAt: new Date().toISOString(),
    });
    message.success(`欢迎，${project.ownerName || "项目方"}！正在进入管理面板...`);
    // 校验接口已确认项目存在，统一以 verify 返回的 id 作为管理页路径，避免与输入大小写 / 空格漂移
    await navigateTo(`/admin/projects/${project.id || projectId}`);
    // 跳转后清空敏感字段，避免登录页 DOM 里残留密码
    ownerForm.controlPassword = "";
  } catch (error) {
    message.error(error instanceof Error && error.message
        ? error.message
        : "项目 ID 或管理密码不正确，请重试");
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
