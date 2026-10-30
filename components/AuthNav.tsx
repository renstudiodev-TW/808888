"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

interface Me {
  id: string;
  name: string;
  picture: string | null;
  tier: string;
  isAdmin?: boolean;
}

// header 右側登入狀態：未登入顯示「LINE 登入」，已登入顯示頭像+暱稱（連到會員專區）。
export function AuthNav() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Me | null) => setMe(d))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <span className="inline-block h-8 w-8" aria-hidden />;

  if (!me) {
    return (
      <a
        href="/auth/line/login"
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#06C755] px-2.5 py-1.5 text-[13px] font-bold text-white transition hover:brightness-110 sm:px-4 sm:text-sm"
      >
        <span className="font-black">LINE</span> 登入
      </a>
    );
  }

  const tier = TIER_STYLE[me.tier] ?? TIER_STYLE.free;

  return (
    <span className="flex shrink-0 items-center gap-2">
    {me.isAdmin && (
      <a
        href="/admin"
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[var(--primary)] bg-[rgba(139,92,246,0.15)] px-3 py-1.5 text-sm font-bold text-[var(--primary)] transition hover:brightness-125"
        title="管理後台"
      >
        🛠 後台
      </a>
    )}
    <a href="/member/" className={`flex shrink-0 items-center gap-2 ${tier.glow}`} title="會員專區">
      {me.picture ? (
        <img src={me.picture} alt={me.name} className={`h-8 w-8 rounded-full object-cover ring-2 ${tier.ring}`} />
      ) : (
        <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-bold text-[var(--neon)] ring-2 ${tier.ring}`}>
          {me.name.slice(0, 1)}
        </span>
      )}
      <span className="hidden items-center gap-1 sm:flex">
        <span className="max-w-[6rem] truncate text-sm font-semibold text-[var(--text)]">{me.name}</span>
        {tier.label && (
          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${tier.badge}`}>
            {tier.label}
          </span>
        )}
      </span>
    </a>
    </span>
  );
}

// 會員等級對應的外觀：普通灰、進階霓虹、旗艦金色尊榮。
const TIER_STYLE: Record<string, { label: string; ring: string; badge: string; glow: string }> = {
  free: { label: "", ring: "ring-[rgba(156,163,175,0.5)]", badge: "", glow: "" },
  pro: {
    label: "進階",
    ring: "ring-[var(--neon)]",
    badge: "border-[var(--neon)] bg-[rgba(0,240,255,0.12)] text-[var(--neon)]",
    glow: "",
  },
  max: {
    label: "👑 旗艦",
    ring: "ring-[#ffd24a]",
    badge: "border-[#ffd24a] bg-[rgba(255,210,74,0.14)] text-[#ffd24a]",
    glow: "drop-shadow-[0_0_6px_rgba(255,210,74,0.55)]",
  },
};
