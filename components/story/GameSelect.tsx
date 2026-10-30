"use client";

import { STORY_GAMES, STORY_GAME_ORDER } from "@/lib/story/games";
import type { StoryGame } from "@/lib/story/types";

const HINT: Record<StoryGame, { emoji: string; text: string }> = {
  daily539: { emoji: "🎯", text: "選 5 個號碼" },
  lotto649: { emoji: "💎", text: "選 6 個號碼" },
  superLotto638: { emoji: "⚡", text: "6 個 + 第二區 1 個" },
};

export function GameSelect({ value, onChange }: { value: StoryGame; onChange: (g: StoryGame) => void }) {
  return (
    <div role="radiogroup" aria-label="選擇彩種" className="grid grid-cols-3 gap-2 sm:gap-3">
      {STORY_GAME_ORDER.map((g) => {
        const active = g === value;
        const hint = HINT[g];
        return (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(g)}
            className={`flex min-h-[5.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl border px-1.5 py-3 text-center transition ${
              active
                ? "border-[var(--neon)] bg-[rgba(0,240,255,0.1)] shadow-[0_0_22px_rgba(0,240,255,0.3)]"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[rgba(0,240,255,0.5)]"
            }`}
          >
            <span className="text-xl">{hint.emoji}</span>
            <span className={`font-display text-base font-extrabold sm:text-lg ${active ? "text-[var(--neon)]" : "text-[var(--text)]"}`}>
              {STORY_GAMES[g].name}
            </span>
            <span className="text-[11px] leading-tight text-[var(--muted)] sm:text-xs">{hint.text}</span>
          </button>
        );
      })}
    </div>
  );
}
