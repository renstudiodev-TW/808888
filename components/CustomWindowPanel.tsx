"use client";

import { useEffect, useRef, useState } from "react";

interface HC { n: number; freq: number; z: number; tag: string }
interface Analysis {
  window: number;
  totalDraws: number;
  hotCold: HC[];
  score: { n: number; score: number }[];
  secondArea: { n: number; freq: number; currentMiss: number; tag: string }[] | null;
}

const pad = (n: number) => String(n).padStart(2, "0");

// 旗艦專屬：自訂分析母數（視窗期數）即時重算。非旗艦顯示升級邀請。
export function CustomWindowPanel({ game }: { game: string }) {
  const [access, setAccess] = useState<"loading" | "locked" | "ok">("loading");
  const [win, setWin] = useState(50);
  const [data, setData] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function load(w: number) {
    setBusy(true);
    fetch(`/api/me/analyze?game=${game}&window=${w}`, { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) return setAccess("locked");
        if (r.ok) {
          setData(await r.json());
          setAccess("ok");
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  }

  useEffect(() => {
    load(50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  function onSlide(w: number) {
    setWin(w);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => load(w), 350);
  }

  if (access === "loading") return null;

  if (access === "locked") {
    return (
      <section className="mb-6 rounded-2xl border-2 border-[#ffd24a]/50 bg-[linear-gradient(160deg,rgba(255,210,74,0.08),rgba(18,24,36,0.9))] p-5 text-center">
        <div className="text-lg font-bold text-[#ffd24a]">👑 旗艦專屬：自訂分析母數</div>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
          免費／進階固定看近 50 期；旗艦會員可自由拉動視窗，從近 10 期到全期，依你的打法即時重算冷熱與 AI 評分。
        </p>
        <a href="/pricing" className="mt-4 inline-flex rounded-full px-6 py-2.5 font-bold text-[#3a2a00]" style={{ background: "linear-gradient(90deg,#ffd24a,#f59e0b)" }}>
          升級旗艦解鎖
        </a>
      </section>
    );
  }

  const hot = data ? [...data.hotCold].sort((a, b) => b.z - a.z).slice(0, 6) : [];
  const cold = data ? [...data.hotCold].sort((a, b) => a.z - b.z).slice(0, 6) : [];

  return (
    <section className="mb-6 rounded-2xl border-2 border-[#ffd24a]/50 bg-[linear-gradient(160deg,rgba(255,210,74,0.07),rgba(18,24,36,0.92))] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-bold text-[#ffd24a]">👑 旗艦自訂分析母數</div>
        <span className="text-xs text-[var(--muted)]">共 {data?.totalDraws} 期可分析</span>
      </div>

      {/* 滑桿 */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">分析最近</span>
          <span className="num text-xl font-bold text-[#ffd24a]">{win}</span>
          <span className="text-[var(--muted)]">期 {busy && <span className="text-[11px]">· 計算中</span>}</span>
        </div>
        <input
          type="range"
          min={10}
          max={Math.min(300, data?.totalDraws ?? 300)}
          value={win}
          onChange={(e) => onSlide(Number(e.target.value))}
          className="w-full accent-[#ffd24a]"
        />
        <div className="flex justify-between text-[10px] text-[var(--muted)]">
          <span>10</span><span>近期敏感</span><span>長期穩定</span><span>{Math.min(300, data?.totalDraws ?? 300)}</span>
        </div>
      </div>

      {data && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* AI 評分精選（每號附評分，本站精華） */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
            <div className="mb-3 text-sm font-bold text-[var(--text)]">本視窗 AI 評分精選</div>
            <div className="flex flex-wrap gap-3">
              {data.score.slice(0, 8).map((s) => (
                <div key={s.n} className="flex flex-col items-center gap-1">
                  <span className="num inline-flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#6bffc0,var(--cold))] text-base font-bold text-[#04221a]">
                    {pad(s.n)}
                  </span>
                  <span className="num text-xs font-bold text-[var(--cold)]">{s.score.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 熱 / 冷 */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
            <div className="mb-2 flex gap-4 text-sm">
              <span className="font-bold text-[var(--hot)]">最熱</span>
              <span className="flex flex-wrap gap-1.5">
                {hot.map((h) => <span key={h.n} className="num inline-flex h-8 w-8 items-center justify-center rounded-full ball-hot text-xs">{pad(h.n)}</span>)}
              </span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="font-bold text-[var(--cold)]">最冷</span>
              <span className="flex flex-wrap gap-1.5">
                {cold.map((h) => <span key={h.n} className="num inline-flex h-8 w-8 items-center justify-center rounded-full ball-cold text-xs">{pad(h.n)}</span>)}
              </span>
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 rounded-lg border border-[rgba(255,210,74,0.35)] bg-[rgba(255,210,74,0.07)] p-3 text-sm leading-relaxed text-[var(--text)]">
        視窗越短越反映近期趨勢、越長越穩定。
        <strong className="text-[#ffd24a]">分數為相對綜合評分，不是中獎機率。</strong>
      </p>
    </section>
  );
}
