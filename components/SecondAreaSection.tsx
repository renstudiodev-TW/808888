import type { SecondAreaItem } from "@/lib/lottery/indicators";

// 威力彩第二區 (1-8) 冷熱與遺漏。
export function SecondAreaSection({ data }: { data: SecondAreaItem[] }) {
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {data.map((s) => (
          <div key={s.n} className="flex flex-col items-center gap-1">
            <span
              className={`ball text-base ${s.tag === "hot" ? "ball-hot" : s.tag === "cold" ? "ball-cold" : ""}`}
            >
              {s.n}
            </span>
            <span className="num text-[11px] text-[var(--muted)]">{s.freq} 次</span>
            <span className="num text-[10px] text-[var(--muted)]">遺漏 {s.currentMiss}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted)]">
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--hot)]" />熱</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--cold)]" />冷</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)]" />普通</span>
        <span>第二區每期只開 1 號（1-8），這裡看近期各號的出現次數與遺漏。</span>
      </div>
    </div>
  );
}
