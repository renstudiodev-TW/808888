"use client";

// 各工具的「對你選的牌講白話」判語。全部讀 useSelection()，資料由 server 頁面以 props 帶入。
// 只是把玩家手算統計自動化，不提高中獎率、不保證中獎。

import { useSelection } from "./SelectionContext";
import { acValue, tailOf, zodiacOf, ZODIAC_EMOJI } from "@/lib/lottery/util";

const pad = (n: number) => String(n).padStart(2, "0");

interface HC { n: number; tag: "hot" | "cold" | "normal" }
interface OM { n: number; currentMiss: number }
interface OE { ratio: string; count: number }
interface SH { bucket: string; count: number }
interface AC { ac: number; count: number }
interface ZN { label: string; freq: number }
interface SA { n: number; freq: number; currentMiss: number; tag: "hot" | "cold" | "normal" }

/** 判語外框：依狀態顯示提示或解析。 */
function Box({
  children,
  state,
  need,
}: {
  children?: React.ReactNode;
  state: "empty" | "partial" | "ready";
  need?: number;
}) {
  return (
    <div className="mt-3 rounded-lg border border-[var(--neon)]/25 bg-[rgba(0,255,135,0.05)] px-3 py-2 text-[13px] leading-relaxed text-[var(--muted)]">
      <span className="mr-1 font-bold text-[var(--neon)]">🎯 你的牌</span>
      {state === "empty" && <span className="opacity-70">：選號後這裡會即時解析。</span>}
      {state === "partial" && <span className="opacity-80">：再選 {need} 顆湊滿即可解析這項。</span>}
      {state === "ready" && <>：{children}</>}
    </div>
  );
}

/** 冷熱（號碼盤 + 長條圖共用） */
export function HotColdVerdict({ data }: { data: HC[] }) {
  const sel = useSelection();
  if (!sel) return null;
  const { picks } = sel;
  if (picks.length === 0) return <Box state="empty" />;
  const tagOf = new Map(data.map((d) => [d.n, d.tag]));
  const hot = picks.filter((n) => tagOf.get(n) === "hot");
  const cold = picks.filter((n) => tagOf.get(n) === "cold");
  const normal = picks.filter((n) => (tagOf.get(n) ?? "normal") === "normal");
  return (
    <Box state="ready">
      <b className="text-[var(--hot)]">{hot.length} 顆熱號</b>
      （{hot.map(pad).join("、") || "無"}）、
      <b className="text-[var(--cold)]">{cold.length} 顆冷號</b>
      （{cold.map(pad).join("、") || "無"}）、{normal.length} 顆普通。
      {hot.length > cold.length ? " 整體偏追熱打法。" : hot.length < cold.length ? " 整體偏買冷回補。" : " 冷熱各半。"}
    </Box>
  );
}

/** 遺漏值 */
export function OmissionVerdict({ data }: { data: OM[] }) {
  const sel = useSelection();
  if (!sel) return null;
  const { picks } = sel;
  if (picks.length === 0) return <Box state="empty" />;
  const rankOf = new Map(
    [...data].sort((a, b) => b.currentMiss - a.currentMiss).map((o, i) => [o.n, i + 1]),
  );
  const missOf = new Map(data.map((o) => [o.n, o.currentMiss]));
  const hits = picks
    .map((n) => ({ n, miss: missOf.get(n) ?? 0, rank: rankOf.get(n) ?? 999 }))
    .filter((x) => x.rank <= 15)
    .sort((a, b) => a.rank - b.rank);
  if (hits.length === 0)
    return (
      <Box state="ready">
        你選的號碼都<b className="text-[var(--text)]">不在遺漏前 15 名</b>，沒有特別「久未開、該回補」的標的。
      </Box>
    );
  return (
    <Box state="ready">
      {hits.map((x) => (
        <span key={x.n}>
          <b className="text-[var(--text)]">{pad(x.n)} 號</b>已 <b className="text-[var(--neon)]">{x.miss}</b> 期沒開（遺漏第 {x.rank} 名）。{" "}
        </span>
      ))}
      玩家常把這類號當「回補」訊號。
    </Box>
  );
}

