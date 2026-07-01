// 反向驗證：已知這期開獎，回推「哪個抓法 × 哪組參數」命中最多。
// 誠實框架：事後諸葛（已知開獎才回推），非預測、非保證中獎。用來透明呈現工具擬合力。

const pad = (n: number) => String(n).padStart(2, "0");

interface AttributionEntry {
  method: string;
  label: string;
  window: number;
  hits: number;
  picks: number[];
}
interface ReverseAttribution {
  period: string;
  date: string;
  actual: number[];
  special: number | null;
  pick: number;
  windows: number[];
  best: AttributionEntry;
  entries: AttributionEntry[];
  aiHits: number;
  randomHits: number;
}

function winLabel(w: number) {
  return w > 0 ? `近 ${w} 期` : "全期遺漏";
}

export function AttributionCard({ data }: { data: ReverseAttribution | null }) {
  if (!data) return null;
  const actual = new Set(data.actual);
  const bestMatched = new Set(data.best.picks.filter((n) => actual.has(n)));
  const maxHits = Math.max(1, data.pick, ...data.entries.map((e) => e.hits));

  return (
    <section className="mb-6 rounded-2xl border-2 border-[var(--primary)]/40 bg-[linear-gradient(160deg,rgba(139,92,246,0.08),rgba(18,24,36,0.92))] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-bold text-[var(--primary)]">🔍 開獎後回推 · 這期哪個抓法最準</div>
        <span className="tag">事後驗證 · 第 {data.period} 期</span>
      </div>
      <p className="mt-1 text-[13px] text-[var(--muted)]">
        已知這期開獎後，用「開獎前的資料」把每個抓法跨不同參數視窗都跑一遍，數哪個命中最多。
      </p>

      {/* 這期開獎 */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[13px] text-[var(--muted)]">本期開獎：</span>
        {data.actual.map((n) => (
          <span key={n} className="num inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-bold text-[var(--neon)] ring-1 ring-[rgba(0,240,255,0.3)]">
            {pad(n)}
          </span>
        ))}
        {data.special != null && (
          <>
            <span className="px-0.5 text-[var(--muted)]">＋</span>
            <span className="num inline-flex h-8 w-8 items-center justify-center rounded-full ball-special text-sm font-bold">{pad(data.special)}</span>
          </>
        )}
      </div>

      {/* 本期最強 */}
      <div className="mt-4 rounded-xl border border-[#ffd24a]/50 bg-[rgba(255,210,74,0.08)] p-4">
        <div className="text-sm text-[var(--muted)]">本期最強組合</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-xl font-extrabold text-[#ffd24a]">{data.best.label}</span>
          <span className="tag">{winLabel(data.best.window)}</span>
          <span className="num text-lg font-bold text-[var(--text)]">命中 {data.best.hits}/{data.pick}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {data.best.picks.map((n) => {
            const hit = bestMatched.has(n);
            return (
              <span
                key={n}
                className={`num inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${
                  hit ? "ball-hit" : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
                }`}
              >
                {pad(n)}
              </span>
            );
          })}
        </div>
      </div>

      {/* 各抓法排名 */}
      <div className="mt-4 space-y-2">
        {data.entries.map((e) => (
          <div key={e.method} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[13px] text-[var(--text)]">{e.label}</span>
            <span className="w-16 shrink-0 text-[11px] text-[var(--muted)]">{winLabel(e.window)}</span>
            <div className="h-3.5 flex-1 overflow-hidden rounded bg-[var(--surface-2)]">
              <div
                className="h-full rounded bg-[linear-gradient(90deg,var(--primary),#ffd24a)]"
                style={{ width: `${(e.hits / maxHits) * 100}%` }}
              />
            </div>
            <span className="num w-12 shrink-0 text-right text-[13px] font-bold text-[var(--text)]">{e.hits}/{data.pick}</span>
          </div>
        ))}
      </div>

      {/* 基準 */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[var(--muted)]">
        <span>當期 AI 精選（近 50 期）：<b className="text-[var(--text)]">{data.aiHits}/{data.pick}</b></span>
        <span>隨機對照平均：<b className="text-[var(--text)]">{data.randomHits}/{data.pick}</b></span>
      </div>

      <p className="mt-4 rounded-lg border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.06)] p-3 text-[12px] leading-relaxed text-[var(--muted)]">
        這是<b className="text-[var(--text)]">已知開獎後才回推</b>哪個工具最準的「事後驗證」，<b className="text-[var(--text)]">不是預測、不代表下期</b>。
        每期最強的抓法與參數都會變，樂透為獨立隨機事件，無法提高中獎率、不保證中獎，僅供參考娛樂。
      </p>
    </section>
  );
}
