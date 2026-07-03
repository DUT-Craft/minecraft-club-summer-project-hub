import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PublicFooter } from "@/components/public-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicSnapshot } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
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
              <h1 className="text-[clamp(1.75rem,3vw,2.45rem)] font-black leading-tight text-[#173318]">想法墙</h1>
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
                  <h2 className="text-xl font-black">{idea.title}</h2>
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
      <PublicFooter />
    </>
  );
}

function EmptyPublicState({ label }: { label: string }) {
  return (
    <div className="pixel-panel flex min-h-36 items-center justify-center rounded-[8px] p-5 text-center font-bold text-[#5d6b55]">
      {label}
    </div>
  );
}
