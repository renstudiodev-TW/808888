// 付費牆核心：把完整分析包遮罩成「公開版」。
// 高評分 AI 推薦號的「號碼本身」絕不放進公開 JSON (否則前端可從原始碼讀到)，
// 只露出評分分數 + 問號，吸引付費解鎖。完整版留在 server 端 (未來由認證 API 發)。

import type { AnalysisBundle } from "./analyze";

export interface LockedTeaser {
  rank: number;
  score: number; // 評分分數，露出
  // 號碼刻意不放
}

export interface PublicBundle {
  game: string;
  name: string;
  pool: number;
  pick: number;
  hasSpecial: boolean;
  totalDraws: number;
  year: number;
  window: number;
  latest: AnalysisBundle["latest"];
  recent: AnalysisBundle["recent"];
  // 免費指標 (完整)
  hotCold: AnalysisBundle["hotCold"];
  omission: AnalysisBundle["omission"];
  tail: AnalysisBundle["tail"];
  zone: AnalysisBundle["zone"];
  zodiac: AnalysisBundle["zodiac"];
  patterns: AnalysisBundle["patterns"];
  patternSummary: AnalysisBundle["patternSummary"];
  // 每日精選 (免費)：中評分參考號 (排名 pick..pick*2)，號碼露出
  freePicks: { n: number; score: number }[];
  // 高評分 AI 牌 (付費)：只露分數，號碼遮罩
  lockedPicks: LockedTeaser[];
  lockedCount: number;
  // 拖牌/版路 premium：只給「存在性」不給內容
  premiumModules: string[];
  generatedAt: string;
}

export function publicize(full: AnalysisBundle): PublicBundle {
  const pick = full.pick;
  // score 已由高到低排序
  const top = full.score.slice(0, pick); // 高評分 → 鎖
  const mid = full.score.slice(pick, pick * 2); // 中評分 → 免費精選

  const lockedPicks: LockedTeaser[] = top.map((s, i) => ({
    rank: i + 1,
    score: s.score,
  }));
  const freePicks = mid
    .map((s) => ({ n: s.n, score: s.score }))
    .sort((a, b) => a.n - b.n);

  return {
    game: full.game,
    name: full.name,
    pool: full.pool,
    pick: full.pick,
    hasSpecial: full.hasSpecial,
    totalDraws: full.totalDraws,
    year: full.year,
    window: full.window,
    latest: full.latest,
    recent: full.recent,
    hotCold: full.hotCold,
    omission: full.omission,
    tail: full.tail,
    zone: full.zone,
    zodiac: full.zodiac,
    patterns: full.patterns,
    patternSummary: full.patternSummary,
    freePicks,
    lockedPicks,
    lockedCount: top.length,
    premiumModules: ["ai-full-ranking", "drag-matrix", "cross-method-select", "custom-window"],
    generatedAt: full.generatedAt,
  };
}
