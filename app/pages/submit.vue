<template>
  <main class="mc-page">
    <MinecraftSiteHeader/>

    <n-config-provider :theme="null" :theme-overrides="themeOverrides">
      <section class="submit-shell">
        <div class="tabs">
          <n-button :type="mode === 'project' ? 'primary' : 'default'" size="large" @click="mode = 'project'">投稿项目
          </n-button>
          <n-button :type="mode === 'idea' ? 'primary' : 'default'" size="large" @click="mode = 'idea'">提交想法
          </n-button>
        </div>

        <n-card v-if="mode === 'project'" :bordered="false" class="panel">
          <n-form
              ref="projectFormRef"
              :model="projectForm"
              :rules="projectRules"
              :show-require-mark="false"
              label-placement="top"
              @submit.prevent="handleSubmitProject"
          >
            <div class="form-head">
              <p>Project Draft</p>
              <h1>写清项目介绍和招工需求</h1>
            </div>

            <n-form-item label="项目标题" path="title">
              <n-input v-model:value="projectForm.title" placeholder="例如：暑假主城建设计划"/>
            </n-form-item>

            <n-form-item label="项目标签" path="tagIds">
              <ProjectTagCascader v-model="projectForm.tagIds" :max-count="10" placeholder="从预设标签里选择，最多 10 个"/>
            </n-form-item>

            <n-form-item label="项目简介" path="introduction">
              <n-input v-model:value="projectForm.introduction" placeholder="一句话概括这个项目"/>
            </n-form-item>

            <n-form-item label="项目封面图">
              <ImageUploader
                  :url="projectForm.coverImageUrl"
                  button-text="上传封面图"
                  @update:url="projectForm.coverImageUrl = $event"
              />
            </n-form-item>

            <n-form-item label="负责人昵称" path="ownerName">
              <n-input v-model:value="projectForm.ownerName" placeholder="你的社团昵称"/>
            </n-form-item>

            <n-form-item label="项目详细介绍" path="description">
              <n-input
                  v-model:value="projectForm.description"
                  :rows="7"
                  placeholder="主要写这个项目想做什么、怎么玩、希望做成什么样。"
                  type="textarea"
              />
            </n-form-item>

            <div class="needs">
              <div class="needs-head">
                <strong>招工需求</strong>
                <n-button size="small" type="primary" @click="addNeed">添加一条</n-button>
              </div>
              <div v-for="(need, index) in projectForm.recruitmentNeeds" :key="need.id" class="need-row">
                <n-input v-model:value="need.skill" placeholder="技能/方向"/>
                <n-input-number v-model:value="need.count" :min="1" :show-button="false" placeholder="人数"/>
                <n-input v-model:value="need.work" :rows="2" placeholder="大概工作内容" type="textarea"/>
                <n-button size="small" @click="removeNeed(index)">删除</n-button>
              </div>
            </div>

            <div class="two-col">
              <n-form-item label="你的 Minecraft ID" path="ownerMinecraftId">
                <n-input v-model:value="projectForm.ownerMinecraftId" placeholder="Java / 基岩版 ID"/>
              </n-form-item>
              <n-form-item label="联系方式" path="publicContact">
                <n-input v-model:value="projectForm.publicContact" placeholder="QQ / 群号 / Discord 等，会公开展示"/>
              </n-form-item>
            </div>

            <n-button :loading="submitting" attr-type="submit" type="primary">
              {{ submitting ? "提交中..." : "提交项目，等待审核" }}
            </n-button>
          </n-form>
        </n-card>

        <n-card v-else :bordered="false" class="panel">
          <n-form
              ref="ideaFormRef"
              :model="ideaForm"
              :rules="ideaRules"
              :show-require-mark="false"
              label-placement="top"
              @submit.prevent="handleSubmitIdea"
          >
            <div class="form-head">
              <p>Idea Wall</p>
              <h1>把还没成型的点子先放到墙上</h1>
            </div>

            <n-form-item label="想法标题" path="title">
              <n-input v-model:value="ideaForm.title" placeholder="例如：每周末速通接力"/>
            </n-form-item>
            <n-form-item label="想法内容" path="content">
              <n-input
                  v-model:value="ideaForm.content"
                  :rows="8"
                  placeholder="写玩法、规则、需要的人、你希望大家怎么参与。"
                  type="textarea"
              />
            </n-form-item>
            <div class="two-col">
              <n-form-item label="昵称" path="nickname">
                <n-input v-model:value="ideaForm.nickname" placeholder="你的昵称"/>
              </n-form-item>
              <n-form-item label="Minecraft ID" path="minecraftId">
                <n-input v-model:value="ideaForm.minecraftId" placeholder="你的游戏 ID"/>
              </n-form-item>
            </div>

            <n-button :loading="submitting" attr-type="submit" type="primary">
              {{ submitting ? "提交中..." : "提交想法，等待审核" }}
            </n-button>
          </n-form>
        </n-card>
      </section>
    </n-config-provider>
  </main>
</template>

<script lang="ts" setup>
import type {FormInst, FormRules} from "naive-ui";
import type {RecruitmentNeed} from "~/types/projectHub";


definePageMeta({
  layout: false,
});

const message = useMessage();
const route = useRoute();
const {submitProject, submitIdea} = useProjectHubApi();
// 投稿成功后把项目信息 + 表单里的明文密码带到 /submit/success 做一次性展示
const {write: writeSubmission} = useLastSubmission();
const mode = ref<"project" | "idea">("project");
const submitting = ref(false);

