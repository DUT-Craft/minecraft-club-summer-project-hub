<template>
  <main class="login-page" :class="themeClass">
    <section class="showcase-panel">
      <div class="brand-strip">
        <div class="cat-mark" aria-hidden="true">
          <span class="cat-ear cat-ear-left" />
          <span class="cat-ear cat-ear-right" />
          <span class="cat-face">
            <span class="cat-eye cat-eye-left" />
            <span class="cat-eye cat-eye-right" />
            <span class="cat-nose" />
          </span>
        </div>
        <div>
          <p class="brand-kicker">Neko Space</p>
          <h1>猫咪陪你开启今天</h1>
        </div>
      </div>

      <n-carousel
        autoplay
        draggable
        show-arrow
        dot-type="line"
        class="neko-carousel"
      >
        <article
          v-for="slide in slides"
          :key="slide.title"
          class="carousel-slide"
        >
          <div class="slide-copy">
            <p>{{ slide.kicker }}</p>
            <h2>{{ slide.title }}</h2>
            <span>{{ slide.text }}</span>
          </div>
          <div class="slide-art" aria-hidden="true">
            <span class="moon" />
            <span class="paw paw-one" />
            <span class="paw paw-two" />
            <span class="paw paw-three" />
            <span class="yarn" />
            <div class="big-cat">
              <span class="big-cat-ear left" />
              <span class="big-cat-ear right" />
              <span class="big-cat-head">
                <span class="big-cat-eye left" />
                <span class="big-cat-eye right" />
                <span class="big-cat-mouth" />
              </span>
              <span class="big-cat-body" />
              <span class="big-cat-tail" />
            </div>
          </div>
        </article>
      </n-carousel>
    </section>

    <aside class="login-panel">
      <div class="theme-switch" aria-label="主题切换">
        <button
          type="button"
          :class="{ active: theme === 'pink' }"
          aria-label="粉色主题"
          @click="theme = 'pink'"
        >
          <span class="swatch pink" />
          粉色
        </button>
        <button
          type="button"
          :class="{ active: theme === 'blue' }"
          aria-label="蓝色主题"
          @click="theme = 'blue'"
        >
          <span class="swatch blue" />
          蓝色
        </button>
      </div>

      <div class="form-shell">
        <div class="form-header">
          <div class="mini-cat" aria-hidden="true">
            <span class="mini-ear left" />
            <span class="mini-ear right" />
            <span class="mini-face" />
          </div>
          <p>欢迎回来</p>
          <h2>登录 Neko</h2>
        </div>

        <n-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <n-form-item label="用户名" path="username">
            <n-input
              v-model:value="form.username"
              clearable
              placeholder="请输入用户名"
            />
          </n-form-item>

          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="form.password"
              type="password"
              show-password-on="click"
              clearable
              placeholder="请输入密码"
            />
          </n-form-item>

          <div class="form-row">
            <n-checkbox v-model:checked="form.remember">记住我</n-checkbox>
            <button type="button" class="link-button">忘记密码</button>
          </div>

          <n-button
            attr-type="submit"
            type="primary"
            size="large"
            block
            :loading="submitting"
            class="login-button"
          >
            登录
          </n-button>
        </n-form>

        <p class="signup-text">
          还没有账号
          <button type="button" class="link-button strong" @click="goRegister">
            立即注册
          </button>
        </p>
      </div>
    </aside>
  </main>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";

type ThemeName = "pink" | "blue";

interface LoginPayload {
  username: string;
  password: string;
}

type LoginResponse = Record<string, unknown>;

definePageMeta({
  layout: false,
});

const message = useMessage();
const { postRaw } = useHttp();
const route = useRoute();
const router = useRouter();
const authToken = useCookie<string | null>("chat_auth_token");
const formRef = ref<FormInst | null>(null);
const theme = ref<ThemeName>("pink");
const submitting = ref(false);

const form = reactive({
  username: "",
  password: "",
  remember: true,
});

const slides = [
  {
    kicker: "Soft morning",
    title: "把任务排好队",
    text: "温柔的猫咪空间，让登录后的每一次操作都保持轻盈。",
  },
  {
    kicker: "Quiet focus",
    title: "在安静里开始",
    text: "干净的界面、清晰的节奏，适合每天稳定进入工作状态。",
  },
  {
    kicker: "Neko mood",
    title: "粉蓝主题随心切换",
    text: "用更贴近心情的颜色，进入属于你的 Neko 前台。",
  },
];

