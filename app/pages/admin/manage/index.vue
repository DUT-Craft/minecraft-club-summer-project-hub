<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="loading" class="loading-state">
        <n-spin size="large"/>
      </div>

      <template v-else-if="session">
        <n-card :bordered="false" class="manage-hero">
          <div class="hero-info">
            <p class="eyebrow">{{ isSuperAdmin ? "Super Admin" : "Project Owner" }}</p>
            <h1>{{ isSuperAdmin ? "总管理控制台" : "项目控制台" }}</h1>
            <span>
              {{ session.username || "用户" }}
              <n-tag :bordered="false" :type="isSuperAdmin ? 'success' : 'info'" class="role-tag" round size="small">
                {{ isSuperAdmin ? "总管理" : "项目用户" }}
              </n-tag>
              · 登录于 {{ formatTime(session.loginAt) }}
            </span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/')">返回站点</n-button>
            <n-button size="large" @click="showPasswordModal = true">修改密码</n-button>
            <n-button size="large" type="primary" @click="handleLogout">退出登录</n-button>
          </div>
        </n-card>

        <div class="entry-grid">
          <n-card v-if="isSuperAdmin" :bordered="false" class="entry-card entry-card--assign" hoverable>
            <div class="entry-head">
              <span class="entry-badge entry-badge--assign" aria-hidden="true"> ⟲ </span>
              <div class="entry-titles">
                <span class="eyebrow">Assign</span>
                <h2>项目分配</h2>
              </div>
            </div>
            <p class="entry-desc">把项目分配给有创建资格的用户或总管理（含你自己，每账号名下上限 10 个），或收回为未分配。</p>
            <n-space :size="10" align="center" wrap>
              <n-select
                  v-model:value="assignProjectId"
                  :options="assignProjectOptions"
                  class="assign-select"
                  filterable
                  placeholder="选择项目"
              />
              <n-select
                  v-model:value="assignManagerId"
                  :options="assignManagerOptions"
                  class="assign-select"
                  filterable
                  placeholder="选择归属用户"
              />
              <n-button :disabled="assignProjectId == null" :loading="assigning" type="primary" @click="handleAssign">
                {{ assignManagerId == null ? "收回" : "分配" }}
              </n-button>
            </n-space>
          </n-card>

          <n-card v-if="isSuperAdmin" :bordered="false" class="entry-card entry-card--users" hoverable>
            <div class="entry-head">
              <span class="entry-badge entry-badge--users" aria-hidden="true"> ♛ </span>
              <div class="entry-titles">
                <span class="eyebrow">Users</span>
                <h2>用户管理</h2>
              </div>
            </div>
            <p class="entry-desc">管理全部账号：授予 / 撤销项目创建资格，查看角色与状态。被授权的用户可创建并管理自己的项目。</p>
            <div class="entry-foot">
              <n-button size="large" type="primary" @click="navigateTo('/admin/manage/users')">进入用户管理</n-button>
            </div>
          </n-card>

          <n-card :bordered="false" class="entry-card entry-card--projects" hoverable>
            <div class="entry-head">
              <span class="entry-badge entry-badge--projects" aria-hidden="true"> ❖ </span>
              <div class="entry-titles">
                <span class="eyebrow">Projects</span>
                <h2>项目管理</h2>
              </div>
            </div>
            <p class="entry-desc">
              {{
                isSuperAdmin ? "审核、批量改状态、分配项目，进入单个项目维护。" : "管理名下项目：审核加入申请、发布动态、审核评论。"
              }}
            </p>
            <div class="entry-foot">
              <n-button size="large" type="primary" @click="navigateTo('/admin/manage/projects')">进入项目管理</n-button>
            </div>
          </n-card>

          <n-card v-if="isSuperAdmin" :bordered="false" class="entry-card entry-card--tags" hoverable>
            <div class="entry-head">
              <span class="entry-badge entry-badge--tags" aria-hidden="true"> # </span>
              <div class="entry-titles">
                <span class="eyebrow">Tags</span>
                <h2>标签管理</h2>
              </div>
            </div>
            <p class="entry-desc">维护全局项目标签字典（父子层级 / 是否可选 / 排序），驱动投稿、项目编辑与项目墙 Cascader。</p>
            <div class="entry-foot">
              <n-button size="large" type="primary" @click="navigateTo('/admin/manage/tags')">进入标签管理</n-button>
            </div>
          </n-card>

          <n-card v-if="isSuperAdmin" :bordered="false" class="entry-card entry-card--ideas" hoverable>
            <div class="entry-head">
              <span class="entry-badge entry-badge--ideas" aria-hidden="true"> ✦ </span>
              <div class="entry-titles">
                <span class="eyebrow">Ideas</span>
                <h2>想法管理</h2>
              </div>
            </div>
            <p class="entry-desc">审核想法墙投稿、批量改状态、编辑或删除单个想法。</p>
            <div class="entry-foot">
              <n-button size="large" type="primary" @click="navigateTo('/admin/manage/ideas')">进入想法管理</n-button>
            </div>
          </n-card>

          <n-card v-if="isSuperAdmin" :bordered="false" class="entry-card entry-card--mine" hoverable>
            <div class="entry-head">
              <span class="entry-badge entry-badge--mine" aria-hidden="true"> ★ </span>
              <div class="entry-titles">
                <span class="eyebrow">My Projects</span>
                <h2>我的项目</h2>
              </div>
            </div>
            <p class="entry-desc">管理你自己归属的项目，或直接创建新的自有项目（与全局项目相互独立）。</p>
            <div class="entry-foot">
              <n-button size="large" type="primary" @click="navigateTo('/admin/manage/projects?scope=mine')">
                进入我的项目
              </n-button>
            </div>
          </n-card>
        </div>

        <p v-if="!isSuperAdmin" class="scope-hint">
          普通用户仅能管理归属自己的项目；如需管理全部项目或想法，请联系总管理。
        </p>
      </template>

      <n-empty v-else class="empty-state" description="尚未登录管理员账号">
        <template #extra>
          <p class="empty-subtext">管理员会话仅在当前标签页有效，关闭或刷新过久会失效。</p>
          <n-button type="primary" @click="navigateTo('/admin')">前往登录</n-button>
        </template>
      </n-empty>

      <!-- 修改密码：已登录，需旧密码 + 邮箱验证码确认 -->
      <n-modal
          v-model:show="showPasswordModal"
          :bordered="false"
          :mask-closable="false"
          preset="card"
          style="width: min(480px, calc(100% - 28px))"
          title="修改密码"
      >
        <n-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            :show-require-mark="false"
            label-placement="top"
            @submit.prevent="handleChangePassword"
        >
          <n-form-item label="当前密码" path="oldPassword">
            <n-input
                v-model:value="passwordForm.oldPassword"
                placeholder="输入当前登录密码"
                show-password-on="click"
                type="password"
            />
          </n-form-item>
          <n-form-item label="邮箱验证码" path="emailCode">
            <VerificationCodeInput
                :code="passwordForm.emailCode"
                :email="sessionEmail"
                scene="CHANGE_PASSWORD"
                @update:code="passwordForm.emailCode = $event"
            />
            <template #feedback>
              <span class="email-hint">验证码将发送至当前账号绑定的邮箱（以服务端记录为准）。</span>
            </template>
          </n-form-item>
          <n-form-item label="新密码" path="newPassword">
            <n-input
                v-model:value="passwordForm.newPassword"
                placeholder="8-64 位，含大写/小写/数字/特殊字符三类"
                show-password-on="click"
                type="password"
            />
          </n-form-item>
          <n-form-item label="确认新密码" path="confirmPassword">
            <n-input
                v-model:value="passwordForm.confirmPassword"
                placeholder="再次输入新密码"
                show-password-on="click"
                type="password"
            />
          </n-form-item>
          <div class="modal-footer">
            <n-button @click="showPasswordModal = false">取消</n-button>
            <n-button :loading="changingPassword" type="primary" @click="handleChangePassword">
              {{ changingPassword ? "保存中..." : "确认修改" }}
            </n-button>
          </div>
        </n-form>
      </n-modal>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {AdminSession} from "~/composables/useAdminAuth";
