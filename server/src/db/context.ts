// DB 抽象介面（async，本地 node:sqlite 與 Cloudflare D1 共用）。
// 用 AsyncLocalStorage 做 per-request 注入：
//  - 本地：整個 app 跑在一個 node:sqlite 單例的 context。
//  - Workers：每個 request 注入該 request 的 D1 binding。
// repos 只透過 getDb() 取得，不直接 import 任何具體 driver（避免 node:sqlite 被打包進 Workers）。

import { AsyncLocalStorage } from "node:async_hooks";

export interface Db {
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<void>;
  exec(sql: string): Promise<void>;
}

export const dbAls = new AsyncLocalStorage<Db>();

export function getDb(): Db {
  const db = dbAls.getStore();
  if (!db) throw new Error("無 DB context：請在 dbAls.run(db, ...) 內呼叫，或經由 withDb 中介層");
  return db;
}

/** 在指定 db context 內執行（scripts / 中介層用） */
export function runWithDb<T>(db: Db, fn: () => Promise<T> | T): Promise<T> {
  return Promise.resolve(dbAls.run(db, fn as () => Promise<T>));
}
