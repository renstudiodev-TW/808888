// 用原生 Canvas 畫 1080x1350 分享圖並下載，不依賴任何套件。
import { STORY_GAMES } from "@/lib/story/games";
import type { StoryResult } from "@/lib/story/types";
import { allPickedNumbers, pad2, splitStory } from "./highlight";

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
  ctx.fillText(pad2(n), cx, cy + 2);
}

/** 依寬度把字串切成最多 maxLines 行（逐字） */
function wrapChars(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const ch of Array.from(text)) {
    if (ctx.measureText(cur + ch).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = cut[maxLines - 1].slice(0, -1) + "…";
    return cut;
  }
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

  // 故事：自動換行，號碼用金色標出
  const units = toUnits(r);
  const left = 90;
  const maxW = W - left * 2;
  let fontSize = 42;
  let lines: Unit[][] = [];
  for (;;) {
    ctx.font = `500 ${fontSize}px ${family}`;
    lines = [];
    let line: Unit[] = [];
    let w = 0;
    for (const u of units) {
      const uw = ctx.measureText(u.text).width;
      if (w + uw > maxW && line.length) {
        lines.push(line);
        line = [];
        w = 0;
      }
      line.push(u);
      w += uw;
    }
    if (line.length) lines.push(line);
    if (lines.length * fontSize * 1.6 <= 640 || fontSize <= 30) break;
    fontSize -= 2;
  }
  const lh = fontSize * 1.6;
  ctx.textAlign = "left";
  let y = 290;
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
  const balls = [
    ...r.numbers.map((x) => ({ ...x, special: false })),
    ...(r.second ? [{ ...r.second, special: true }] : []),
  ];
  const slot = Math.min(140, (W - 120) / balls.length);
  const rad = Math.min(54, slot * 0.4);
  const startX = (W - slot * balls.length) / 2 + slot / 2;
  const ballY = 940;
  balls.forEach((b, i) => {
    const cx = startX + i * slot;
    drawBall(ctx, cx, ballY, rad, b.n, b.special, family);
    ctx.font = `500 22px ${family}`;
    ctx.fillStyle = MUTED;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const caption = b.special ? [`第二區`, ...wrapChars(ctx, b.source, slot - 8, 1)] : wrapChars(ctx, b.source, slot - 8, 2);
    caption.forEach((t, k) => ctx.fillText(t, cx, ballY + rad + 38 + k * 28));
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
