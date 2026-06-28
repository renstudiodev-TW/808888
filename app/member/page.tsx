"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";

interface Me {
  id: string;
  name: string;
  picture: string | null;
  tier: "free" | "pro" | "max";
  subStatus: string;
  periodEnd: string | null;
  hasLine: boolean;
  pushEnabled: boolean;
}

const TIER_LABEL: Record<string, string> = { free: "免費會員", pro: "進階會員", max: "旗艦會員" };

export default function MemberPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => setMe(d))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  async function togglePush() {
    if (!me || pushBusy) return;
    const next = !me.pushEnabled;
    setPushBusy(true);
    try {
      const r = await fetch("/api/me/push", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ enabled: String(next) }),
      });
      if (r.ok) setMe({ ...me, pushEnabled: next });
    } finally {
      setPushBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center text-[var(--muted)]">載入中…</div>
    );
  }

  if (!me) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">尚未登入</h1>
        <p className="mt-3 text-[var(--muted)]">用 LINE 登入即可查看會員專區、管理報牌推播。</p>
        <a
          href="/auth/line/login"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#06C755] px-6 py-2.5 text-base font-bold text-white transition hover:brightness-110"
        >
          <span className="font-black">LINE</span> 登入
        </a>
      </div>
    );
  }

  const tierLabel = TIER_LABEL[me.tier] ?? me.tier;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold text-gradient">會員專區</h1>

      {/* 個人資料 */}
      <div className="glass mt-6 flex items-center gap-4 p-5">
        {me.picture ? (
          <img src={me.picture} alt={me.name} className="h-16 w-16 rounded-full object-cover ring-1 ring-[rgba(0,240,255,0.4)]" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-2)] text-2xl font-bold text-[var(--neon)] ring-1 ring-[rgba(0,240,255,0.4)]">
            {me.name.slice(0, 1)}
          </span>
        )}
        <div>
          <div className="text-lg font-bold text-[var(--text)]">{me.name}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">{me.hasLine ? "已綁定 LINE 帳號" : "未綁定 LINE"}</div>
        </div>
      </div>

      {/* 訂閱狀態 */}
      <div className="glass mt-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[var(--muted)]">目前方案</div>
            <div className="mt-1 font-display text-xl font-bold text-[var(--neon)]">{tierLabel}</div>
            {me.periodEnd && (
              <div className="mt-1 text-[13px] text-[var(--muted)]">有效至 {me.periodEnd.slice(0, 10)}</div>
            )}
          </div>
          <Link href="/pricing" className="btn-primary !px-5 !py-2 text-sm">
            {me.tier === "free" ? "升級訂閱" : "管理方案"}
          </Link>
        </div>
      </div>

      {/* 報牌推播開關 */}
      <div className="glass mt-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-[var(--text)]">每日 LINE 報牌推播</div>
            <div className="mt-1 text-[13px] text-[var(--muted)]">
              開啟後，開獎前由 808888 官方帳號把當日精選號推給你（需為官方帳號好友）。
            </div>
          </div>
          <button
            onClick={togglePush}
            disabled={pushBusy}
            aria-pressed={me.pushEnabled}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              me.pushEnabled ? "bg-[var(--cold)]" : "bg-[var(--surface-2)]"
            } ${pushBusy ? "opacity-60" : ""}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                me.pushEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 登出 */}
      <div className="mt-6 text-center">
        <a href="/auth/logout" className="text-sm text-[var(--muted)] hover:text-[var(--hot)]">
          登出
        </a>
      </div>

      <p className="mt-8 text-center text-[12px] text-[var(--muted)]">
        ⚠️ 樂透為獨立隨機事件，本站僅供參考娛樂，無法提高中獎率、不保證中獎。
      </p>
    </div>
  );
}
