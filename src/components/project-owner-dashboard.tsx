"use client";

import { useEffect, useState } from "react";
import { Check, Edit3, LogOut, RefreshCw, Send, ShieldCheck, X } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import type { JoinRequest, ProjectEditableFields, ProjectEditRequest, ProjectUpdate, RequestStatus } from "@/lib/types";

type LoginState = "checking" | "logged-out" | "logged-in";

type OwnerData = {
  project: {
    id: string;
    title: string;
    summary: string;
    type: string;
    projectStatus: string;
    ownerName: string;
    neededMembers: number;
    skills: string[];
    description: string;
    publicContact: string;
    reviewStatus: string;
  };
  joinRequests: JoinRequest[];
  updates: ProjectUpdate[];
  editRequests: ProjectEditRequest[];
};

export function ProjectOwnerDashboard({ projectId }: { projectId: string }) {
  const [loginState, setLoginState] = useState<LoginState>("checking");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [data, setData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const response = await fetch("/api/project-owner/data");
    const payload = (await response.json()) as OwnerData & { message?: string };
    if (response.ok) {
      setData(payload);
      setLoginState("logged-in");
    } else if (response.status === 401) {
      setLoginState("logged-out");
    } else {
      setMessage(payload.message || "项目数据读取失败。");
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/project-owner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, password }),
    });
    const payload = (await response.json()) as { message?: string };
    setMessage(payload.message || "");
    if (response.ok) {
      setPassword("");
      await refresh();
    }
  }

  async function logout() {
    await fetch("/api/project-owner/logout", { method: "POST" });
    setLoginState("logged-out");
    setData(null);
  }

  async function patchRequest(id: string, processStatus: RequestStatus) {
    setMessage("");
    const response = await fetch("/api/project-owner/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, processStatus }),
    });
    const payload = (await response.json()) as { message?: string };
    setMessage(payload.message || (response.ok ? "已保存。" : "保存失败。"));
    if (response.ok) {
      await refresh();
    }
  }

  async function publishUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/project-owner/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        content: formData.get("content"),
        imageUrl: formData.get("imageUrl"),
      }),
    });
    const payload = (await response.json()) as { message?: string };
    setMessage(payload.message || (response.ok ? "已发布。" : "发布失败。"));
    if (response.ok) {
      form.reset();
      await refresh();
    }
  }

  async function submitEditRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/project-owner/edit-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        summary: formData.get("summary"),
        type: formData.get("type"),
        projectStatus: formData.get("projectStatus"),
        neededMembers: formData.get("neededMembers"),
        skills: formData.get("skills"),
        description: formData.get("description"),
        publicContact: formData.get("publicContact"),
      }),
    });
    const payload = (await response.json()) as { message?: string };
    setMessage(payload.message || (response.ok ? "已提交修改申请。" : "提交失败。"));
    if (response.ok) {
      await refresh();
    }
  }

  if (loginState === "checking") {
    return <p className="pixel-panel rounded-[8px] p-5 font-bold">正在打开项目管理...</p>;
  }

  if (loginState === "logged-out") {
    return (
      <form className="pixel-panel mx-auto grid max-w-md gap-4 rounded-[8px] p-6" onSubmit={login}>
        <div className="grass-strip -mx-6 -mt-6 rounded-t-[6px]" />
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[8px] border-2 border-[#382617] bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318] shadow-[4px_4px_0_rgba(56,38,23,.16)]">
            <ShieldCheck size={22} aria-hidden />
          </span>
          <div>
            <p className="minecraft-badge mb-1">发起者入口</p>
            <h1 className="text-2xl font-black">项目管理</h1>
            <p className="mt-1 text-sm font-bold text-[#52604e]">只管理当前项目</p>
          </div>
        </div>
        <label className="field-label">
          项目管理密码
          <input className="field-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318] shadow-block" type="submit">
          进入项目管理
        </button>
        {message ? <p className="rounded-[8px] border-2 border-[#c9473a] bg-[#ffe0dd] px-3 py-2 text-sm font-bold text-[#9a3028]">{message}</p> : null}
      </form>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="block-frame rounded-[8px] p-4">
          <p className="minecraft-badge mb-2">项目发起者后台</p>
          <h1 className="text-3xl font-black leading-tight text-[#173318]">{data?.project.title || "项目管理"}</h1>
          <p className="mt-1 text-sm font-bold text-[#52604e]">发起者：{data?.project.ownerName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="icon-button bg-[#fff7d0]" disabled={loading} onClick={refresh} type="button">
            <RefreshCw size={16} aria-hidden />
            刷新
          </button>
          <button className="icon-button bg-[#fff7d0]" onClick={logout} type="button">
            <LogOut size={16} aria-hidden />
            退出
          </button>
        </div>
      </div>

      {message ? <p className="rounded-[8px] border-2 border-[#382617] bg-[#e9ffd4] px-3 py-2 text-sm font-black text-[#35682b] shadow-[4px_4px_0_rgba(56,38,23,.12)]">{message}</p> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="grid gap-4">
          {data?.project ? (
            <ProjectEditRequestForm project={data.project} onSubmit={submitEditRequest} />
          ) : null}

          <section className="grid gap-3">
            <h2 className="text-2xl font-black">资料修改申请</h2>
            {data?.editRequests.length ? (
              data.editRequests.map((editRequest) => (
                <article className="item-slot rounded-[8px] p-4" key={editRequest.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{editRequest.payload.title}</h3>
                      <p className="mt-1 text-xs font-bold text-[#52604e]">{new Date(editRequest.createdAt).toLocaleString("zh-CN")}</p>
                    </div>
                    <StatusBadge status={editRequest.reviewStatus} />
                  </div>
                </article>
              ))
            ) : (
              <p className="pixel-panel rounded-[8px] p-4 text-sm font-bold text-[#52604e]">暂无修改申请</p>
            )}
          </section>

          <h2 className="text-2xl font-black">加入申请</h2>
          {data?.joinRequests.length ? (
            data.joinRequests.map((request) => (
              <article className="pixel-panel grid gap-3 rounded-[8px] p-4" key={request.id}>
                <div className="grass-strip -mx-4 -mt-4 rounded-t-[6px]" />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black">{request.applicantName}</h3>
                    <p className="mt-1 text-sm font-bold text-[#52604e]">{request.minecraftId}</p>
                  </div>
                  <StatusBadge status={request.processStatus} />
                </div>
                <p className="text-sm font-bold text-[#52604e]">联系方式：{request.contact}</p>
                <p className="whitespace-pre-wrap leading-7 text-[#3f493c]">{request.reason}</p>
                <div className="flex flex-wrap gap-2">
                  <button className="icon-button bg-[#fff7d0]" onClick={() => patchRequest(request.id, "contacted")} type="button">
                    已联系
                  </button>
                  <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" onClick={() => patchRequest(request.id, "accepted")} type="button">
                    <Check size={16} aria-hidden />
                    通过
                  </button>
                  <button className="icon-button bg-[#c9473a] text-white" onClick={() => patchRequest(request.id, "rejected")} type="button">
                    <X size={16} aria-hidden />
                    拒绝
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="pixel-panel rounded-[8px] p-5 font-bold text-[#52604e]">暂无加入申请</p>
          )}
        </div>

        <div className="grid content-start gap-4">
          <form className="pixel-panel grid gap-4 rounded-[8px] p-5" onSubmit={publishUpdate}>
            <div className="grass-strip -mx-5 -mt-5 rounded-t-[6px]" />
            <div>
              <p className="minecraft-badge mb-2">公告板</p>
              <h2 className="text-2xl font-black">发布项目动态</h2>
            </div>
            <label className="field-label">
              动态标题
              <input className="field-input" name="title" maxLength={80} required />
            </label>
            <label className="field-label">
              动态内容
              <textarea className="field-input min-h-36 resize-y" name="content" maxLength={1200} required />
            </label>
            <label className="field-label">
              图片链接（可选）
              <input className="field-input" name="imageUrl" type="url" maxLength={500} placeholder="https://..." />
            </label>
            <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318] shadow-block" type="submit">
              <Send size={16} aria-hidden />
              发布动态
            </button>
          </form>

          <section className="grid gap-3">
            <h2 className="text-2xl font-black">已发布动态</h2>
            {data?.updates.length ? (
              data.updates.map((update) => (
                <article className="item-slot rounded-[8px] p-4" key={update.id}>
                  {update.imageUrl ? (
                    <img alt={update.title} className="mb-3 aspect-video w-full rounded-[8px] border border-black/10 object-cover" src={update.imageUrl} />
                  ) : null}
                  <h3 className="font-black">{update.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#3f493c]">{update.content}</p>
                  {update.reviewStatus === "rejected" ? <p className="mt-2 text-xs font-black text-[#9a3028]">已被管理员隐藏</p> : null}
                  <p className="mt-3 text-xs font-bold text-[#52604e]">{new Date(update.createdAt).toLocaleString("zh-CN")}</p>
                </article>
              ))
            ) : (
              <p className="pixel-panel rounded-[8px] p-4 text-sm font-bold text-[#52604e]">暂无动态</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function ProjectEditRequestForm({
  project,
  onSubmit,
}: {
  project: ProjectEditableFields & { ownerName: string };
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="pixel-panel grid gap-4 rounded-[8px] p-5" onSubmit={onSubmit}>
      <div className="grass-strip -mx-5 -mt-5 rounded-t-[6px]" />
      <div className="flex items-center gap-2">
        <Edit3 size={18} aria-hidden />
        <h2 className="text-2xl font-black">编辑项目资料</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="field-label">
          项目标题
          <input className="field-input" name="title" defaultValue={project.title} maxLength={80} required />
        </label>
        <label className="field-label">
          项目类型
          <input className="field-input" name="type" defaultValue={project.type} maxLength={40} required />
        </label>
      </div>
      <label className="field-label">
        简介
        <input className="field-input" name="summary" defaultValue={project.summary} maxLength={160} required />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="field-label">
          当前状态
          <input className="field-input" name="projectStatus" defaultValue={project.projectStatus} maxLength={40} required />
        </label>
        <label className="field-label">
          还需要人数
          <input className="field-input" name="neededMembers" type="number" min="0" max="99" defaultValue={project.neededMembers} required />
        </label>
      </div>
      <label className="field-label">
        技能标签
        <input className="field-input" name="skills" defaultValue={project.skills.join("、")} />
      </label>
      <label className="field-label">
        项目介绍
        <textarea className="field-input min-h-32 resize-y" name="description" defaultValue={project.description} maxLength={1600} required />
      </label>
      <label className="field-label">
        公开联系方式（可选）
        <input className="field-input" name="publicContact" defaultValue={project.publicContact} maxLength={120} />
      </label>
      <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318] shadow-block" type="submit">
        <Send size={16} aria-hidden />
        提交修改申请
      </button>
    </form>
  );
}
