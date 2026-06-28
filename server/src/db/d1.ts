// Cloudflare D1 adapter（只在 Workers 入口 import）。
import type { Db } from "./context.js";

export interface D1PreparedStatement {
  bind(...vals: unknown[]): D1PreparedStatement;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}
export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  exec(sql: string): Promise<unknown>;
  batch(stmts: D1PreparedStatement[]): Promise<unknown>;
}

export class D1Db implements Db {
  constructor(private d1: D1Database) {}
  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.d1.prepare(sql).bind(...params).all<T>()).results;
  }
  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    return (await this.d1.prepare(sql).bind(...params).first<T>()) ?? undefined;
  }
  async run(sql: string, params: unknown[] = []): Promise<void> {
    await this.d1.prepare(sql).bind(...params).run();
  }
  async exec(sql: string): Promise<void> {
    // D1.exec 一次只吃一條；以分號切割（schema 內無字串含分號，安全）
    for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await this.d1.prepare(stmt).run();
    }
  }
}
