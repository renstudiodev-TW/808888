"use client";

// 玩法頁：把「自選號碼」即時比對「最新一期開獎」，命中就慶祝。
// 讓使用者一邊調參數/選號，一邊看哪一組最接近上一期，找出最強參數組合。

import { useMemo } from "react";
import { useSelection } from "./SelectionContext";
import { Confetti } from "../Confetti";

const pad = (n: number) => String(n).padStart(2, "0");

interface Latest {
  period: string;
  date: string;
  numbers: number[];
  special: number | null;
}

export function LastDrawMatch({ latest }: { latest: Latest }) {
  const sel = useSelection();

  const info = useMemo(() => {
    if (!sel) return null;
    const actual = new Set(latest.numbers);
    const matchedMain = sel.picks.filter((n) => actual.has(n));
    const matchedSpecial = sel.secondPool != null && sel.special != null && sel.special === latest.special;
    const half = Math.ceil(sel.pick / 2);
    const big = matchedMain.length >= half && matchedMain.length >= 2;
    return { matchedMain, matchedSpecial, half, big, count: matchedMain.length };
  }, [sel, latest]);

  if (!sel || !info) return null;
  const matchedSet = new Set(info.matchedMain);
  const hasPicks = sel.picks.length > 0;
  // 大獎才灑彩帶；fireKey 綁命中組合，換一組會重播
  const fireKey = info.big ? info.matchedMain.reduce((a, b) => a + b, info.matchedMain.length * 100) : 0;

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-5 sm:p-6">
      <Confetti fireKey={fireKey} />
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-bold text-[var(--text)]">
          🏆 對中上一期開獎
        </div>
        <span className="num text-xs text-[var(--muted)]">第 {latest.period} 期 · {latest.date}</span>
      </div>

      {/* 上一期開獎號碼（命中你的牌者金球慶祝） */}
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        {latest.numbers.map((n) => {
          const hit = matchedSet.has(n);
          return (
            <span
              key={n}
              className={`num inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                hit ? "ball-hit" : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]"
              }`}
              title={hit ? "你這組有選中這號！" : undefined}
            >
              {pad(n)}
            </span>
          );
        })}
        {latest.special != null && (
          <>
            <span className="px-0.5 text-[var(--muted)]">＋</span>
            <span
              className={`num inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                info.matchedSpecial ? "ball-hit" : "ball-special"
              }`}
              title={info.matchedSpecial ? "第二區也中！" : undefined}
            >
              {pad(latest.special)}
            </span>
          </>
        )}
      </div>

      {/* 結果判語 */}
      <div className="relative mt-4">
        {!hasPicks ? (
          <p className="text-[13px] text-[var(--muted)]">
            在上面「我的自選號碼」選一組，這裡會即時比對上一期開獎，幫你驗證哪組參數最接近。
          </p>
        ) : info.big ? (
          <div className="celebrate-banner inline-flex items-center gap-2 rounded-xl border border-[#ffd24a]/60 bg-[rgba(255,210,74,0.12)] px-4 py-2.5">
            <span className="throb-gold text-xl font-extrabold text-[#ffd24a]">
              🎉 神抓 {info.count} 碼{info.matchedSpecial ? " ＋第二區" : ""}！
            </span>
          </div>
        ) : info.count > 0 ? (
          <div className="celebrate-banner inline-flex items-center gap-2 rounded-xl border border-[#ffd24a]/45 bg-[rgba(255,210,74,0.08)] px-4 py-2">
            <span className="text-base font-bold text-[#ffd24a]">
              ✨ 對中 {info.count} 碼{info.matchedSpecial ? " ＋第二區也中" : ""}
            </span>
          </div>
        ) : info.matchedSpecial ? (
          <div className="celebrate-banner inline-flex items-center gap-2 rounded-xl border border-[var(--primary)]/50 bg-[rgba(139,92,246,0.1)] px-4 py-2">
            <span className="text-base font-bold text-[var(--primary)]">✨ 第二區中了！</span>
          </div>
        ) : (
          <p className="text-[13px] text-[var(--muted)]">
            這組沒對中上一期（{sel.picks.length}/{sel.pick} 碼全落空）。微調選號或上面的參數再比對看看。
          </p>
        )}
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          比對對象是最新一期實際開獎。<b className="text-[var(--text)]">歷史命中不代表未來</b>，樂透為獨立隨機事件，僅供參考娛樂。
        </p>
      </div>
    </section>
  );
}
