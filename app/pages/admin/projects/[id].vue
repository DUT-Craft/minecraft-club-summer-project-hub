<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
      </div>

      <template v-else-if="session">
        <n-card class="manage-hero" :bordered="false">
          <div class="hero-info">
            <n-space :size="8" align="center">
              <n-tag :bordered="false" type="primary">{{ session.project.type || "未分类" }}</n-tag>
              <n-tag :bordered="false">{{ statusLabel }}</n-tag>
              <n-tag :bordered="false" round class="id-tag">ID · {{ session.project.id }}</n-tag>
            </n-space>
            <h1>{{ session.project.title }}</h1>
            <span>负责人：{{ session.project.ownerName || "未填写" }}</span>
          </div>
          <div class="hero-actions">
            <n-button size="large" @click="navigateTo('/admin')">切换账号</n-button>
            <n-button size="large" type="primary" @click="handleLogout">退出登录</n-button>
          </div>
        </n-card>

        <n-card class="manage-panel" :bordered="false">
          <template #header>
            <div class="panel-head">
              <span class="eyebrow">Owner Console</span>
              <h2>项目管理面板</h2>
            </div>
          </template>
          <template #header-extra>
            <n-space :size="8" align="center">
              <n-button size="small" type="primary" @click="openEditModal">编辑项目信息</n-button>
              <n-button :loading="refreshing" size="small" @click="handleRefresh">
                {{ refreshing ? "同步中..." : "刷新" }}
              </n-button>
            </n-space>
          </template>

          <n-alert :bordered="false" type="success" class="login-banner">
            <strong>已登录项目方后台。</strong>
            登录时间：{{ formatTime(session.loginAt) }}。可在此编辑项目信息、修改管理密码、处理加入申请。
          </n-alert>

          <dl class="info-list">
            <div class="info-row">
              <dt>项目标题</dt>
              <dd>{{ session.project.title || "——" }}</dd>
            </div>
            <div class="info-row">
              <dt>项目类型</dt>
              <dd>{{ session.project.type || "——" }}</dd>
            </div>
            <div class="info-row">
              <dt>负责人</dt>
              <dd>{{ session.project.ownerName || "——" }}</dd>
            </div>
            <div v-if="session.project.ownerMinecraftId" class="info-row">
              <dt>Minecraft ID</dt>
              <dd>{{ session.project.ownerMinecraftId }}</dd>
            </div>
            <div v-if="session.project.publicContact" class="info-row">
              <dt>联系方式</dt>
              <dd>{{ session.project.publicContact }}</dd>
            </div>
            <div class="info-row">
              <dt>当前状态</dt>
              <dd>
                <n-tag :bordered="false" size="small" round class="status-tag">{{ statusLabel }}</n-tag>
              </dd>
            </div>
          </dl>

          <div v-if="session.project.summary" class="info-block">
            <strong>项目简介</strong>
            <p class="info-text">{{ session.project.summary }}</p>
          </div>

          <div v-if="session.project.description" class="info-block">
            <strong>项目详细介绍</strong>
            <p class="info-text">{{ session.project.description }}</p>
          </div>

          <div v-if="needs.length" class="info-block">
            <strong>招工需求</strong>
            <div class="need-list">
              <article
                v-for="need in needs"
                :key="need.id || need.skill"
                class="need-card"
              >
                <div class="need-head">
                  <span class="need-skill">{{ need.skill }}</span>
                  <n-tag :bordered="false" size="small" round class="need-count">招 {{ need.count }} 人</n-tag>
                </div>
                <p v-if="need.work" class="need-work">{{ need.work }}</p>
              </article>
            </div>
          </div>
        </n-card>

        <div class="action-grid">
          <n-card class="action-card" :bordered="false">
            <template #header>
              <div class="panel-head">
                <span class="eyebrow">Security</span>
                <h3>修改管理密码</h3>
              </div>
            </template>
            <n-form
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-placement="top"
              :show-require-mark="false"
              size="medium"
              class="password-form"
              @submit.prevent="handleChangePassword"
            >
              <n-form-item label="新管理密码" path="newPassword">
                <n-input
                  v-model:value="passwordForm.newPassword"
                  type="password"
                  show-password-on="click"
                  placeholder="至少 6 位"
                />
              </n-form-item>
              <n-form-item label="确认新密码" path="confirmPassword">
                <n-input
                  v-model:value="passwordForm.confirmPassword"
                  type="password"
                  show-password-on="click"
                  placeholder="再次输入新密码"
                  @keyup.enter="handleChangePassword"
                />
              </n-form-item>
              <n-button type="primary" attr-type="submit" :loading="submittingPassword">
                {{ submittingPassword ? "提交中..." : "更新密码" }}
              </n-button>
            </n-form>
            <p class="action-hint">当前密码取自已登录会话，无需重复输入；更新后新密码会自动覆盖会话。</p>
          </n-card>
        </div>

        <n-card class="applications-panel" :bordered="false">
          <template #header>
            <div class="panel-head">
              <span class="eyebrow">Join Applications</span>
              <h2>加入申请管理</h2>
            </div>
          </template>
          <template #header-extra>
            <n-space :size="8" align="center" wrap>
              <n-select
                v-model:value="applicationFilter"
                :options="filterOptions"
                size="small"
                class="filter-select"
              />
              <n-button size="small" :loading="loadingApplications" @click="loadApplications">
                {{ applications.length || loadedApplications ? "刷新" : "加载申请" }}
              </n-button>
            </n-space>
          </template>

          <n-empty
            v-if="!applications.length"
            description="暂无加入申请，点击右上角「刷新」可重新拉取。"
          />
          <div v-else class="application-list">
            <article
              v-for="app in applications"
              :key="app.id"
              class="application-card"
            >
              <div class="application-head">
                <span class="application-name">{{ app.nickName || "匿名申请人" }}</span>
                <n-tag :bordered="false" size="small" round :type="applicationTagType(app.status)">
                  {{ applicationStatusLabel(app.status) }}
                </n-tag>
              </div>
              <dl class="application-meta">
                <div>
                  <dt>Minecraft ID</dt>
                  <dd>{{ app.mcId || "——" }}</dd>
                </div>
                <div>
                  <dt>联系方式</dt>
                  <dd>{{ app.contact || "——" }}</dd>
                </div>
                <div>
                  <dt>申请时间</dt>
                  <dd>{{ formatTime(app.createTime) }}</dd>
                </div>
              </dl>
              <p v-if="app.reason" class="application-reason">{{ app.reason }}</p>
              <div v-if="(app.status || '').toUpperCase() === 'PENDING'" class="application-actions">
                <n-button
                  type="primary"
                  size="small"
                  :loading="processingId === app.id"
                  @click="handleAccept(app)"
                >
                  同意
                </n-button>
                <n-button
                  size="small"
                  :loading="processingId === app.id"
                  @click="handleReject(app)"
                >
                  拒绝
                </n-button>
              </div>
            </article>
          </div>
        </n-card>

        <!-- 动态管理：发布 / 编辑 / 删除项目动态（自带图片上传） -->
        <AdminProjectUpdates
          :project-id="session.project.id"
          :control-password="session.controlPassword"
        />
        <!-- 评论审核：通过 / 拒绝 / 删除待审核评论 -->
        <AdminProjectComments
          :project-id="session.project.id"
          :control-password="session.controlPassword"
        />

        <n-card class="danger-zone" :bordered="false">
          <template #header>
            <div class="panel-head">
              <span class="eyebrow danger-eyebrow">Danger Zone</span>
              <h2>删除项目</h2>
            </div>
          </template>
          <p class="danger-desc">
            删除后项目将被标记为已删除，不再在项目广场公开展示。此操作在前端不可逆，仅能由后端恢复。
          </p>
          <n-popconfirm @positive-click="handleDeleteProject">
            <template #trigger>
              <n-button type="error" :loading="deleting">删除此项目</n-button>
            </template>
            确定删除本项目吗？删除后将立即退出管理后台。
          </n-popconfirm>
        </n-card>

        <!-- 编辑项目信息弹窗：字段较多，用 modal 收纳避免主面板过长 -->
        <n-modal
          v-model:show="showEditModal"
          preset="card"
          title="编辑项目信息"
          :bordered="false"
          style="width: min(720px, calc(100% - 28px)); max-width: 720px"
          :mask-closable="false"
        >
          <n-form
            ref="editFormRef"
            :model="editForm"
            :rules="editRules"
            label-placement="top"
            :show-require-mark="false"
            size="medium"
            @submit.prevent="handleEditSubmit"
          >
            <div class="edit-grid">
              <n-form-item label="项目标题" path="title">
                <n-input v-model:value="editForm.title" placeholder="项目标题" />
              </n-form-item>
              <n-form-item label="项目类型" path="type">
                <n-input v-model:value="editForm.type" placeholder="如：建筑 / 红石 / 剧情" />
              </n-form-item>
            </div>

            <n-form-item label="运营状态" path="status">
              <n-select
                v-model:value="editForm.status"
                :options="statusOptions"
                placeholder="选择当前运营状态"
              />
            </n-form-item>

            <n-form-item label="项目简介" path="introduction">
              <n-input
                v-model:value="editForm.introduction"
                type="textarea"
                :rows="2"
                placeholder="一句话简介，展示在卡片上"
              />
            </n-form-item>

            <n-form-item label="项目详细介绍" path="description">
              <n-input
                v-model:value="editForm.description"
                type="textarea"
                :rows="4"
                placeholder="项目的背景、目标、玩法等详细说明"
              />
            </n-form-item>

            <div class="edit-grid">
              <n-form-item label="负责人" path="ownerName">
                <n-input v-model:value="editForm.ownerName" placeholder="负责人昵称" />
              </n-form-item>
              <n-form-item label="负责人 Minecraft ID" path="ownerMinecraftId">
                <n-input v-model:value="editForm.ownerMinecraftId" placeholder="Java / 基岩版 ID" />
              </n-form-item>
            </div>

            <n-form-item label="公开联系方式" path="publicContact">
              <n-input v-model:value="editForm.publicContact" placeholder="QQ 群 / Discord 等" />
            </n-form-item>

            <n-form-item label="标签" path="tagsText">
              <n-input v-model:value="editForm.tagsText" placeholder="用逗号分隔，如：建筑,红石,剧情" />
            </n-form-item>

            <n-form-item label="招工需求" path="recruitmentNeeds">
              <div class="need-editor">
                <div
                  v-for="(need, index) in editForm.recruitmentNeeds"
                  :key="index"
                  class="need-editor-row"
                >
                  <n-input v-model:value="need.skill" placeholder="岗位（如 建筑师）" />
                  <n-input-number
                    v-model:value="need.count"
                    :min="0"
                    placeholder="人数"
                    class="need-editor-count"
                  />
                  <n-input v-model:value="need.work" placeholder="工作内容 / 要求" class="need-editor-work" />
                  <n-button quaternary type="error" @click="editForm.recruitmentNeeds.splice(index, 1)">
                    删除
                  </n-button>
                </div>
                <n-button dashed block @click="addNeed">+ 添加岗位</n-button>
              </div>
            </n-form-item>
          </n-form>

          <template #footer>
            <div class="edit-footer">
              <n-button @click="showEditModal = false">取消</n-button>
              <n-button type="primary" :loading="submittingEdit" @click="handleEditSubmit">
                {{ submittingEdit ? "保存中..." : "保存修改" }}
              </n-button>
            </div>
          </template>
        </n-modal>
      </template>

      <n-empty
        v-else
        class="empty-state"
        description="尚未登录项目方后台"
      >
        <template #extra>
          <p class="empty-subtext">
            项目方会话仅在当前标签页有效，关闭或刷新过久会失效。请重新用项目 ID + 管理密码登录。
          </p>
          <n-button type="primary" @click="navigateTo('/admin')">前往登录</n-button>
        </template>
      </n-empty>
    </n-config-provider>
  </main>
