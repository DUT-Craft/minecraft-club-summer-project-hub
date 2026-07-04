<template>
  <main class="user-center-page">
    <section class="profile-hero">
      <div class="hero-main">
        <n-avatar round :size="72" :src="profileForm.avatar || undefined">
          {{ avatarFallback }}
        </n-avatar>
        <div class="hero-copy">
          <p>USER CENTER</p>
          <h1>{{ displayName }}</h1>
          <span>{{ profileForm.signature || "保持资料准确，方便同学和管理员快速识别你。" }}</span>
        </div>
      </div>
      <n-button type="primary" :loading="profileLoading" @click="loadProfile">
        刷新资料
      </n-button>
    </section>

    <section class="content-grid">
      <n-card title="个人资料" :bordered="false" class="panel-card">
        <n-spin :show="profileLoading">
          <n-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-placement="top"
            class="profile-form"
          >
            <div class="form-grid two-columns">
              <n-form-item label="昵称" path="nickname">
                <n-input v-model:value="profileForm.nickname" clearable placeholder="请输入昵称" />
              </n-form-item>

              <n-form-item label="头像地址" path="avatar">
                <n-input v-model:value="profileForm.avatar" clearable placeholder="https://..." />
              </n-form-item>
            </div>

            <n-form-item label="个性签名" path="signature">
              <n-input
                v-model:value="profileForm.signature"
                type="textarea"
                clearable
                :autosize="{ minRows: 2, maxRows: 4 }"
                placeholder="写一句展示在资料页的话"
              />
            </n-form-item>

            <div class="form-grid three-columns">
              <n-form-item label="学号" path="studentId">
                <n-input v-model:value="profileForm.studentId" clearable placeholder="请输入学号" />
              </n-form-item>

              <n-form-item label="年级" path="grade">
                <n-input v-model:value="profileForm.grade" clearable placeholder="例如 2024" />
              </n-form-item>

              <n-form-item label="班级" path="className">
                <n-input v-model:value="profileForm.className" clearable placeholder="请输入班级" />
              </n-form-item>

              <n-form-item label="专业" path="major">
                <n-input v-model:value="profileForm.major" clearable placeholder="请输入专业" />
              </n-form-item>

              <n-form-item label="手机号" path="phone">
                <n-input v-model:value="profileForm.phone" clearable placeholder="请输入手机号" />
              </n-form-item>

              <n-form-item label="QQ 号" path="qqNumber">
                <n-input v-model:value="profileForm.qqNumber" clearable placeholder="请输入 QQ 号" />
              </n-form-item>
            </div>

            <div class="visibility-panel">
              <div>
                <strong>资料可见性</strong>
                <span>控制其他用户能看到哪些资料字段。</span>
              </div>
              <n-space>
                <n-checkbox v-model:checked="profileForm.isStudentId">学号</n-checkbox>
                <n-checkbox v-model:checked="profileForm.isClassName">班级</n-checkbox>
                <n-checkbox v-model:checked="profileForm.isMajor">专业</n-checkbox>
                <n-checkbox v-model:checked="profileForm.isPhone">手机号</n-checkbox>
                <n-checkbox v-model:checked="profileForm.isQQNumber">QQ</n-checkbox>
              </n-space>
            </div>

            <n-form-item label="联系方式">
              <n-dynamic-tags v-model:value="profileForm.contactInformation" />
            </n-form-item>

            <div class="form-actions">
              <n-button @click="resetProfileForm">重置</n-button>
              <n-button type="primary" :loading="profileSaving" @click="handleSaveProfile">
                保存资料
              </n-button>
            </div>
          </n-form>
        </n-spin>
      </n-card>

      <aside class="side-stack">
        <n-card title="账号信息" :bordered="false" class="panel-card">
          <n-descriptions label-placement="left" :column="1" bordered size="small">
            <n-descriptions-item label="用户名">
              {{ accountInfo.username || "-" }}
            </n-descriptions-item>
            <n-descriptions-item label="邮箱">
              {{ accountInfo.email || "-" }}
            </n-descriptions-item>
            <n-descriptions-item label="用户 ID">
              {{ accountInfo.id || "-" }}
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <n-card title="修改密码" :bordered="false" class="panel-card">
          <n-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-placement="top"
          >
            <n-form-item label="旧密码" path="oldPassword">
              <n-input
                v-model:value="passwordForm.oldPassword"
                type="password"
                show-password-on="click"
                clearable
                placeholder="请输入当前密码"
              />
            </n-form-item>

            <n-form-item label="新密码" path="newPassword">
              <n-input
                v-model:value="passwordForm.newPassword"
                type="password"
                show-password-on="click"
                clearable
                placeholder="请输入新密码"
              />
            </n-form-item>

            <n-form-item label="确认新密码" path="confirmPassword">
              <n-input
                v-model:value="passwordForm.confirmPassword"
                type="password"
                show-password-on="click"
                clearable
                placeholder="请再次输入新密码"
              />
            </n-form-item>

            <n-button
              type="primary"
              block
              :loading="passwordCodeSending"
              @click="handleOpenPasswordVerify"
            >
              确认修改
            </n-button>
          </n-form>
        </n-card>
      </aside>
    </section>

    <n-modal
      v-model:show="passwordVerifyVisible"
      preset="card"
      title="邮箱验证码验证"
      class="verify-modal"
      :bordered="false"
      :mask-closable="false"
    >
      <n-form
        ref="verifyFormRef"
        :model="verifyForm"
        :rules="verifyRules"
        label-placement="top"
      >
        <n-alert type="info" :show-icon="false" class="verify-alert">
          验证码已发送到当前绑定邮箱，请完成验证后提交密码修改。
        </n-alert>

        <n-form-item label="邮箱验证码" path="verificationCode">
          <n-input-group>
            <n-input
              v-model:value="verifyForm.verificationCode"
              clearable
              placeholder="请输入验证码"
            />
            <n-button
              :disabled="passwordCodeDisabled"
              :loading="passwordCodeSending"
              class="code-button"
              @click="sendPasswordCode"
            >
              {{ passwordCodeButtonText }}
            </n-button>
          </n-input-group>
        </n-form-item>

        <div class="modal-actions">
          <n-button @click="passwordVerifyVisible = false">取消</n-button>
          <n-button type="primary" :loading="passwordSaving" @click="handleSavePassword">
            提交修改
          </n-button>
        </div>
      </n-form>
    </n-modal>
  </main>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from "naive-ui";

