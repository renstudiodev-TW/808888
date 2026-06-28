"use client";

import { useEffect, useRef } from "react";

// 駭客任務風格的代碼雨背景。低透明度，放在 hero 後面，不蓋住文字。
// 之後生好的「賽博財神爺」圖會疊在這之上。
export function CodeRain({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cnv = ref.current;
    if (!cnv) return;
    const ctx = cnv.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = "0123456789７８９６５８発發ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱ".split("");
    const fontSize = 16;
    let columns = 0;
    let drops: number[] = [];
    let raf = 0;
    let cw = 0;
    let ch = 0;

    const resize = () => {
      const parent = cnv.parentElement;
      cw = parent ? parent.clientWidth : window.innerWidth;
      ch = parent ? parent.clientHeight : 400;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cnv.width = cw * dpr;
      cnv.height = ch * dpr;
      cnv.style.width = cw + "px";
      cnv.style.height = ch + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.max(1, Math.floor(cw / fontSize));
      drops = Array.from({ length: columns }, () => Math.random() * (ch / fontSize));
    };
    resize();
    window.addEventListener("resize", resize);

    // 節流：每隔 stepMs 才推進一次雨滴，數字越大雨越慢（60fps 約等於 16ms）。
    const stepMs = 95;
    let last = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (t - last < stepMs) return;
      last = t;
      ctx.fillStyle = "rgba(8, 11, 16, 0.12)";
      ctx.fillRect(0, 0, cw, ch);
      ctx.font = `${fontSize}px ui-monospace, monospace`;
      for (let i = 0; i < columns; i++) {
        const c = chars[(Math.random() * chars.length) | 0];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const lead = Math.random() > 0.975;
        ctx.fillStyle = lead ? "rgba(0,240,255,0.9)" : "rgba(0,255,135,0.45)";
        ctx.fillText(c, x, y);
        if (y > ch && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
    };

    if (reduce) {
      ctx.font = `${fontSize}px ui-monospace, monospace`;
      ctx.fillStyle = "rgba(0,255,135,0.22)";
      for (let i = 0; i < columns; i++)
        for (let j = 0; j < ch / fontSize; j += 2)
          if (Math.random() > 0.6) ctx.fillText(chars[(Math.random() * chars.length) | 0], i * fontSize, j * fontSize);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5, pointerEvents: "none" }}
    />
  );
}
