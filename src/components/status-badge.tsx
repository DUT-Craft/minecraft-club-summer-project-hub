import type { AdminStatus } from "@/lib/types";

const statusText: Record<AdminStatus, string> = {
  pending: "待审核",
  approved: "已公开",
  rejected: "已拒绝",
  contacted: "已联系",
  accepted: "已加入",
};

const statusClass: Record<AdminStatus, string> = {
  pending: "border-[#d99a24]/25 bg-[#fff2cc] text-[#7a4d00]",
  approved: "border-[#287a43]/25 bg-[#dff4e6] text-[#1f6a39]",
  rejected: "border-[#c9473a]/25 bg-[#ffe0dd] text-[#9a3028]",
  contacted: "border-[#2f80c2]/25 bg-[#dcefff] text-[#1d5f92]",
  accepted: "border-[#5fbd63]/25 bg-[#e9f8dd] text-[#287a43]",
};

export function StatusBadge({ status }: { status: AdminStatus }) {
  return (
    <span className={`inline-flex items-center rounded-[8px] border px-2.5 py-1 text-xs font-black ${statusClass[status]}`}>
      {statusText[status]}
    </span>
  );
}
