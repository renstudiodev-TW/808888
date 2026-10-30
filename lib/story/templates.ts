// 備援用的範本故事：AI 失敗、逾時或沒有次數時使用。口語、自然，每個號碼保證出現在文中。
import type { PickedNumber, StoryGame } from "./types";
import { cyrb53 } from "./numbers";
import { checkStoryOutput } from "./validate";

interface Slots {
  a: string; // 錨點出處，例如「手機電量 41%」
  n1: number; // 錨點號碼
  list: string; // 全部第一區號碼，例如「2、17、25」
  cn: string; // 號碼個數的中文，例如「五」
}

const COUNT_ZH: Record<number, string> = { 3: "三", 4: "四", 5: "五", 6: "六", 7: "七" };

// 至少 12 種句型。不用破折號，不出現必中或保證之類的詞。
const PATTERNS: ((s: Slots) => string)[] = [
  (s) => `說到${s.a}，我第一個想到的就是 ${s.n1}。再加上今天其他的小線索，最後記下 ${s.list}。`,
  (s) => `朋友問我今天的幸運數字，我看了看${s.a}，直接報 ${s.n1}，剩下的慢慢湊，最後寫在備忘錄裡：${s.list}。`,
  (s) => `早上有點恍神，想到${s.a}，腦中就冒出 ${s.n1}。中午吃飯時又補了幾個，今天這組是 ${s.list}。`,
  (s) => `${s.a}，這件小事今天一直在我腦袋裡轉，轉著轉著就轉出 ${s.n1}。收工前整理一下，號碼是 ${s.list}。`,
  (s) => `晚上跟朋友聊天，聊到${s.a}，大家都說 ${s.n1} 聽起來很順耳。於是我們一人貢獻一個，湊成 ${s.list}。`,
  (s) => `今天最有印象的是${s.a}，所以 ${s.n1} 先卡位。其他號碼就看緣分，這次手上的是 ${s.list}。`,
  (s) => `走在路上突然想起${s.a}，覺得 ${s.n1} 好像在跟我打招呼。回家寫下來，一共${s.cn}個：${s.list}。`,
  (s) => `如果今天要挑一組號碼，我會從${s.a}開始，先放 ${s.n1}，再把其他線索排進去，結果是 ${s.list}。`,
  (s) => `午休滑手機，看到${s.a}，莫名覺得 ${s.n1} 很順眼。順手把今天的靈感都記下來：${s.list}。`,
  (s) => `小時候外婆常說，生活裡的小事都藏著數字。今天的${s.a}讓我想到 ${s.n1}，整組寫下來是 ${s.list}。`,
  (s) => `下班路上我在想${s.a}這件事，${s.n1} 就這樣跳出來。回到家再補上其他的，今天的${s.cn}個號碼是 ${s.list}。`,
  (s) => `同事聽我講完${s.a}，笑著說那就選 ${s.n1} 吧。我們一起把其他號碼也定下來：${s.list}。`,
];

export const TEMPLATE_COUNT = PATTERNS.length;

const SECOND_PARTS: ((n: number) => string)[] = [
  (n) => `第二區就選 ${n}。`,
  (n) => `第二區補上 ${n}。`,
  (n) => `最後第二區放 ${n}。`,
];

const GENERIC_ANCHOR = "你剛剛填的這些答案";

/** 最簡短的保底句：只列號碼，仍然通過檢查 */
function plainStory(numbers: PickedNumber[], second?: PickedNumber): string {
  const list = numbers.map((x) => x.n).join("、");
  return `把你今天的答案湊一湊，算出來的號碼是 ${list}。${second ? `第二區是 ${second.n}。` : ""}`;
}

/**
 * 依答案與號碼產生範本故事。同樣的輸入加同一天會得到同樣的句型。
 * 出處文字可能含用戶輸入（文字題），若導致檢查不過就換下一個錨點，最後退回只列號碼的保底句。
 */
export function buildTemplateStory(game: StoryGame, numbers: PickedNumber[], second: PickedNumber | undefined, date: string): string {
  const nums = numbers.map((x) => x.n);
  const seed = cyrb53(`${game}|${date}|${nums.join(",")}|${second?.n ?? ""}`);
  const list = nums.join("、");
  const cn = COUNT_ZH[numbers.length] ?? String(numbers.length);

  // 錨點候選：有具體出處的號碼優先（綜合推算的不拿來當錨點），最後是通用說法
  const anchors: { a: string; n1: number }[] = numbers
    .filter((x) => !x.source.startsWith("綜合"))
    .map((x) => ({ a: x.source, n1: x.n }));
  const start = anchors.length ? seed % anchors.length : 0;
  const ordered = anchors.length ? [...anchors.slice(start), ...anchors.slice(0, start)] : [];
  ordered.push({ a: GENERIC_ANCHOR, n1: numbers[0]?.n ?? 0 });

  for (let i = 0; i < ordered.length; i++) {
    for (let j = 0; j < PATTERNS.length; j++) {
      const pattern = PATTERNS[(seed + j) % PATTERNS.length];
      let text = pattern({ ...ordered[i], list, cn });
      if (second) text += SECOND_PARTS[seed % SECOND_PARTS.length](second.n);
      if (checkStoryOutput(text, nums, second?.n).ok) return text;
      // 通常只有出處太長才會超字，換句型沒用的話跳到下一個錨點
      if (j >= 2) break;
    }
  }
  return plainStory(numbers, second);
}