import type {FormInst, FormRules} from "naive-ui";
import type {ManagerSummary, Project} from "~/types/projectHub";

definePageMeta({
  layout: false,
});

const message = useMessage();
const {themeOverrides} = useMinecraftTheme();
const {read, clear, write} = useAdminAuth();
const {
  adminLogout,
  adminMe,
  listProjectsAdmin,
  listManagers,
  assignProjectOwner,
  changePassword
} = useProjectHubApi();

const loading = ref(true);
const session = ref<AdminSession | null>(null);

const isSuperAdmin = computed(() => session.value?.role === "SUPER_ADMIN");

// 恢复会话后立刻拉一次 /auth/me 同步角色：登录时可能取角色失败 / 旧会话缺角色，
// 这里以保证「总管理专属入口」显隐正确（取不到角色按项目管理兜底）。
onMounted(async () => {
  const existing = read();
  session.value = existing;
  if (!existing) {
    loading.value = false;
    navigateTo("/admin");
    return;
  }
  try {
    const me = await adminMe();
    const updated = {...existing, role: me.role, email: me.email, canCreateProject: me.canCreateProject, id: me.id};
    session.value = updated;
    write(updated);
  } catch {
    // token 失效等：useHttp 已处理清会话 + 跳转，这里不阻塞渲染
  }
  loading.value = false;
  if (session.value?.role === "SUPER_ADMIN") {
    void loadAssignData();
  }
});

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "未记录时间");

