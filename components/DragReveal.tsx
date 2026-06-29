"use client";

import { useEffect, useState } from "react";

interface Drag {
  a: number;
  top: { b: number; count: number; rate: number }[];
}
interface DragData {
  period: string;
  latestNumbers: number[];
  drags: Drag[];
}

const pad = (n: number) => String(n).padStart(2, "0");

// 拖牌/版路分析：進階以上會員解鎖。顯示上一期各號最常帶出下一期哪些號。
export function DragReveal({ game }: { game: string }) {
  const [state, setState] = useState<"loading" | "locked" | "ok">("loading");
  const [data, setData] = useState<DragData | null>(null);

  useEffect(() => {
    fetch(`/api/me/drag?game=${game}`, { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) return setState("locked");
        if (r.ok) {
          setData(await r.json());
          setState("ok");
        }
      })
      .catch(() => setState("locked"));
  }, [game]);

  if (state === "loading") {
    return <section className="glass p-5 text-sm text-[var(--muted)] sm:p-6">拖牌分析載入中…</section>;
  }

  if (state === "locked") {
    return (
      <section className="glass relative overflow-hidden p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold text-[var(--text)]">拖牌 / 版路分析</h2>
          <span className="tag border-[rgba(255,42,95,0.4)] text-[var(--hot)]">🔒 進階會員</span>
        </div>
        <p className="mb-4 text-sm text-[var(--muted)]">
          上一期開出的號碼最常帶出下一期哪些號（條件機率），台灣老玩家最核心的拖牌技巧自動化。
        </p>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-6">
          <span className="text-3xl">🔒</span>
          <a href="/pricing" className="btn-primary">升級解鎖</a>
        </div>
      </section>
    );
  }

  return (
    <section className="glass p-5 sm:p-6">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-bold text-[var(--text)]">拖牌 / 版路分析</h2>
        <span className="tag border-[rgba(0,255,135,0.4)] text-[var(--cold)]">🔓 已解鎖</span>
      </div>
      <p className="mb-4 text-[13px] text-[var(--muted)]">
        上一期（第 {data?.period} 期）各號最常帶出下一期的號碼（歷史條件機率，僅供參考，非中獎機率）。
      </p>
      <div className="space-y-2.5">
        {data?.drags.map((d) => (
          <div key={d.a} className="flex items-center gap-2">
            <span className="num inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--hot)] text-sm font-bold text-white">
              {pad(d.a)}
            </span>
            <span className="text-[var(--muted)]">→</span>
            <div className="flex flex-wrap gap-1.5">
              {d.top.map((t) => (
                <span key={t.b} className="num inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs">
                  <b className="text-[var(--neon)]">{pad(t.b)}</b>
                  <span className="text-[10px] text-[var(--muted)]">{Math.round(t.rate * 100)}%</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