</template>

<script setup lang="ts">
import type {FormInst, FormRules} from "naive-ui";
import type {JoinApplicationResponse} from "~/composables/useProjectHubApi";
import type {RecruitmentNeed} from "~/types/projectHub";


definePageMeta({
  layout: false,
  // 仅允许纯数字 id；非数字（如 /admin/projects/abc）直接落到 404
  validate: (to) => /^\d+$/.test(String(to.params.id)),
});

// 项目方可切换的运营状态：仅这 4 个对外可见；
// 审核类状态（PENDING/APPROVED/REJECTED/DELETED）由管理员侧推进，不放进编辑选项
const OPERATIONAL_STATUSES = ["PREPARING", "RECRUITING", "IN_PROGRESS", "PAUSED"] as const;

const route = useRoute();
const message = useMessage();
const { themeOverrides } = useMinecraftTheme();
// session 直接绑定 useOwnerSession 的共享 ref：updateProjectSession / updateControlPassword /
// clear 回写后 hero 与 info 面板自动刷新，不再用本地副本（本地副本会断开响应式，导致「刷新」点完不更新）
const { session, read, clear, updateProject: updateProjectSession, updateControlPassword } = useOwnerSession();
const {
  updateProject: updateProjectApi,
  changeControlPassword,
  loadJoinApplications,
  acceptJoinApplication,
  rejectJoinApplication,
  verifyProjectOwner,
  deleteProject,
} = useProjectHubApi();

