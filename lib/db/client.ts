/**
 * Minimal interface matching Cloudflare D1's D1Database and D1PreparedStatement
 */
export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean; meta?: unknown }>;
  run(): Promise<{ success: boolean; meta?: unknown }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<Array<{ results: T[]; success: boolean }>>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}
