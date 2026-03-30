import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * WHY globalThis?
 * ───────────────
 * Next.js hot-reloads re-execute this file on EVERY file save during development.
 * Without caching the connection on globalThis, each reload creates a NEW connection
 * pool and the old one is NEVER closed — leaking connections until Supabase/Postgres
 * hits its limit and throws "Max client connections reached".
 *
 * globalThis persists across hot-reloads, so we reuse the same single connection.
 *
 * WHY max: 1?
 * ───────────
 * Supabase's Transaction Pooler (port 6543) has a hard limit of ~15 server connections
 * shared across ALL clients. With max:1, each Next.js instance uses exactly 1 connection.
 * postgres-js will queue queries internally — this is safe and fast.
 *
 * WHY prepare: false?
 * ───────────────────
 * Supabase's Transaction Pooler uses PgBouncer in transaction mode.
 * Prepared statements do NOT work through PgBouncer — they cause silent failures
 * and connection exhaustion. This flag is REQUIRED.
 */

const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

const connection =
    globalForDb.conn ??
    postgres(process.env.DATABASE_URL!, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
        max_lifetime: 60 * 30,
        prepare: false,
    });

globalForDb.conn = connection;

export const db = drizzle(connection, { schema });