const projectFormRef = ref<FormInst | null>(null);
const ideaFormRef = ref<FormInst | null>(null);

const newNeed = (): RecruitmentNeed => ({
  id: String(Date.now() + Math.random()),
  skill: "",
  count: 1,
  work: "",
});

const projectForm = reactive({
  title: "",
  tagIds: [] as Array<number | string>,
  introduction: "",
  coverImageUrl: "",
  ownerName: "",
  ownerMinecraftId: "",
  description: "",
  publicContact: "",
  recruitmentNeeds: [newNeed()],
});

const ideaForm = reactive({
  title: "",
  content: "",
  nickname: "",
  minecraftId: "",
});

const projectRules: FormRules = {
  title: {required: true, message: "请填写项目标题", trigger: ["blur", "input"]},
  introduction: {required: true, message: "请填写项目简介", trigger: ["blur", "input"]},
  ownerName: {required: true, message: "请填写负责人昵称", trigger: ["blur", "input"]},
  description: {required: true, message: "请填写项目详细介绍", trigger: ["blur", "input"]},
  ownerMinecraftId: {required: true, message: "请填写 Minecraft ID", trigger: ["blur", "input"]},
  publicContact: {required: true, message: "请填写联系方式", trigger: ["blur", "input"]},
};

const ideaRules: FormRules = {
  title: {required: true, message: "请填写想法标题", trigger: ["blur", "input"]},
  content: {required: true, message: "请填写想法内容", trigger: ["blur", "input"]},
  nickname: {required: true, message: "请填写昵称", trigger: ["blur", "input"]},
  minecraftId: {required: true, message: "请填写 Minecraft ID", trigger: ["blur", "input"]},
};

// Minecraft 暖色主题（草地绿主色 + 羊皮纸卡片 + 木边输入框），见 useMinecraftTheme
const {themeOverrides} = useMinecraftTheme();

const addNeed = () => {
  projectForm.recruitmentNeeds.push(newNeed());
};

const removeNeed = (index: number) => {
  if (projectForm.recruitmentNeeds.length === 1) {
    message.warning("至少保留一条招工需求");
    return;
  }

  projectForm.recruitmentNeeds.splice(index, 1);
};

const resetProject = () => {
  Object.assign(projectForm, {
    title: "",
    tagIds: [],
    introduction: "",
    coverImageUrl: "",
    ownerName: "",
    ownerMinecraftId: "",
    description: "",
    publicContact: "",
    recruitmentNeeds: [newNeed()],
  });
};

const handleSubmitProject = async () => {
  try {
    await projectFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    const created = await submitProject({
      title: projectForm.title,
      tagIds: projectForm.tagIds,
      introduction: projectForm.introduction,
      ownerName: projectForm.ownerName,
      ownerMinecraftId: projectForm.ownerMinecraftId,
      description: projectForm.description,
      publicContact: projectForm.publicContact,
      coverImageUrl: projectForm.coverImageUrl || undefined,
      recruitmentNeeds: projectForm.recruitmentNeeds.map((need) => ({
        ...need,
        count: Number(need.count) || 1,
      })),
    });
    // 把返回的项目信息存到 useLastSubmission，带到 /submit/success 做一次性展示
    writeSubmission({
      project: created,
      submittedAt: new Date().toISOString(),
    });
    resetProject();
    await navigateTo("/submit/success");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "提交失败，请确认后端接口是否已配置");
  } finally {
    submitting.value = false;
  }
};

const handleSubmitIdea = async () => {
  try {
    await ideaFormRef.value?.validate();
  } catch {
    return;
  }
  try {
    submitting.value = true;
    await submitIdea({...ideaForm});
    message.success("想法已提交，等待管理员审核");
    Object.assign(ideaForm, {
      title: "",
      content: "",
      nickname: "",
      minecraftId: "",
    });
  } catch (error) {
    message.error(error instanceof Error ? error.message : "提交失败，请确认后端接口是否已配置");
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  if (route.hash === "#idea") {
    mode.value = "idea";
  }
  // 投稿收紧为需登录（设计 §8.3 / §14.12）：未登录跳转登录页
  const authToken = useCookie<string | null>("chat_auth_token");
  if (!authToken.value) {
    message.warning("投稿需先登录");
    navigateTo("/admin");
  }
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

.submit-shell {
  width: min(900px, calc(100% - 28px));
  margin: 22px auto 0;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

/* 把 Naive UI 卡片包成 Minecraft 风格的木边面板（原 .panel 阴影为 7px） */
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

/* 标签字重对齐原 label 的 font-weight: 900 */
.panel :deep(.n-form-item-label) {
  font-weight: 900;
}

.form-head p,
.form-head h1 {
  margin: 0;
}

.form-head p {
  color: #6b8f32;
  font-weight: 900;
}

.form-head h1 {
  margin-top: 5px;
  font-size: clamp(28px, 4vw, 46px);
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.needs {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 2px solid #8b6a3d;
  border-radius: 10px;
  background: rgba(255, 248, 223, 0.72);
}

.needs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.need-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.8fr) 90px minmax(220px, 1.2fr) auto;
  gap: 10px;
  align-items: start;
}

/* 招工需求行的输入控件填满各自网格列，n-input-number 在 90px 列内不溢出 */
.need-row :deep(.n-input),
.need-row :deep(.n-input-number) {
  width: 100%;
  min-width: 0;
}

@media (width <= 760px) {
  .two-col,
  .need-row {
    grid-template-columns: 1fr;
  }
}
</style>
