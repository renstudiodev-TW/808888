"use client";

import {
  Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
  Area, AreaChart, CartesianGrid, ReferenceLine,
} from "recharts";
import type {
  HotColdItem, OmissionItem, TailItem, ZoneItem, ZodiacItem,
} from "@/lib/lottery/indicators";
import { useSelection } from "./selection/SelectionContext";
import { acValue } from "@/lib/lottery/util";

const PICK_STROKE = "#fff";
/** 高亮選中號碼的長條：白框 + 不透明。 */
function pickedCellProps(on: boolean): { stroke?: string; strokeWidth?: number; fillOpacity?: number } {
  return on ? { stroke: PICK_STROKE, strokeWidth: 2, fillOpacity: 1 } : {};
}

const HOT = "#ff2a5f";
const COLD = "#00ff87";
const NEON = "#00f0ff";
const PRIMARY = "#8b5cf6";
const MUTED = "#9ca3af";

const tooltipStyle = {
  background: "rgba(14,20,32,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.5rem",
  color: "#f3f4f6",
  fontSize: "12px",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** 冷熱號長條圖 (近 W 期出現次數) */
export function HotColdChart({ data }: { data: HotColdItem[] }) {
  const sel = useSelection();
  const picked = new Set(sel?.picks ?? []);
  const rows = data.map((d) => ({ name: pad(d.n), num: d.n, freq: d.freq, tag: d.tag, expected: d.expected }));
  const expected = data[0]?.expected ?? 0;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 10 }} interval={1} />
        <YAxis tick={{ fill: MUTED, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} 次 (期望 ${expected})`, "出現"]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="freq" radius={[3, 3, 0, 0]}>
          {rows.map((r, i) => (
            <Cell
              key={i}
              fill={r.tag === "hot" ? HOT : r.tag === "cold" ? COLD : PRIMARY}
              fillOpacity={r.tag === "normal" ? 0.5 : 0.95}
              {...pickedCellProps(picked.has(r.num))}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 遺漏值排行 (當前遺漏期數，前 15 名) */
export function OmissionChart({ data }: { data: OmissionItem[] }) {
  const sel = useSelection();
  const picked = new Set(sel?.picks ?? []);
  const rows = [...data].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 15)
    .map((d) => ({ name: pad(d.n), num: d.n, current: d.currentMiss, avg: d.avgMiss }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart layout="vertical" data={rows} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
        <XAxis type="number" tick={{ fill: MUTED, fontSize: 10 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} width={28} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v, k) => [`${v} 期`, k === "current" ? "當前遺漏" : "平均遺漏"]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="current" radius={[0, 3, 3, 0]} fill={NEON} fillOpacity={0.9}>
          {rows.map((r, i) => (
            <Cell key={i} fill={NEON} fillOpacity={0.9} {...pickedCellProps(picked.has(r.num))} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 尾數分佈 (0-9) */
export function TailChart({ data }: { data: TailItem[] }) {
  const sel = useSelection();
  const pickedTails = new Set((sel?.picks ?? []).map((n) => n % 10));
  const rows = data.map((d) => ({ name: `尾${d.tail}`, tail: d.tail, freq: d.freq, tag: d.tag }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} />
        <YAxis tick={{ fill: MUTED, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} 次`, "出現"]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="freq" radius={[3, 3, 0, 0]}>
          {rows.map((r, i) => (
            <Cell
              key={i}
              fill={r.tag === "hot" ? HOT : r.tag === "cold" ? COLD : PRIMARY}
              fillOpacity={r.tag === "normal" ? 0.5 : 0.95}
              {...pickedCellProps(pickedTails.has(r.tail))}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 區間冷熱 */
export function ZoneChart({ data }: { data: ZoneItem[] }) {
  const rows = data.map((d) => ({ name: d.label, freq: d.freq }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 10 }} />
        <YAxis tick={{ fill: MUTED, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} 次`, "出現"]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="freq" radius={[3, 3, 0, 0]} fill={PRIMARY} fillOpacity={0.85} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 生肖近期熱度 */
export function ZodiacChart({ data }: { data: ZodiacItem[] }) {
  const rows = data.map((d) => ({ name: d.zodiac, freq: d.freq }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} />
        <YAxis tick={{ fill: MUTED, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} 次`, "出現"]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="freq" radius={[3, 3, 0, 0]} fill={NEON} fillOpacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 和值分佈直方圖 */
export function SumChart({ data }: { data: { bucket: string; count: number }[] }) {
  const sel = useSelection();
  // 把使用者的和值對到所屬區間，畫一條參考線標出「你在這」
  let mySum: number | null = null;
  let myBucket: string | null = null;
  if (sel?.full) {
    mySum = sel.picks.reduce((a, b) => a + b, 0);
    for (const d of data) {
      const m = d.bucket.match(/(-?\d+)\D+(-?\d+)/);
      if (m && mySum >= Number(m[1]) && mySum <= Number(m[2])) myBucket = d.bucket;
    }
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="sumFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={NEON} stopOpacity={0.5} />
            <stop offset="100%" stopColor={NEON} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="bucket" tick={{ fill: MUTED, fontSize: 9 }} />
        <YAxis tick={{ fill: MUTED, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} 期`, "和值落點"]} cursor={{ stroke: NEON }} />
        <Area type="monotone" dataKey="count" stroke={NEON} fill="url(#sumFill)" strokeWidth={2} />
        {myBucket && (
          <ReferenceLine
            x={myBucket}
            stroke="#fff"
            strokeDasharray="4 2"
            label={{ value: `你 ${mySum}`, position: "top", fill: "#fff", fontSize: 11 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** AC 值分佈 */
export function ACChart({ data }: { data: { ac: number; count: number }[] }) {
  const sel = useSelection();
  const myAc = sel?.full ? acValue(sel.picks) : null;
  const rows = data.map((d) => ({ name: String(d.ac), ac: d.ac, count: d.count }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 10 }} />
        <YAxis tick={{ fill: MUTED, fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} 期`, "AC 值"]} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]} fill={PRIMARY} fillOpacity={0.85}>
          {rows.map((r, i) => (
            <Cell key={i} fill={PRIMARY} fillOpacity={0.85} {...pickedCellProps(myAc === r.ac)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
