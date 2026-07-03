"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { RecruitmentNeed } from "@/lib/types";

type RecruitmentNeedsEditorProps = {
  initialNeeds?: RecruitmentNeed[];
  fallbackSkills?: string[];
  fallbackCount?: number;
};

function createNeed(): RecruitmentNeed {
  return {
    id: crypto.randomUUID(),
    skill: "",
    count: 1,
    work: "",
  };
}

function fallbackNeeds(fallbackSkills?: string[], fallbackCount?: number) {
  if (fallbackSkills?.length) {
    return fallbackSkills.map((skill, index) => ({
      id: `fallback-${index + 1}`,
      skill,
      count: index === 0 ? Math.max(1, fallbackCount || 1) : 1,
      work: "",
    }));
  }

  return [createNeed()];
}

export function RecruitmentNeedsEditor({ initialNeeds, fallbackSkills, fallbackCount }: RecruitmentNeedsEditorProps) {
  const initial = useMemo(
    () => (initialNeeds?.length ? initialNeeds : fallbackNeeds(fallbackSkills, fallbackCount)),
    [fallbackCount, fallbackSkills, initialNeeds],
  );
  const [needs, setNeeds] = useState<RecruitmentNeed[]>(initial);

  function updateNeed(id: string, patch: Partial<RecruitmentNeed>) {
    setNeeds((current) => current.map((need) => (need.id === id ? { ...need, ...patch } : need)));
  }

  function removeNeed(id: string) {
    setNeeds((current) => (current.length > 1 ? current.filter((need) => need.id !== id) : current));
  }

  return (
    <section className="grid gap-3">
      <input name="recruitmentNeeds" type="hidden" value={JSON.stringify(needs)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-black text-[#173318]">招工需求</h3>
          <p className="mt-1 text-xs font-bold text-[#5d6b55]">写清楚需要什么技能、几个人，以及大概要做什么。</p>
        </div>
        <button className="icon-button bg-[#fff7d0]" onClick={() => setNeeds((current) => [...current, createNeed()])} type="button">
          <Plus size={16} aria-hidden />
          添加需求
        </button>
      </div>

      {needs.map((need, index) => (
        <div className="item-slot grid gap-3 rounded-[8px] p-3" key={need.id}>
          <div className="flex items-center justify-between gap-2">
            <strong className="text-sm font-black text-[#5d4b2a]">需求 {index + 1}</strong>
            <button
              aria-label="删除这条招工需求"
              className="grid h-8 w-8 place-items-center rounded-[6px] border-2 border-[#382617] bg-[#ffe0dd] text-[#9a3028]"
              disabled={needs.length <= 1}
              onClick={() => removeNeed(need.id)}
              type="button"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
            <label className="field-label">
              技能 / 人才方向
              <input className="field-input" maxLength={40} required value={need.skill} onChange={(event) => updateNeed(need.id, { skill: event.target.value })} />
            </label>
            <label className="field-label">
              人数
              <input
                className="field-input"
                min="1"
                max="99"
                required
                type="number"
                value={need.count}
                onChange={(event) => updateNeed(need.id, { count: Number(event.target.value) })}
              />
            </label>
          </div>
          <label className="field-label">
            大概工作内容
            <textarea
              className="field-input min-h-20 resize-y"
              maxLength={400}
              required
              value={need.work}
              onChange={(event) => updateNeed(need.id, { work: event.target.value })}
            />
          </label>
        </div>
      ))}
    </section>
  );
}
