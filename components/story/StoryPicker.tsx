"use client";

import { useEffect, useRef, useState } from "react";
import { drawQuestions } from "@/lib/story/questions";
import type { Question, StoryGame, StoryResult } from "@/lib/story/types";
import { requestStory, StoryApiError } from "./api";
import { GameSelect } from "./GameSelect";
import { QuestionField, questionIssue } from "./QuestionField";
import { StoryLoading } from "./StoryLoading";
import { StoryResultCard } from "./StoryResultCard";

const MIN_WAIT_MS = 1200; // 結果最快 1.2 秒才出現，保留一點儀式感

type Phase = "form" | "loading" | "result";
interface ErrorState {
  kind: "invalid" | "fatal";
  message: string;
}

export function StoryPicker() {
  const [game, setGame] = useState<StoryGame>("daily539");
  // 題目是隨機的，等掛載後才抽，避免伺服器與瀏覽器畫面不一致
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<StoryResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuestions(drawQuestions(3));
  }, []);

  const missing = questions.filter((q) => questionIssue(q, answers[q.id] ?? "") !== null).length;
  const ready = questions.length > 0 && missing === 0;

  function reroll() {
    setQuestions(drawQuestions(3));
    setAnswers({});
    setError(null);
  }

  function scrollToTop() {
    rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  async function submit() {
    if (!ready || phase === "loading") return;
    setError(null);
    setPhase("loading");
    scrollToTop();
    try {
      const [res] = await Promise.all([
        requestStory({
          game,
          answers: questions.map((q) => ({ questionId: q.id, value: (answers[q.id] ?? "").trim() })),
        }),
        new Promise((r) => setTimeout(r, MIN_WAIT_MS)),
      ]);
      setResult(res);
      setPhase("result");
    } catch (e) {
      const err = e instanceof StoryApiError ? e : null;
      setError({
        kind: err?.code === "invalid_answer" ? "invalid" : "fatal",
        message: err?.message ?? "出了點狀況，請再試一次。",
      });
      setPhase("form");
    }
  }

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-xl scroll-mt-20 text-left">
      {phase === "loading" && <StoryLoading game={game} />}

      {phase === "result" && result && (
        <StoryResultCard
          result={result}
          onAgain={() => {
            setPhase("form");
            scrollToTop();
          }}
          onReset={() => {
            reroll();
            setPhase("form");
            scrollToTop();
          }}
        />
      )}

      {phase === "form" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="glass p-4 sm:p-6"
        >
          <h2 className="mb-2 font-display text-base font-extrabold text-[var(--text)]">① 選彩種</h2>
          <GameSelect value={game} onChange={setGame} />

          <div className="mt-6 mb-2 flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-extrabold text-[var(--text)]">② 回答幾個小問題</h2>
            <button
              type="button"
              onClick={reroll}
              className="min-h-10 shrink-0 rounded-full border border-[var(--border)] px-3 text-sm font-semibold text-[var(--neon)] hover:border-[var(--neon)]"
            >
              🔄 換一批題目
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-3 rounded-xl border border-[rgba(255,42,95,0.5)] bg-[rgba(255,42,95,0.08)] p-3 text-sm text-[var(--text)]"
            >
              <p>{error.message}</p>
              {error.kind === "fatal" && (
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!ready}
                  className="mt-2 min-h-10 rounded-full bg-[var(--hot)] px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                  再試一次
                </button>
              )}
            </div>
          )}

          <div className="space-y-3">
            {questions.length === 0 && <div className="h-40 animate-pulse rounded-2xl bg-[var(--surface-2)]" aria-hidden />}
            {questions.map((q, i) => (
              <QuestionField
                key={q.id}
                q={q}
                index={i}
                value={answers[q.id] ?? ""}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              />
            ))}
          </div>

          <button type="submit" disabled={!ready} className="btn-primary mt-5 w-full !py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50">
            ✨ 幫我抓牌
          </button>
          {questions.length > 0 && !ready && (
            <p className="mt-2 text-center text-sm text-[var(--hot)]">還有 {missing} 題沒填好，填完才能抓牌</p>
          )}
        </form>
      )}
    </div>
  );
}
