<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <section class="login-shell">
        <header class="login-head">
          <p class="eyebrow">Admin Console</p>
          <h1>项目管理后台</h1>
          <p class="sub">选择对应身份登录后，即可进入管理面板</p>
        </header>

        <div class="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'admin'"
            :class="['tab', { active: mode === 'admin' }]"
            @click="switchMode('admin')"
          >
            <span class="tab-title">管理员登录</span>
            <span class="tab-sub">账号 + 密码</span>
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'owner'"
            :class="['tab', { active: mode === 'owner' }]"
            @click="switchMode('owner')"
          >
            <span class="tab-title">项目方登录</span>
            <span class="tab-sub">项目 ID + 管理密码</span>
          </button>
        </div>

        <n-card class="panel" :bordered="false">
          <n-form
            v-if="mode === 'admin'"
            ref="adminFormRef"
            :model="adminForm"
            :rules="adminRules"
            label-placement="top"
            :show-require-mark="false"
            size="large"
            @submit.prevent="handleAdminLogin"
          >
            <n-form-item label="账号" path="username">
              <n-input
                v-model:value="adminForm.username"
                placeholder="输入管理员账号"
                clearable
              />
            </n-form-item>
            <n-form-item label="密码" path="password">
              <n-input
                v-model:value="adminForm.password"
                type="password"
                show-password-on="click"
                placeholder="输入管理员密码"
              />
            </n-form-item>
            <n-button type="primary" attr-type="submit" block :loading="submitting">
              {{ submitting ? "登录中..." : "登录后台" }}
            </n-button>
          </n-form>

          <n-form
            v-else
            ref="ownerFormRef"
            :model="ownerForm"
            :rules="ownerRules"
            label-placement="top"
            :show-require-mark="false"
            size="large"
            @submit.prevent="handleOwnerLogin"
          >
            <n-form-item label="项目 ID" path="projectId">
              <n-input
                v-model:value="ownerForm.projectId"
                placeholder="例如：12"
                :input-props="{ inputmode: 'numeric' }"
                clearable
              />
            </n-form-item>
            <n-form-item label="项目管理密码" path="controlPassword">
              <n-input
                v-model:value="ownerForm.controlPassword"
                type="password"
                show-password-on="click"
                placeholder="投稿时设置的管理密码"
              />
            </n-form-item>
            <n-button type="primary" attr-type="submit" block :loading="submitting">
              {{ submitting ? "登录中..." : "登录后台" }}
            </n-button>
          </n-form>
        </n-card>

        <p class="hint">
          项目方登录仅能管理自己提交的项目；管理员可管理全部项目、想法与审核。
        </p>

        <div class="back">
          <n-button text @click="navigateTo('/')">← 返回首页</n-button>
        </div>
      </section>
    </n-config-provider>
  </main>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";


definePageMeta({
  layout: false,
});

type LoginMode = "admin" | "owner";

const message = useMessage();
const { themeOverrides } = useMinecraftTheme();

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
  username: { required: true, message: "请输入账号", trigger: ["blur", "input"] },
  password: { required: true, message: "请输入密码", trigger: ["blur", "input"] },
};

const ownerRules: FormRules = {
  projectId: { required: true, message: "请输入项目 ID", trigger: ["blur", "input"] },
  controlPassword: { required: true, message: "请输入项目管理密码", trigger: ["blur", "input"] },
};

const switchMode = (next: LoginMode) => {
  if (mode.value === next || submitting.value) {
    return;
  }
  mode.value = next;
};

// 接口接入前的占位：只做表单校验 + 模拟一次请求，方便先把交互跑通
const fakeRequest = (delay = 500) =>
  new Promise<void>((resolve) => setTimeout(resolve, delay));

const handleAdminLogin = async () => {
  try {
    await adminFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    // TODO: 接入 POST /api/auth/login { username, password }，成功后写入 token 并跳转后台首页
    await fakeRequest();
    message.success("登录入口已就绪，等待接入后端鉴权接口");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "登录失败，请稍后再试");
  } finally {
    submitting.value = false;
  }
};

const handleOwnerLogin = async () => {
  try {
    await ownerFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    // TODO: 用 projectId + controlPassword 进入项目方管理视图（后端接口待定）
    await fakeRequest();
    message.success("登录入口已就绪，等待接入项目方鉴权接口");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "登录失败，请稍后再试");
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
  background:
    radial-gradient(circle at 80% 8%, rgba(255, 215, 101, 0.44), transparent 21%),
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
