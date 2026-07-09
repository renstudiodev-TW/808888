-- 訂單新增計費週期欄位 (M=月繳 / Y=年繳)，供 notify 判斷續期要加一個月還是一年。
ALTER TABLE orders ADD COLUMN cycle TEXT NOT NULL DEFAULT 'M';