const loading = ref(true);

const projectId = computed(() => String(route.params.id));

onMounted(() => {
  // 项目方会话由登录页写入（useOwnerSession），刷新时从 sessionStorage 兜底恢复。
  // 注意：会话里的 project.id 必须与当前路径 id 一致，避免登录 A 项目后手动跳到 B 的管理页
  const current = read();
  if (current && String(current.project.id) === projectId.value) {
    // read() 已把共享 session 恢复就绪，无需再赋值；直接拉取一次加入申请
    loadApplications();
  } else if (current && String(current.project.id) !== projectId.value) {
    // 路径 id 与会话不匹配：清掉脏会话，落到「未登录」空态让用户重登
    clear();
  }
  loading.value = false;
});

const statusLabel = computed(() => formatProjectStatus(session.value?.project.status));

const needs = computed<RecruitmentNeed[]>(() => session.value?.project.recruitmentNeeds ?? []);

const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("zh-CN") : "未记录时间");

const handleLogout = () => {
  // clear() 已把共享 session 置空，模板自动切回「未登录」空态
  clear();
  message.success("已退出项目方后台");
  navigateTo("/admin");
};

const refreshing = ref(false);
const deleting = ref(false);

// 刷新：用当前会话密码重新调 verify，拿到后端最新项目详情回写会话，
// 避免管理页一直停留在登录时刻的快照（例如管理员改了状态后项目方还看到旧值）
const handleRefresh = async () => {
  const current = session.value;
  if (!current) {
    return;
  }
  try {
    refreshing.value = true;
    const latest = await verifyProjectOwner(current.project.id, current.controlPassword);
    updateProjectSession(latest);
    message.success("已同步最新项目信息");
  } catch (error) {
    message.error(error instanceof Error && error.message
      ? error.message
      : "刷新失败，控制密码可能已变更，请重新登录");
  } finally {
    refreshing.value = false;
  }
};

