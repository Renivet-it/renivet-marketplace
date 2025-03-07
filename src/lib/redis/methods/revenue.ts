import { getDate } from "@/lib/utils";
import { redis } from "..";

export interface RevenueData {
    amount: number;
    orderId: string;
    paymentId: string;
    refundId?: string;
    type: "payment" | "refund";
    success: boolean;
}

interface RevenueStats {
    grossRevenue: number;
    netRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    change: {
        grossRevenue: number;
        netRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
    };
}

class Revenue {
    async track(brandId: string, data: RevenueData) {
        const key = ["revenue", brandId, getDate()].join("::");
        const value = JSON.stringify(data);
        await redis.rpush(key, value);
    }

    async retrieveByRange({
        brandId,
        nDays,
    }: {
        brandId: string;
        nDays: number;
    }) {
        const pipeline = redis.pipeline();
        const dates: string[] = [];

        for (let i = 0; i < nDays; i++) {
            const date = getDate(i);
            dates.push(date);
            const key = ["revenue", brandId, date].join("::");
            pipeline.lrange(key, 0, -1);
        }

        const results = await pipeline.exec();

        return dates.map((date, index) => {
            const dayData = (results?.[index]?.[1] as string[] | null) ?? [];
            const transactions = dayData.map(
                (item) => JSON.parse(item) as RevenueData
            );

            const payments = transactions.filter(
                (t) => t.type === "payment" && t.success
            );
            const refunds = transactions.filter(
                (t) => t.type === "refund" && t.success
            );

            const totalPayments = payments.reduce(
                (sum, t) => sum + t.amount,
                0
            );
            const totalRefunds = refunds.reduce((sum, t) => sum + t.amount, 0);

            return {
                date,
                revenue: totalPayments - totalRefunds,
                payments: totalPayments,
                refunds: totalRefunds,
                transactions,
            };
        });
    }

    private calculateStats(
        data: Awaited<ReturnType<typeof this.retrieveByRange>>,
        splitIndex: number
    ) {
        const current = data.slice(0, splitIndex);
        const previous = data.slice(splitIndex);

        const calculate = (items: typeof current) => {
            const grossRevenue = items.reduce(
                (sum, day) => sum + day.payments,
                0
            );
            const netRevenue = items.reduce((sum, day) => sum + day.revenue, 0);
            const uniqueOrders = new Set(
                items.flatMap((day) =>
                    day.transactions
                        .filter((t) => t.type === "payment" && t.success)
                        .map((t) => t.orderId)
                )
            );
            const totalOrders = uniqueOrders.size;
            const averageOrderValue = totalOrders
                ? grossRevenue / totalOrders
                : 0;

            return { grossRevenue, netRevenue, totalOrders, averageOrderValue };
        };

        const currentStats = calculate(current);
        const previousStats = calculate(previous);

        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            ...currentStats,
            change: {
                grossRevenue: calculateChange(
                    currentStats.grossRevenue,
                    previousStats.grossRevenue
                ),
                netRevenue: calculateChange(
                    currentStats.netRevenue,
                    previousStats.netRevenue
                ),
                totalOrders: calculateChange(
                    currentStats.totalOrders,
                    previousStats.totalOrders
                ),
                averageOrderValue: calculateChange(
                    currentStats.averageOrderValue,
                    previousStats.averageOrderValue
                ),
            },
        };
    }

    async getStats(brandId: string, days: number): Promise<RevenueStats> {
        const data = await this.retrieveByRange({ brandId, nDays: days * 2 });
        return this.calculateStats(data, days);
    }
}

export const revenue = new Revenue();
