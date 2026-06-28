"use client";

import { useEffect, useState } from "react";

// 頁尾累積到訪人次。
export function VisitCounter() {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visits", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setN(typeof d?.count === "number" ? d.count : null))
      .catch(() => {});
  }, []);

  if (n === null) return null;
  return (
    <span>
      累積到訪 <b className="num text-[var(--neon)]">{n.toLocaleString()}</b> 人次
    </span>
  );
}
