"use client";

import { useState } from "react";
import { SubscribeButton } from "./SubscribeButton";

// 旗艦會員價格區塊：月繳/年繳切換（其他方案目前只有月繳，不需要這個元件）。
export function MaxTierPricing({ monthly, annual, gold }: { monthly: number; annual: number; gold: string }) {
  const [cycle, setCycle] = useState<"M" | "Y">("M");
  const price = cycle === "M" ? monthly : annual;
  const saved = monthly * 12 - annual;

  return (
    <>
      <div className="mt-4 flex items-end gap-1">
        <span className="num text-sm text-[var(--muted)]">NT$</span>
        <span className="num text-4xl font-bold" style={{ color: gold }}>
          {price}
        </span>
        <span className="mb-1 text-sm text-[var(--muted)]">{cycle === "M" ? "/ 月" : "/ 年"}</span>
      </div>

      <div className="mt-2 inline-flex rounded-full border border-[#ffd24a]/40 bg-[rgba(255,210,74,0.06)] p-0.5 text-[12px]">
        <button
          type="button"
          onClick={() => setCycle("M")}
          className={`rounded-full px-3 py-1 font-bold transition ${
            cycle === "M" ? "bg-[#ffd24a] text-[#3a2a00]" : "text-[var(--muted)]"
          }`}
        >
          月繳
        </button>
        <button
          type="button"
          onClick={() => setCycle("Y")}
          className={`rounded-full px-3 py-1 font-bold transition ${
            cycle === "Y" ? "bg-[#ffd24a] text-[#3a2a00]" : "text-[var(--muted)]"
          }`}
        >
          年繳
        </button>
      </div>
      {cycle === "Y" && (
        <p className="mt-1.5 text-[11px] text-[#ffd24a]">比月繳划算，一年省 NT${saved}</p>
      )}

      <SubscribeButton
        tier="max"
        cycle={cycle}
        label={cycle === "M" ? "訂閱旗艦" : "訂閱旗艦（年繳）"}
        gold
      />
    </>
  );
}
