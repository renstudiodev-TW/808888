"use client";

import { useEffect, useState } from "react";
import { STORY_GAMES } from "@/lib/story/games";
import type { StoryResult } from "@/lib/story/types";
import { NumberBall } from "@/components/NumberBall";
import { Confetti } from "@/components/Confetti";
import { allPickedNumbers, splitStory } from "./highlight";
import { downloadShareImage } from "./shareImage";

const SITE_URL = "https://808888.tw";

function buildShareText(r: StoryResult): string {
  const nums = r.numbers.map((x) => x.n).join(" ");
  const second = r.second ? `\n第二區：${r.second.n}` : "";
  return `${r.story}\n\n我的${STORY_GAMES[r.game].name}故事號碼：${nums}${second}\n\n你也來抓一組：${SITE_URL}`;
}

export function StoryResultCard({
  result,
  onAgain,
  onReset,
}: {
  result: StoryResult;
  onAgain: () => void;
  onReset: () => void;
}) {
  const quotaOut = result.storySource === "template" && result.remaining === 0;
  // null = 還不知道；只有額度用完時才需要確認有沒有登入
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!quotaOut) return;
    let alive = true;
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => alive && setLoggedIn(r.ok))
      .catch(() => alive && setLoggedIn(false));
    return () => {
      alive = false;
    };
  }, [quotaOut]);

  const segments = splitStory(result.story, allPickedNumbers(result));
  const lineHref = `https://line.me/R/share?text=${encodeURIComponent(buildShareText(result))}`;

  async function saveImage() {
    setSaving(true);
    setSaveError("");
    try {
      await downloadShareImage(result);
    } catch {
      setSaveError("圖片產生失敗，請再試一次，或直接截圖分享。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <Confetti fireKey={1} />
      <div className="glass relative overflow-hidden p-5 sm:p-7">
        <div className="mb-3 flex items-center justify-between text-xs text-[var(--muted)]">
          <span className="font-bold text-[var(--neon)]">{STORY_GAMES[result.game].name} 故事號碼</span>
          <span className="num">{result.date}</span>
        </div>

        <p className="text-left text-base leading-8 text-[var(--text)] sm:text-lg sm:leading-9">
          {segments.map((s, i) =>
            s.hit ? (
              <span
                key={i}
                className="num mx-0.5 rounded-md bg-[rgba(255,210,74,0.14)] px-1 font-bold text-[#ffd24a] [text-shadow:0_0_10px_rgba(255,210,74,0.5)]"
              >
                {s.text}
              </span>
            ) : (
              <span key={i}>{s.text}</span>
            ),
          )}
        </p>

        <div className="mt-6 flex flex-wrap items-start justify-center gap-x-2 gap-y-4">
          {result.numbers.map((x) => (
            <div key={x.n} className="flex w-[4.5rem] flex-col items-center gap-1">
              <NumberBall n={String(x.n)} size="lg" tone="hot" />
              <span className="text-center text-[11px] leading-tight break-words text-[var(--muted)]">{x.source}</span>
            </div>
          ))}
          {result.second && (
            <>
              <div className="hidden self-stretch border-l border-dashed border-[var(--border)] sm:block" aria-hidden />
              <div className="flex w-[4.5rem] flex-col items-center gap-1">
                <NumberBall n={String(result.second.n)} size="lg" tone="special" />
                <span className="text-[11px] font-bold text-[var(--primary)]">第二區</span>
                <span className="text-center text-[11px] leading-tight break-words text-[var(--muted)]">
                  {result.second.source}
                </span>
              </div>
            </>
          )}
        </div>

        {quotaOut && (
          <div className="mt-5 rounded-xl border border-[rgba(255,210,74,0.3)] bg-[rgba(255,210,74,0.06)] p-3 text-left text-sm text-[var(--text)]">
            <p>今天的 AI 故事次數用完了，這篇由老師傅的範本代筆。</p>
            {loggedIn === false && (
              <p className="mt-1.5 text-[var(--muted)]">
                用 LINE 登入，每天可以抽 10 次。{" "}
                <a href="/auth/line/login" className="font-bold text-[#06C755] underline underline-offset-2">
                  LINE 登入
                </a>
              </p>
            )}
          </div>
        )}

        <p className="mt-4 text-center text-[12px] text-[var(--muted)]">娛樂用途，不影響中獎機率</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onAgain} className="btn-primary !py-3.5 text-base">
          🔁 再抽一次
        </button>
        <button type="button" onClick={onReset} className="btn-ghost !py-3.5 text-base">
          🎲 換題目重來
        </button>
        <a
          href={lineHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#06C755] px-6 py-3.5 text-base font-bold text-white transition hover:brightness-110"
        >
          分享到 LINE
        </a>
        <button type="button" onClick={saveImage} disabled={saving} className="btn-ghost !py-3.5 text-base disabled:opacity-60">
          {saving ? "製作中…" : "🖼 存成圖片"}
        </button>
      </div>
      {saveError && <p className="mt-2 text-center text-sm text-[var(--hot)]">{saveError}</p>}
    </div>
  );
}