/** 尾數 */
export function TailVerdict() {
  const sel = useSelection();
  if (!sel) return null;
  const { picks } = sel;
  if (picks.length === 0) return <Box state="empty" />;
  const groups = new Map<number, number[]>();
  for (const n of picks) {
    const t = tailOf(n);
    groups.set(t, [...(groups.get(t) ?? []), n]);
  }
  const sorted = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  const dup = sorted.filter(([, arr]) => arr.length > 1);
  return (
    <Box state="ready">
      尾數 {sorted.map(([t, arr]) => `${t}尾(${arr.map(pad).join("、")})`).join("、")}。
      {dup.length > 0 ? (
        <>
          {" "}其中 <b className="text-[var(--text)]">{dup.map(([t]) => `${t}尾`).join("、")}</b> 有撞尾（同尾多顆），玩家眼中較「擠」。
        </>
      ) : (
        <> 各尾數分散、沒有撞尾。</>
      )}
    </Box>
  );
}

/** 區間 */
export function ZoneVerdict({ zone }: { zone: ZN[] }) {
  const sel = useSelection();
  if (!sel) return null;
  const { picks } = sel;
  if (picks.length === 0) return <Box state="empty" />;
  // 由 label（如 "1-10"）解析每區範圍，把選號分桶
  const ranges = zone.map((z) => {
    const m = z.label.match(/(\d+)\D+(\d+)/);
    return { label: z.label, lo: m ? Number(m[1]) : 0, hi: m ? Number(m[2]) : 0 };
  });
  const counts = ranges.map((r) => ({
    label: r.label,
    c: picks.filter((n) => n >= r.lo && n <= r.hi).length,
  }));
  const used = counts.filter((c) => c.c > 0);
  const top = [...counts].sort((a, b) => b.c - a.c)[0];
  const concentrated = top && top.c >= Math.ceil(picks.length / 2);
  return (
    <Box state="ready">
      分佈在 {used.map((c) => `${c.label}(${c.c})`).join("、")}。
      {concentrated ? (
        <>
          {" "}有 <b className="text-[var(--text)]">{top.c} 顆擠在 {top.label}</b>，偏集中。
        </>
      ) : (
        <> 各區段分散得還算平均。</>
      )}
    </Box>
  );
}

/** 和值 */
export function SumVerdict({ expectedSum, sumHistogram }: { expectedSum: number; sumHistogram: SH[] }) {
  const sel = useSelection();
  if (!sel) return null;
  const { picks, pick, full } = sel;
  if (picks.length === 0) return <Box state="empty" />;
  if (!full) return <Box state="partial" need={pick - picks.length} />;
  const s = picks.reduce((a, b) => a + b, 0);
  const total = sumHistogram.reduce((a, b) => a + b.count, 0) || 1;
  const maxCount = Math.max(1, ...sumHistogram.map((b) => b.count));
  let inBucket: SH | null = null;
  let cumBelow = 0;
  for (const b of sumHistogram) {
    const m = b.bucket.match(/(-?\d+)\D+(-?\d+)/);
    const lo = m ? Number(m[1]) : 0;
    const hi = m ? Number(m[2]) : 0;
    if (s >= lo && s <= hi) inBucket = b;
    if (hi < s) cumBelow += b.count;
  }
  const pct = Math.round((cumBelow / total) * 100);
  const central = inBucket ? inBucket.count >= maxCount * 0.55 : false;
  return (
    <Box state="ready">
      總和 <b className="text-[var(--neon)]">{s}</b>（理論平均約 {expectedSum}）
      {inBucket ? <>，落在 {inBucket.bucket} 區間，贏過約 <b className="text-[var(--text)]">{pct}%</b> 的歷史期數。</> : "。"}
      {central ? " 屬最常見的中央帶。" : " 偏向兩端、較少見。"}
    </Box>
  );
}

/** 奇偶 */
export function OddEvenVerdict({ oddEven }: { oddEven: OE[] }) {
  const sel = useSelection();
  if (!sel) return null;
  const { picks, pick, full } = sel;
  if (picks.length === 0) return <Box state="empty" />;
  if (!full) return <Box state="partial" need={pick - picks.length} />;
  const odd = picks.filter((n) => n % 2 === 1).length;
  const even = picks.length - odd;
  const key = `${odd}:${even}`;
  const total = oddEven.reduce((a, b) => a + b.count, 0) || 1;
  const hit = oddEven.find((o) => o.ratio === key);
  const rank = [...oddEven].sort((a, b) => b.count - a.count).findIndex((o) => o.ratio === key) + 1;
  return (
    <Box state="ready">
      奇偶比 <b className="text-[var(--neon)]">{key}</b>（{odd} 單 {even} 雙），
      歷史出現 <b className="text-[var(--text)]">{hit?.count ?? 0}</b> 期
      （約 {Math.round(((hit?.count ?? 0) / total) * 100)}%）
      {rank > 0 ? <>，常見度排第 {rank} 名。</> : "。"}
      {rank > 0 && rank <= 3 ? " 屬主流型態。" : " 屬較少見的組合。"}
    </Box>
  );
}