interface ProfileForm {
  nickname: string;
  avatar: string;
  signature: string;
  studentId: string;
  grade: string;
  className: string;
  major: string;
  phone: string;
  qqNumber: string;
  isStudentId: boolean;
  isGrouping: string;
  isClassName: boolean;
  isMajor: boolean;
  isPhone: boolean;
  isQQNumber: boolean;
  contactInformation: string[];
}

interface AccountInfo {
  id: string;
  username: string;
  email: string;
}

interface PasswordPayload {
  oldPassword: string;
  newPassword: string;
  verificationCode: string;
}

type ApiObject = Record<string, any>;

const message = useMessage();
const { get, put, postRaw } = useHttp();

const profileFormRef = ref<FormInst | null>(null);
const passwordFormRef = ref<FormInst | null>(null);
const verifyFormRef = ref<FormInst | null>(null);

const profileLoading = ref(false);
const profileSaving = ref(false);
const passwordSaving = ref(false);
const passwordCodeSending = ref(false);
const passwordVerifyVisible = ref(false);
const passwordCodeCooldown = ref(0);
let passwordCodeTimer: ReturnType<typeof setInterval> | null = null;

const createEmptyProfile = (): ProfileForm => ({
  nickname: "",
  avatar: "",
  signature: "",
  studentId: "",
  grade: "",
  className: "",
  major: "",
  phone: "",
  qqNumber: "",
  isStudentId: true,
  isGrouping: "PUBLIC",
  isClassName: true,
  isMajor: true,
  isPhone: false,
  isQQNumber: false,
  contactInformation: [],
});

