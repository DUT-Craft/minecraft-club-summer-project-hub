import { SubmissionForms } from "@/components/submission-forms";
import { SiteHeader } from "@/components/site-header";
import Image from "next/image";

export default function SubmitPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-band min-h-screen pb-10">
        <section className="content-shell grid gap-5 pb-2 pt-8 md:grid-cols-[1fr_170px] md:items-end">
          <div className="block-frame rounded-[12px] p-5">
            <div className="voxel-chip mb-4 w-fit px-2.5 py-1.5 text-sm">公开前会审核</div>
            <h1 className="text-[clamp(2.2rem,5vw,4.4rem)] font-black leading-[0.98] text-[#173318]">投稿入口</h1>
            <p className="mt-3 max-w-2xl font-bold leading-7 text-[#5d6b55]">
              项目和想法提交后会进入后台，管理员审核通过后再公开展示。
            </p>
          </div>
          <Image
            alt="方块风格的小装饰"
            className="hidden rounded-[8px] opacity-90 md:block"
            src="/assets/minecraft-ui-decor.png"
            width={160}
            height={160}
          />
        </section>
        <SubmissionForms />
      </main>
    </>
  );
}