/* ---------- 项目分配 ---------- */
const assignProjects = ref<Project[]>([]);
const assignManagers = ref<ManagerSummary[]>([]);
const assignProjectId = ref<string | number | null>(null);
const assignManagerId = ref<string | number | null>(null);
const assigning = ref(false);

const assignProjectOptions = computed(() =>
    assignProjects.value.map((p) => ({label: `#${p.id} ${p.title || "未命名项目"}`, value: p.id})),
);
// 首项「未分配」用于收回项目（ownerId=null）；其余为可归属账号（有项目创建资格的用户 + 总管理，标注身份）。
const assignManagerOptions = computed(() => [
  {label: "（未分配）", value: null},
  ...assignManagers.value.map((m) => ({
    label: `${m.nickname}（${m.username}）· ${m.role === "SUPER_ADMIN" ? "总管理" : "可创建项目"}`,
    value: m.id,
  })),
]);

const loadAssignData = async () => {
  try {
    const [projects, managers] = await Promise.all([listProjectsAdmin(), listManagers()]);
    assignProjects.value = projects;
    assignManagers.value = managers;
  } catch {
    // 下拉数据缺失时用户可稍后重试（进入页面时不阻塞）
  }
};

const handleAssign = async () => {
  if (assignProjectId.value == null) {
    message.warning("请先选择要分配的项目");
    return;
  }
  try {
    assigning.value = true;
    await assignProjectOwner(assignProjectId.value, assignManagerId.value);
    message.success(assignManagerId.value == null ? "已收回项目（未分配）" : "项目已分配给所选项目管理");
    assignProjectId.value = null;
    assignManagerId.value = null;
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "分配失败，请稍后再试");
  } finally {
    assigning.value = false;
  }
};

const handleLogout = async () => {
  try {
    await adminLogout();
  } catch {
    // 忽略：token 可能已过期，继续清本地会话
  }
  clear();
  session.value = null;
  message.success("已退出管理员控制台");
  await navigateTo("/admin");
};

/* ---------- 修改密码（已登录，需旧密码 + 邮箱验证码确认） ---------- */
const showPasswordModal = ref(false);
const changingPassword = ref(false);
const passwordFormRef = ref<FormInst | null>(null);
const passwordForm = reactive({
  oldPassword: "",
  emailCode: "",
  newPassword: "",
  confirmPassword: "",
});
// 改密验证码发到当前账号绑定邮箱：后端按 userId 绑定，忽略请求体 email（设计 §6.2）。
// 这里用会话里的 email 作为 VerificationCodeInput 的占位（组件要求 email 合法才允许发码）。
const sessionEmail = computed(() => session.value?.email ?? "");
const passwordRules: FormRules = {
  oldPassword: {required: true, message: "请输入当前密码", trigger: ["blur", "input"]},
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
      if (value !== passwordForm.newPassword) return new Error("两次密码不一致");
      return true;
    },
  },
};

