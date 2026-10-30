// 故事抓牌：前端與 Worker 共用的介面合約。改這裡要同時顧到 components/story 與 server/src/routes/story.ts。

export type StoryGame = "daily539" | "lotto649" | "superLotto638";

/** 題目類型：數字題直接取數、選單題依選項對應、文字題換算成數字 */
export type QuestionKind = "number" | "choice" | "text";

export interface Question {
  id: string; // 穩定代號，例如 "battery"；Worker 依此回查題庫，不信任前端傳來的題目文字
  kind: QuestionKind;
  label: string; // 題目文字，例如「手機電量剩幾 %？」
  placeholder?: string;
  options?: string[]; // kind = "choice" 才有
  min?: number; // kind = "number" 的合理輸入範圍
  max?: number;
  unit?: string; // 顯示用單位，例如「%」「歲」
}

/** 前端送出的單題答案 */
export interface StoryAnswer {
  questionId: string;
  value: string; // 數字題送數字字串、選單題送選項原文、文字題送原文（≤ 20 字）
}

export interface StoryRequest {
  game: StoryGame;
  answers: StoryAnswer[]; // 3～4 題
}

/** 每顆號碼與它的出處 */
export interface PickedNumber {
  n: number;
  source: string; // 給用戶看的出處，例如「手機電量 41%」「今天的日子」
}

export interface StoryResult {
  game: StoryGame;
  date: string; // 台灣日期 YYYY-MM-DD，號碼換算有混入
  numbers: PickedNumber[]; // 第一區，依號碼由小到大
  second?: PickedNumber; // 只有威力彩有（1～8）
  story: string; // 繁體中文短故事（≤ 150 字），每個號碼都出現在文中
  storySource: "ai" | "template"; // AI 失敗、超過次數或全站上限時為 template
  remaining: number; // 今天這個身分還剩幾次 AI 故事
}

/** API 錯誤回應：{ error: StoryErrorCode, message: string }，message 是可直接顯示給用戶的繁中文字 */
export type StoryErrorCode = "bad_request" | "invalid_answer" | "server_error";
