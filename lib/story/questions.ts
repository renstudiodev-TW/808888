// 故事抓牌題庫（約 40 題）。數字題 15、選單題 10、文字題 15。
// Worker 依 id 回查這份題庫驗證答案，所以 id 一旦上線就不要改。
import type { Question } from "./types";

const ZODIAC_SIGNS = ["牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"];
const CHINESE_ZODIAC = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];

export const QUESTIONS: Question[] = [
  // ---- 數字題（15）----
  { id: "battery", kind: "number", label: "手機電量剩幾 %？", short: "手機電量", min: 0, max: 100, unit: "%" },
  { id: "age", kind: "number", label: "你今年幾歲？", short: "年齡", min: 18, max: 120, unit: "歲" },
  { id: "stepsToday", kind: "number", label: "今天大概走了幾步？（猜的也行）", short: "今天的步數", min: 0, max: 50000, unit: "步" },
  { id: "wakeHour", kind: "number", label: "今天早上幾點起床？（24 小時制，填整點）", short: "起床時間", min: 0, max: 23, unit: "點" },
  { id: "drinksToday", kind: "number", label: "今天已經喝了幾杯飲料？（咖啡、手搖都算）", short: "今天喝的飲料", min: 0, max: 20, unit: "杯" },
  { id: "browserTabs", kind: "number", label: "手機或電腦現在開了幾個瀏覽器分頁？", short: "瀏覽器分頁", min: 1, max: 200, unit: "個" },
  { id: "lineUnread", kind: "number", label: "LINE 現在有幾則未讀訊息？", short: "LINE 未讀", min: 0, max: 999, unit: "則" },
  { id: "commuteMin", kind: "number", label: "每天通勤單程大概要幾分鐘？", short: "通勤時間", min: 0, max: 180, unit: "分鐘" },
  { id: "sleepHours", kind: "number", label: "昨晚睡了幾小時？", short: "昨晚睡眠", min: 0, max: 14, unit: "小時" },
  { id: "lastMealPrice", kind: "number", label: "上一餐花了多少錢？", short: "上一餐", min: 0, max: 2000, unit: "元" },
  { id: "shoeSize", kind: "number", label: "你的鞋子穿幾號？（公分，例如 26）", short: "鞋子尺寸", min: 20, max: 35, unit: "號" },
  { id: "photoCount", kind: "number", label: "手機相簿大概有幾張照片？（猜的也行）", short: "相簿照片", min: 0, max: 99999, unit: "張" },
  { id: "floorNo", kind: "number", label: "你現在所在的建築物是在幾樓？", short: "所在樓層", min: 1, max: 60, unit: "樓" },
  { id: "walletCoins", kind: "number", label: "口袋或錢包裡的零錢大概有多少？", short: "口袋零錢", min: 0, max: 500, unit: "元" },
  { id: "screenMinutes", kind: "number", label: "今天手機螢幕大概用了幾分鐘？", short: "螢幕使用時間", min: 0, max: 1440, unit: "分鐘" },

  // ---- 選單題（10）----
  { id: "zodiacSign", kind: "choice", label: "你的星座是？", short: "星座", options: ZODIAC_SIGNS },
  { id: "chineseZodiac", kind: "choice", label: "你的生肖是？", short: "生肖", options: CHINESE_ZODIAC },
  { id: "outfitColor", kind: "choice", label: "今天穿什麼顏色的衣服？", short: "衣服顏色", options: ["黑", "白", "紅", "藍", "綠", "黃", "灰", "其他"] },
  { id: "breakfast", kind: "choice", label: "今天早餐吃什麼？", short: "早餐", options: ["蛋餅", "漢堡", "三明治", "飯糰", "燒餅油條", "麵包", "沒吃", "其他"] },
  { id: "weatherNow", kind: "choice", label: "你那邊現在的天氣？", short: "天氣", options: ["大太陽", "多雲", "陰天", "下雨", "起霧", "颳風"] },
  { id: "transport", kind: "choice", label: "今天主要靠什麼代步？", short: "交通工具", options: ["機車", "汽車", "捷運", "公車", "腳踏車", "走路", "火車高鐵", "沒出門"] },
  { id: "sweetness", kind: "choice", label: "手搖飲你通常點幾分糖？", short: "手搖甜度", options: ["無糖", "微糖", "半糖", "少糖", "正常糖", "我不喝手搖"] },
  { id: "moodNow", kind: "choice", label: "現在的心情比較像哪一種？", short: "心情", options: ["很放鬆", "有點累", "超有精神", "快餓死", "在放空", "想睡覺"] },
  { id: "midnightSnack", kind: "choice", label: "半夜肚子餓最想吃什麼？", short: "宵夜", options: ["泡麵", "鹽酥雞", "滷味", "炒飯", "冰淇淋", "水果", "忍住不吃"] },
  { id: "bloodType", kind: "choice", label: "你的血型是？", short: "血型", options: ["A 型", "B 型", "O 型", "AB 型", "不知道"] },

  // ---- 文字題（15，限 20 字）----
  { id: "firstSight", kind: "text", label: "今天出門看到的第一個東西是？", short: "出門第一眼", placeholder: "例如：黑貓、紅色機車" },
  { id: "lunch", kind: "text", label: "今天中午吃什麼？", short: "午餐", placeholder: "例如：排骨便當" },
  { id: "lastLaugh", kind: "text", label: "最近一次笑出來是因為什麼？", short: "讓你笑出來的事", placeholder: "例如：同事把咖啡打翻" },
  { id: "firstSong", kind: "text", label: "今天聽到的第一首歌是？", short: "今天第一首歌", placeholder: "例如：夜空中最亮的星" },
  { id: "wallpaper", kind: "text", label: "你的手機桌布是什麼畫面？", short: "手機桌布", placeholder: "例如：我家的狗" },
  { id: "lastDream", kind: "text", label: "最近夢到的東西是？", short: "夢境", placeholder: "例如：在飛的麵包" },
  { id: "lastSearch", kind: "text", label: "最近一次上網搜尋的是什麼？", short: "最近搜尋", placeholder: "例如：週末天氣" },
  { id: "dreamTrip", kind: "text", label: "最想去哪裡玩？", short: "想去的地方", placeholder: "例如：北海道" },
  { id: "childNickname", kind: "text", label: "小時候有什麼好笑的綽號？", short: "小時候的綽號", placeholder: "例如：小胖" },
  { id: "luckyThing", kind: "text", label: "最近遇到的一件小確幸是？", short: "小確幸", placeholder: "例如：剛好趕上公車" },
  { id: "drinkOrder", kind: "text", label: "手搖飲你最常點什麼？", short: "常點的飲料", placeholder: "例如：珍珠奶茶" },
  { id: "lastMovie", kind: "text", label: "最近看的一部電影或劇是？", short: "最近看的劇", placeholder: "例如：鬼滅之刃" },
  { id: "firstWords", kind: "text", label: "今天第一個跟你說話的人說了什麼？", short: "今天聽到的第一句話", placeholder: "例如：早安" },
  { id: "firstBuy", kind: "text", label: "如果中獎，第一件事想買什麼？", short: "中獎想買的東西", placeholder: "例如：一台新機車" },
  { id: "petName", kind: "text", label: "如果養寵物，你會取什麼名字？", short: "寵物名字", placeholder: "例如：旺財" },
];

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

/** Fisher-Yates 洗牌，回傳新陣列 */
function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 隨機抽一組題目（預設 3 題，可選 4 題）。至少一題數字題、一題文字題，其餘從剩下的題目任意抽，不重複。
 * 前端呼叫，每次進站或按「換一批題目」都重抽。
 */
export function drawQuestions(count = 3): Question[] {
  const total = Math.max(2, Math.min(count, 4));
  const numbers = shuffle(QUESTIONS.filter((q) => q.kind === "number"));
  const texts = shuffle(QUESTIONS.filter((q) => q.kind === "text"));
  const picked = [numbers[0], texts[0]];
  const rest = shuffle(QUESTIONS.filter((q) => !picked.includes(q)));
  picked.push(...rest.slice(0, total - picked.length));
  return shuffle(picked);
}
