import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Blocks, BookOpen, ClipboardList, Compass, Flame, Lightbulb, MessageSquare, Search, Square } from "lucide-react";

import { PublicFooter } from "@/components/public-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSnapshot } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getPublicSnapshot();
  const hotTags = buildHotTags(snapshot.projects);
  const heroTags = hotTags.length ? hotTags : ["项目投稿", "想法收集", "申请加入", "公开评论"];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="grid-paper relative overflow-hidden border-b-2 border-[#382617]/25">
          <div className="wide-shell relative grid grid-cols-1 items-center gap-6 py-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:py-8 xl:min-h-[520px]">
            <div className="max-w-[620px] py-4">
              <div className="voxel-chip mb-5 w-fit px-2.5 py-1.5 text-[13px]">
                <span className="h-3 w-3 rotate-45 border-2 border-[#382617] bg-[#83d5ff]" />
                暑假共创 · 审核后公开展示
              </div>
              <h1 className="max-w-[9.6em] text-[clamp(3rem,5.9vw,5.35rem)] font-black leading-[0.96] tracking-[0] text-[#173318]">
                Minecraft 暑假共创项目站
              </h1>
              <p className="mt-5 max-w-[590px] text-[clamp(1rem,1.35vw,1.18rem)] font-bold leading-[1.72] text-[#40563a]">
                集中展示社团项目、收集玩法灵感、处理加入申请。公开内容由管理员审核后展示。
              </p>

              <div className="mt-4 flex max-w-[560px] flex-wrap gap-2" aria-label={hotTags.length ? "公开项目标签" : "站点入口"}>
                {heroTags.map((tag) => (
                  <span className="minecraft-badge" key={tag}>{tag}</span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="icon-button min-h-[50px] bg-[linear-gradient(180deg,#93d65a,#55a63a)] px-5 text-[#173318] shadow-[6px_6px_0_rgba(56,38,23,.22)]" href="/projects">
                  <Search size={18} aria-hidden />
                  浏览项目
                </Link>
                <Link className="icon-button min-h-[50px] bg-[linear-gradient(180deg,#93d65a,#55a63a)] px-5 text-[#173318] shadow-[6px_6px_0_rgba(56,38,23,.22)]" href="/submit">
                  <ClipboardList size={18} aria-hidden />
                  投稿项目
                </Link>
                <Link className="icon-button min-h-[50px] bg-[linear-gradient(180deg,#fff7d0,#e6c986)] px-5 text-[#20301f] shadow-[6px_6px_0_rgba(56,38,23,.22)]" href="/submit#idea">
                  <MessageSquare size={18} aria-hidden />
                  提交想法
                </Link>
                <Link className="icon-button min-h-[50px] bg-[linear-gradient(180deg,#fff7d0,#e6c986)] px-5 text-[#20301f] shadow-[6px_6px_0_rgba(56,38,23,.22)]" href="/ideas">
                  <Lightbulb size={18} aria-hidden />
                  查看想法
                </Link>
              </div>

              <div className="mt-7 grid gap-2.5 sm:grid-cols-3">
                <Stat label="公开项目" value={snapshot.projects.length} />
                <Stat label="公开想法" value={snapshot.ideas.length} />
                <Stat label="公开建议" value={snapshot.projectComments.length} />
              </div>
            </div>

            <div className="relative justify-self-center lg:justify-self-stretch">
              <FloatingSlot className="-left-4 top-[20%] hidden lg:grid" icon="book" />
              <FloatingSlot className="-right-4 bottom-[22%] hidden lg:grid" icon="torch" />
              <figure className="relative overflow-hidden rounded-[12px] border-2 border-[#382617] bg-[#bde9ff] shadow-[12px_12px_0_rgba(56,38,23,.20)]">
                <Image
                  alt="像素方块风格的猫娘社成员在空岛基地整理项目计划"
                  className="aspect-[16/10] w-full scale-[1.01] rounded-[10px] object-cover"
                  width={1600}
                  height={1000}
                  priority
                  src="/assets/catgirl-concepts/catgirl-sky-island.png"
                />
                <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-[8px] border-2 border-[#3826178c] bg-[#fff8dcea] px-3 py-2 text-sm font-black text-[#4b321b] shadow-[4px_4px_0_rgba(56,38,23,.18)]">
                  空岛基地已开工 · 暑假共创招募中
                  <span className="h-2.5 w-2.5 border-2 border-[#382617] bg-[#d4472d] shadow-[0_0_0_3px_rgba(212,71,45,.18)]" />
                </figcaption>
              </figure>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <MiniCard title="真实公开数据" text={snapshot.projects.length ? `已有 ${snapshot.projects.length} 个项目通过审核` : "暂无公开项目，投稿后会先进入后台审核"} />
                <MiniCard title="审核说明" text="投稿会先进入后台，公开页面只展示通过审核的项目和想法" />
              </div>
            </div>
          </div>

          <div className="wide-shell pb-7">
            <div className="grid gap-4 lg:grid-cols-3">
              <HomePortalCard
                action="进入项目列表"
                href="/projects"
                icon={<Blocks size={18} aria-hidden />}
                image="/assets/catgirl-concepts/catgirl-farm-base.png"
                kicker="全部公开项目"
                text="看项目介绍、招工需求、动态和公开评论，找到合适的项目后直接申请加入。"
                title="浏览正在招人的项目"
              />
              <HomePortalCard
                action="提交项目草案"
                href="/submit"
                icon={<ClipboardList size={18} aria-hidden />}
                image="/assets/catgirl-concepts/catgirl-survival-plaza.png"
                kicker="项目投稿"
                text="把项目标题、介绍和招工需求写清楚，管理员审核通过后就会公开展示。"
                title="把你的暑假计划挂出来"
              />
              <HomePortalCard
                action="查看想法墙"
                href="/ideas"
                icon={<Lightbulb size={18} aria-hidden />}
                image="/assets/catgirl-concepts/catgirl-campfire-planning.png"
                kicker="灵感收集"
                text="还没形成项目也没关系，先把玩法点子放到想法墙，等人一起完善。"
                title="围着营火讨论新玩法"
              />
            </div>

            <section className="relative mt-5 min-h-[220px] overflow-hidden rounded-[10px] border-2 border-[#382617] bg-[#173318] shadow-[8px_8px_0_rgba(56,38,23,.18)]">
              <Image
                alt="像素方块风格的猫娘社成员在洞穴中探索矿物和新路线"
                className="object-cover object-[center_48%]"
                fill
                sizes="(min-width: 1024px) 1280px, 100vw"
                src="/assets/catgirl-concepts/catgirl-cave-adventure.png"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,51,24,.94),rgba(23,51,24,.62)_48%,rgba(23,51,24,.08))]" />
              <div className="relative max-w-[620px] p-5 text-[#fffdf4] md:p-7">
                <p className="voxel-chip mb-3 border-[#fff8dc] bg-[#fff8dc] px-2.5 py-1.5 text-xs text-[#4b321b]">
                  <Compass size={14} aria-hidden />
                  下一步扩展
                </p>
                <h2 className="text-[clamp(1.75rem,3vw,2.8rem)] font-black leading-tight">
                  后续可以把每周活动、长期组队和服务器玩法继续接进来
                </h2>
                <p className="mt-3 max-w-[560px] text-sm font-bold leading-7 text-[#fff4c9] md:text-base">
                  首页先保持入口清楚：看项目、交项目、看想法。等服务器主站功能确定后，可以继续把活动置顶、长期玩法和在线状态做成同一套方块面板。
                </p>
                <Link className="icon-button mt-4 bg-[#fff7d0] text-[#20301f]" href="/submit#idea">
                  <MessageSquare size={17} aria-hidden />
                  先提交一个点子
                </Link>
              </div>
            </section>
          </div>
          <div className="grass-strip relative" />
        </section>

        {snapshot.setupError ? (
          <section className="wide-shell pb-6 pt-6">
            <div className="rounded-[8px] border-2 border-[#c9473a] bg-[#ffe0dd] p-4 font-bold text-[#9a3028] shadow-[4px_4px_0_rgba(56,38,23,.14)]">
              {snapshot.setupError}
            </div>
          </section>
        ) : null}

      </main>
      <PublicFooter />
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

function FloatingSlot({ className, icon }: { className: string; icon: "book" | "torch" }) {
  return (
    <div className={`absolute z-10 h-[58px] w-[58px] place-items-center rounded-[8px] border-2 border-[#382617] bg-[#fff2bd] text-[#4b321b] shadow-[6px_6px_0_rgba(56,38,23,.19)] ${className}`} aria-hidden>
      {icon === "book" ? <BookOpen size={30} /> : <Flame size={30} />}
    </div>
  );
}

function HomePortalCard({
  action,
  href,
  icon,
  image,
  kicker,
  text,
  title,
}: {
  action: string;
  href: string;
  icon: ReactNode;
  image: string;
  kicker: string;
  text: string;
  title: string;
}) {
  return (
    <Link className="group item-slot grid overflow-hidden rounded-[10px] bg-[#fff8dc] transition hover:-translate-y-1 hover:shadow-[7px_7px_0_rgba(56,38,23,.18)]" href={href}>
      <span className="relative block aspect-[16/8.4] overflow-hidden border-b-2 border-[#382617] bg-[#bde9ff]">
        <Image
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          height={720}
          sizes="(min-width: 1024px) 33vw, 100vw"
          src={image}
          width={1200}
        />
        <span className="absolute left-3 top-3 rounded-[7px] border-2 border-[#382617] bg-[#fff8dcea] px-2.5 py-1 text-xs font-black text-[#4b321b] shadow-[3px_3px_0_rgba(56,38,23,.16)]">
          {kicker}
        </span>
      </span>
      <span className="grid gap-2 p-4">
        <span className="flex items-start justify-between gap-3">
          <span className="text-xl font-black leading-tight text-[#173318]">{title}</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[7px] border-2 border-[#382617] bg-[#e9ffd4] text-[#35682b] shadow-[3px_3px_0_rgba(56,38,23,.15)]">
            {icon}
          </span>
        </span>
        <span className="min-h-[56px] text-sm font-bold leading-7 text-[#52604e]">{text}</span>
        <span className="mt-1 inline-flex items-center gap-2 text-sm font-black text-[#35682b]">
          {action}
          <ArrowRight size={16} aria-hidden />
        </span>
      </span>
    </Link>
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

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .map(([tag]) => tag)
    .slice(0, 4);
}
