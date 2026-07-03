"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, Eye, EyeOff, LogOut, RefreshCw, ShieldCheck, Trash2, X } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { RecruitmentNeedsEditor } from "@/components/recruitment-needs-editor";
import { getHttpErrorMessage, getHttpStatusCode, useHttp } from "@/lib/useHttp";
import type {
  AuditLog,
  DataSnapshot,
  Idea,
  JoinRequest,
  Project,
  ProjectComment,
  ProjectEditRequest,
  ProjectUpdate,
  RecruitmentNeed,
  RequestStatus,
  ReviewStatus,
} from "@/lib/types";

type LoginState = "checking" | "logged-out" | "logged-in";
type AdminEditableCollection = "projects" | "ideas" | "joinRequests" | "projectUpdates" | "projectComments";
type AdminTab = AdminEditableCollection | "archivedProjects" | "archivedIdeas" | "editRequests" | "auditLogs" | "export";
type AdminProjectPatch = Partial<Omit<Project, "recruitmentNeeds">> & {
  ownerPassword?: string;
  recruitmentNeeds?: string;
};

export function AdminDashboard() {
  const http = useHttp();
  const [loginState, setLoginState] = useState<LoginState>("checking");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<DataSnapshot>({
    projects: [],
    ideas: [],
    joinRequests: [],
    projectUpdates: [],
    projectComments: [],
    projectEditRequests: [],
    auditLogs: [],
  });
  const [activeTab, setActiveTab] = useState<AdminTab>("projects");
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const result = await http.getRaw<DataSnapshot>("/admin/data");
      setSnapshot(result.data);
      setLoginState("logged-in");
    } catch (error) {
      if (getHttpStatusCode(error) === 401) {
        setLoginState("logged-out");
      } else {
        setMessage(getHttpErrorMessage(error, "后台数据读取失败。"));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const result = await http.postRaw<null, { password: string }>("/admin/login", { password });
      setMessage(result.msg || "");
      setPassword("");
      await refresh();
    } catch (error) {
      setMessage(getHttpErrorMessage(error, "登录失败。"));
    }
  }

  async function logout() {
    await http.postRaw<null>("/admin/logout");
    setLoginState("logged-out");
  }

  async function patchRecord(collection: AdminEditableCollection, id: string, patch: Record<string, unknown>) {
    setMessage("");
    try {
      const result = await http.patchRaw<{ record: unknown }>("/admin/records", { collection, id, patch });
      setMessage(result.msg || "已保存。");
      await refresh();
    } catch (error) {
      setMessage(getHttpErrorMessage(error, "保存失败。"));
    }
  }

  async function deleteRecord(collection: AdminEditableCollection, id: string) {
    setMessage("");
    try {
      const result = await http.requestRaw<null, { collection: AdminEditableCollection; id: string }>("/admin/records", { collection, id }, {
        method: "DELETE",
        payloadMode: "json",
      });
      setMessage(result.msg || "已删除。");
      await refresh();
    } catch (error) {
      setMessage(getHttpErrorMessage(error, "删除失败。"));
    }
  }

  const counts = useMemo(
    () => ({
      projects: snapshot.projects.filter((item) => item.reviewStatus === "pending").length,
      archivedProjects: snapshot.projects.filter((item) => item.reviewStatus === "rejected").length,
      ideas: snapshot.ideas.filter((item) => item.reviewStatus === "pending").length,
      archivedIdeas: snapshot.ideas.filter((item) => item.reviewStatus === "rejected").length,
      joinRequests: snapshot.joinRequests.filter((item) => item.processStatus === "pending").length,
      editRequests: snapshot.projectEditRequests.filter((item) => item.reviewStatus === "pending").length,
    }),
    [snapshot],
  );

  async function reviewEditRequest(id: string, reviewStatus: ReviewStatus) {
    setMessage("");
    try {
      const result = await http.patchRaw<{ record: ProjectEditRequest }>("/admin/edit-requests", { id, reviewStatus });
      setMessage(result.msg || "已保存。");
      await refresh();
    } catch (error) {
      setMessage(getHttpErrorMessage(error, "保存失败。"));
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
          <div className="mt-3 grid gap-2 text-sm font-black text-[#5d4b2a] sm:grid-cols-5">
            <span className="item-slot rounded-[8px] px-3 py-2">项目 {counts.projects}</span>
            <span className="item-slot rounded-[8px] px-3 py-2">归档 {counts.archivedProjects}</span>
            <span className="item-slot rounded-[8px] px-3 py-2">修改 {counts.editRequests}</span>
            <span className="item-slot rounded-[8px] px-3 py-2">想法 {counts.ideas}</span>
            <span className="item-slot rounded-[8px] px-3 py-2">归档想法 {counts.archivedIdeas}</span>
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
        <TabButton active={activeTab === "archivedProjects"} onClick={() => setActiveTab("archivedProjects")}>归档项目</TabButton>
        <TabButton active={activeTab === "editRequests"} onClick={() => setActiveTab("editRequests")}>修改申请</TabButton>
        <TabButton active={activeTab === "projectUpdates"} onClick={() => setActiveTab("projectUpdates")}>项目动态</TabButton>
        <TabButton active={activeTab === "projectComments"} onClick={() => setActiveTab("projectComments")}>项目评论</TabButton>
        <TabButton active={activeTab === "ideas"} onClick={() => setActiveTab("ideas")}>想法墙</TabButton>
        <TabButton active={activeTab === "archivedIdeas"} onClick={() => setActiveTab("archivedIdeas")}>归档想法</TabButton>
        <TabButton active={activeTab === "joinRequests"} onClick={() => setActiveTab("joinRequests")}>加入申请</TabButton>
        <TabButton active={activeTab === "auditLogs"} onClick={() => setActiveTab("auditLogs")}>操作记录</TabButton>
        <TabButton active={activeTab === "export"} onClick={() => setActiveTab("export")}>导出</TabButton>
      </div>

      {message ? <p className="rounded-[8px] border-2 border-[#382617] bg-[#e9ffd4] px-3 py-2 text-sm font-black text-[#35682b] shadow-[4px_4px_0_rgba(56,38,23,.12)]">{message}</p> : null}

      {activeTab === "projects" ? (
        <ProjectAdminList
          projects={snapshot.projects.filter((project) => project.reviewStatus !== "rejected")}
          onPatch={(id, patch) => patchRecord("projects", id, patch)}
        />
      ) : null}
      {activeTab === "archivedProjects" ? (
        <ProjectAdminList
          archived
          projects={snapshot.projects.filter((project) => project.reviewStatus === "rejected")}
          onPatch={(id, patch) => patchRecord("projects", id, patch)}
        />
      ) : null}
      {activeTab === "ideas" ? (
        <IdeaAdminList
          ideas={snapshot.ideas.filter((idea) => idea.reviewStatus !== "rejected")}
          onPatch={(id, patch) => patchRecord("ideas", id, patch)}
        />
      ) : null}
      {activeTab === "archivedIdeas" ? (
        <IdeaAdminList
          archived
          ideas={snapshot.ideas.filter((idea) => idea.reviewStatus === "rejected")}
          onPatch={(id, patch) => patchRecord("ideas", id, patch)}
        />
      ) : null}
      {activeTab === "editRequests" ? (
        <ProjectEditRequestAdminList requests={snapshot.projectEditRequests} onReview={reviewEditRequest} />
      ) : null}
      {activeTab === "projectUpdates" ? (
        <ProjectUpdateAdminList
          updates={snapshot.projectUpdates}
          onDelete={(id) => deleteRecord("projectUpdates", id)}
          onPatch={(id, patch) => patchRecord("projectUpdates", id, patch)}
        />
      ) : null}
      {activeTab === "projectComments" ? (
        <ProjectCommentAdminList comments={snapshot.projectComments} onPatch={(id, patch) => patchRecord("projectComments", id, patch)} />
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

function ProjectAdminList({
  projects,
  onPatch,
  archived = false,
}: {
  projects: Project[];
  onPatch: (id: string, patch: AdminProjectPatch) => void;
  archived?: boolean;
}) {
  if (!projects.length) {
    return <EmptyState label={archived ? "暂无归档项目" : "暂无项目投稿"} />;
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
            {archived ? (
              <>
                <button className="icon-button bg-[#fff7d0]" onClick={() => onPatch(project.id, { reviewStatus: "pending" })} type="button">
                  恢复待审核
                </button>
                <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" onClick={() => onPatch(project.id, { reviewStatus: "approved" })} type="button">
                  <Check size={16} aria-hidden />
                  恢复公开
                </button>
              </>
            ) : (
              <>
                <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" onClick={() => onPatch(project.id, { reviewStatus: "approved" })} type="button">
                  <Check size={16} aria-hidden />
                  公开
                </button>
                <button className="icon-button bg-[#c9473a] text-white" onClick={() => onPatch(project.id, { reviewStatus: "rejected" })} type="button">
                  <X size={16} aria-hidden />
                  归档
                </button>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function ProjectEditForm({ project, onPatch }: { project: Project; onPatch: (id: string, patch: AdminProjectPatch) => void }) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ownerPassword = String(formData.get("ownerPassword") || "").trim();
    const patch: AdminProjectPatch = {
      title: String(formData.get("title") || ""),
      type: String(formData.get("type") || ""),
      projectStatus: String(formData.get("projectStatus") || ""),
      ownerName: String(formData.get("ownerName") || ""),
      description: String(formData.get("description") || ""),
      recruitmentNeeds: String(formData.get("recruitmentNeeds") || "[]"),
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
      <div className="grid gap-3 md:grid-cols-2">
        <input className="field-input" name="projectStatus" defaultValue={project.projectStatus} />
        <input className="field-input" name="ownerName" defaultValue={project.ownerName} />
      </div>
      <textarea className="field-input min-h-28" name="description" defaultValue={project.description} />
      <RecruitmentNeedsEditor initialNeeds={project.recruitmentNeeds} fallbackSkills={project.skills} fallbackCount={project.neededMembers} />
      <input className="field-input" name="publicContact" defaultValue={project.publicContact} />
      <input className="field-input" name="ownerPassword" type="password" placeholder="重置项目管理密码，留空则不修改" minLength={8} maxLength={80} />
      <button className="icon-button bg-[#fff7d0]" type="submit">保存编辑</button>
    </form>
  );
}

function IdeaAdminList({
  ideas,
  onPatch,
  archived = false,
}: {
  ideas: Idea[];
  onPatch: (id: string, patch: Partial<Idea>) => void;
  archived?: boolean;
}) {
  if (!ideas.length) {
    return <EmptyState label={archived ? "暂无归档想法" : "暂无想法投稿"} />;
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
          {archived ? (
            <div className="flex flex-wrap gap-2">
              <button className="icon-button bg-[#fff7d0]" onClick={() => onPatch(idea.id, { reviewStatus: "pending" })} type="button">
                恢复待审核
              </button>
              <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" onClick={() => onPatch(idea.id, { reviewStatus: "approved" })} type="button">
                <Check size={16} aria-hidden />
                恢复公开
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" onClick={() => onPatch(idea.id, { reviewStatus: "approved" })} type="button">
                <Check size={16} aria-hidden />
                公开
              </button>
              <button className="icon-button bg-[#c9473a] text-white" onClick={() => onPatch(idea.id, { reviewStatus: "rejected" })} type="button">
                <X size={16} aria-hidden />
                归档
              </button>
            </div>
          )}
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
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="状态" value={request.payload.projectStatus} />
              <ReadOnlyField label="公开联系方式" value={request.payload.publicContact || "未填写"} />
            </div>
            <ReadOnlyField label="项目介绍" value={request.payload.description} multiline />
            <ReadOnlyNeeds needs={request.payload.recruitmentNeeds} fallbackSkills={request.payload.skills} fallbackCount={request.payload.neededMembers} />
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
  onDelete,
  onPatch,
}: {
  updates: ProjectUpdate[];
  onDelete: (id: string) => void;
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
            <div className="flex flex-wrap gap-2">
              <button
                className={`icon-button ${isHidden ? "bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" : "bg-[#fff7d0]"}`}
                onClick={() => onPatch(update.id, { reviewStatus: isHidden ? "approved" : "rejected" })}
                type="button"
              >
                {isHidden ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
                {isHidden ? "恢复公开" : "隐藏动态"}
              </button>
              <button
                className="icon-button bg-[#c9473a] text-white"
                onClick={() => {
                  if (window.confirm(`确定要永久删除项目动态“${update.title}”吗？`)) {
                    onDelete(update.id);
                  }
                }}
                type="button"
              >
                <Trash2 size={16} aria-hidden />
                删除动态
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProjectCommentAdminList({
  comments,
  onPatch,
}: {
  comments: ProjectComment[];
  onPatch: (id: string, patch: Partial<ProjectComment>) => void;
}) {
  if (!comments.length) {
    return <EmptyState label="暂无项目评论" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {comments.map((comment) => {
        const isHidden = comment.reviewStatus === "rejected";
        return (
          <article className="pixel-panel grid gap-3 rounded-[8px] p-4" key={comment.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{comment.projectTitle}</h2>
                <p className="mt-1 text-sm font-bold text-[#52604e]">
                  {comment.nickname} / {new Date(comment.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <StatusBadge status={isHidden ? "rejected" : "approved"} />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#3f493c]">{comment.content}</p>
            <button
              className={`icon-button ${isHidden ? "bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" : "bg-[#fff7d0]"}`}
              onClick={() => onPatch(comment.id, { reviewStatus: isHidden ? "approved" : "rejected" })}
              type="button"
            >
              {isHidden ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
              {isHidden ? "恢复公开" : "隐藏评论"}
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

function ReadOnlyNeeds({ needs, fallbackSkills, fallbackCount }: { needs?: RecruitmentNeed[]; fallbackSkills: string[]; fallbackCount: number }) {
  const visibleNeeds = needs?.length
    ? needs
    : fallbackCount > 0 || fallbackSkills.length
      ? [{
        id: "legacy-recruitment",
        skill: fallbackSkills.join("、") || "协作者",
        count: fallbackCount,
        work: "旧项目未填写具体工作内容",
      }]
      : [];

  return (
    <div>
      <p className="text-xs font-black text-[#52604e]">招工需求</p>
      {visibleNeeds.length ? (
        <div className="mt-2 grid gap-2">
          {visibleNeeds.map((need) => (
            <div className="rounded-[8px] border-2 border-[#3826172e] bg-white/60 p-3" key={need.id}>
              <p className="text-sm font-black text-[#273323]">
                {need.skill} / {need.count} 人
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-bold leading-6 text-[#52604e]">{need.work}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm font-bold text-[#273323]">无</p>
      )}
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
