import { Users } from "lucide-react";

export function PublicFooter() {
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
