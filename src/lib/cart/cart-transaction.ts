import { sql } from "drizzle-orm";

type CartLockDatabase<TTransaction> = {
    transaction: <T>(
        callback: (transaction: TTransaction) => Promise<T>
    ) => Promise<T>;
};

export async function withCartTransactionLock<
    T,
    TTransaction extends { execute: (...args: any[]) => Promise<unknown> },
>(
    database: CartLockDatabase<TTransaction>,
    lockKey: string,
    operation: (transaction: TTransaction) => Promise<T>
) {
    return database.transaction(async (transaction) => {
        await transaction.execute(
            sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`
        );
        return operation(transaction);
    });
}
