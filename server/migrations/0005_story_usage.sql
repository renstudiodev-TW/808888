-- 故事抓牌每日 AI 使用次數。who = "m:<會員id>" 或 "ip:<雜湊前 16 碼>"，全站合計用 "__all__"。
-- 刻意不存用戶填的答案內容。
CREATE TABLE IF NOT EXISTS story_usage (
  day TEXT NOT NULL,
  who TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, who)
);
