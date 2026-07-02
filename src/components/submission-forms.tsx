"use client";

import { useState } from "react";
import { Lightbulb, Send, SquarePen } from "lucide-react";

type Target = "project" | "idea";

async function postForm(target: Target, form: HTMLFormElement) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const endpoint = target === "project" ? "/api/public/projects" : "/api/public/ideas";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return {
    ok: response.ok,
    data: (await response.json()) as { message?: string },
  };
}

export function SubmissionForms() {
  const [active, setActive] = useState<Target>("project");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const form = event.currentTarget;
    const result = await postForm(active, form);

    setPending(false);
    setMessage(result.data.message || (result.ok ? "提交成功。" : "提交失败。"));

    if (result.ok) {
      form.reset();
    }
  }

  return (
    <section className="content-shell py-8">
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          className={`icon-button ${active === "project" ? "bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" : "bg-[#fff7d0] text-[#20301f]"}`}
          onClick={() => setActive("project")}
          type="button"
        >
          <SquarePen size={17} aria-hidden />
          投稿项目
        </button>
        <button
          className={`icon-button ${active === "idea" ? "bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" : "bg-[#fff7d0] text-[#20301f]"}`}
          onClick={() => setActive("idea")}
          type="button"
        >
          <Lightbulb size={17} aria-hidden />
          提交想法
        </button>
      </div>

      <form className="pixel-panel grid gap-4 rounded-[8px] p-5 md:p-6" onSubmit={submit}>
        <div className="grass-strip -mx-5 -mt-5 rounded-t-[6px] md:-mx-7 md:-mt-7" />
        {active === "project" ? <ProjectFields /> : <IdeaFields />}
        <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318] shadow-block" disabled={pending} type="submit">
          <Send size={17} aria-hidden />
          {pending ? "提交中" : "提交审核"}
        </button>
        {message ? <p className="rounded-[8px] border-2 border-[#382617] bg-[#e9ffd4] px-3 py-2 text-sm font-black text-[#35682b] shadow-[4px_4px_0_rgba(56,38,23,.12)]">{message}</p> : null}
      </form>
    </section>
  );
}

function ProjectFields() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          项目标题
          <input className="field-input" name="title" maxLength={80} required />
        </label>
        <label className="field-label">
          项目类型
          <input className="field-input" name="type" list="project-type-suggestions" maxLength={40} placeholder="例如：建筑 / 红石 / 剧情地图" required />
          <datalist id="project-type-suggestions">
            <option value="建筑" />
            <option value="红石" />
            <option value="插件/模组" />
            <option value="服务器活动" />
            <option value="美术/宣传" />
            <option value="剧情地图" />
            <option value="资源包" />
            <option value="其他" />
          </datalist>
        </label>
      </div>
      <label className="field-label">
        简介
        <input className="field-input" name="summary" maxLength={160} required />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="field-label">
          当前状态
          <select className="field-input" name="projectStatus" required>
            <option value="招募中">招募中</option>
            <option value="筹备中">筹备中</option>
            <option value="制作中">制作中</option>
            <option value="暂缓">暂缓</option>
          </select>
        </label>
        <label className="field-label">
          负责人昵称
          <input className="field-input" name="ownerName" maxLength={40} required />
        </label>
        <label className="field-label">
          还需要人数
          <input className="field-input" name="neededMembers" type="number" min="0" max="99" defaultValue="1" required />
        </label>
      </div>
      <label className="field-label">
        技能标签
        <input className="field-input" name="skills" maxLength={120} placeholder="建筑、红石、文案" required />
      </label>
      <label className="field-label">
        项目介绍
        <textarea className="field-input min-h-40 resize-y" name="description" maxLength={1600} required />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="field-label">
          你的 Minecraft ID
          <input className="field-input" name="submitterMinecraftId" minLength={3} maxLength={32} required />
        </label>
        <label className="field-label">
          后台联系方式
          <input className="field-input" name="privateContact" maxLength={120} required />
        </label>
        <label className="field-label">
          公开联系方式
          <input className="field-input" name="publicContact" maxLength={120} />
        </label>
      </div>
      <label className="field-label">
        项目管理密码
        <input className="field-input" name="ownerPassword" type="password" minLength={8} maxLength={80} required />
      </label>
      <p className="soft-note px-3 py-2">
        这个密码只用于项目发起者管理自己的项目、处理加入申请和发布动态；请自己保存好。
      </p>
    </>
  );
}

function IdeaFields() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          想法标题
          <input className="field-input" name="title" maxLength={80} required />
        </label>
        <label className="field-label">
          昵称
          <input className="field-input" name="submitterName" maxLength={40} required />
        </label>
      </div>
      <label className="field-label">
        Minecraft ID
        <input className="field-input" name="minecraftId" minLength={3} maxLength={32} required />
      </label>
      <label className="field-label">
        想法内容
        <textarea className="field-input min-h-48 resize-y" name="content" maxLength={1600} required />
      </label>
    </>
  );
}

