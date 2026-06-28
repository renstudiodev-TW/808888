import Link from "next/link";
import type { LockedTeaser } from "@/lib/lottery/publicize";

/** 付費鎖定的高評分 AI 牌：露出大大的評分數字 + 問號，吸引解鎖 */
export function LockedPicks({ picks, gameName }: { picks: LockedTeaser[]; gameName: string }) {
  return (
    <div className="glow-wrap glass relative overflow-hidden p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="tag border-[rgba(255,42,95,0.4)] text-[var(--hot)]">🔒 付費解鎖</span>
        <span className="tag">AI 綜合評分</span>
      </div>
      <h3 className="font-display text-lg font-bold text-[var(--text)]">
        本期 {gameName} AI 高評分精選 <span className="num text-[var(--hot)]">{picks.length}</span> 碼
      </h3>
      <p className="mt-1 mb-5 text-sm text-[var(--muted)]">
        多種抓牌技巧交叉演算後的最高分號碼。免費版只顯示分數，號碼需訂閱解鎖。
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {picks.map((p) => (
          <div
            key={p.rank}
            className="scanline relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4"
          >
            <span className="num text-[11px] text-[var(--muted)]">#{p.rank}</span>
            {/* 大問號水晶球 */}
            <span
              className="font-display text-5xl font-bold blur-[1px] select-none"
              style={{
                background: "linear-gradient(135deg, #c4b5fd, #00f0ff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              ?
            </span>
            {/* 大大的評分數字 + 脈衝 */}
            <span className="num pulse-prob text-2xl font-bold text-[var(--hot)]">{p.score.toFixed(1)}</span>
            <span className="text-[10px] text-[var(--muted)]">綜合分數</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Link href="/pricing" className="btn-primary w-full sm:w-auto">
          🔓 解鎖完整號碼
        </Link>
        <span className="text-[11px] text-[var(--muted)]">解鎖後可看號碼、評分組成、拖牌版路與每日 LINE 精選</span>
      </div>
    </div>
  );
}
