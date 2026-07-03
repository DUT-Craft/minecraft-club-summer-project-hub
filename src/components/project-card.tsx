import Link from "next/link";
import { ArrowRight, Hammer, Users } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import type { PublicProject } from "@/lib/types";

export function ProjectCard({ project, compact = false }: { project: PublicProject; compact?: boolean }) {
  const recruitmentNeeds = project.recruitmentNeeds?.length ? project.recruitmentNeeds : [];
  const neededSkills = recruitmentNeeds.length ? recruitmentNeeds.map((need) => need.skill) : project.skills;
  const neededMembers = recruitmentNeeds.length ? recruitmentNeeds.reduce((sum, need) => sum + need.count, 0) : project.neededMembers;

  return (
    <article className={`pixel-panel flex h-full flex-col rounded-[8px] ${compact ? "gap-3 p-3" : "gap-4 p-4"}`}>
      {!compact ? <div className="grass-strip -mx-4 -mt-4 rounded-t-[6px]" /> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="minecraft-badge mb-2">
            {project.type}
          </p>
          <h3 className={`${compact ? "text-lg" : "text-xl"} font-black leading-tight text-[#173318]`}>{project.title}</h3>
        </div>
        <StatusBadge status="approved" />
      </div>
      <p className={`${compact ? "line-clamp-2" : ""} text-sm font-semibold leading-6 text-[#5f6b58]`}>{project.summary}</p>
      <div className="flex flex-wrap gap-2">
        {(compact ? neededSkills.slice(0, 4) : neededSkills).map((skill, index) => (
          <span key={`${skill}-${index}`} className="rounded-[6px] border-2 border-[#38261747] bg-[#fff3bc] px-2.5 py-1 text-xs font-black text-[#5b431d]">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-auto grid gap-2 border-t-2 border-dashed border-[#3826172e] pt-3 text-sm font-black text-[#5d4b2a] sm:grid-cols-2">
        <span className="flex items-center gap-2">
          <Hammer size={16} aria-hidden />
          {project.projectStatus}
        </span>
        <span className="flex items-center gap-2">
          <Users size={16} aria-hidden />
          还需要 {neededMembers} 人
        </span>
      </div>
      <Link className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318]" href={`/projects/${project.id}`}>
        {compact ? "查看" : "查看与申请"}
        <ArrowRight size={16} aria-hidden />
      </Link>
    </article>
  );
}
