"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

interface Me {
  id: string;
  name: string;
  picture: string | null;
  tier: string;
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
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#06C755] px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110 sm:px-4"
      >
        <span className="font-black">LINE</span> 登入
      </a>
    );
  }

  return (
    <a href="/member/" className="flex shrink-0 items-center gap-2" title="會員專區">
      {me.picture ? (
        <img
          src={me.picture}
          alt={me.name}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-[rgba(0,240,255,0.4)]"
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-bold text-[var(--neon)] ring-1 ring-[rgba(0,240,255,0.4)]">
          {me.name.slice(0, 1)}
        </span>
      )}
      <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-[var(--text)] sm:inline">
        {me.name}
      </span>
    </a>
  );
}