// 软删除项目（后端置 DELETED，不再公开展示）；不可在前端恢复，需二次确认
const handleDeleteProject = async () => {
  const current = session.value;
  if (!current) {
    return;
  }
  try {
    deleting.value = true;
    await deleteProject(current.project.id, current.controlPassword);
    // clear() 已把共享 session 置空，模板自动切回「未登录」空态
    clear();
    message.success("项目已删除");
    navigateTo("/admin");
  } catch (error) {
    message.error(error instanceof Error && error.message
      ? error.message
      : "删除失败，请稍后再试");
  } finally {
    deleting.value = false;
  }
};

/* ---------- 编辑项目信息 ---------- */

const editFormRef = ref<FormInst | null>(null);
const showEditModal = ref(false);
const submittingEdit = ref(false);

// 编辑表单：recruitmentNeeds 用 { skill, count, work } 行内编辑；tags 用逗号分隔文本，提交前再拆分
const editForm = reactive({
  title: "",
  type: "",
  status: "PREPARING" as string,
  introduction: "",
  description: "",
  ownerName: "",
  ownerMinecraftId: "",
  publicContact: "",
  tagsText: "",
  recruitmentNeeds: [] as { skill: string; count: number; work: string }[],
});

const editRules: FormRules = {
  title: { required: true, message: "请填写项目标题", trigger: ["blur", "input"] },
  type: { required: true, message: "请填写项目类型", trigger: ["blur", "input"] },
};