// 修改密码：POST /api/auth/change-password（JWT 鉴权，后端按 userId+UA 绑定验证码）
// 后端只认已认证用户绑定邮箱的验证码（设计 §6.2），请求体不携带 email。
// 修改成功后后端踢掉所有会话，前端需清会话并跳回登录页。
const handleChangePassword = async () => {
  if (!session.value?.id) {
    message.warning("会话信息缺失，请重新登录后再试");
    return;
  }
  try {
    await passwordFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    changingPassword.value = true;
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
      emailCode: passwordForm.emailCode.trim(),
    });
    message.success("密码已修改，请用新密码重新登录");
    showPasswordModal.value = false;
    // 后端已踢掉所有会话，前端清会话后跳回登录页
    clear();
    session.value = null;
    await navigateTo("/admin");
  } catch (error) {
    message.error(error instanceof Error && error.message ? error.message : "修改失败，请稍后再试");
  } finally {
    changingPassword.value = false;
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

.manage-hero,
.entry-grid,
.scope-hint,
.empty-state,
.loading-state {
  width: min(1080px, calc(100% - 28px));
  margin: 22px auto 0;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 80px 0;
}

:deep(.n-card) {
  border: 2px solid #5a3a21;
  box-shadow: 0 6px 0 #5a3a21;
}

.manage-hero :deep(.n-card__content) {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.hero-info {
  min-width: 0;
}

.eyebrow {
  margin: 0;
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.12em;
}

.hero-info h1 {
  margin: 6px 0 0;
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.08;
  color: #2d2418;
}

.hero-info span {
  display: block;
  margin-top: 9px;
  color: #60462b;
  font-weight: 800;
}

.role-tag {
  margin-left: 6px;
  vertical-align: middle;
}

.hero-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}

/* 入口卡：左侧主题色条 + 顶部对齐，让同行卡片底栏齐平 */
.entry-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.entry-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: var(--entry-accent, #6b8f32);
  transition: width 0.18s ease;
}

.entry-card :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.entry-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 0 #5a3a21;
}

.entry-card:hover::before {
  width: 9px;
}

.entry-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

/* 彩色方块徽标：Minecraft 像素风质感，hover 时高亮 */
.entry-badge {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  background: var(--entry-accent, #6b8f32);
  color: #fff8df;
  font-size: 22px;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 3px 0 #5a3a21;
  transition: filter 0.18s ease;
}

.entry-card:hover .entry-badge {
  filter: brightness(1.12);
}

.entry-titles {
  min-width: 0;
}

.entry-titles .eyebrow {
  margin: 0;
  color: var(--entry-accent, #6b8f32);
  font-weight: 900;
  font-size: 12px;
  letter-spacing: 0.12em;
}

.entry-head h2 {
  margin: 2px 0 0;
  color: #2d2418;
}

.entry-desc {
  margin: 0 0 16px;
  color: #60462b;
  line-height: 1.7;
  flex: 1 1 auto;
}

/* 底部按钮区：统一贴底，保证多卡对齐 */
.entry-foot {
  margin-top: auto;
  padding-top: 4px;
}

/* 各入口主题色（与徽标 + 色条联动） */
.entry-card--assign { --entry-accent: #c0732d; }   /* 橙：分配 */
.entry-card--users { --entry-accent: #6b8f32; }   /* 绿：用户 */
.entry-card--projects { --entry-accent: #4a7cb8; } /* 蓝：项目 */
.entry-card--tags { --entry-accent: #8b5cb6; }    /* 紫：标签 */
.entry-card--ideas { --entry-accent: #c8a83a; }   /* 金：想法 */
.entry-card--mine { --entry-accent: #3aa3a3; }    /* 青：我的项目 */

.assign-select {
  min-width: 220px;
}

.scope-hint {
  margin-top: 16px;
  padding: 0 6px;
  color: #795b36;
  font-size: 13px;
  line-height: 1.7;
  text-align: center;
}

.empty-state {
  width: min(560px, calc(100% - 28px));
  margin: 80px auto 0;
}

.empty-subtext {
  margin: 8px 0 16px;
  color: #60462b;
  line-height: 1.7;
}

@media (width <= 880px) {
  .manage-hero :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }

  .entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 600px) {
  .entry-grid {
    grid-template-columns: 1fr;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.email-hint {
  color: #795b36;
  font-size: 12px;
}
</style>
