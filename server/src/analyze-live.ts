// 旗艦會員自訂母數即時重算：用打包進 Worker 的完整歷史，依指定視窗重算冷熱/尾數/區間/評分。
import historyData from "./data/history.json";
import { GAMES } from "../../lib/lottery/games.js";
import { hotCold, omission, tailDistribution, zoneStats, secondAreaStats, dragFor } from "../../lib/lottery/indicators.js";
import { comboScore } from "../../lib/lottery/score.js";
import { tailOf, zoneOf } from "../../lib/lottery/util.js";
import type { Draw, GameId } from "../../lib/lottery/types.js";

const HIST = historyData as Record<string, Draw[]>;

export interface LiveAnalysis {
  game: string;
  name: string;
  window: number;
  totalDraws: number;
  latestPeriod: string | null;
  hotCold: { n: number; freq: number; z: number; tag: string }[];
  tail: { tail: number; rate: number; tag: string }[];
  zone: { label: string; rate: number }[];
  score: { n: number; score: number }[];
  secondArea: { n: number; freq: number; currentMiss: number; tag: string }[] | null;
}

// 拖牌/版路：上一期開出的號碼，最常帶出下一期哪些號（條件機率）。
export function liveDrag(game: string) {
  const g = GAMES[game as GameId];
  const history = HIST[game];
  if (!g || !history || history.length === 0) return null;
  const latest = history[history.length - 1];
  return {
    game,
    name: g.name,
    period: latest.period,
    date: latest.date,
    latestNumbers: latest.numbers,
    drags: latest.numbers.map((a) => dragFor(history, g, a, 5)),
  };
}

// 複數抓牌法交叉選牌：回傳每種抓法的前 N 名號碼，前端做交集／聯集。
export function liveMethodPicks(game: string, window: number, n: number) {
  const g = GAMES[game as GameId];
  const history = HIST[game];
  if (!g || !history || history.length === 0) return null;
  const w = Math.max(10, Math.min(Math.floor(window) || 50, history.length));
  const N = Math.max(3, Math.min(Math.floor(n) || 8, g.pool));

  const rankByMap = (val: (n: number) => number) => {
    const arr: { n: number; s: number }[] = [];
    for (let i = 1; i <= g.pool; i++) arr.push({ n: i, s: val(i) });
    arr.sort((a, b) => b.s - a.s);
    return arr.slice(0, N).map((x) => x.n);
  };

  const hc = hotCold(history, g, w);
  const zMap = new Map(hc.map((h) => [h.n, h.z]));
  const om = omission(history, g);
  const ratioMap = new Map(om.map((o) => [o.n, o.ratio]));
  const tails = tailDistribution(history, g, w);
  const tailRate = new Map(tails.map((t) => [t.tail, t.rate]));
  const zones = zoneStats(history, g, 10, w);
  const zoneRate = new Map(zones.map((z) => [z.zone, z.rate]));

  return {
    game,
    name: g.name,
    window: w,
    n: N,
    pool: g.pool,
    methods: {
      score: comboScore(history, g, { window: w }).slice(0, N).map((s) => s.n),
      hot: rankByMap((x) => zMap.get(x) ?? 0),
      omission: rankByMap((x) => ratioMap.get(x) ?? 0),
      tail: rankByMap((x) => tailRate.get(tailOf(x)) ?? 0),
      zone: rankByMap((x) => zoneRate.get(zoneOf(x, 10)) ?? 0),
    },
  };
}

export function liveAnalyze(game: string, window: number): LiveAnalysis | null {
  const g = GAMES[game as GameId];
  const history = HIST[game];
  if (!g || !history || history.length === 0) return null;
  const w = Math.max(10, Math.min(Math.floor(window) || 50, history.length));

  const score = comboScore(history, g, { window: w });
  return {
    game,
    name: g.name,
    window: w,
    totalDraws: history.length,
    latestPeriod: history[history.length - 1]?.period ?? null,
    hotCold: hotCold(history, g, w).map((h) => ({ n: h.n, freq: h.freq, z: h.z, tag: h.tag })),
    tail: tailDistribution(history, g, w).map((t) => ({ tail: t.tail, rate: t.rate, tag: t.tag })),
    zone: zoneStats(history, g, 10, w).map((z) => ({ label: z.label, rate: z.rate })),
    score: score.slice(0, g.pick * 2).map((s) => ({ n: s.n, score: s.score })),
    secondArea: g.second
      ? secondAreaStats(history, g.second.pool, w).map((s) => ({ n: s.n, freq: s.freq, currentMiss: s.currentMiss, tag: s.tag }))
      : null,
  };
}
