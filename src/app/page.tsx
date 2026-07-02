import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, Compass, Flame, Lightbulb, Square, Users } from "lucide-react";

import { ProjectBrowser } from "@/components/project-browser";
import { SiteHeader } from "@/components/site-header";
import { getPublicSnapshot } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getPublicSnapshot();
  const hotTags = buildHotTags(snapshot.projects);
  const activityItems = buildActivityItems(snapshot);
  const recruitSlots = buildRecruitSlots(snapshot.projects);
  const totalNeededMembers = snapshot.projects.reduce((sum, project) => sum + project.neededMembers, 0);
  const recruitingProjects = snapshot.projects.filter((project) => project.neededMembers > 0 || project.projectStatus.includes("招募")).length;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="grid-paper relative overflow-hidden border-b-2 border-[#382617]/25">
          <div className="wide-shell relative grid min-h-[calc(100svh-210px)] grid-cols-1 items-center gap-7 py-7 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12 xl:min-h-[600px]">
            <div className="max-w-[620px] py-4">
              <div className="voxel-chip mb-5 w-fit px-2.5 py-1.5 text-[13px]">
                <span className="h-3 w-3 rotate-45 border-2 border-[#382617] bg-[#83d5ff]" />
                暑假共创 · 审核后公开展示
              </div>
              <h1 className="max-w-[9.6em] text-[clamp(3rem,5.9vw,5.35rem)] font-black leading-[0.96] tracking-[0] text-[#173318]">
                Minecraft 暑假共创项目广场
              </h1>
              <p className="mt-5 max-w-[590px] text-[clamp(1rem,1.35vw,1.18rem)] font-bold leading-[1.72] text-[#40563a]">
                集中展示社团项目、收集玩法灵感、处理加入申请。公开内容由管理员审核后展示。
              </p>

              <div className="mt-4 flex max-w-[560px] flex-wrap gap-2" aria-label="热门方向">
                {hotTags.map((tag) => (
                  <span className="minecraft-badge" key={tag}>{tag}</span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="icon-button min-h-[50px] bg-[linear-gradient(180deg,#93d65a,#55a63a)] px-5 text-[#173318] shadow-[6px_6px_0_rgba(56,38,23,.22)]" href="/submit">
                  <ClipboardList size={18} aria-hidden />
                  投稿项目
                </Link>
                <a className="icon-button min-h-[50px] bg-[linear-gradient(180deg,#fff7d0,#e6c986)] px-5 text-[#20301f] shadow-[6px_6px_0_rgba(56,38,23,.22)]" href="#ideas">
                  <Lightbulb size={18} aria-hidden />
                  查看想法
                </a>
              </div>

              <div className="mt-7 grid gap-2.5 sm:grid-cols-3">
                <Stat label="公开项目" value={snapshot.projects.length} />
                <Stat label="公开想法" value={snapshot.ideas.length} />
                <Stat label="加入口" value={snapshot.projects.length} />
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-[1.08fr_0.92fr]">
                <ActivityBoard items={activityItems} />
                <RecruitBoard projects={snapshot.projects.length} slots={recruitSlots} totalNeededMembers={totalNeededMembers} />
              </div>
            </div>

            <div className="relative justify-self-center lg:justify-self-stretch">
              <FloatingSlot className="-left-4 top-[20%] hidden lg:grid" icon="book" />
              <FloatingSlot className="-right-4 bottom-[22%] hidden lg:grid" icon="torch" />
              <figure className="relative overflow-hidden rounded-[12px] border-2 border-[#382617] bg-[#bde9ff] shadow-[12px_12px_0_rgba(56,38,23,.20)]">
                <Image
                  alt="原创像素方块世界插画：草地方块、木牌、工作台、矿石、火把、书本和学生创作者正在搭建项目广场"
                  className="aspect-[16/10] w-full scale-[1.01] rounded-[10px] object-cover"
                  width={1600}
                  height={1000}
                  priority
                  src="/assets/hero-voxel-plaza.png"
                />
                <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-[8px] border-2 border-[#3826178c] bg-[#fff8dcea] px-3 py-2 text-sm font-black text-[#4b321b] shadow-[4px_4px_0_rgba(56,38,23,.18)]">
                  公告板正在更新 · 暑假共创招募中
                  <span className="h-2.5 w-2.5 border-2 border-[#382617] bg-[#d4472d] shadow-[0_0_0_3px_rgba(212,71,45,.18)]" />
                </figcaption>
              </figure>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <MiniCard title="本周共创主题" text={hotTags.slice(0, 3).join("、") || "等待社团成员提交方向"} />
                <MiniCard title="招募看板" text={`${recruitingProjects} 个项目正在招募，合计还需要 ${totalNeededMembers} 人`} />
              </div>
            </div>
          </div>
          <section className="wide-shell relative z-10 pb-7">
            <div className="pixel-panel rounded-[12px] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[1.35rem] font-black leading-tight text-[#173318]">项目广场</h2>
                  <p className="mt-1 text-sm font-extrabold text-[#5d6b55]">
                    首屏下沿露出项目列表，提示这里是可继续浏览的社区广场。
                  </p>
                </div>
                <span className="voxel-chip px-2.5 py-1.5 text-sm">
                  <Compass size={16} aria-hidden />
                  审核通过后公开
                </span>
              </div>
              <div className="mb-3 grid gap-2.5 md:grid-cols-4">
                <SummaryChip label="今日动态" value={snapshot.projectUpdates.length} />
                <SummaryChip label="公开项目" value={snapshot.projects.length} />
                <SummaryChip label="招募中" value={recruitingProjects} />
                <SummaryChip label="还需人数" value={totalNeededMembers} />
              </div>
              <ProjectBrowser projects={snapshot.projects} compact />
            </div>
          </section>
          <div className="grass-strip relative" />
        </section>

        {snapshot.setupError ? (
          <section className="wide-shell pb-6 pt-6">
            <div className="rounded-[8px] border-2 border-[#c9473a] bg-[#ffe0dd] p-4 font-bold text-[#9a3028] shadow-[4px_4px_0_rgba(56,38,23,.14)]">
              {snapshot.setupError}
            </div>
          </section>
        ) : null}

        <section className="wide-shell py-8">
          <div className="section-heading">
            <div>
              <h2>全部公开项目</h2>
              <p>已通过审核的暑假项目，可以继续搜索筛选</p>
            </div>
            <Link className="icon-button bg-[#fff7d0] text-[#20301f]" href="/submit">
              提交项目
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <ProjectBrowser projects={snapshot.projects} />
        </section>

        <section className="wide-shell py-8" id="ideas">
          <div className="section-heading">
            <div>
              <h2>想法墙</h2>
              <p>已通过审核的玩法、活动和建设灵感</p>
            </div>
            <Link className="icon-button bg-[#fff7d0] text-[#20301f]" href="/submit">
              提交想法
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          {snapshot.ideas.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {snapshot.ideas.map((idea) => (
                <article className="pixel-panel grid gap-3 rounded-[8px] p-4" key={idea.id}>
                  <div className="grass-strip -mx-5 -mt-5 rounded-t-[6px]" />
                  <h3 className="text-xl font-black">{idea.title}</h3>
                  <p className="whitespace-pre-wrap leading-7 text-[#3f493c]">{idea.content}</p>
                  <p className="text-sm font-black text-[#5d6b55]">{idea.submitterName} / {idea.minecraftId}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyPublicState label="暂无公开想法" />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="item-slot min-h-[88px] rounded-[8px] bg-[linear-gradient(135deg,#fff8d6,#ead394)] p-3.5">
      <p className="font-mono text-3xl font-black leading-none tabular-nums text-[#173318]">{value}</p>
      <p className="mt-2.5 text-sm font-black text-[#5d4b2a]">{label}</p>
      <Square className="absolute right-3 top-3 text-[#382617]/25" size={18} aria-hidden />
    </div>
  );
}

function ActivityBoard({ items }: { items: Array<{ title: string; meta: string }> }) {
  return (
    <section className="item-slot rounded-[8px] bg-[#fffdf4]/90 p-3" aria-label="今日广场动态">
      <div className="flex items-center justify-between gap-2 text-[13px] font-black text-[#374b2f]">
        <span>今日广场动态</span>
        <strong className="font-mono text-xs text-[#7a542b]">公开</strong>
      </div>
      <ul className="mt-2 grid gap-1.5">
        {items.map((item) => (
          <li className="flex items-center justify-between gap-2 text-xs font-bold leading-5 text-[#526149]" key={`${item.title}-${item.meta}`}>
            <span className="min-w-0 truncate">{item.title}</span>
            <span className="shrink-0 font-mono font-black text-[#7a542b]">{item.meta}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecruitBoard({
  projects,
  slots,
  totalNeededMembers,
}: {
  projects: number;
  slots: Array<{ label: string; current: number; total: number }>;
  totalNeededMembers: number;
}) {
  return (
    <section className="item-slot rounded-[8px] bg-[#fffdf4]/90 p-3" aria-label="招募席位">
      <div className="flex items-center justify-between gap-2 text-[13px] font-black text-[#374b2f]">
        <span>招募席位</span>
        <strong className="font-mono text-xs text-[#7a542b]">{totalNeededMembers}</strong>
      </div>
      <div className="mt-2 grid gap-2">
        {slots.map((slot) => (
          <div key={slot.label}>
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#526149]">
              <span className="truncate">{slot.label}</span>
              <span className="font-mono font-black text-[#7a542b]">{slot.current} / {slot.total}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full border-2 border-[#3826176b] bg-[#f3e1a9]">
              <span className="block h-full bg-[linear-gradient(90deg,#55a63a,#93d65a)]" style={{ width: `${Math.min(100, Math.round((slot.current / Math.max(slot.total, 1)) * 100))}%` }} />
            </div>
          </div>
        ))}
        {!projects ? <p className="text-xs font-bold leading-5 text-[#526149]">等待第一个项目开放招募。</p> : null}
      </div>
    </section>
  );
}

function FloatingSlot({ className, icon }: { className: string; icon: "book" | "torch" }) {
  return (
    <div className={`absolute z-10 h-[58px] w-[58px] place-items-center rounded-[8px] border-2 border-[#382617] bg-[#fff2bd] text-[#4b321b] shadow-[6px_6px_0_rgba(56,38,23,.19)] ${className}`} aria-hidden>
      {icon === "book" ? <BookOpen size={30} /> : <Flame size={30} />}
    </div>
  );
}

function MiniCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="item-slot rounded-[8px] bg-[#fff8dc] p-3">
      <strong className="block text-sm font-black leading-tight text-[#2f442a]">{title}</strong>
      <span className="mt-1.5 block text-xs font-bold leading-5 text-[#6a5839]">{text}</span>
    </article>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="item-slot min-h-[66px] rounded-[8px] bg-[#f7edbf] p-3">
      <span className="block text-xs font-black text-[#6a5839]">{label}</span>
      <strong className="mt-1 block font-mono text-xl font-black leading-none text-[#26351f]">{value}</strong>
    </div>
  );
}

function EmptyPublicState({ label }: { label: string }) {
  return (
    <div className="pixel-panel flex min-h-36 items-center justify-center rounded-[8px] p-5 text-center font-bold text-[#5d6b55]">
      {label}
    </div>
  );
}

type HomeSnapshot = Awaited<ReturnType<typeof getPublicSnapshot>>;
type HomeProject = HomeSnapshot["projects"][number];

function buildHotTags(projects: HomeProject[]) {
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const tag of [project.type, ...project.skills]) {
      const key = tag.trim();
      if (key) {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }

  const tags = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .map(([tag]) => tag)
    .slice(0, 4);

  return tags.length ? tags : ["建筑共创", "红石机关", "剧情地图", "资源包"];
}

function buildActivityItems(snapshot: HomeSnapshot) {
  const updates = snapshot.projectUpdates.slice(0, 3).map((update) => ({
    title: update.title,
    meta: formatShortTime(update.createdAt),
  }));

  if (updates.length) {
    return updates;
  }

  const fallback = [
    ...snapshot.projects.slice(0, 2).map((project) => ({ title: `${project.title} 已公开`, meta: "项目" })),
    ...snapshot.ideas.slice(0, 1).map((idea) => ({ title: `${idea.title} 加入想法墙`, meta: "想法" })),
  ];

  return fallback.length ? fallback : [{ title: "等待社团成员提交第一个项目", meta: "待开启" }];
}

function buildRecruitSlots(projects: HomeProject[]) {
  const slots = projects
    .filter((project) => project.neededMembers > 0)
    .slice(0, 2)
    .map((project) => ({
      label: project.type || project.title,
      current: Math.max(1, project.neededMembers),
      total: Math.max(project.neededMembers + 2, project.neededMembers || 1),
    }));

  return slots.length ? slots : [
    { label: "建筑师", current: 0, total: 1 },
    { label: "红石测试", current: 0, total: 1 },
  ];
}

function formatShortTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "动态";
  }

  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function Footer() {
  return (
    <footer className="mt-10 border-t-2 border-[#382617]/20 bg-[#fffdf4]/82">
      <div className="wide-shell flex flex-wrap items-center justify-between gap-3 py-6 text-sm font-bold text-[#5d6b55]">
        <span>暑假项目站</span>
        <span className="flex items-center gap-2">
          <Users size={16} aria-hidden />
          Minecraft 社团共创
        </span>
      </div>
    </footer>
  );
}
