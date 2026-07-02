// 資料管線：抓台彩 API 歷史 → 分析 → 寫 public/data/{game}.json
// 用法：npx tsx scripts/build-data.ts [gameId ...]   (預設只跑 daily539)
//      環境變數 FROM=YYYY-MM 設定起始月份 (預設 2020-01)
//
// 設計：data/raw/{game}.json 當快取，只補抓快取最後一期之後的月份，省 API 請求。

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GAMES } from "../lib/lottery/games";
import { fetchHistory } from "../lib/lottery/fetch";
import { analyze } from "../lib/lottery/analyze";
import { restingNumbers } from "../lib/lottery/score";
import { publicize } from "../lib/lottery/publicize";
import type { Draw, GameId } from "../lib/lottery/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "data", "raw");
const FULL_DIR = path.join(ROOT, "data", "full"); // 完整分析 (私有，未來認證 API 用)
const OUT_DIR = path.join(ROOT, "public", "data"); // 公開遮罩版 (前端)
// 已發布精選號歷史 (近日去重/強制輪替用)。放 data/ 根目錄 (受版控)，
// 不可放 data/full/ (被 gitignore、CI 不 commit → 每次跑都空 → 功能形同虛設)。
const PICKS_LOG = path.join(ROOT, "data", "picks-log.json");

const RECENCY_LOOKBACK = 3; // 去重回看期數
const PICKS_LOG_KEEP = 60; // 每個遊戲保留幾筆

type PicksLogEntry = { period: string; pick: number[] };
type PicksLog = Record<string, PicksLogEntry[]>;

async function loadPicksLog(): Promise<PicksLog> {
  if (!existsSync(PICKS_LOG)) return {};
  try {
    return JSON.parse(await readFile(PICKS_LOG, "utf8")) as PicksLog;
  } catch {
    return {};
  }
}

function parseMonth(s: string | undefined, fallback: { year: number; month: number }) {
  if (!s) return fallback;
  const [y, m] = s.split("-").map(Number);
  if (!y || !m) return fallback;
  return { year: y, month: m };
}

async function loadRaw(game: GameId): Promise<Draw[]> {
  const f = path.join(RAW_DIR, `${game}.json`);
  if (!existsSync(f)) return [];
  try {
    return JSON.parse(await readFile(f, "utf8")) as Draw[];
  } catch {
    return [];
  }
}

function mergeDraws(a: Draw[], b: Draw[]): Draw[] {
  const map = new Map<string, Draw>();
  for (const d of [...a, ...b]) map.set(d.period, d);
  return [...map.values()].sort((x, y) => x.period.localeCompare(y.period));
}

async function run() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(FULL_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const now = new Date();
  const to = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const defaultFrom = { year: 2020, month: 1 };
  const from = parseMonth(process.env.FROM, defaultFrom);
  const generatedAt = now.toISOString();

  const args = process.argv.slice(2).filter((a) => a in GAMES) as GameId[];
  const targets: GameId[] = args.length ? args : ["daily539"];

  const index: { game: string; name: string; totalDraws: number; latest: string | null }[] = [];
  const picksLog = await loadPicksLog();

  for (const id of targets) {
    const g = GAMES[id];
    const cached = await loadRaw(id);

    // 決定補抓起點：有快取就從最後一期所在月份開始補
    let fetchFrom = from;
    if (cached.length) {
      const lastPeriod = cached[cached.length - 1].period;
      const lastDate = cached[cached.length - 1].date;
      if (lastDate) {
        const [ly, lm] = lastDate.split("-").map(Number);
        fetchFrom = { year: ly, month: lm };
      }
      console.log(`[${g.name}] 快取 ${cached.length} 期 (最後 ${lastPeriod})，從 ${fetchFrom.year}-${fetchFrom.month} 補抓`);
    } else {
      console.log(`[${g.name}] 無快取，從 ${fetchFrom.year}-${fetchFrom.month} 全抓`);
    }

    const fresh = await fetchHistory(g, fetchFrom, to, {
      onProgress: (m) => process.stdout.write(`  ${m}\n`),
    });
    const merged = mergeDraws(cached, fresh);

    if (merged.length === 0) {
      console.error(`[${g.name}] 抓不到任何資料，跳過`);
      continue;
    }

    await writeFile(path.join(RAW_DIR, `${id}.json`), JSON.stringify(merged), "utf8");

    // 近日去重：取本期之前最近幾期「已發布的精選號」，最新在前，餵進分析軟扣分。
    const latestPeriod = merged[merged.length - 1].period;
    const history = (picksLog[id] ?? []).filter((e) => e.period < latestPeriod);
    const recentPicks = history.slice(-RECENCY_LOOKBACK).reverse().map((e) => e.pick);
    // 強制輪替：連席達上限的號本期輪休。
    const restNumbers = [...restingNumbers(recentPicks)];

    const bundle = analyze(merged, g, { generatedAt, recentPicks, restNumbers });
    await writeFile(path.join(FULL_DIR, `${id}.json`), JSON.stringify(bundle), "utf8");

    // 記錄本期實際發布的精選（top-pick），供之後幾期去重比對。
    const publishedPick = bundle.score.slice(0, g.pick).map((s) => s.n);
    const updated = (picksLog[id] ?? []).filter((e) => e.period !== latestPeriod);
    updated.push({ period: latestPeriod, pick: publishedPick });
    picksLog[id] = updated.slice(-PICKS_LOG_KEEP);
    // 前端只拿遮罩過的公開版 (高評分號碼不外送)
    const pub = publicize(bundle);
    await writeFile(path.join(OUT_DIR, `${id}.json`), JSON.stringify(pub), "utf8");

    console.log(`[${g.name}] 完成：${merged.length} 期，最新 ${merged[merged.length - 1].period} (${merged[merged.length - 1].date})`);
    index.push({
      game: id,
      name: g.name,
      totalDraws: merged.length,
      latest: merged[merged.length - 1].date,
    });
  }

  // 寫索引 (前端首頁用)
  const indexPath = path.join(OUT_DIR, "index.json");
  let prevGames: typeof index = [];
  if (existsSync(indexPath)) {
    try {
      const parsed = JSON.parse(await readFile(indexPath, "utf8"));
      if (Array.isArray(parsed?.games)) prevGames = parsed.games;
    } catch { /* ignore */ }
  }
  const byGame = new Map(prevGames.map((i) => [i.game, i]));
  for (const i of index) byGame.set(i.game, i);
  await writeFile(indexPath, JSON.stringify({ games: [...byGame.values()], generatedAt }, null, 2), "utf8");

  await writeFile(PICKS_LOG, JSON.stringify(picksLog, null, 2), "utf8");

  console.log("全部完成。");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
