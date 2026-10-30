// 用原生 Canvas 畫 1080x1350 分享圖並下載，不依賴任何套件。
import { STORY_GAMES } from "@/lib/story/games";
import type { StoryResult } from "@/lib/story/types";
import { allPickedNumbers, splitStory } from "./highlight";

const W = 1080;
const H = 1350;
const NEON = "#00f0ff";
const HOT = "#ff2a5f";
const GOLD = "#ffd24a";
const PURPLE = "#8b5cf6";
const TEXT = "#f3f4f6";
const MUTED = "#9ca3af";

interface Unit {
  text: string;
  hit: boolean;
}

/** 把片段拆成排版單位：數字連續算一個單位，其他逐字 */
function toUnits(r: StoryResult): Unit[] {
  const units: Unit[] = [];
  for (const seg of splitStory(r.story, allPickedNumbers(r))) {
    if (/^\d+$/.test(seg.text)) units.push({ text: seg.text, hit: seg.hit });
    else for (const ch of Array.from(seg.text)) units.push({ text: ch, hit: false });
  }
  return units;
}

function drawBall(ctx: CanvasRenderingContext2D, cx: number, cy: number, rad: number, n: number, special: boolean, font: string) {
  const g = ctx.createRadialGradient(cx - rad * 0.35, cy - rad * 0.35, rad * 0.1, cx, cy, rad);
  if (special) {
    g.addColorStop(0, "#c4b5fd");
    g.addColorStop(1, PURPLE);
  } else {
    g.addColorStop(0, "#ff7a9a");
    g.addColorStop(1, HOT);
  }
  ctx.save();
  ctx.shadowColor = special ? "rgba(139,92,246,0.7)" : "rgba(255,42,95,0.7)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = special ? "#1a1030" : "#fff";
  ctx.font = `700 ${Math.round(rad * 0.82)}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n), cx, cy + 2);
}

// 避頭點：不可出現在行首的標點；避尾點：不可出現在行尾的開頭標點
const NO_START = new Set(Array.from("、，。！？；：」』）》】,.!?;:)%"));
const NO_END = new Set(Array.from("「『（《【("));

/** 出處文字的最小斷行單位：英數連續算一個字，中文逐字，空白獨立 */
function tokens(text: string): string[] {
  return text.match(/[A-Za-z0-9%]+|\s|[^\s]/gu) ?? [];
}

/** 依寬度把出處切成最多 maxLines 行；放不下時在完整的字上截斷並加「…」 */
function wrapSource(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let cur = "";
  const toks = tokens(text);
  let i = 0;
  for (; i < toks.length; i++) {
    const t = toks[i];
    if (!cur && /^\s$/.test(t)) continue; // 行首不放空白
    if (ctx.measureText(cur + t).width > maxWidth && cur) {
      lines.push(cur.trimEnd());
      if (lines.length === maxLines) break;
      cur = /^\s$/.test(t) ? "" : t;
    } else cur += t;
  }
  if (lines.length < maxLines) {
    if (cur.trim()) lines.push(cur.trimEnd());
    return lines;
  }
  // 還有剩字：最後一行用完整的字截斷並補「…」
  let tail = lines[maxLines - 1];
  const tt = tokens(tail);
  while (tt.length && ctx.measureText(tt.join("") + "…").width > maxWidth) tt.pop();
  tail = tt.join("").trimEnd() + "…";
  lines[maxLines - 1] = tail;
  return lines;
}

export async function downloadShareImage(r: StoryResult): Promise<void> {
  // 取網頁目前實際用的字體，並先確保故事用到的字都載入，否則畫布會退回系統預設字
  const family = `${getComputedStyle(document.body).fontFamily || ""}, "Microsoft JhengHei", "PingFang TC", sans-serif`;
  try {
    await document.fonts.load(`700 40px ${family}`, r.story + r.numbers.map((x) => x.source).join(""));
  } catch {
    // 字體載入失敗就用備援字體
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("瀏覽器不支援畫布");

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#080b10");
  bg.addColorStop(1, "#141a2e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 700);
  glow.addColorStop(0, "rgba(0,240,255,0.22)");
  glow.addColorStop(1, "rgba(0,240,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 700);
  ctx.strokeStyle = "rgba(0,240,255,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // 標題
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = NEON;
  ctx.font = `700 64px ${family}`;
  ctx.fillText("808888 故事抓牌", W / 2, 140);
  ctx.fillStyle = MUTED;
  ctx.font = `500 30px ${family}`;
  ctx.fillText(`${STORY_GAMES[r.game].name}　${r.date}`, W / 2, 196);

  // 故事：自動換行（含避頭尾點），號碼用金色標出
  const units = toUnits(r);
  const left = 90;
  const maxW = W - left * 2;
  let fontSize = 42;
  let lines: Unit[][] = [];
  for (;;) {
    ctx.font = `500 ${fontSize}px ${family}`;
    const wOf = (u: Unit) => ctx.measureText(u.text).width;
    lines = [];
    let line: Unit[] = [];
    let w = 0;
    for (const u of units) {
      const uw = wOf(u);
      if (w + uw > maxW && line.length) {
        if (NO_START.has(u.text) && w + uw <= maxW + fontSize * 0.6) {
          // 標點擠在上一行行尾
          line.push(u);
          w += uw;
          continue;
        }
        const carry: Unit[] = [];
        if (NO_START.has(u.text) && line.length > 1) carry.push(line.pop()!); // 前一個字一起帶下去
        while (line.length > 1 && NO_END.has(line[line.length - 1].text)) carry.unshift(line.pop()!);
        lines.push(line);
        line = carry;
        w = carry.reduce((sum, c) => sum + wOf(c), 0);
      }
      line.push(u);
      w += uw;
    }
    if (line.length) lines.push(line);
    if (lines.length * fontSize * 1.6 <= 640 || fontSize <= 30) break;
    fontSize -= 2;
  }
  const lh = fontSize * 1.6;

  // 號碼球尺寸與出處（最多兩行）
  const balls = [
    ...r.numbers.map((x) => ({ ...x, special: false })),
    ...(r.second ? [{ ...r.second, special: true }] : []),
  ];
  const slot = Math.min(140, (W - 100) / balls.length);
  const rad = Math.min(54, slot * 0.4);
  const capSize = balls.length > 6 ? 20 : 22;
  ctx.font = `500 ${capSize}px ${family}`;
  const captions = balls.map((b) =>
    b.special ? ["第二區", ...wrapSource(ctx, b.source, slot - 6, 2)] : wrapSource(ctx, b.source, slot - 6, 2),
  );
  const capLines = Math.max(...captions.map((c) => c.length));
  const capLh = capSize + 6;
  const ballBlockH = rad * 2 + 20 + capLines * capLh;

  // 整塊內容（故事 + 號碼球）在標題與頁尾之間垂直置中
  const GAP = 70;
  const storyH = lines.length * lh;
  const regionTop = 250;
  const regionBottom = 1130;
  const total = storyH + GAP + ballBlockH;
  const top = regionTop + Math.max(0, (regionBottom - regionTop - total) / 2);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let y = top + fontSize;
  for (const line of lines) {
    let x = left;
    for (const u of line) {
      ctx.fillStyle = u.hit ? GOLD : TEXT;
      ctx.font = `${u.hit ? 800 : 500} ${fontSize}px ${family}`;
      ctx.fillText(u.text, x, y);
      x += ctx.measureText(u.text).width;
    }
    y += lh;
  }

  // 號碼球
  const startX = (W - slot * balls.length) / 2 + slot / 2;
  const ballY = top + storyH + GAP + rad;
  balls.forEach((b, i) => {
    const cx = startX + i * slot;
    drawBall(ctx, cx, ballY, rad, b.n, b.special, family);
    ctx.font = `500 ${capSize}px ${family}`;
    ctx.fillStyle = MUTED;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    captions[i].forEach((t, k) => ctx.fillText(t, cx, ballY + rad + 32 + k * capLh));
  });

  // 頁尾
  ctx.textAlign = "center";
  ctx.fillStyle = NEON;
  ctx.font = `700 56px ${family}`;
  ctx.fillText("808888.tw", W / 2, 1200);
  ctx.fillStyle = MUTED;
  ctx.font = `500 26px ${family}`;
  ctx.fillText("娛樂用途，不影響中獎機率", W / 2, 1256);

  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("產生圖片失敗");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `808888-story-${r.date}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