const statusOptions = OPERATIONAL_STATUSES.map((value) => ({
  label: formatProjectStatus(value),
  value,
}));

const addNeed = () => {
  editForm.recruitmentNeeds.push({ skill: "", count: 1, work: "" });
};

// 打开弹窗时把当前项目快照到表单；不在 session.value 上直接编辑，避免「取消」后脏数据残留
const openEditModal = () => {
  const project = session.value?.project;
  if (!project) {
    return;
  }
  editForm.title = project.title ?? "";
  editForm.type = project.type ?? "";
  editForm.status = project.status && OPERATIONAL_STATUSES.includes(project.status.toUpperCase() as (typeof OPERATIONAL_STATUSES)[number])
    ? project.status.toUpperCase()
    : "PREPARING";
  editForm.introduction = project.summary ?? "";
  editForm.description = project.description ?? "";
  editForm.ownerName = project.ownerName ?? "";
  editForm.ownerMinecraftId = project.ownerMinecraftId ?? "";
  editForm.publicContact = project.publicContact ?? "";
  editForm.tagsText = (project.skills ?? []).join(", ");
  editForm.recruitmentNeeds = (project.recruitmentNeeds ?? []).map((need) => ({
    skill: need.skill ?? "",
    count: need.count ?? 0,
    work: need.work ?? "",
  }));
  showEditModal.value = true;
};

const handleEditSubmit = async () => {
  const current = session.value;
  if (!current) {
    return;
  }
  try {
    await editFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submittingEdit.value = true;
    const updated = await updateProjectApi(current.project.id, current.controlPassword, {
      title: editForm.title.trim(),
      type: editForm.type.trim(),
      status: editForm.status,
      introduction: editForm.introduction.trim(),
      description: editForm.description,
      ownerName: editForm.ownerName.trim(),
      ownerMinecraftId: editForm.ownerMinecraftId.trim(),
      publicContact: editForm.publicContact.trim(),
      tags: editForm.tagsText
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      recruitmentNeeds: editForm.recruitmentNeeds
        .map((need) => ({
          skill: need.skill.trim(),
          count: Number(need.count) || 0,
          work: need.work.trim(),
        }))
        .filter((need) => need.skill),
    });
    // 把后端返回的最新项目回写到会话，hero / info 面板会随之刷新
    updateProjectSession(updated);
    message.success("项目信息已更新");
    showEditModal.value = false;
  } catch (error) {
    message.error(error instanceof Error && error.message
      ? error.message
      : "保存失败，请稍后再试");
  } finally {
    submittingEdit.value = false;
  }
};

/* ---------- 修改管理密码 ---------- */

const passwordFormRef = ref<FormInst | null>(null);
const submittingPassword = ref(false);

const passwordForm = reactive({
  newPassword: "",
  confirmPassword: "",
});

const passwordRules: FormRules = {
  newPassword: [
    { required: true, message: "请输入新密码", trigger: ["blur", "input"] },
    { min: 6, message: "密码至少 6 位", trigger: ["blur", "input"] },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: ["blur", "input"] },
    {
      validator: (_rule, value) => value === passwordForm.newPassword,
      message: "两次输入的密码不一致",
      trigger: ["blur", "input"],
    },
  ],
};

const handleChangePassword = async () => {
  const current = session.value;
  if (!current) {
    return;
  }
  try {
    await passwordFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submittingPassword.value = true;
    await changeControlPassword(current.project.id, current.controlPassword, passwordForm.newPassword);
    // 后续所有管理操作都要带 controlPassword，必须把会话里的明文同步成新密码
    updateControlPassword(passwordForm.newPassword);
    message.success("管理密码已更新");
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
  } catch (error) {
    message.error(error instanceof Error && error.message
      ? error.message
      : "修改密码失败，请稍后再试");
  } finally {
    submittingPassword.value = false;
  }
};

/* ---------- 加入申请管理 ---------- */

