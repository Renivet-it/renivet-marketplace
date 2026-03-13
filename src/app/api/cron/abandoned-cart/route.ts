import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema/cart";
import { users } from "@/lib/db/schema/user";
import { resend } from "@/lib/resend";
import AbandonedCartEmail from "@/lib/resend/emails/abandoned-cart-email";
import { and, eq, getTableColumns, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    console.log("CRON: Starting abandoned cart check...");

    try {
        // Find carts that are active (status = true) and haven't been updated in 2 hours
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        // Fetch carts older than 2 hours that are still active
        const abandonedCarts = await db
            .select({
                ...getTableColumns(carts),
                userEmail: users.email,
                userFirstName: users.firstName,
                hasReceivedAbandonedCartEmail:
                    users.hasReceivedAbandonedCartEmail,
            })
            .from(carts)
            .innerJoin(users, eq(carts.userId, users.id))
            .where(
                and(eq(carts.status, true), lte(carts.updatedAt, twoHoursAgo))
            );

        if (abandonedCarts.length === 0) {
            console.log("CRON: No abandoned carts found.");
            return NextResponse.json({
                message: "No abandoned carts found",
                count: 0,
            });
        }

        // Group by user ID
        const cartsByUser = abandonedCarts.reduce(
            (acc, cart) => {
                if (!acc[cart.userId]) {
                    acc[cart.userId] = {
                        email: cart.userEmail,
                        firstName: cart.userFirstName,
                        hasReceivedEmail: cart.hasReceivedAbandonedCartEmail,
                        items: [],
                    };
                }
                acc[cart.userId].items.push(cart);
                return acc;
            },
            {} as Record<string, any>
        );

        let emailsSent = 0;

        // Process each user
        for (const [userId, userData] of Object.entries(cartsByUser)) {
            // Skip if they already received the email
            if (userData.hasReceivedEmail) {
                console.log(
                    `CRON: User ${userId} already received abandoned cart email. Skipping.`
                );
                continue;
            }

            console.log(
                `CRON: Sending abandoned cart email to ${userData.email} (${userData.firstName})`
            );

            // 1. Send Email
            const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cart`;

            await resend.emails.send({
                from: "Renivet <support@updates.renivet.com>",
                to: userData.email,
                subject: "You left something behind! 🛒",
                react: AbandonedCartEmail({
                    customerName: userData.firstName,
                    checkoutUrl,
                }),
            });

            // 2. Update User flag to ensure we only send this once
            await db
                .update(users)
                .set({ hasReceivedAbandonedCartEmail: true })
                .where(eq(users.id, userId));

            emailsSent++;
        }

        console.log(
            `CRON: Abandoned cart check completed. Emails sent: ${emailsSent}`
        );
        return NextResponse.json({
            success: true,
            message: "Abandoned cart process completed",
            emailsSent,
        });
    } catch (error) {
        console.error("CRON ERROR:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
