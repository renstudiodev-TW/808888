// 每日精選：讀完整分析 (data/full，含未遮罩的高評分號) → 推播給有效訂閱會員。
// 由後台手動觸發 (測試) 或正式環境的 Cloudflare Cron 觸發。
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pushMessage, type LineMessage } from "./integrations/line.js";
import { pushRepo, subsRepo, deliveriesRepo, usersRepo, settingsRepo } from "./repos.js";
import { canReceivePush } from "./plans.js";
import { config } from "./config.js";
import fullPicks from "./data/full-picks.json";

const pad2 = (n: number) => String(n).padStart(2, "0");

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

// 各彩種開獎日（台灣星期）：今彩539 一到六、大樂透 二五、威力彩 一四。
// 回傳「今天該推哪些彩種」。週日無開獎 → 空陣列。
export function gamesForToday(): string[] {
  const twWeekday = new Date(Date.now() + 8 * 3600 * 1000).getUTCDay(); // 0=日..6=六（台灣時間）
  const map: Record<number, string[]> = {
    0: [],
    1: ["daily539", "superLotto638"],
    2: ["daily539", "lotto649"],
    3: ["daily539"],
    4: ["daily539", "superLotto638"],
    5: ["daily539", "lotto649"],
    6: ["daily539"],
  };
  return map[twWeekday] ?? ["daily539"];
}

/** 把多個彩種的精選合併成一則訊息（省 LINE 額度，一天一則） */
export function buildCombinedText(games: string[]): string | null {
  const sections: string[] = [];
  for (const g of games) {
    const b = loadFull(g);
    if (!b || !b.latest) continue;
    const top = b.score.slice(0, b.pick).map((s) => String(s.n).padStart(2, "0"));
    sections.push(`【${b.name}】參考期 ${b.latest.period}（${b.latest.date}）\nAI 高評分精選：${top.join("、")}`);
  }
  if (sections.length === 0) return null;
  return [
    `🔮 808888 今日精選`,
    ``,
    sections.join("\n\n"),
    ``,
    `⚠️ 樂透為獨立隨機事件，僅供參考娛樂，不保證中獎。`,
  ].join("\n");
}

/**
 * 把每日精選建成 LINE Flex 訊息。
 * 用 Flex 的原因：純文字訊息中 LINE 會自動把「808888」與長數字偵測成電話撥號連結，
 * 且無法關閉。Flex 的 text 不會被自動連結（號碼不會變連結），而品牌「808888」可用
 * uri action 綁成網站連結。
 */
export function buildCombinedFlex(games: string[]): LineMessage | null {
  const sections: { name: string; period: string; top: string[] }[] = [];
  for (const g of games) {
    const b = loadFull(g);
    if (!b || !b.latest) continue;
    sections.push({ name: b.name, period: b.latest.period, top: b.score.slice(0, b.pick).map((s) => pad2(s.n)) });
  }
  if (sections.length === 0) return null;
  const url = config.baseUrl;

  const body: Record<string, unknown>[] = [
    {
      type: "box",
      layout: "baseline",
      contents: [
        { type: "text", text: "🔮", flex: 0, size: "lg" },
        // 只有「808888」是連結，點了開網站（非撥號）
        { type: "text", text: "808888", flex: 0, size: "lg", weight: "bold", color: "#06b6c7", margin: "sm", action: { type: "uri", label: "808888", uri: url } },
        { type: "text", text: "今日精選", size: "lg", weight: "bold", margin: "sm" },
      ],
    },
  ];
  for (const s of sections) {
    body.push({ type: "separator", margin: "md" });
    body.push({ type: "text", text: `${s.name}　參考期 ${s.period}`, size: "sm", color: "#8b93a1", margin: "md", wrap: true });
    // 號碼在 flex text 內，不會被自動連結
    body.push({ type: "text", text: `AI 高評分精選：${s.top.join("、")}`, size: "md", weight: "bold", wrap: true });
  }
  body.push({ type: "separator", margin: "md" });
  body.push({ type: "text", text: "⚠️ 樂透為獨立隨機事件，僅供參考娛樂，不保證中獎。", size: "xxs", color: "#99a0ad", wrap: true, margin: "md" });

  return {
    type: "flex",
    altText: `808888 今日精選：${sections.map((s) => `${s.name} ${s.top.join("、")}`).join("；")}`,
    contents: {
      type: "bubble",
      body: { type: "box", layout: "vertical", spacing: "sm", contents: body },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "button", style: "primary", color: "#8b5cf6", height: "sm", action: { type: "uri", label: "看完整分析 · 808888.tw", uri: url } },
        ],
      },
    },
  };
}

