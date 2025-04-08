import { sql } from "drizzle-orm";

export function hasMedia<T extends Record<string, any>>(table: T, column: keyof T) {
  return sql`jsonb_array_length(${table[column]}) > 0`;
}

export function noMedia<T extends Record<string, any>>(table: T, column: keyof T) {
  return sql`jsonb_array_length(${table[column]}) = 0`;
}
