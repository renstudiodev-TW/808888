"use client";

import { useState } from "react";
import { SubscribeButton } from "./SubscribeButton";

// 旗艦會員價格區塊：月繳/年繳切換（其他方案目前只有月繳，不需要這個元件）。
export function MaxTierPricing({ monthly, annual, gold }: { monthly: number; annual: number; gold: string }) {
  const [cycle, setCycle] = useState<"M" | "Y">("M");
  const price = cycle === "M" ? monthly : annual;
  const saved = monthly * 12 - annual;
  const savedPct = Math.round((saved / (monthly * 12)) * 100);
  const monthlyEquivalent = Math.round(annual / 12);

  return (
    <>
      {/* 切換放最前面：先選計費週期，價格才跟著變，避免使用者以為只有一個固定價格 */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl border-2 border-[#ffd24a]/50 bg-[rgba(255,210,74,0.05)] p-1 text-sm">
        <button
          type="button"
          aria-pressed={cycle === "M"}
          onClick={() => setCycle("M")}
          className={`rounded-lg px-3 py-2 font-bold transition ${
            cycle === "M"
              ? "bg-[#ffd24a] text-[#3a2a00] shadow-[0_0_10px_rgba(255,210,74,0.5)]"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          月繳
        </button>
        <button
          type="button"
          aria-pressed={cycle === "Y"}
          onClick={() => setCycle("Y")}
          className={`relative rounded-lg px-3 py-2 font-bold transition ${
            cycle === "Y"
              ? "bg-[#ffd24a] text-[#3a2a00] shadow-[0_0_10px_rgba(255,210,74,0.5)]"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          年繳
          <span className="absolute -top-2.5 -right-2 rounded-full bg-[#22c55e] px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow">
            省{savedPct}%
          </span>
        </button>
      </div>

      <div className="mt-4 flex items-end gap-1">
        <span className="num text-sm text-[var(--muted)]">NT$</span>
        <span className="num text-4xl font-bold" style={{ color: gold }}>
          {price}
        </span>
        <span className="mb-1 text-sm text-[var(--muted)]">{cycle === "M" ? "/ 月" : "/ 年"}</span>
      </div>
      <p className="mt-1 text-[11px] text-[var(--muted)]">
        {cycle === "M" ? "隨時可取消，無綁約" : `等於每月 NT$${monthlyEquivalent}，一年省 NT$${saved}`}
      </p>

      <SubscribeButton
        tier="max"
        cycle={cycle}
        label={cycle === "M" ? "訂閱旗艦" : "訂閱旗艦（年繳）"}
        gold
      />
    </>
  );
}
