import type { MethodResult } from "@/lib/lottery/backtest";

// 抓法命中率成績榜：各抓法歷史回測的平均命中數排名（含隨機對照）。
export function MethodLeaderboard({
  data,
}: {
  data: { evaluated: number; pick: number; results: MethodResult[] };
}) {
  const max = Math.max(0.01, ...data.results.map((r) => r.avgHits));
  return (
    <div>
      <div className="space-y-2.5">
        {data.results.map((r, i) => {
          const isRandom = r.method === "random";
          const isTop = i === 0 && !isRandom;
          return (
            <div key={r.method} className="flex items-center gap-2 sm:gap-3">
              <span className={`num w-5 shrink-0 text-center text-sm font-bold ${isTop ? "text-[#ffd24a]" : "text-[var(--muted)]"}`}>
                {i + 1}
              </span>
              <span className={`w-24 shrink-0 truncate text-[13px] sm:w-32 sm:text-sm ${isRandom ? "text-[var(--muted)]" : "text-[var(--text)]"}`}>
                {isTop && "🏆 "}
                {r.label}
              </span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-[var(--surface-2)]">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${(r.avgHits / max) * 100}%`,
                    background: isRandom
                      ? "rgba(156,163,175,0.5)"
                      : isTop
                      ? "linear-gradient(90deg,#ffd24a,#f59e0b)"
                      : "linear-gradient(90deg,var(--neon),var(--primary))",
                  }}
                />
              </div>
              <span className="num w-20 shrink-0 text-right text-[11px] text-[var(--muted)] sm:text-xs">
                {r.avgHits.toFixed(2)}/{data.pick}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
        近 {data.evaluated} 期回測：每期只用「該期之前」的資料選 {data.pick} 個號，再比對實際開出，算平均命中數。
        含「隨機亂選」對照組讓你判斷各抓法是否真的優於亂猜。
        <strong className="text-[var(--text)]">歷史表現不代表未來</strong>，樂透為獨立隨機事件，僅供參考娛樂。
      </p>
    </div>
  );
}
