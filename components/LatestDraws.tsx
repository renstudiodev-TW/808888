"use client";

import { useEffect, useState } from "react";

interface Draw {
  game: string;
  name: string;
  period: string;
  date: string;
  numbers: number[];
  special?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

// 首頁「最新開獎」：即時抓台彩官方各遊戲最新一期號碼。
export function LatestDraws() {
  const [draws, setDraws] = useState<Draw[] | null>(null);

  useEffect(() => {
    fetch("/api/draws")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDraws(d?.draws ?? []))
      .catch(() => setDraws([]));
  }, []);

  if (draws === null) {
    return <div className="glass p-5 text-center text-sm text-[var(--muted)]">最新開獎載入中…</div>;
  }
  if (!draws.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {draws.map((d) => (
        <div key={d.game} className="glass p-5">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-bold text-[var(--text)]">{d.name}</span>
            <span className="num text-xs text-[var(--muted)]">{d.date}</span>
          </div>
          <div className="num mt-0.5 text-[11px] text-[var(--muted)]">第 {d.period} 期</div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {d.numbers.map((n) => (
              <span
                key={n}
                className="num inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-bold text-[var(--neon)] ring-1 ring-[rgba(0,240,255,0.3)]"
              >
                {pad(n)}
              </span>
            ))}
            {d.special != null && (
              <>
                <span className="px-0.5 text-[var(--muted)]">+</span>
                <span className="ball-special num inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold">
                  {pad(d.special)}
                </span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
