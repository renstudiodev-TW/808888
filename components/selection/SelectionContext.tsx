"use client";

// 全站共用的「自選號碼」狀態。選號框、黏頂顯示條、各工具的判語與高亮都讀這裡。
// 設計：tolerant hook（不在 Provider 內回 null），避免任何工具被單獨重用時炸掉。

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface SelectionConfig {
  game: string;
  pool: number;
  pick: number;
  /** 第二區號池（威力彩=8）；無第二區傳 null */
  secondPool: number | null;
}

export interface SelectionState extends SelectionConfig {
  picks: number[];
  special: number | null;
  full: boolean;
  toggle: (n: number) => void;
  setSpecial: (n: number | null) => void;
  clear: () => void;
  randomFill: () => void;
}

const Ctx = createContext<SelectionState | null>(null);

/** 取得選號狀態；不在 Provider 內時回 null（呼叫端自行 null-check）。 */
export function useSelection(): SelectionState | null {
  return useContext(Ctx);
}

export function SelectionProvider({
  game,
  pool,
  pick,
  secondPool,
  children,
}: SelectionConfig & { children: ReactNode }) {
  const [picks, setPicks] = useState<number[]>([]);
  const [special, setSpecial] = useState<number | null>(null);

  // 換彩種時清空，並從 localStorage 還原該彩種上次的牌（在 effect 內做，避免 SSR/hydration 不一致）
  useEffect(() => {
    setPicks([]);
    setSpecial(null);
    try {
      const raw = localStorage.getItem(`pick:${game}`);
      if (raw) {
        const o = JSON.parse(raw);
        if (Array.isArray(o.picks)) {
          setPicks(o.picks.filter((n: number) => Number.isInteger(n) && n >= 1 && n <= pool).slice(0, pick));
        }
        if (typeof o.special === "number" && secondPool && o.special >= 1 && o.special <= secondPool) {
          setSpecial(o.special);
        }
      }
    } catch {
      /* localStorage 不可用時忽略 */
    }
  }, [game, pool, pick, secondPool]);

  useEffect(() => {
    try {
      localStorage.setItem(`pick:${game}`, JSON.stringify({ picks, special }));
    } catch {
      /* ignore */
    }
  }, [game, picks, special]);

  const toggle = useCallback(
    (n: number) => {
      setPicks((cur) =>
        cur.includes(n)
          ? cur.filter((x) => x !== n)
          : cur.length >= pick
            ? cur
            : [...cur, n].sort((a, b) => a - b),
      );
    },
    [pick],
  );

  const clear = useCallback(() => {
    setPicks([]);
    setSpecial(null);
  }, []);

  const randomFill = useCallback(() => {
    const bag = Array.from({ length: pool }, (_, i) => i + 1);
    const out: number[] = [];
    while (out.length < pick && bag.length) {
      out.push(bag.splice(Math.floor(Math.random() * bag.length), 1)[0]);
    }
    setPicks(out.sort((a, b) => a - b));
    if (secondPool) setSpecial(Math.floor(Math.random() * secondPool) + 1);
  }, [pool, pick, secondPool]);

  const value = useMemo<SelectionState>(
    () => ({
      game,
      pool,
      pick,
      secondPool,
      picks,
      special,
      full: picks.length === pick,
      toggle,
      setSpecial,
      clear,
      randomFill,
    }),
    [game, pool, pick, secondPool, picks, special, toggle, clear, randomFill],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
