"use client";

import { useState } from "react";

// 訂閱按鈕：免費 → 導去登入；付費 → 建立藍新委託並自動送出付款表單。
export function SubscribeButton({
  tier,
  label,
  highlight,
  gold,
  cycle = "M",
}: {
  tier: "free" | "pro" | "max";
  label: string;
  highlight?: boolean;
  gold?: boolean;
  cycle?: "M" | "Y";
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [needEmail, setNeedEmail] = useState(false);
  const [email, setEmail] = useState("");

  async function submitCheckout() {
    const r = await fetch("/api/pay/checkout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ tier, cycle }),
    });
    if (r.status === 401) {
      window.location.href = "/auth/line/login";
      return;
    }
    const d = await r.json().catch(() => ({}));
    if (r.status === 422 && d.needEmail) {
      setNeedEmail(true);
      return;
    }
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
  }

  async function go() {
    setErr(null);
    if (tier === "free") {
      window.location.href = "/auth/line/login";
      return;
    }
    setBusy(true);
    try {
      await submitCheckout();
    } catch {
      setErr("網路錯誤，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  async function saveEmailThenPay() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/me/email", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) {
        setErr(d.error || "Email 儲存失敗，請確認格式。");
        return;
      }
      setNeedEmail(false);
      await submitCheckout();
    } catch {
      setErr("網路錯誤，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  if (needEmail) {
    return (
      <div className="mt-6 flex w-full flex-col gap-2">
        <label className="text-center text-[12px] text-[var(--muted)]">
          請填寫付款通知 Email（扣款成功通知、電子發票會寄到這裡）
        </label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !busy) saveEmailThenPay();
          }}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--neon)]"
        />
        <button
          onClick={saveEmailThenPay}
          disabled={busy || !email}
          className="btn-primary disabled:opacity-60"
        >
          {busy ? "處理中…" : "確認並前往付款"}
        </button>
        {err && <span className="text-center text-[11px] text-[var(--hot)]">{err}</span>}
      </div>
    );
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
