// 故事抓牌支援的彩種規格。玩家「要選」的號碼個數，不是開獎個數（大樂透特別號由開獎產生，玩家不選）。
import type { StoryGame } from "./types";

export interface StoryGameSpec {
  id: StoryGame;
  name: string;
  pick: number; // 第一區要選幾個
  pool: number; // 第一區範圍 1～pool
  second?: { pick: 1; pool: number }; // 第二區（威力彩 1～8）
}

export const STORY_GAMES: Record<StoryGame, StoryGameSpec> = {
  daily539: { id: "daily539", name: "今彩539", pick: 5, pool: 39 },
  lotto649: { id: "lotto649", name: "大樂透", pick: 6, pool: 49 },
  superLotto638: { id: "superLotto638", name: "威力彩", pick: 6, pool: 38, second: { pick: 1, pool: 8 } },
};

export const STORY_GAME_ORDER: StoryGame[] = ["daily539", "lotto649", "superLotto638"];
