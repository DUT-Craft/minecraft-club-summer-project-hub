"use client";

import { useMemo, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import type { ProjectComment } from "@/lib/types";
import { getHttpErrorMessage, useHttp } from "@/lib/useHttp";

type CommentFormProps = {
  projectId: string;
  initialComments: ProjectComment[];
};

export function ProjectCommentForm({ projectId, initialComments }: CommentFormProps) {
  const http = useHttp();
  const [comments, setComments] = useState(initialComments);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const visibleComments = useMemo(
    () =>
      comments
        .filter((comment) => comment.reviewStatus !== "rejected")
        .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [comments],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await http.postRaw<{ record: ProjectComment }>("/public/comments", {
        projectId,
        nickname: formData.get("nickname"),
        content: formData.get("content"),
      });

      setMessage(result.msg || "评论已发布。");
      setComments((current) => [result.data.record, ...current]);
      form.reset();
    } catch (error) {
      setMessage(getHttpErrorMessage(error, "评论发布失败。"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <MessageSquare size={20} aria-hidden />
          项目评论
        </h2>
        <span className="minecraft-badge">{visibleComments.length} 条建议</span>
      </div>

      <form className="item-slot grid gap-3 rounded-[8px] p-4" onSubmit={submit}>
        <label className="field-label">
          昵称
          <input className="field-input" name="nickname" maxLength={40} required />
        </label>
        <label className="field-label">
          想法或建议
          <textarea className="field-input min-h-28 resize-y" name="content" maxLength={800} required />
        </label>
        <button className="icon-button bg-[linear-gradient(180deg,#93d65a,#55a63a)] text-[#173318] shadow-block" disabled={pending} type="submit">
          <Send size={16} aria-hidden />
          {pending ? "发布中" : "发布评论"}
        </button>
        {message ? <p className="rounded-[8px] border-2 border-[#382617] bg-[#e9ffd4] px-3 py-2 text-sm font-black text-[#35682b]">{message}</p> : null}
      </form>

      {visibleComments.length ? (
        <div className="grid gap-3">
          {visibleComments.map((comment) => (
            <article className="item-slot rounded-[8px] p-4" key={comment.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black">{comment.nickname}</h3>
                <p className="text-xs font-bold text-[#52604e]">{new Date(comment.createdAt).toLocaleString("zh-CN")}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-[#3f493c]">{comment.content}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="item-slot rounded-[8px] p-4 font-bold text-[#52604e]">还没有评论，欢迎给这个项目留一点建议。</p>
      )}
    </section>
  );
}
