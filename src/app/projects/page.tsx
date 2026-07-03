import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProjectBrowser } from "@/components/project-browser";
import { PublicFooter } from "@/components/public-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSnapshot } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const snapshot = await getPublicSnapshot();

  return (
    <>
      <SiteHeader />
      <main className="page-band min-h-[calc(100svh-76px)]">
        <section className="wide-shell py-8">
          {snapshot.setupError ? (
            <div className="mb-6 rounded-[8px] border-2 border-[#c9473a] bg-[#ffe0dd] p-4 font-bold text-[#9a3028] shadow-[4px_4px_0_rgba(56,38,23,.14)]">
              {snapshot.setupError}
            </div>
          ) : null}

          <div className="section-heading">
            <div>
              <h1 className="text-[clamp(1.75rem,3vw,2.45rem)] font-black leading-tight text-[#173318]">全部公开项目</h1>
              <p>已通过审核的暑假项目，可以继续搜索筛选</p>
            </div>
            <Link className="icon-button bg-[#fff7d0] text-[#20301f]" href="/submit">
              提交项目
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          <ProjectBrowser projects={snapshot.projects} />
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
