"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { ProjectCard } from "@/components/project-card";
import type { PublicProject } from "@/lib/types";

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export function ProjectBrowser({ projects, compact = false }: { projects: PublicProject[]; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [skill, setSkill] = useState("");

  const options = useMemo(
    () => ({
      types: unique(projects.map((project) => project.type)),
      statuses: unique(projects.map((project) => project.projectStatus)),
      skills: unique(projects.flatMap((project) => project.skills)),
    }),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return projects.filter((project) => {
      const haystack = [
        project.title,
        project.summary,
        project.type,
        project.projectStatus,
        project.ownerName,
        project.description,
        ...project.skills,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || haystack.includes(keyword)) &&
        (!type || project.type === type) &&
        (!projectStatus || project.projectStatus === projectStatus) &&
        (!skill || project.skills.includes(skill))
      );
    });
  }, [projectStatus, projects, query, skill, type]);

  if (!projects.length) {
    return <EmptyPublicState label="暂无公开项目，欢迎提交第一个暑假共创项目" compact={compact} />;
  }

  return (
    <div className={compact ? "grid gap-3" : "grid gap-4"}>
      <div className={`pixel-panel grid rounded-[12px] ${compact ? "gap-2.5 p-3" : "gap-3 p-4"}`}>
        {!compact ? <div className="grass-strip -mx-4 -mt-4 rounded-t-[10px]" /> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className={compact ? "text-base font-black text-[#173318]" : "text-xl font-black text-[#173318]"}>筛选项目</h3>
            {!compact ? <p className="mt-1 text-sm font-bold text-[#5d6b55]">按标题、状态、技能和类型快速找到想加入的共创。</p> : null}
          </div>
          <span className="voxel-chip px-2.5 py-1.5 text-sm">
            <SlidersHorizontal size={16} aria-hidden />
            {filteredProjects.length} / {projects.length}
          </span>
        </div>
        <div className={`grid gap-2.5 ${compact ? "md:grid-cols-[1.2fr_repeat(3,minmax(0,0.62fr))]" : "lg:grid-cols-[1.2fr_repeat(3,minmax(0,0.55fr))]"}`}>
          <label className="field-label">
            搜索项目
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#52604e]" size={16} aria-hidden />
              <input
                className="field-input pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="标题、简介、负责人、技能"
              />
            </span>
          </label>
          <FilterSelect label="类型" value={type} onChange={setType} options={options.types} />
          <FilterSelect label="状态" value={projectStatus} onChange={setProjectStatus} options={options.statuses} />
          <FilterSelect label="技能" value={skill} onChange={setSkill} options={options.skills} />
        </div>
        {(query || type || projectStatus || skill) ? (
          <div className="flex justify-end">
            <button
              className="icon-button bg-[#fff7d0] px-3 py-2 text-sm text-[#20301f]"
              type="button"
              onClick={() => {
                setQuery("");
                setType("");
                setProjectStatus("");
                setSkill("");
              }}
            >
              清空筛选
            </button>
          </div>
        ) : null}
      </div>

      {filteredProjects.length ? (
        <div className={`grid gap-3 ${compact ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-3"}`}>
          {filteredProjects.map((project) => (
            <ProjectCard compact={compact} key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyPublicState label="没有匹配的公开项目" compact={compact} />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-label">
      {label}
      <select className="field-input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">全部</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyPublicState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`pixel-panel flex items-center justify-center rounded-[8px] text-center font-bold text-[#5d6b55] ${compact ? "min-h-24 p-4" : "min-h-36 p-5"}`}>
      {label}
    </div>
  );
}