const profileForm = reactive<ProfileForm>(createEmptyProfile());
const profileSnapshot = ref<ProfileForm>(createEmptyProfile());
const accountInfo = reactive<AccountInfo>({
  id: "",
  username: "",
  email: "",
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const verifyForm = reactive({
  verificationCode: "",
});

const profileRules: FormRules = {
  nickname: {
    max: 32,
    message: "昵称不能超过 32 个字符",
    trigger: ["input", "blur"],
  },
  avatar: {
    max: 255,
    message: "头像地址不能超过 255 个字符",
    trigger: ["input", "blur"],
  },
  signature: {
    max: 120,
    message: "个性签名不能超过 120 个字符",
    trigger: ["input", "blur"],
  },
};

const passwordRules: FormRules = {
  oldPassword: {
    required: true,
    message: "请输入旧密码",
    trigger: ["input", "blur"],
  },
  newPassword: [
    {
      required: true,
      message: "请输入新密码",
      trigger: ["input", "blur"],
    },
    {
      min: 6,
      message: "新密码至少需要 6 位",
      trigger: ["input", "blur"],
    },
  ],
  confirmPassword: [
    {
      required: true,
      message: "请再次输入新密码",
      trigger: ["input", "blur"],
    },
    {
      validator: (_rule, value: string) => {
        if (value !== passwordForm.newPassword) {
          return new Error("两次输入的新密码不一致");
        }

        return true;
      },
      trigger: ["input", "blur"],
    },
  ],
};

const verifyRules: FormRules = {
  verificationCode: {
    required: true,
    message: "请输入邮箱验证码",
    trigger: ["input", "blur"],
  },
};

const displayName = computed(() => {
  return profileForm.nickname || accountInfo.username || "Neko 用户";
});

const avatarFallback = computed(() => {
  return displayName.value.trim().slice(0, 1).toUpperCase() || "N";
});

const passwordCodeDisabled = computed(() => {
  return passwordCodeSending.value || passwordCodeCooldown.value > 0;
});

const passwordCodeButtonText = computed(() => {
  return passwordCodeCooldown.value > 0 ? `${passwordCodeCooldown.value}s` : "重新发送";
});

const readString = (source: ApiObject, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (value !== null && value !== undefined) {
      return String(value);
    }
  }

  return "";
};

const readBoolean = (source: ApiObject, key: string, fallback: boolean) => {
  const value = source[key];
  return typeof value === "boolean" ? value : fallback;
};

const resolveUserSource = (data: ApiObject | null | undefined) => {
  return (data?.user ?? data?.profile ?? data ?? {}) as ApiObject;
};

const assignProfileForm = (data: ApiObject | null | undefined) => {
  const source = resolveUserSource(data);
  const nextProfile: ProfileForm = {
    nickname: readString(source, ["nickname", "nickName"]),
    avatar: readString(source, ["avatar", "avatarUrl"]),
    signature: readString(source, ["signature", "bio"]),
    studentId: readString(source, ["studentId", "student_id"]),
    grade: readString(source, ["grade"]),
    className: readString(source, ["className", "class_name"]),
    major: readString(source, ["major"]),
    phone: readString(source, ["phone", "phoneNumber"]),
    qqNumber: readString(source, ["qqNumber", "qq"]),
    isStudentId: readBoolean(source, "isStudentId", true),
    isGrouping: readString(source, ["isGrouping"]) || "PUBLIC",
    isClassName: readBoolean(source, "isClassName", true),
    isMajor: readBoolean(source, "isMajor", true),
    isPhone: readBoolean(source, "isPhone", false),
    isQQNumber: readBoolean(source, "isQQNumber", false),
    contactInformation: Array.isArray(source.contactInformation)
      ? source.contactInformation.map(String)
      : [],
  };

  Object.assign(profileForm, nextProfile);
  profileSnapshot.value = { ...nextProfile, contactInformation: [...nextProfile.contactInformation] };

  accountInfo.id = readString(source, ["id", "userId", "user_id"]);
  accountInfo.username = readString(source, ["username", "userName", "name"]);
  accountInfo.email = readString(source, ["email", "mail"]);
};

const startPasswordCodeCooldown = () => {
  passwordCodeCooldown.value = 60;
  if (passwordCodeTimer) {
    clearInterval(passwordCodeTimer);
  }

  passwordCodeTimer = setInterval(() => {
    passwordCodeCooldown.value -= 1;
    if (passwordCodeCooldown.value <= 0 && passwordCodeTimer) {
      clearInterval(passwordCodeTimer);
      passwordCodeTimer = null;
    }
  }, 1000);
};

const loadProfile = async () => {
  try {
    profileLoading.value = true;
    const data = await get<ApiObject>("/auth/me");
    assignProfileForm(data);
  } catch (error) {
    message.error(error instanceof Error ? error.message : "用户资料加载失败");
  } finally {
    profileLoading.value = false;
  }
};

const resetProfileForm = () => {
  Object.assign(profileForm, {
    ...profileSnapshot.value,
    contactInformation: [...profileSnapshot.value.contactInformation],
  });
};

const handleSaveProfile = async () => {
  try {
    await profileFormRef.value?.validate();
    profileSaving.value = true;
    await put<ApiObject, ProfileForm>("/user/profile", { ...profileForm }, { payloadMode: "json" });
    profileSnapshot.value = { ...profileForm, contactInformation: [...profileForm.contactInformation] };
    message.success("资料已保存");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "资料保存失败");
  } finally {
    profileSaving.value = false;
  }
};

