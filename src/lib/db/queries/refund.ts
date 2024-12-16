import { CreateRefund, Refund } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { db } from "..";
import { refunds } from "../schema";

class RefundQuery {
    async createRefund(values: CreateRefund) {
        const data = await db
            .insert(refunds)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateRefundStatus(refundId: string, status: Refund["status"]) {
        const data = await db
            .update(refunds)
            .set({ status })
            .where(eq(refunds.id, refundId))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const refundQueries = new RefundQuery();
