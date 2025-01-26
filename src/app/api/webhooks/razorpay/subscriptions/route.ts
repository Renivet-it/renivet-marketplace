import crypto from "crypto";
import { env } from "@/../env";
import { brandSubscriptionQueries } from "@/lib/db/queries";
import { brandCache, planCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import {
    BrandSubscribed,
    BrandSubscriptionCharged,
    BrandUnsubscribed,
} from "@/lib/resend/emails";
import { AppError, CResponse, handleError } from "@/lib/utils";
import { razorpaySubscriptionWebhookSchema } from "@/lib/validations";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        const secret = env.RAZOR_PAY_WEBHOOK_SECRET;

        const isValid = validateWebhookSignature(body, signature, secret);
        if (!isValid) throw new AppError("Invalid signature", "BAD_REQUEST");

        const payload = razorpaySubscriptionWebhookSchema.parse(
            JSON.parse(body)
        );

        const existingSubscription =
            await brandSubscriptionQueries.getBrandSubscriptionById(
                payload.payload.subscription.entity.id
            );
        if (!existingSubscription)
            throw new AppError("Subscription not found", "NOT_FOUND");

        if (
            existingSubscription.planId !==
            payload.payload.subscription.entity.plan_id
        )
            throw new AppError("Invalid subscription", "BAD_REQUEST");

        const [existingBrand, existingPlan] = await Promise.all([
            brandCache.get(existingSubscription.brandId),
            planCache.get(existingSubscription.planId),
        ]);
        if (!existingBrand) throw new AppError("Brand not found", "NOT_FOUND");
        if (!existingPlan) throw new AppError("Plan not found", "NOT_FOUND");

        switch (payload.event) {
            case "subscription.authenticated":
                await Promise.all([
                    brandSubscriptionQueries.updateBrandSubscription(
                        existingSubscription.id,
                        {
                            isActive: true,
                            renewedAt: new Date(),
                        }
                    ),
                    brandCache.remove(existingSubscription.brandId),
                ]);

                await resend.emails.send({
                    from: env.RESEND_EMAIL_FROM,
                    to: existingBrand.email,
                    subject: "Subscription started",
                    react: BrandSubscribed({
                        brand: existingBrand,
                        plan: existingPlan,
                    }),
                });

                break;

            case "subscription.charged":
                await Promise.all([
                    brandSubscriptionQueries.updateBrandSubscription(
                        existingSubscription.id,
                        {
                            isActive: true,
                            renewedAt: new Date(),
                        }
                    ),
                    brandCache.remove(existingSubscription.brandId),
                ]);

                await resend.emails.send({
                    from: env.RESEND_EMAIL_FROM,
                    to: existingBrand.email,
                    subject: "Subscription renewed",
                    react: BrandSubscriptionCharged({
                        brand: existingBrand,
                        plan: existingPlan,
                    }),
                });
                break;

            case "subscription.cancelled":
                await Promise.all([
                    brandSubscriptionQueries.updateBrandSubscription(
                        existingSubscription.id,
                        {
                            isActive: false,
                            renewedAt: null,
                        }
                    ),
                    brandCache.remove(existingSubscription.brandId),
                ]);

                await resend.emails.send({
                    from: env.RESEND_EMAIL_FROM,
                    to: existingBrand.email,
                    subject: "Subscription cancelled",
                    react: BrandUnsubscribed({
                        brand: existingBrand,
                        plan: existingPlan,
                    }),
                });
                break;
        }

        return CResponse({
            message: "OK",
        });
    } catch (err) {
        return handleError(err);
    }
}

function validateWebhookSignature(
    body: string,
    signature: string | null,
    secret: string | undefined
): boolean {
    if (!signature || !secret) return false;

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}
