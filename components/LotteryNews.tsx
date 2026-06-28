"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  title: string;
  link: string;
  date: string;
  source: string;
}

function shortDate(s: string): string {
  if (!s) return "";
  const t = Date.parse(s);
  if (Number.isNaN(t)) return "";
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// 首頁「樂透新聞」：即時抓樂透相關新聞標題，點擊開新分頁到原報導。
export function LotteryNews() {
  const [news, setNews] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setNews(d?.news ?? []))
      .catch(() => setNews([]));
  }, []);

  if (news === null) {
    return <div className="glass p-5 text-center text-sm text-[var(--muted)]">新聞載入中…</div>;
  }
  if (!news.length) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {news.slice(0, 8).map((n, i) => (
        <a
          key={i}
          href={n.link}
          target="_blank"
          rel="noopener noreferrer"
          className="glass flex items-start gap-3 p-3 transition hover:border-[var(--neon)]"
        >
          <span className="mt-0.5 text-[var(--hot)]">📰</span>
          <span className="flex-1">
            <span className="line-clamp-2 text-sm text-[var(--text)]">{n.title}</span>
            <span className="mt-1 block text-[11px] text-[var(--muted)]">
              {[n.source, shortDate(n.date)].filter(Boolean).join(" · ")}
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}
