"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type JoinFormProps = {
  projectId: string;
  projectTitle: string;
};

export function ProjectJoinForm({ projectId, projectTitle }: JoinFormProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch("/api/public/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        projectTitle,
        applicantName: formData.get("applicantName"),
        minecraftId: formData.get("minecraftId"),
        contact: formData.get("contact"),
        reason: formData.get("reason"),
      }),
    });

    const data = (await response.json()) as { message?: string };
    setPending(false);
    setMessage(data.message || (response.ok ? "申请已提交。" : "提交失败。"));

    if (response.ok) {
      form.reset();
    }
  }

  return (
    <form className="pixel-panel grid content-start gap-4 rounded-[8px] p-5 lg:sticky lg:top-24" onSubmit={submit}>
      <div className="grass-strip -mx-5 -mt-5 rounded-t-[6px]" />
      <div>
        <p className="minecraft-badge mb-2">加入申请</p>
        <h2 className="text-2xl font-black text-[#173318]">申请加入</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-[#5d6b55]">联系方式只会给管理员和项目发起者查看，不会公开展示。</p>
      </div>
      <label className="field-label">
        昵称
        <input className="field-input" name="applicantName" maxLength={40} required />
      </label>
      <label className="field-label">
        Minecraft ID
        <input className="field-input" name="minecraftId" minLength={3} maxLength={32} required />
      </label>
      <label className="field-label">
        联系方式
        <input className="field-input" name="contact" maxLength={120} required />
      </label>
      <label className="field-label">
        申请理由
        <textarea className="field-input min-h-32 resize-y" name="reason" maxLength={800} required />
      </label>
      <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318] shadow-block" disabled={pending} type="submit">
        <Send size={17} aria-hidden />
        {pending ? "提交中" : "提交申请"}
      </button>
      {message ? <p className="rounded-[8px] border-2 border-[#382617] bg-[#e9ffd4] px-3 py-2 text-sm font-black text-[#35682b]">{message}</p> : null}
    </form>
  );
}
