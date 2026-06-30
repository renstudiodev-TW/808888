"use client";

import { useState } from "react";

// 訂閱按鈕：免費 → 導去登入；付費 → 建立藍新委託並自動送出付款表單。
export function SubscribeButton({
  tier,
  label,
  highlight,
  gold,
}: {
  tier: "free" | "pro" | "max";
  label: string;
  highlight?: boolean;
  gold?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setErr(null);
    if (tier === "free") {
      window.location.href = "/auth/line/login";
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/pay/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ tier }),
      });
      if (r.status === 401) {
        window.location.href = "/auth/line/login";
        return;
      }
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.action) {
        setErr(d.error || "建立訂單失敗，請稍後再試。");
        return;
      }
      // 動態組隱藏表單，POST 到藍新付款頁
      const form = document.createElement("form");
      form.method = "POST";
      form.action = d.action;
      for (const [k, v] of Object.entries(d.fields as Record<string, string>)) {
        const i = document.createElement("input");
        i.type = "hidden";
        i.name = k;
        i.value = String(v);
        form.appendChild(i);
      }
      document.body.appendChild(form);
      form.submit();
    } catch {
      setErr("網路錯誤，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={go}
        disabled={busy}
        className={`mt-6 ${gold ? "inline-flex items-center justify-center rounded-full px-6 py-3 font-bold" : highlight ? "btn-primary" : "btn-ghost"} disabled:opacity-60`}
        style={gold ? { background: "linear-gradient(90deg,#ffd24a,#f59e0b)", color: "#3a2a00" } : undefined}
      >
        {busy ? "處理中…" : label}
      </button>
      {err && <span className="mt-2 text-center text-[11px] text-[var(--hot)]">{err}</span>}
    </>
  );
}