/** AC 離散值 */
export function ACVerdict({ acHistogram }: { acHistogram: AC[] }) {
  const sel = useSelection();
  if (!sel) return null;
  const { picks, pick, full } = sel;
  if (picks.length === 0) return <Box state="empty" />;
  if (!full) return <Box state="partial" need={pick - picks.length} />;
  const ac = acValue(picks);
  const total = acHistogram.reduce((a, b) => a + b.count, 0) || 1;
  const avg = acHistogram.reduce((a, b) => a + b.ac * b.count, 0) / total;
  const hit = acHistogram.find((a) => a.ac === ac);
  return (
    <Box state="ready">
      AC 值 <b className="text-[var(--neon)]">{ac}</b>（歷史平均約 {avg.toFixed(1)}），
      歷史出現 <b className="text-[var(--text)]">{hit?.count ?? 0}</b> 期。
      {ac > avg + 0.5 ? " 比平均更分散。" : ac < avg - 0.5 ? " 比平均更像等差、較集中。" : " 離散度接近平均。"}
    </Box>
  );
}

/** 連號 */
export function ConsecutiveVerdict() {
  const sel = useSelection();
  if (!sel) return null;
  const { picks } = sel;
  if (picks.length < 2) return <Box state="empty" />;
  const s = [...picks].sort((a, b) => a - b);
  const pairs: string[] = [];
  for (let i = 1; i < s.length; i++) if (s[i] - s[i - 1] === 1) pairs.push(`${pad(s[i - 1])}-${pad(s[i])}`);
  return (
    <Box state="ready">
      {pairs.length > 0 ? (
        <>
          含 <b className="text-[var(--neon)]">{pairs.length}</b> 組連號（{pairs.join("、")}）。連號其實沒你想的罕見。
        </>
      ) : (
        <>沒有連號，號碼彼此都不相鄰。</>
      )}
    </Box>
  );
}

/** 生肖 */
export function ZodiacVerdict({ pool, year }: { pool: number; year: number }) {
  const sel = useSelection();
  if (!sel) return null;
  const { picks } = sel;
  if (picks.length === 0) return <Box state="empty" />;
  const groups = new Map<string, number[]>();
  for (const n of picks) {
    const z = zodiacOf(n, pool, year);
    groups.set(z, [...(groups.get(z) ?? []), n]);
  }
  const list = [...groups.entries()];
  const dup = list.filter(([, arr]) => arr.length > 1);
  return (
    <Box state="ready">
      涵蓋 <b className="text-[var(--text)]">{list.length}</b> 種生肖：
      {list.map(([z, arr]) => `${ZODIAC_EMOJI[z] ?? ""}${z}(${arr.map(pad).join("、")})`).join("、")}。
      {dup.length > 0 ? <> 其中 {dup.map(([z]) => `${z}`).join("、")} 重複押了同生肖。</> : <> 生肖分散。</>}
    </Box>
  );
}

/** 威力彩第二區 */
export function SecondAreaVerdict({ data }: { data: SA[] }) {
  const sel = useSelection();
  if (!sel) return null;
  const { special } = sel;
  if (special == null)
    return (
      <div className="mt-3 rounded-lg border border-[var(--primary)]/25 bg-[rgba(139,92,246,0.06)] px-3 py-2 text-[13px] text-[var(--muted)]">
        <span className="mr-1 font-bold text-[var(--primary)]">🎯 第二區</span>：在上方選號框挑 1 個第二區號碼，這裡會告訴你它的冷熱與遺漏。
      </div>
    );
  const it = data.find((d) => d.n === special);
  return (
    <div className="mt-3 rounded-lg border border-[var(--primary)]/25 bg-[rgba(139,92,246,0.06)] px-3 py-2 text-[13px] leading-relaxed text-[var(--muted)]">
      <span className="mr-1 font-bold text-[var(--primary)]">🎯 第二區</span>：你押 <b className="text-[var(--text)]">{pad(special)}</b>，
      {it ? (
        <>
          近期出現 <b className="text-[var(--text)]">{it.freq}</b> 次、目前遺漏 <b className="text-[var(--text)]">{it.currentMiss}</b> 期，
          屬{it.tag === "hot" ? "熱號" : it.tag === "cold" ? "冷號" : "普通"}。
        </>
      ) : (
        <>查無資料。</>
      )}
    </div>
  );
}