const sendPasswordCode = async () => {
  try {
    passwordCodeSending.value = true;
    const response = await postRaw<ApiObject>("/auth/email-code/password");
    message.success(response.message ?? response.msg ?? "验证码已发送");
    startPasswordCodeCooldown();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "验证码发送失败");
  } finally {
    passwordCodeSending.value = false;
  }
};

const handleOpenPasswordVerify = async () => {
  try {
    await passwordFormRef.value?.validate();
    verifyForm.verificationCode = "";
    await sendPasswordCode();
    passwordVerifyVisible.value = true;
  } catch {
    message.warning("请先填写完整的密码信息");
  }
};

const handleSavePassword = async () => {
  try {
    await verifyFormRef.value?.validate();
    passwordSaving.value = true;
    await put<ApiObject, PasswordPayload>(
      "/auth/password",
      {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        verificationCode: verifyForm.verificationCode.trim(),
      },
      {
        payloadMode: "json",
      },
    );

    message.success("密码已修改");
    passwordVerifyVisible.value = false;
    passwordForm.oldPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
    verifyForm.verificationCode = "";
  } catch (error) {
    message.error(error instanceof Error ? error.message : "密码修改失败");
  } finally {
    passwordSaving.value = false;
  }
};

onMounted(loadProfile);

onBeforeUnmount(() => {
  if (passwordCodeTimer) {
    clearInterval(passwordCodeTimer);
  }
});
</script>

<style scoped>
.user-center-page {
  display: grid;
  gap: 20px;
}

.profile-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  border: 1px solid rgba(128, 128, 128, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(243, 108, 167, 0.12), rgba(89, 168, 255, 0.12)),
    var(--n-color);
}

.hero-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-copy {
  min-width: 0;
}

.hero-copy p {
  margin: 0 0 4px;
  color: #e83f8c;
  font-size: 12px;
  font-weight: 800;
}

.hero-copy h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

.hero-copy span {
  display: block;
  margin-top: 6px;
  color: var(--n-text-color-3);
  line-height: 1.6;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  align-items: start;
}

.side-stack {
  display: grid;
  gap: 20px;
}

.panel-card {
  border-radius: 8px;
  box-shadow: 0 16px 40px rgba(24, 36, 56, 0.06);
}

.form-grid {
  display: grid;
  gap: 0 16px;
}

.two-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.three-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.visibility-panel {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid rgba(128, 128, 128, 0.16);
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.04);
}

.visibility-panel div {
  display: grid;
  gap: 4px;
}

.visibility-panel span {
  color: var(--n-text-color-3);
  font-size: 13px;
}

.form-actions,
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.verify-modal {
  width: min(440px, calc(100vw - 32px));
}

.verify-alert {
  margin-bottom: 16px;
}

.code-button {
  width: 112px;
}

@media (width <= 1080px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (width <= 760px) {
  .profile-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-copy h1 {
    font-size: 22px;
  }

  .two-columns,
  .three-columns {
    grid-template-columns: 1fr;
  }
}
</style>
