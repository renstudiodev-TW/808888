// 每日精選：讀完整分析 (data/full，含未遮罩的高評分號) → 推播給有效訂閱會員。
// 由後台手動觸發 (測試) 或正式環境的 Cloudflare Cron 觸發。
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pushMessage } from "./integrations/line.js";
import { pushRepo, subsRepo, deliveriesRepo, usersRepo } from "./repos.js";
import { tierMeets } from "./plans.js";
import fullPicks from "./data/full-picks.json";

interface FullBundle {
  name: string;
  pick: number;
  latest: { period: string; date: string } | null;
  score: Array<{ n: number; score: number }>;
}

// 完整分析資料夾位置。本地 Node 由 import.meta.url 推算；Workers 無此值 → 回 null。
function fullDir(): string | null {
  try {
    const url = import.meta.url;
    if (!url) return null;
    const dir = path.dirname(fileURLToPath(url));
    return path.resolve(dir, "..", "..", "data", "full");
  } catch {
    return null;
  }
}

export function loadFull(game: string): FullBundle | null {
  // 1) 本地 Node：從 data/full 讀完整檔（含所有指標）。
  try {
    const dir = fullDir();
    if (dir) {
      const f = path.join(dir, `${game}.json`);
      if (existsSync(f)) return JSON.parse(readFileSync(f, "utf8")) as FullBundle;
    }
  } catch {
    /* fall through */
  }
  // 2) Workers（無 fs）：用打包進 Worker 的精簡高分 picks（只給已驗證付費會員的 API 用）。
  const b = (fullPicks as Record<string, FullBundle | undefined>)[game];
  return b ?? null;
}

/** 產生某彩種的精選文字 (含高評分精選號，僅付費會員可收) */
export function buildReportText(game: string): string | null {
  const b = loadFull(game);
  if (!b || !b.latest) return null;
  const top = b.score.slice(0, b.pick).map((s) => String(s.n).padStart(2, "0"));
  return [
    `🔮 808888 ${b.name} 每日精選`,
    `期別參考：${b.latest.period}（${b.latest.date}）`,
    ``,
    `AI 高評分精選 ${b.pick} 碼：`,
    `${top.join("、")}`,
    ``,
    `⚠️ 樂透為獨立隨機事件，僅供參考娛樂，不保證中獎。`,
  ].join("\n");
}

/**
 * 觸發精選：對所有「啟用推播 + 訂閱達 pro 以上 + 帳號正常」的會員推送。
 * 回傳寄送摘要。
 */
export async function runDailyReport(game = "daily539"): Promise<{ total: number; sent: number; skipped: number; stub: boolean }> {
  const text = buildReportText(game);
  if (!text) return { total: 0, sent: 0, skipped: 0, stub: false };

  const targets = await pushRepo.enabledTargets();
  let sent = 0;
  let skipped = 0;
  let stub = false;
  const b = loadFull(game);
  const period = b?.latest?.period;

  for (const t of targets) {
    const user = await usersRepo.byId(t.user_id);
    const sub = await subsRepo.ensureActive(t.user_id);
    // 每日推播僅限正式付費(active)會員；試用(trial)與免費不送。
    const eligible = user?.status === "active" && tierMeets(sub.tier, "pro") && sub.status === "active";
    if (!eligible) {
      await deliveriesRepo.log(t.user_id, game, "line", "skipped", { drawPeriod: period, detail: "未達付費資格(試用/免費不含推播)" });
      skipped++;
      continue;
    }
    const res = await pushMessage(t.line_user_id, [{ type: "text", text }]);
    if (res.stub) stub = true;
    await deliveriesRepo.log(t.user_id, game, "line", res.ok ? "sent" : "failed", {
      drawPeriod: period,
      detail: res.stub ? "LINE stub (未設定 token)" : `status ${res.status ?? ""}`,
    });
    if (res.ok) sent++;
  }
  return { total: targets.length, sent, skipped, stub };
}
