"use client";

import { useEffect, useState } from "react";
import { STORY_GAMES } from "@/lib/story/games";
import type { StoryGame } from "@/lib/story/types";
import { NumberBall } from "@/components/NumberBall";

// 等待時讓號碼球一直滾動，像搖獎機。
export function StoryLoading({ game }: { game: StoryGame }) {
  const spec = STORY_GAMES[game];
  const total = spec.pick + (spec.second ? 1 : 0);
  const [vals, setVals] = useState<number[]>(() => Array.from({ length: total }, (_, i) => i + 1));

  useEffect(() => {
    const t = setInterval(() => {
      setVals(
        Array.from({ length: total }, (_, i) => {
          const pool = spec.second && i === total - 1 ? spec.second.pool : spec.pool;
          return 1 + Math.floor(Math.random() * pool);
        }),
      );
    }, 90);
    return () => clearInterval(t);
  }, [total, spec]);

  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {vals.map((n, i) => (
          <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 90}ms`, animationDuration: "0.7s" }}>
            <NumberBall n={n} size="lg" tone={spec.second && i === total - 1 ? "special" : "hot"} />
          </span>
        ))}
      </div>
      <p className="font-display text-lg font-bold text-[var(--neon)]">老師傅正在翻你的答案，編故事中…</p>
      <p className="text-xs text-[var(--muted)]">通常幾秒就好，請稍等一下</p>
    </div>
  );
}