const applications = ref<JoinApplicationResponse[]>([]);
const loadingApplications = ref(false);
const loadedApplications = ref(false);
// processingId 标记当前正在 同意/拒绝 的申请，给对应行两个按钮同时置 loading
const processingId = ref<string | number | null>(null);
// 默认拉全部申请；用户可按状态筛选待处理 / 已同意 / 已联系 / 已拒绝
const applicationFilter = ref<string>("");

const filterOptions = [
  { label: "待处理", value: "PENDING" },
  { label: "已同意", value: "ACCEPTED" },
  { label: "已联系", value: "CONTACTED" },
  { label: "已拒绝", value: "REJECTED" },
  { label: "全部", value: "" },
];

const loadApplications = async () => {
  const current = session.value;
  if (!current) {
    return;
  }
  try {
    loadingApplications.value = true;
    const list = await loadJoinApplications(
      current.project.id,
      current.controlPassword,
      applicationFilter.value || undefined,
    );
    // 按 createTime 倒序，最新的申请排在最前
    applications.value = list.sort(
      (a, b) => Date.parse(b.createTime ?? "") - Date.parse(a.createTime ?? ""),
    );
    loadedApplications.value = true;
  } catch (error) {
    // 加载失败（如后端尚未实现 GET 申请列表接口）时清空列表，避免展示过期数据
    message.error(error instanceof Error && error.message
      ? error.message
      : "加载申请列表失败，该接口可能尚未上线");
    applications.value = [];
  } finally {
    loadingApplications.value = false;
  }
};

// 切换筛选时若已加载过，自动刷新；未加载过不打扰用户
watch(applicationFilter, () => {
  if (loadedApplications.value) {
    loadApplications();
  }
});

const reloadAfterProcess = async () => {
  // 处理完一条后若停留在「待处理」视图，列表里那条应消失；其它视图则刷新状态
  await loadApplications();
};

const handleAccept = async (app: JoinApplicationResponse) => {
  const current = session.value;
  if (!current || app.id == null) {
    return;
  }
  try {
    processingId.value = app.id;
    await acceptJoinApplication(current.project.id, app.id, current.controlPassword);
    message.success(`已同意 ${app.nickName || "申请人"} 的加入申请`);
    await reloadAfterProcess();
  } catch (error) {
    message.error(error instanceof Error && error.message
      ? error.message
      : "操作失败，请稍后再试");
  } finally {
    processingId.value = null;
  }
};

const handleReject = async (app: JoinApplicationResponse) => {
  const current = session.value;
  if (!current || app.id == null) {
    return;
  }
  try {
    processingId.value = app.id;
    await rejectJoinApplication(current.project.id, app.id, current.controlPassword);
    message.success(`已拒绝 ${app.nickName || "申请人"} 的加入申请`);
    await reloadAfterProcess();
  } catch (error) {
    message.error(error instanceof Error && error.message
      ? error.message
      : "操作失败，请稍后再试");
  } finally {
    processingId.value = null;
  }
};

const applicationStatusLabel = (status?: string) => {
  switch ((status || "").toUpperCase()) {
    case "PENDING": return "待处理";
    case "ACCEPTED": return "已同意";
    case "CONTACTED": return "已联系";
    case "REJECTED": return "已拒绝";
    case "DELETED": return "已删除";
    default: return status || "未知";
  }
};

const applicationTagType = (status?: string): "warning" | "success" | "info" | "error" | "default" => {
  switch ((status || "").toUpperCase()) {
    case "PENDING": return "warning";
    case "ACCEPTED": return "success";
    case "CONTACTED": return "info";
    case "REJECTED": return "error";
    default: return "default";
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

.manage-hero,
.manage-panel,
.applications-panel,
.empty-state,
.loading-state {
  width: min(1080px, calc(100% - 28px));
  margin: 22px auto 0;
}

.action-grid {
  width: min(1080px, calc(100% - 28px));
  margin: 16px auto 0;
  display: grid;
  /* 编辑入口已上移到面板头部，这里只剩修改密码一张卡，单列全宽与上下面板对齐 */
  grid-template-columns: 1fr;
  gap: 16px;
}

.loading-state {
  display: grid;
  place-items: center;
  padding: 80px 0;
}

/* 把 Naive UI 的卡片包成 Minecraft 风格的木边面板 */
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

.id-tag {
  background: #fff8df;
  color: #5a3a21;
  font-weight: 800;
}

.hero-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 10px;
}

.panel-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.eyebrow {
  color: #6b8f32;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.12em;
}

.panel-head h2,
.panel-head h3 {
  margin: 0;
  color: #2d2418;
}

.login-banner {
  margin-bottom: 16px;
  border: 2px solid #6b8f32 !important;
  border-radius: 9px;
  background: #f0f8d8;
}

/* 项目信息：自定义 dl 网格，比 n-descriptions 更可控主题 */
.info-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 16px;
}

