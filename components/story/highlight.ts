import type { StoryResult } from "@/lib/story/types";

export interface StorySegment {
  text: string;
  hit: boolean; // 是不是被選中的號碼
}

/** 全部號碼（第一區加第二區） */
export function allPickedNumbers(r: StoryResult): number[] {
  return [...r.numbers.map((x) => x.n), ...(r.second ? [r.second.n] : [])];
}

/** 把故事切成一般文字與號碼片段，號碼片段之後用醒目顏色標出來 */
export function splitStory(story: string, picked: number[]): StorySegment[] {
  const set = new Set(picked);
  return story
    .split(/(\d+)/)
    .filter((s) => s !== "")
    .map((s) => ({ text: s, hit: /^\d+$/.test(s) && set.has(Number(s)) }));
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
