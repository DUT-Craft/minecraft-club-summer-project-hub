"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, Eye, EyeOff, LogOut, RefreshCw, ShieldCheck, X } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import type {
  AuditLog,
  DataSnapshot,
  Idea,
  JoinRequest,
  Project,
  ProjectEditRequest,
  ProjectUpdate,
  RequestStatus,
  ReviewStatus,
} from "@/lib/types";

type LoginState = "checking" | "logged-out" | "logged-in";
type AdminEditableCollection = "projects" | "ideas" | "joinRequests" | "projectUpdates";
type AdminTab = AdminEditableCollection | "editRequests" | "auditLogs" | "export";

export function AdminDashboard() {
  const [loginState, setLoginState] = useState<LoginState>("checking");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<DataSnapshot>({
    projects: [],
    ideas: [],
    joinRequests: [],
    projectUpdates: [],
    projectEditRequests: [],
    auditLogs: [],
  });
  const [activeTab, setActiveTab] = useState<AdminTab>("projects");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const response = await fetch("/api/admin/data");
    if (response.ok) {
      setSnapshot((await response.json()) as DataSnapshot);
      setLoginState("logged-in");
    } else if (response.status === 401) {
      setLoginState("logged-out");
    } else {
      const data = (await response.json()) as { message?: string };
      setMessage(data.message || "后台数据读取失败。");
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json()) as { message?: string };
    setMessage(data.message || "");
    if (response.ok) {
      setPassword("");
      await refresh();
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoginState("logged-out");
  }

  async function patchRecord(collection: AdminEditableCollection, id: string, patch: Record<string, unknown>) {
    setMessage("");
    const response = await fetch("/api/admin/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection, id, patch }),
    });
    const data = (await response.json()) as { message?: string };
    setMessage(data.message || (response.ok ? "已保存。" : "保存失败。"));
    if (response.ok) {
      await refresh();
    }
  }

  const counts = useMemo(
    () => ({
      projects: snapshot.projects.filter((item) => item.reviewStatus === "pending").length,
      ideas: snapshot.ideas.filter((item) => item.reviewStatus === "pending").length,
      joinRequests: snapshot.joinRequests.filter((item) => item.processStatus === "pending").length,
      editRequests: snapshot.projectEditRequests.filter((item) => item.reviewStatus === "pending").length,
    }),
    [snapshot],
  );

  async function reviewEditRequest(id: string, reviewStatus: ReviewStatus) {
    setMessage("");
    const response = await fetch("/api/admin/edit-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reviewStatus }),
    });
    const data = (await response.json()) as { message?: string };
    setMessage(data.message || (response.ok ? "已保存。" : "保存失败。"));
    if (response.ok) {
      await refresh();
    }
  }

  if (loginState === "checking") {
    return <p className="pixel-panel rounded-[8px] p-5 font-bold">正在打开后台...</p>;
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
            <p className="minecraft-badge mb-1">审核控制台</p>
            <h1 className="text-2xl font-black">管理后台</h1>
          </div>
        </div>
        <label className="field-label">
          管理密码
          <input className="field-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318] shadow-block" type="submit">
          登录
        </button>
        {message ? <p className="rounded-[8px] border-2 border-[#c9473a] bg-[#ffe0dd] px-3 py-2 text-sm font-bold text-[#9a3028]">{message}</p> : null}
      </form>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="block-frame rounded-[8px] p-4">
          <p className="minecraft-badge mb-2">社团数据由后台掌握</p>
          <h1 className="text-3xl font-black leading-tight text-[#173318]">管理后台</h1>
          <div className="mt-3 grid gap-2 text-sm font-black text-[#5d4b2a] sm:grid-cols-4">
            <span className="item-slot rounded-[8px] px-3 py-2">项目 {counts.projects}</span>
            <span className="item-slot rounded-[8px] px-3 py-2">修改 {counts.editRequests}</span>
            <span className="item-slot rounded-[8px] px-3 py-2">想法 {counts.ideas}</span>
            <span className="item-slot rounded-[8px] px-3 py-2">申请 {counts.joinRequests}</span>
          </div>
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

      <div className="flex flex-wrap gap-2">
        <TabButton active={activeTab === "projects"} onClick={() => setActiveTab("projects")}>项目投稿</TabButton>
        <TabButton active={activeTab === "editRequests"} onClick={() => setActiveTab("editRequests")}>修改申请</TabButton>
        <TabButton active={activeTab === "projectUpdates"} onClick={() => setActiveTab("projectUpdates")}>项目动态</TabButton>
        <TabButton active={activeTab === "ideas"} onClick={() => setActiveTab("ideas")}>想法墙</TabButton>
        <TabButton active={activeTab === "joinRequests"} onClick={() => setActiveTab("joinRequests")}>加入申请</TabButton>
        <TabButton active={activeTab === "auditLogs"} onClick={() => setActiveTab("auditLogs")}>操作记录</TabButton>
        <TabButton active={activeTab === "export"} onClick={() => setActiveTab("export")}>导出</TabButton>
      </div>

      {message ? <p className="rounded-[8px] border-2 border-[#382617] bg-[#e9ffd4] px-3 py-2 text-sm font-black text-[#35682b] shadow-[4px_4px_0_rgba(56,38,23,.12)]">{message}</p> : null}

      {activeTab === "projects" ? (
        <ProjectAdminList projects={snapshot.projects} onPatch={(id, patch) => patchRecord("projects", id, patch)} />
      ) : null}
      {activeTab === "ideas" ? <IdeaAdminList ideas={snapshot.ideas} onPatch={(id, patch) => patchRecord("ideas", id, patch)} /> : null}
      {activeTab === "editRequests" ? (
        <ProjectEditRequestAdminList requests={snapshot.projectEditRequests} onReview={reviewEditRequest} />
      ) : null}
      {activeTab === "projectUpdates" ? (
        <ProjectUpdateAdminList updates={snapshot.projectUpdates} onPatch={(id, patch) => patchRecord("projectUpdates", id, patch)} />
      ) : null}
      {activeTab === "joinRequests" ? (
        <JoinAdminList requests={snapshot.joinRequests} onPatch={(id, patch) => patchRecord("joinRequests", id, patch)} />
      ) : null}
      {activeTab === "auditLogs" ? <AuditLogList logs={snapshot.auditLogs} /> : null}
      {activeTab === "export" ? <ExportPanel /> : null}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`icon-button ${active ? "bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" : "bg-[#fff7d0] text-[#20301f]"}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function ProjectAdminList({ projects, onPatch }: { projects: Project[]; onPatch: (id: string, patch: Partial<Project>) => void }) {
  if (!projects.length) {
    return <EmptyState label="暂无项目投稿" />;
  }

  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <article className="pixel-panel grid gap-4 rounded-[8px] p-4" key={project.id}>
          <div className="grass-strip -mx-4 -mt-4 rounded-t-[6px]" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{project.title}</h2>
              <p className="mt-1 text-sm font-bold text-[#52604e]">
                {project.ownerName} / {project.submitterMinecraftId} / {new Date(project.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
            <StatusBadge status={project.reviewStatus} />
          </div>
          <ProjectEditForm project={project} onPatch={onPatch} />
          <div className="flex flex-wrap gap-2">
            <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" onClick={() => onPatch(project.id, { reviewStatus: "approved" })} type="button">
              <Check size={16} aria-hidden />
              公开
            </button>
            <button className="icon-button bg-[#c9473a] text-white" onClick={() => onPatch(project.id, { reviewStatus: "rejected" })} type="button">
              <X size={16} aria-hidden />
              拒绝
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProjectEditForm({ project, onPatch }: { project: Project; onPatch: (id: string, patch: Partial<Project>) => void }) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ownerPassword = String(formData.get("ownerPassword") || "").trim();
    const patch: Partial<Project> & { ownerPassword?: string } = {
      title: String(formData.get("title") || ""),
      summary: String(formData.get("summary") || ""),
      type: String(formData.get("type") || ""),
      projectStatus: String(formData.get("projectStatus") || ""),
      ownerName: String(formData.get("ownerName") || ""),
      neededMembers: Number(formData.get("neededMembers") || 0),
      skills: String(formData.get("skills") || "")
        .split(/[,，、\n]/)
        .map((item) => item.trim())
        .filter(Boolean),
      description: String(formData.get("description") || ""),
      publicContact: String(formData.get("publicContact") || ""),
    };

    if (ownerPassword) {
      patch.ownerPassword = ownerPassword;
    }

    onPatch(project.id, patch);
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-2">
        <input className="field-input" name="title" defaultValue={project.title} />
        <input className="field-input" name="type" defaultValue={project.type} />
      </div>
      <input className="field-input" name="summary" defaultValue={project.summary} />
      <div className="grid gap-3 md:grid-cols-3">
        <input className="field-input" name="projectStatus" defaultValue={project.projectStatus} />
        <input className="field-input" name="ownerName" defaultValue={project.ownerName} />
        <input className="field-input" name="neededMembers" type="number" min="0" max="99" defaultValue={project.neededMembers} />
      </div>
      <input className="field-input" name="skills" defaultValue={project.skills.join("、")} />
      <textarea className="field-input min-h-28" name="description" defaultValue={project.description} />
      <input className="field-input" name="publicContact" defaultValue={project.publicContact} />
      <p className="soft-note px-3 py-2">后台联系方式：{project.privateContact}</p>
      <input className="field-input" name="ownerPassword" type="password" placeholder="重置项目管理密码，留空则不修改" minLength={8} maxLength={80} />
      <button className="icon-button bg-[#fff7d0]" type="submit">保存编辑</button>
    </form>
  );
}

function IdeaAdminList({ ideas, onPatch }: { ideas: Idea[]; onPatch: (id: string, patch: Partial<Idea>) => void }) {
  if (!ideas.length) {
    return <EmptyState label="暂无想法投稿" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ideas.map((idea) => (
        <article className="pixel-panel grid gap-3 rounded-[8px] p-4" key={idea.id}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-black">{idea.title}</h2>
            <StatusBadge status={idea.reviewStatus} />
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-[#3f493c]">{idea.content}</p>
          <p className="text-sm font-bold text-[#52604e]">{idea.submitterName} / {idea.minecraftId}</p>
          <StatusSelect value={idea.reviewStatus} onChange={(reviewStatus) => onPatch(idea.id, { reviewStatus })} values={["pending", "approved", "rejected"]} />
        </article>
      ))}
    </div>
  );
}

function ProjectEditRequestAdminList({
  requests,
  onReview,
}: {
  requests: ProjectEditRequest[];
  onReview: (id: string, reviewStatus: ReviewStatus) => void;
}) {
  if (!requests.length) {
    return <EmptyState label="暂无项目修改申请" />;
  }

  return (
    <div className="grid gap-4">
      {requests.map((request) => (
        <article className="pixel-panel grid gap-4 rounded-[8px] p-4" key={request.id}>
          <div className="grass-strip -mx-4 -mt-4 rounded-t-[6px]" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{request.projectTitle}</h2>
              <p className="mt-1 text-sm font-bold text-[#52604e]">
                {request.requesterName} / {new Date(request.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
            <StatusBadge status={request.reviewStatus} />
          </div>
          <div className="grid gap-3 rounded-[8px] border-2 border-[#38261747] bg-[#fff8dc]/80 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="标题" value={request.payload.title} />
              <ReadOnlyField label="类型" value={request.payload.type} />
            </div>
            <ReadOnlyField label="简介" value={request.payload.summary} />
            <div className="grid gap-3 md:grid-cols-3">
              <ReadOnlyField label="状态" value={request.payload.projectStatus} />
              <ReadOnlyField label="还需人数" value={`${request.payload.neededMembers}`} />
              <ReadOnlyField label="技能" value={request.payload.skills.join("、") || "无"} />
            </div>
            <ReadOnlyField label="公开联系方式" value={request.payload.publicContact || "未填写"} />
            <ReadOnlyField label="项目介绍" value={request.payload.description} multiline />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]"
              disabled={request.reviewStatus !== "pending"}
              onClick={() => onReview(request.id, "approved")}
              type="button"
            >
              <Check size={16} aria-hidden />
              通过并更新项目
            </button>
            <button
              className="icon-button bg-[#c9473a] text-white"
              disabled={request.reviewStatus !== "pending"}
              onClick={() => onReview(request.id, "rejected")}
              type="button"
            >
              <X size={16} aria-hidden />
              拒绝
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProjectUpdateAdminList({
  updates,
  onPatch,
}: {
  updates: ProjectUpdate[];
  onPatch: (id: string, patch: Partial<ProjectUpdate>) => void;
}) {
  if (!updates.length) {
    return <EmptyState label="暂无项目动态" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {updates.map((update) => {
        const isHidden = update.reviewStatus === "rejected";
        return (
          <article className="pixel-panel grid gap-3 rounded-[8px] p-4" key={update.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{update.title}</h2>
                <p className="mt-1 text-sm font-bold text-[#52604e]">{update.projectTitle}</p>
              </div>
              <StatusBadge status={isHidden ? "rejected" : "approved"} />
            </div>
            {update.imageUrl ? (
              <img alt={update.title} className="aspect-video w-full rounded-[8px] border border-black/10 object-cover" src={update.imageUrl} />
            ) : null}
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#3f493c]">{update.content}</p>
            <p className="text-xs font-bold text-[#52604e]">{new Date(update.createdAt).toLocaleString("zh-CN")}</p>
            <button
              className={`icon-button ${isHidden ? "bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" : "bg-[#fff7d0]"}`}
              onClick={() => onPatch(update.id, { reviewStatus: isHidden ? "approved" : "rejected" })}
              type="button"
            >
              {isHidden ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
              {isHidden ? "恢复公开" : "隐藏动态"}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function JoinAdminList({ requests, onPatch }: { requests: JoinRequest[]; onPatch: (id: string, patch: Partial<JoinRequest>) => void }) {
  if (!requests.length) {
    return <EmptyState label="暂无加入申请" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {requests.map((request) => (
        <article className="pixel-panel grid gap-3 rounded-[8px] p-4" key={request.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{request.projectTitle}</h2>
              <p className="mt-1 text-sm font-bold text-[#52604e]">{request.applicantName} / {request.minecraftId}</p>
            </div>
            <StatusBadge status={request.processStatus} />
          </div>
          <p className="text-sm font-bold text-[#52604e]">联系方式：{request.contact}</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-[#3f493c]">{request.reason}</p>
          <StatusSelect value={request.processStatus} onChange={(processStatus) => onPatch(request.id, { processStatus })} values={["pending", "contacted", "accepted", "rejected"]} />
        </article>
      ))}
    </div>
  );
}

function AuditLogList({ logs }: { logs: AuditLog[] }) {
  if (!logs.length) {
    return <EmptyState label="暂无操作记录" />;
  }

  return (
    <div className="grid gap-3">
      {logs.map((log) => (
        <article className="pixel-panel grid gap-2 rounded-[8px] p-4" key={log.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black">{log.summary}</h2>
              <p className="mt-1 text-sm font-bold text-[#52604e]">
                {log.actorLabel} / {log.actorRole} / {log.action}
              </p>
            </div>
            <p className="text-xs font-bold text-[#52604e]">{new Date(log.createdAt).toLocaleString("zh-CN")}</p>
          </div>
          <p className="text-xs font-bold text-[#52604e]">
            {log.targetType}: {log.targetTitle || log.targetId}
          </p>
        </article>
      ))}
    </div>
  );
}

function ReadOnlyField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs font-black text-[#52604e]">{label}</p>
      <p className={`mt-1 text-sm font-bold text-[#273323] ${multiline ? "whitespace-pre-wrap leading-6" : ""}`}>{value}</p>
    </div>
  );
}

function StatusSelect<T extends ReviewStatus | RequestStatus>({ value, values, onChange }: { value: T; values: T[]; onChange: (value: T) => void }) {
  return (
    <select className="field-input" value={value} onChange={(event) => onChange(event.target.value as T)}>
      {values.map((item) => (
        <option key={item} value={item}>{item}</option>
      ))}
    </select>
  );
}

function ExportPanel() {
  return (
    <div className="pixel-panel grid gap-4 rounded-[8px] p-5">
      <h2 className="text-xl font-black">导出数据</h2>
      <div className="flex flex-wrap gap-2">
        <a className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" href="/api/admin/export?format=json">
          <Download size={16} aria-hidden />
          JSON
        </a>
        <a className="icon-button bg-[#fff7d0]" href="/api/admin/export?format=csv">
          <Download size={16} aria-hidden />
          CSV
        </a>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="pixel-panel rounded-[8px] p-5 font-bold text-[#52604e]">{label}</p>;
}
