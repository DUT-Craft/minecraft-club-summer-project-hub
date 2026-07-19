// 后端 ObjectItemStatus 枚举（见后端枚举类 / openapi.json）→ 前端展示文案。
// 与后端交互始终使用英文枚举值（statusFilter 的 value、URL query 等）；
// 前端展示统一走这份映射，避免在多个页面 / 组件里各写一份导致漂移。
export const PROJECT_STATUS_LABEL: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "筹备中",
  REJECTED: "审核未通过",
  DELETED: "已删除",
  PREPARING: "筹备中",
  RECRUITING: "招募中",
  IN_PROGRESS: "制作中",
  PAUSED: "暂缓",
};

// 把后端返回的英文枚举状态映射为中文文案；空值或未知值回退为“筹备中”，
// 与原 ProjectHubCard / 项目详情页的兜底文案保持一致。
export const formatProjectStatus = (status?: string): string => {
  if (!status) {
    return "筹备中";
  }
  return PROJECT_STATUS_LABEL[status.toUpperCase()] ?? "筹备中";
};

export const OPERATIONAL_STATUSES = ["PREPARING", "RECRUITING", "IN_PROGRESS", "PAUSED"] as const;
