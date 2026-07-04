<template>
  <main class="mc-page">
    <MinecraftSiteHeader />

    <section class="submit-shell">
      <div class="tabs">
        <button type="button" :class="{ active: mode === 'project' }" @click="mode = 'project'">投稿项目</button>
        <button type="button" :class="{ active: mode === 'idea' }" @click="mode = 'idea'">提交想法</button>
      </div>

      <form v-if="mode === 'project'" class="panel" @submit.prevent="handleSubmitProject">
        <div class="form-head">
          <p>Project Draft</p>
          <h1>写清项目介绍和招工需求</h1>
        </div>

        <label>
          项目标题
          <input v-model="projectForm.title" required placeholder="例如：暑假主城建设计划" />
        </label>

        <div class="two-col">
          <label>
            项目类型
            <input v-model="projectForm.type" required placeholder="可自定义，例如 建筑 / 生电 / 活动" />
          </label>
          <label>
            当前状态
            <input v-model="projectForm.status" required placeholder="筹备中 / 招募中 / 进行中" />
          </label>
        </div>

        <label>
          负责人昵称
          <input v-model="projectForm.ownerName" required placeholder="你的社团昵称" />
        </label>

        <label>
          项目介绍
          <textarea v-model="projectForm.description" required rows="7" placeholder="主要写这个项目想做什么、怎么玩、希望做成什么样。" />
        </label>

        <div class="needs">
          <div class="needs-head">
            <strong>招工需求</strong>
            <button type="button" @click="addNeed">添加一条</button>
          </div>
          <div v-for="(need, index) in projectForm.recruitmentNeeds" :key="need.id" class="need-row">
            <input v-model="need.skill" required placeholder="技能/方向" />
            <input v-model.number="need.count" required type="number" min="1" placeholder="人数" />
            <textarea v-model="need.work" required rows="2" placeholder="大概工作内容" />
            <button type="button" @click="removeNeed(index)">删除</button>
          </div>
        </div>

        <div class="two-col">
          <label>
            你的 Minecraft ID
            <input v-model="projectForm.ownerMinecraftId" required placeholder="Java / 基岩版 ID" />
          </label>
          <label>
            联系方式
            <input v-model="projectForm.publicContact" required placeholder="QQ / 群号 / Discord 等，会公开展示" />
          </label>
        </div>

        <label>
          项目管理密码
          <input v-model="projectForm.ownerPassword" required type="password" placeholder="以后项目发起者后台使用" />
        </label>

        <button class="submit-button" type="submit" :disabled="submitting">
          {{ submitting ? "提交中..." : "提交项目，等待审核" }}
        </button>
      </form>

      <form v-else class="panel" @submit.prevent="handleSubmitIdea">
        <div class="form-head">
          <p>Idea Wall</p>
          <h1>把还没成型的点子先放到墙上</h1>
        </div>

        <label>
          想法标题
          <input v-model="ideaForm.title" required placeholder="例如：每周末速通接力" />
        </label>
        <label>
          想法内容
          <textarea v-model="ideaForm.content" required rows="8" placeholder="写玩法、规则、需要的人、你希望大家怎么参与。" />
        </label>
        <div class="two-col">
          <label>
            昵称
            <input v-model="ideaForm.nickname" required placeholder="你的昵称" />
          </label>
          <label>
            Minecraft ID
            <input v-model="ideaForm.minecraftId" required placeholder="你的游戏 ID" />
          </label>
        </div>

        <button class="submit-button" type="submit" :disabled="submitting">
          {{ submitting ? "提交中..." : "提交想法，等待审核" }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { RecruitmentNeed } from "~/types/projectHub";

definePageMeta({
  layout: false,
});

const message = useMessage();
const route = useRoute();
const { submitProject, submitIdea } = useProjectHubApi();
const mode = ref<"project" | "idea">("project");
const submitting = ref(false);

const newNeed = (): RecruitmentNeed => ({
  id: String(Date.now() + Math.random()),
  skill: "",
  count: 1,
  work: "",
});

const projectForm = reactive({
  title: "",
  type: "",
  status: "招募中",
  ownerName: "",
  ownerMinecraftId: "",
  description: "",
  publicContact: "",
  ownerPassword: "",
  recruitmentNeeds: [newNeed()],
});

const ideaForm = reactive({
  title: "",
  content: "",
  nickname: "",
  minecraftId: "",
});

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
    type: "",
    status: "招募中",
    ownerName: "",
    ownerMinecraftId: "",
    description: "",
    publicContact: "",
    ownerPassword: "",
    recruitmentNeeds: [newNeed()],
  });
};

const handleSubmitProject = async () => {
  try {
    submitting.value = true;
    await submitProject({
      ...projectForm,
      recruitmentNeeds: projectForm.recruitmentNeeds.map((need) => ({
        ...need,
        count: Number(need.count) || 1,
      })),
    });
    message.success("项目已提交，等待管理员审核");
    resetProject();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "提交失败，请确认后端接口是否已配置");
  } finally {
    submitting.value = false;
  }
};

const handleSubmitIdea = async () => {
  try {
    submitting.value = true;
    await submitIdea({ ...ideaForm });
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
});
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

.submit-shell {
  width: min(900px, calc(100% - 28px));
  margin: 22px auto 0;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

button,
input,
textarea {
  font: inherit;
}

.tabs button,
.needs-head button,
.need-row button,
.submit-button {
  border: 2px solid #5a3a21;
  border-radius: 8px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 0 #5a3a21;
}

.tabs button {
  padding: 10px 14px;
  background: #fff8df;
}

.tabs button.active {
  background: #ffdf7e;
}

.panel {
  display: grid;
  gap: 16px;
  padding: 22px;
  border: 2px solid #5a3a21;
  border-radius: 10px;
  background: rgba(255, 245, 207, 0.94);
  box-shadow: 0 7px 0 #5a3a21;
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

label {
  display: grid;
  gap: 7px;
  font-weight: 900;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

input,
textarea {
  width: 100%;
  min-width: 0;
  padding: 11px 12px;
  border: 2px solid #5a3a21;
  border-radius: 8px;
  background: #fff8df;
  color: #2d2418;
  font-weight: 700;
}

textarea {
  resize: vertical;
  line-height: 1.65;
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

.needs-head button,
.need-row button {
  padding: 8px 10px;
  background: #ffdf7e;
}

.need-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.8fr) 90px minmax(220px, 1.2fr) auto;
  gap: 10px;
  align-items: start;
}

.submit-button {
  padding: 13px 16px;
  background: #65a844;
  color: #fffbe4;
}

.submit-button:disabled {
  opacity: 0.65;
  cursor: wait;
}

@media (width <= 760px) {
  .two-col,
  .need-row {
    grid-template-columns: 1fr;
  }
}
</style>
