// 每日報牌：讀完整分析 (data/full，含未遮罩的高機率號) → 推播給有效訂閱會員。
// 由後台手動觸發 (測試) 或正式環境的 Cloudflare Cron 觸發。
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pushMessage } from "./integrations/line.js";
import { pushRepo, subsRepo, deliveriesRepo, usersRepo } from "./repos.js";
import { tierMeets } from "./plans.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FULL_DIR = path.resolve(__dirname, "..", "..", "data", "full");

interface FullBundle {
  name: string;
  pick: number;
  latest: { period: string; date: string } | null;
  score: Array<{ n: number; score: number }>;
}

export function loadFull(game: string): FullBundle | null {
  // 本地由檔案系統讀；Workers 無 fs（Phase C 改由 KV/R2 提供）→ 優雅回 null。
  try {
    const f = path.join(FULL_DIR, `${game}.json`);
    if (!existsSync(f)) return null;
    return JSON.parse(readFileSync(f, "utf8")) as FullBundle;
  } catch {
    return null;
  }
}

/** 產生某彩種的報牌文字 (含高機率精選號，僅付費會員可收) */
export function buildReportText(game: string): string | null {
  const b = loadFull(game);
  if (!b || !b.latest) return null;
  const top = b.score.slice(0, b.pick).map((s) => String(s.n).padStart(2, "0"));
  return [
    `🔮 17168 ${b.name} 每日報牌`,
    `期別參考：${b.latest.period}（${b.latest.date}）`,
    ``,
    `AI 高機率精選 ${b.pick} 碼：`,
    `${top.join("、")}`,
    ``,
    `⚠️ 樂透為獨立隨機事件，僅供參考娛樂，不保證中獎。`,
  ].join("\n");
}

/**
 * 觸發報牌：對所有「啟用推播 + 訂閱達 pro 以上 + 帳號正常」的會員推送。
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
    const sub = await subsRepo.forUser(t.user_id);
    const eligible = user?.status === "active" && sub && tierMeets(sub.tier, "pro") &&
      (sub.status === "active" || sub.status === "trial");
    if (!eligible) {
      await deliveriesRepo.log(t.user_id, game, "line", "skipped", { drawPeriod: period, detail: "未達付費資格" });
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
