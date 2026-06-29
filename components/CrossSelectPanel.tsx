"use client";

import { useEffect, useRef, useState } from "react";

type Methods = Record<string, number[]>;
const LABELS: Record<string, string> = {
  score: "AI 評分",
  hot: "冷熱號",
  omission: "遺漏回補",
  tail: "尾數",
  zone: "區間",
};
const ALL = ["score", "hot", "omission", "tail", "zone"];
const pad = (n: number) => String(n).padStart(2, "0");

// 旗艦：複數抓牌法交叉選牌。選多種抓法取交集／聯集，縮小候選號。
export function CrossSelectPanel({ game }: { game: string }) {
  const [access, setAccess] = useState<"loading" | "locked" | "ok">("loading");
  const [methods, setMethods] = useState<Methods | null>(null);
  const [n, setN] = useState(8);
  const [selected, setSelected] = useState<Set<string>>(new Set(["score", "hot", "omission"]));
  const [mode, setMode] = useState<"intersect" | "union">("intersect");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function load(nv: number) {
    setBusy(true);
    fetch(`/api/me/cross?game=${game}&n=${nv}`, { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) return setAccess("locked");
        if (r.ok) {
          setMethods((await r.json()).methods);
          setAccess("ok");
        }
      })
      .catch(() => setAccess("locked"))
      .finally(() => setBusy(false));
  }

  useEffect(() => {
    load(8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  function onN(v: number) {
    setN(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => load(v), 350);
  }
  function toggle(m: string) {
    const s = new Set(selected);
    if (s.has(m)) s.delete(m);
    else s.add(m);
    setSelected(s);
  }

  if (access === "loading") return null;

  if (access === "locked") {
    return (
      <section className="rounded-2xl border-2 border-[#ffd24a]/50 bg-[linear-gradient(160deg,rgba(255,210,74,0.08),rgba(18,24,36,0.9))] p-5 text-center sm:p-6">
        <div className="text-lg font-bold text-[#ffd24a]">👑 旗艦專屬：複數抓牌法交叉選牌</div>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
          同時用冷熱、遺漏、尾數、區間、AI 評分等多種抓法，取交集或聯集，一鍵把候選號縮小到最值得參考的幾個。
        </p>
        <a href="/pricing" className="mt-4 inline-flex rounded-full px-6 py-2.5 font-bold text-[#3a2a00]" style={{ background: "linear-gradient(90deg,#ffd24a,#f59e0b)" }}>
          升級旗艦解鎖
        </a>
      </section>
    );
  }

  const sel = ALL.filter((m) => selected.has(m));
  let result: number[] = [];
  if (methods && sel.length) {
    if (mode === "intersect") {
      result = (methods[sel[0]] ?? []).filter((num) => sel.every((m) => methods[m]?.includes(num)));
    } else {
      const s = new Set<number>();
      sel.forEach((m) => methods[m]?.forEach((num) => s.add(num)));
      result = [...s];
    }
    result.sort((a, b) => a - b);
  }

  return (
    <section className="rounded-2xl border-2 border-[#ffd24a]/50 bg-[linear-gradient(160deg,rgba(255,210,74,0.07),rgba(18,24,36,0.92))] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-bold text-[#ffd24a]">👑 複數抓牌法交叉選牌</div>
        <span className="text-xs text-[var(--muted)]">{busy ? "計算中…" : `每法取前 ${n} 名`}</span>
      </div>

      {/* 抓法選擇 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ALL.map((m) => (
          <button
            key={m}
            onClick={() => toggle(m)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              selected.has(m)
                ? "border-[#ffd24a] bg-[rgba(255,210,74,0.15)] text-[#ffd24a]"
                : "border-[var(--border)] text-[var(--muted)]"
            }`}
          >
            {LABELS[m]}
          </button>
        ))}
      </div>

      {/* 取前 N 名 + 模式 */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex flex-1 items-center gap-2 text-sm text-[var(--muted)]">
          每法取前
          <input type="range" min={3} max={15} value={n} onChange={(e) => onN(Number(e.target.value))} className="flex-1 accent-[#ffd24a]" />
          <span className="num font-bold text-[#ffd24a]">{n}</span>名
        </label>
        <div className="flex overflow-hidden rounded-full border border-[var(--border)] text-sm">
          {(["intersect", "union"] as const).map((mo) => (
            <button
              key={mo}
              onClick={() => setMode(mo)}
              className={`px-3 py-1 ${mode === mo ? "bg-[#ffd24a] font-bold text-[#3a2a00]" : "text-[var(--muted)]"}`}
            >
              {mo === "intersect" ? "交集" : "聯集"}
            </button>
          ))}
        </div>
      </div>

      {/* 結果 */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
        <div className="mb-2 text-sm text-[var(--muted)]">
          {mode === "intersect" ? "同時符合所選抓法" : "符合任一所選抓法"}的號碼（{result.length} 個）：
        </div>
        {result.length ? (
          <div className="flex flex-wrap gap-2">
            {result.map((num) => (
              <span key={num} className="num inline-flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffe79a,#ffd24a)] text-sm font-bold text-[#3a2a00]">
                {pad(num)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">沒有共同號碼，試著少選幾種抓法、放寬取前 N 名，或改用「聯集」。</p>
        )}
      </div>
      <p className="mt-3 text-[11px] text-[var(--muted)]">
        ※ 交集＝同時被多種抓法看好（更集中）；聯集＝任一抓法看好（更廣）。僅供參考，非中獎機率。
      </p>
    </section>
  );
}