const rules: FormRules = {
  username: {
    required: true,
    message: "请输入用户名",
    trigger: ["input", "blur"],
  },
  password: {
    required: true,
    message: "请输入密码",
    trigger: ["input", "blur"],
  },
};

const themeClass = computed(() => `theme-${theme.value}`);

const readToken = (source: unknown): string => {
  if (!source || typeof source !== "object") {
    return "";
  }

  const data = source as Record<string, unknown>;
  const directToken = data.token ?? data.accessToken ?? data.access_token ?? data.jwt;
  if (typeof directToken === "string" && directToken.trim()) {
    return directToken.trim();
  }

  return readToken(data.data);
};

const handleLogin = async () => {
  try {
    await formRef.value?.validate();
    submitting.value = true;

    const response = await postRaw<LoginResponse, LoginPayload>(
      "/auth/login",
      {
        username: form.username.trim(),
        password: form.password,
      },
      {
        payloadMode: "json",
      },
    );

    const token = readToken(response);
    if (!token) {
      message.error("登录成功，但响应中未找到访问令牌");
      return;
    }

    authToken.value = token;
    message.success(response.message ?? response.msg ?? "登录成功");
    await navigateTo(String(route.query.redirect || "/"));
  } catch (error) {
    if (error instanceof Error) {
      message.error(error.message || "登录失败，请稍后重试");
      return;
    }

    message.error("登录失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
};

const goRegister = () => {
  return navigateTo("/register");
};

onMounted(() => {
  if (route.query.authError !== "unauthorized") {
    return;
  }

  message.warning("登录状态异常，请重新登录");
  void router.replace({
    path: "/login",
    query: route.query.redirect
      ? {
          redirect: String(route.query.redirect),
        }
      : undefined,
  });
});
</script>

<style scoped>
.login-page {
  --accent: #f36ca7;
  --accent-strong: #e83f8c;
  --accent-soft: #ffe1ef;
  --accent-tint: #fff4fa;
  --ink: #2b2430;
  --muted: #756b7c;
  --line: rgba(93, 69, 91, 0.14);
  --panel: rgba(255, 255, 255, 0.84);
  --shadow: 0 24px 80px rgba(166, 76, 128, 0.18);
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(360px, 3fr);
  background:
    radial-gradient(circle at 20% 16%, var(--accent-soft), transparent 30%),
    linear-gradient(135deg, #fff8fc 0%, var(--accent-tint) 52%, #ffffff 100%);
  color: var(--ink);
  overflow: hidden;
}

.theme-blue {
  --accent: #59a8ff;
  --accent-strong: #267fe8;
  --accent-soft: #dcefff;
  --accent-tint: #f1f8ff;
  --ink: #1f2a3d;
  --muted: #667085;
  --line: rgba(47, 104, 176, 0.14);
  --shadow: 0 24px 80px rgba(44, 119, 204, 0.18);
}

.showcase-panel {
  position: relative;
  min-width: 0;
  padding: 42px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.showcase-panel::before {
  content: "";
  position: absolute;
  inset: 22px 0 22px 22px;
  border: 1px solid var(--line);
  border-radius: 28px;
  pointer-events: none;
}

.brand-strip {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand-kicker,
.slide-copy p,
.form-header p {
  margin: 0;
  color: var(--accent-strong);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.brand-strip h1,
.slide-copy h2,
.form-header h2 {
  margin: 4px 0 0;
  letter-spacing: 0;
}

.brand-strip h1 {
  font-size: clamp(24px, 3vw, 42px);
}

.cat-mark {
  position: relative;
  width: 62px;
  height: 58px;
  flex: 0 0 auto;
}

.cat-ear,
.cat-face,
.cat-eye,
.cat-nose,
.mini-ear,
.mini-face,
.big-cat-ear,
.big-cat-head,
.big-cat-eye,
.big-cat-mouth,
.big-cat-body,
.big-cat-tail,
.paw,
.moon,
.yarn {
  position: absolute;
  display: block;
}

.cat-ear {
  top: 4px;
  width: 26px;
  height: 28px;
  background: var(--accent);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.cat-ear-left {
  left: 6px;
  transform: rotate(-18deg);
}

.cat-ear-right {
  right: 6px;
  transform: rotate(18deg);
}

.cat-face {
  left: 6px;
  bottom: 0;
  width: 50px;
  height: 42px;
  border-radius: 22px 22px 20px 20px;
  background: #ffffff;
  box-shadow: inset 0 0 0 2px var(--accent), var(--shadow);
}

.cat-eye {
  top: 17px;
  width: 6px;
  height: 8px;
  border-radius: 999px;
  background: var(--ink);
}

.cat-eye-left {
  left: 15px;
}

.cat-eye-right {
  right: 15px;
}

.cat-nose {
  left: 22px;
  top: 27px;
  width: 7px;
  height: 5px;
  border-radius: 999px;
  background: var(--accent);
}

.neko-carousel {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 520px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.carousel-slide {
  height: 100%;
  min-height: 520px;
  padding: clamp(32px, 5vw, 76px);
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(340px, 1.2fr);
  align-items: center;
  gap: 28px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.58)),
    repeating-linear-gradient(
      -35deg,
      transparent 0 28px,
      rgba(255, 255, 255, 0.32) 28px 30px
    ),
    var(--accent-soft);
}

.slide-copy {
  max-width: 540px;
}

.slide-copy h2 {
  margin-top: 12px;
  font-size: clamp(40px, 5.6vw, 88px);
  line-height: 0.98;
}

.slide-copy span {
  display: block;
  margin-top: 22px;
  max-width: 440px;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.8;
}

.slide-art {
  position: relative;
  min-height: 430px;
}

.moon {
  right: 12%;
  top: 4%;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: -18px 18px 0 var(--accent), var(--shadow);
  opacity: 0.92;
}

.big-cat {
  position: absolute;
  right: 8%;
  bottom: 6%;
  width: min(42vw, 430px);
  height: min(42vw, 430px);
  min-width: 300px;
  min-height: 300px;
}

.big-cat-head {
  left: 15%;
  top: 12%;
  width: 60%;
  height: 48%;
  border-radius: 45% 45% 42% 42%;
  background: #ffffff;
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.7), var(--shadow);
}

.big-cat-ear {
  top: 4%;
  width: 22%;
  height: 22%;
  background: var(--accent);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.big-cat-ear.left {
  left: 20%;
  transform: rotate(-18deg);
}

.big-cat-ear.right {
  right: 30%;
  transform: rotate(18deg);
}

.big-cat-eye {
  top: 42%;
  width: 20px;
  height: 26px;
  border-radius: 999px;
  background: var(--ink);
}

.big-cat-eye.left {
  left: 30%;
}

.big-cat-eye.right {
  right: 30%;
}

.big-cat-mouth {
  left: 44%;
  top: 60%;
  width: 38px;
  height: 18px;
  border-bottom: 4px solid var(--accent);
  border-radius: 0 0 999px 999px;
}

.big-cat-body {
  left: 5%;
  right: 13%;
  bottom: 5%;
  height: 45%;
  border-radius: 48% 52% 34% 34%;
  background: color-mix(in srgb, var(--accent) 38%, #ffffff);
}

.big-cat-tail {
  right: 0;
  bottom: 24%;
  width: 34%;
  height: 22%;
  border: 22px solid var(--accent);
  border-left: 0;
  border-bottom: 0;
  border-radius: 0 80px 0 0;
  transform: rotate(20deg);
}

.paw {
  width: 54px;
  height: 42px;
  border-radius: 28px 28px 24px 24px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow:
    10px -18px 0 -10px var(--accent),
    -10px -18px 0 -10px var(--accent),
    0 -22px 0 -10px var(--accent);
}

.paw-one {
  left: 8%;
  bottom: 15%;
  transform: rotate(-12deg);
}

.paw-two {
  left: 32%;
  top: 18%;
  transform: rotate(15deg) scale(0.82);
}

.paw-three {
  right: 5%;
  top: 36%;
  transform: rotate(-22deg) scale(0.72);
}

.yarn {
  left: 10%;
  top: 54%;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background:
    linear-gradient(30deg, transparent 44%, rgba(255, 255, 255, 0.75) 45% 54%, transparent 55%),
    linear-gradient(-26deg, transparent 43%, rgba(255, 255, 255, 0.75) 44% 53%, transparent 54%),
    var(--accent);
  box-shadow: var(--shadow);
}

.login-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 34px;
  background: rgba(255, 255, 255, 0.58);
  border-left: 1px solid var(--line);
  backdrop-filter: blur(18px);
}

.theme-switch {
  position: absolute;
  top: 28px;
  right: 28px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
}

.theme-switch button,
.link-button {
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
}

.theme-switch button {
  min-width: 78px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
}

.theme-switch button.active {
  color: #ffffff;
  background: var(--accent);
  box-shadow: 0 10px 22px color-mix(in srgb, var(--accent) 32%, transparent);
}

.swatch {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: currentColor;
}

.swatch.pink {
  background: #f36ca7;
}

.swatch.blue {
  background: #59a8ff;
}

.form-shell {
  width: min(100%, 420px);
  padding: 34px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h2 {
  font-size: 32px;
}

.mini-cat {
  position: relative;
  width: 62px;
  height: 52px;
  margin: 0 auto 14px;
}

.mini-ear {
  top: 2px;
  width: 24px;
  height: 24px;
  background: var(--accent);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.mini-ear.left {
  left: 8px;
  transform: rotate(-18deg);
}

.mini-ear.right {
  right: 8px;
  transform: rotate(18deg);
}

.mini-face {
  left: 6px;
  bottom: 0;
  width: 50px;
  height: 38px;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: inset 0 0 0 2px var(--accent);
}

.login-form :deep(.n-form-item-label__text) {
  font-weight: 700;
  color: var(--ink);
}

.login-form :deep(.n-input) {
  --n-border-radius: 14px !important;
}

.login-form :deep(.n-input.n-input--focus) {
  --n-border: 1px solid var(--accent) !important;
  --n-border-hover: 1px solid var(--accent) !important;
  --n-border-focus: 1px solid var(--accent) !important;
  --n-box-shadow-focus: 0 0 0 2px color-mix(in srgb, var(--accent) 18%, transparent) !important;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: -2px 0 22px;
}

.link-button {
  padding: 0;
  color: var(--accent-strong);
  font-weight: 700;
}

.login-button {
  --n-border-radius: 14px !important;
  --n-color: var(--accent) !important;
  --n-color-hover: var(--accent-strong) !important;
  --n-color-pressed: var(--accent-strong) !important;
  --n-color-focus: var(--accent) !important;
  --n-border: 1px solid var(--accent) !important;
  --n-border-hover: 1px solid var(--accent-strong) !important;
  --n-border-pressed: 1px solid var(--accent-strong) !important;
  --n-border-focus: 1px solid var(--accent) !important;
  height: 48px;
  font-weight: 800;
}

.signup-text {
  margin: 24px 0 0;
  text-align: center;
  color: var(--muted);
}

.strong {
  margin-left: 6px;
}

@media (width <= 1100px) {
  .login-page {
    grid-template-columns: minmax(0, 1fr);
    overflow: auto;
  }

  .showcase-panel {
    min-height: 56dvh;
    padding: 24px;
  }

  .showcase-panel::before {
    inset: 12px;
  }

  .login-panel {
    min-height: 44dvh;
    border-left: 0;
    border-top: 1px solid var(--line);
  }
}

@media (width <= 760px) {
  .showcase-panel {
    gap: 18px;
  }

  .neko-carousel,
  .carousel-slide {
    min-height: 420px;
  }

  .carousel-slide {
    grid-template-columns: 1fr;
    padding: 26px;
  }

  .slide-copy h2 {
    font-size: 40px;
  }

  .slide-copy span {
    font-size: 15px;
  }

  .slide-art {
    min-height: 200px;
  }

  .big-cat {
    right: 0;
    width: 250px;
    height: 250px;
    min-width: 250px;
    min-height: 250px;
  }

  .moon,
  .paw-three {
    display: none;
  }

  .login-panel {
    padding: 84px 18px 24px;
  }

  .theme-switch {
    top: 20px;
    right: 50%;
    transform: translateX(50%);
  }

  .form-shell {
    padding: 24px;
    border-radius: 20px;
  }
}
</style>