/** 測試推播的 Flex（同樣讓 808888 是網站連結、其他不出現撥號連結）。 */
export function buildTestFlex(): LineMessage {
  const url = config.baseUrl;
  return {
    type: "flex",
    altText: "808888 測試推播：你已成功開通 LINE 精選推播！",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "box",
            layout: "baseline",
            contents: [
              { type: "text", text: "🔮", flex: 0, size: "lg" },
              { type: "text", text: "808888", flex: 0, size: "lg", weight: "bold", color: "#06b6c7", margin: "sm", action: { type: "uri", label: "808888", uri: url } },
              { type: "text", text: "測試推播", size: "lg", weight: "bold", margin: "sm" },
            ],
          },
          { type: "text", text: "你已成功開通 LINE 精選推播！開獎前老師傅會把當日精選號送到這裡。", size: "sm", wrap: true, margin: "md" },
          { type: "separator", margin: "md" },
          { type: "text", text: "⚠️ 樂透為獨立隨機事件，僅供參考娛樂，不保證中獎。", size: "xxs", color: "#99a0ad", wrap: true, margin: "md" },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "button", style: "primary", color: "#8b5cf6", height: "sm", action: { type: "uri", label: "看完整分析 · 808888.tw", uri: url } },
        ],
      },
    },
  };
}

/**
 * 觸發精選：把「指定彩種（預設今日開獎的）」合併成一則，推給有效付費會員。
 * 回傳寄送摘要。
 */
export async function runDailyReport(games: string[] = ["daily539"]): Promise<{ total: number; sent: number; skipped: number; stub: boolean }> {
  const flex = buildCombinedFlex(games);
  if (!flex) return { total: 0, sent: 0, skipped: 0, stub: false };
  // 全域推播開關（後台可關閉，控制 LINE 成本）。
  if (!(await settingsRepo.isPushEnabled())) return { total: 0, sent: 0, skipped: 0, stub: false };

  const targets = await pushRepo.enabledTargets();
  let sent = 0;
  let skipped = 0;
  let stub = false;
  const label = games.join(",");

  for (const t of targets) {
    const user = await usersRepo.byId(t.user_id);
    // ensureActive 會把過期試用/付費降為 free+expired → 自動鎖住推播。
    const sub = await subsRepo.ensureActive(t.user_id);
    // 每日推播：進階以上的付費(active)或試用(trial)會員皆可收；免費/過期/停權不送。
    const eligible = user?.status === "active" && canReceivePush(sub.tier, sub.status);
    if (!eligible) {
      await deliveriesRepo.log(t.user_id, label, "line", "skipped", { detail: "未達推播資格(免費/過期/停權)" });
      skipped++;
      continue;
    }
    const res = await pushMessage(t.line_user_id, [flex]);
    if (res.stub) stub = true;
    await deliveriesRepo.log(t.user_id, label, "line", res.ok ? "sent" : "failed", {
      detail: res.stub ? "LINE stub (未設定 token)" : `status ${res.status ?? ""}`,
    });
    if (res.ok) sent++;
  }
  return { total: targets.length, sent, skipped, stub };
}
