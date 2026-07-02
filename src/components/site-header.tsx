import Link from "next/link";
import { Blocks, ClipboardList, Home, ShieldCheck } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-[#382617]/20 bg-[#fffdf4]/86 backdrop-blur-md">
      <div className="wide-shell flex flex-wrap items-center justify-between gap-3 py-3">
        <Link className="flex items-center gap-2.5 font-black tracking-[0]" href="/">
          <span className="relative grid h-[38px] w-[38px] place-items-center rounded-[7px] border-2 border-[#382617] bg-[linear-gradient(180deg,#75c64a_0_42%,#8d5a32_42%_100%)] text-[#173318] shadow-[4px_4px_0_rgba(56,38,23,.24)]">
            <Blocks size={20} aria-hidden />
          </span>
          <span className="text-lg text-[#173318]">猫娘社</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1.5 rounded-[10px] border-2 border-[#38261738] bg-[#fffdf4d8] p-1.5 text-sm font-black shadow-[0_5px_0_rgba(56,38,23,.10)]">
          <Link className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border-2 border-transparent px-3 transition hover:-translate-y-0.5 hover:border-[#38261759] hover:bg-[#fff7ce]" href="/">
            <Home size={16} aria-hidden />
            首页
          </Link>
          <Link className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border-2 border-transparent px-3 transition hover:-translate-y-0.5 hover:border-[#38261759] hover:bg-[#fff7ce]" href="/submit">
            <ClipboardList size={16} aria-hidden />
            投稿
          </Link>
          <Link className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border-2 border-transparent px-3 transition hover:-translate-y-0.5 hover:border-[#38261759] hover:bg-[#fff7ce]" href="/admin">
            <ShieldCheck size={16} aria-hidden />
            后台
          </Link>
        </nav>
      </div>
    </header>
  );
}
