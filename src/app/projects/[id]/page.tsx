import { notFound } from "next/navigation";
import Link from "next/link";
import { Hammer, Settings, Tag, Users } from "lucide-react";

import { ProjectJoinForm } from "@/components/project-join-form";
import { SiteHeader } from "@/components/site-header";
import { getRecord, listAllData } from "@/lib/storage";
import type { Project } from "@/lib/types";
import { toPublicProject } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [record, snapshot] = await Promise.all([getRecord<Project>("projects", id), listAllData()]);

  if (!record || record.reviewStatus !== "approved") {
    notFound();
  }

  const project = toPublicProject(record);
  const updates = snapshot.projectUpdates.filter((update) => update.projectId === project.id && update.reviewStatus !== "rejected");

  return (
    <>
      <SiteHeader />
      <main className="page-band min-h-screen">
        <div className="wide-shell grid gap-5 py-8 lg:grid-cols-[1fr_380px]">
        <article className="pixel-panel grid gap-5 rounded-[8px] p-5 md:p-6">
          <div className="grass-strip -mx-5 -mt-5 rounded-t-[6px] md:-mx-7 md:-mt-7" />
          <div>
            <p className="minecraft-badge mb-3">
              <Tag size={14} aria-hidden />
              {project.type}
            </p>
            <h1 className="text-[clamp(2.2rem,4.8vw,4.6rem)] font-black leading-[0.98] text-[#173318]">{project.title}</h1>
            <p className="mt-3 max-w-3xl text-lg font-bold leading-8 text-[#3f493c]">{project.summary}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Info label="负责人" value={project.ownerName} />
            <Info label="状态" value={project.projectStatus} icon={<Hammer size={16} aria-hidden />} />
            <Info label="还需要" value={`${project.neededMembers} 人`} icon={<Users size={16} aria-hidden />} />
          </div>

          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <span key={skill} className="item-slot rounded-[8px] px-2.5 py-1 text-sm font-bold">
                {skill}
              </span>
            ))}
          </div>

          <div>
            <h2 className="mb-3 text-2xl font-black">项目介绍</h2>
            <p className="whitespace-pre-wrap leading-8 text-[#3f493c]">{project.description}</p>
          </div>

          {project.publicContact ? (
            <div className="item-slot rounded-[8px] p-4">
              <p className="text-sm font-black text-[#52604e]">公开联系方式</p>
              <p className="mt-1 font-bold">{project.publicContact}</p>
            </div>
          ) : null}

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black">项目动态</h2>
              <Link className="icon-button bg-[#fff7d0]" href={`/projects/${project.id}/manage`}>
                <Settings size={16} aria-hidden />
                发起者管理
              </Link>
            </div>
            {updates.length ? (
              <div className="grid gap-3">
                {updates.map((update) => (
                  <article className="item-slot rounded-[8px] p-4" key={update.id}>
                    {update.imageUrl ? (
                      <img
                        alt={update.title}
                        className="mb-3 aspect-video w-full rounded-[8px] border border-black/10 object-cover"
                        src={update.imageUrl}
                      />
                    ) : null}
                    <h3 className="font-black">{update.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap leading-7 text-[#3f493c]">{update.content}</p>
                    <p className="mt-3 text-xs font-bold text-[#52604e]">{new Date(update.createdAt).toLocaleString("zh-CN")}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="item-slot rounded-[8px] p-4 font-bold text-[#52604e]">暂无项目动态</p>
            )}
          </div>
        </article>
        <ProjectJoinForm projectId={project.id} projectTitle={project.title} />
        </div>
      </main>
    </>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="item-slot rounded-[8px] p-4">
      <p className="text-sm font-black text-[#52604e]">{label}</p>
      <p className="mt-1 flex items-center gap-2 font-black">
        {icon}
        {value}
      </p>
    </div>
  );
}
