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
        // Find carts older than 24 hours that are still active
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
                and(eq(carts.status, true), lte(carts.updatedAt, oneDayAgo))
            );

        if (abandonedCarts.length === 0) {
            console.log("CRON: No abandoned carts found.");
            return NextResponse.json({
                message: "No abandoned carts found",
                count: 0,
            });
        }

        // Group by user
        const cartsByUser = abandonedCarts.reduce(
            (acc, cart) => {
                if (!acc[cart.userId]) {
                    acc[cart.userId] = {
                        email: cart.userEmail,
                        firstName: cart.userFirstName,
                        hasReceivedEmail: cart.hasReceivedAbandonedCartEmail,
                        itemCount: 0,
                    };
                }
                acc[cart.userId].itemCount++;
                return acc;
            },
            {} as Record<string, any>
        );

        let emailsSent = 0;

        const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/mycart`;

        for (const [userId, userData] of Object.entries(cartsByUser)) {
            if (userData.hasReceivedEmail) {
                console.log(
                    `CRON: User ${userId} already received abandoned cart email. Skipping.`
                );
                continue;
            }

            const { email, firstName, itemCount } = userData;

            try {
                await resend.emails.send({
                    from: "Renivet <support@updates.renivet.com>",
                    to: email,
                    subject: `You left ${itemCount} item${itemCount > 1 ? "s" : ""} behind! 🛒`,
                    react: AbandonedCartEmail({
                        customerName: firstName,
                        checkoutUrl,
                    }),
                });

                // Mark as notified so we don't send again
                await db
                    .update(users)
                    .set({ hasReceivedAbandonedCartEmail: true })
                    .where(eq(users.id, userId));

                emailsSent++;
                console.log(`CRON: Email sent to ${email}`);
            } catch (emailErr) {
                console.error(`CRON: Email failed for ${email}:`, emailErr);
            }
        }

        console.log(`CRON: Done. Emails sent: ${emailsSent}`);
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