.info-row {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border: 2px solid #8b6a3d;
  border-radius: 8px;
  background: rgba(255, 248, 223, 0.7);
}

.info-row dt {
  color: #795b36;
  font-weight: 800;
  font-size: 12px;
}

.info-row dd {
  margin: 0;
  color: #2d2418;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
}

.status-tag {
  background: #fff3d4;
  color: #8a5a1c;
  font-weight: 800;
}

.info-block {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.info-block strong {
  color: #2d2418;
  font-weight: 900;
}

.info-text {
  margin: 0;
  padding: 12px 14px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: rgba(255, 248, 223, 0.7);
  color: #4f3924;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 招工需求卡：复用项目详情页的左绿条便签风格 */
.need-list {
  display: grid;
  gap: 10px;
}

.need-card {
  position: relative;
  padding: 12px 14px 12px 18px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
  overflow: hidden;
}

.need-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #6b8f32;
}

.need-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.need-skill {
  font-weight: 900;
  color: #2d2418;
  font-size: 16px;
}

.need-count {
  background: #6b8f32;
  color: #fff8df;
  font-weight: 800;
}

.need-work {
  margin: 0;
  color: #60462b;
  line-height: 1.7;
}

/* 操作卡：编辑信息 / 修改密码 两栏 */
.action-card .action-desc {
  margin: 0 0 14px;
  color: #60462b;
  line-height: 1.7;
}

.action-card .action-hint {
  margin: 12px 0 0;
  color: #795b36;
  font-size: 13px;
  line-height: 1.7;
}

.password-form {
  display: grid;
  gap: 4px;
  max-width: 480px;
}

.password-form :deep(.n-form-item) {
  margin-bottom: 0;
}

.filter-select {
  width: 130px;
}

/* 加入申请列表 */
.application-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.application-card {
  position: relative;
  padding: 14px 16px 14px 20px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: #fff8df;
  box-shadow: 0 3px 0 rgba(90, 58, 33, 0.18);
  overflow: hidden;
}

.application-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: #6b8f32;
}

.application-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.application-name {
  font-weight: 900;
  color: #2d2418;
  font-size: 16px;
  word-break: break-word;
}

.application-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 8px;
}

.application-meta div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.application-meta dt {
  color: #795b36;
  font-weight: 800;
  font-size: 12px;
}

.application-meta dd {
  margin: 0;
  color: #2d2418;
  font-weight: 700;
  word-break: break-word;
}

.application-reason {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  color: #4f3924;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.application-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

/* 编辑弹窗内的两列表单 */
.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.edit-grid :deep(.n-form-item) {
  margin-bottom: 0;
}

.need-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.need-editor-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px minmax(0, 1.4fr) auto;
  align-items: flex-start;
  gap: 8px;
}

.edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.empty-subtext {
  margin: 8px 0 16px;
  color: #60462b;
  line-height: 1.7;
}

/* 危险区：删除项目。用红石红强调不可逆操作。
   danger-zone 类直接挂在 n-card 根元素上，作用域选择器特异性高于 :deep(.n-card)，可覆盖木边配色 */
.danger-zone {
  width: min(1080px, calc(100% - 28px));
  margin: 16px auto 0;
  border-color: #963c30;
}

.danger-eyebrow {
  color: #963c30;
}

.danger-desc {
  margin: 0 0 14px;
  color: #60462b;
  line-height: 1.7;
}

@media (width <= 720px) {
  .manage-hero :deep(.n-card__content) {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .info-list,
  .application-meta {
    grid-template-columns: 1fr;
  }

  .need-editor-row {
    grid-template-columns: 1fr;
  }

  .edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
