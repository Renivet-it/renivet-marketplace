"use server";

import crypto from "crypto";
import { env } from "@/../env";
import { brandCache, userCache } from "@/lib/redis/methods";
import { RazorpaySubscriptionResponse } from "@/lib/validations";
import { auth } from "@clerk/nextjs/server";

export async function verifySubscription({
    razorpay_payment_id,
    razorpay_signature,
    razorpay_subscription_id,
}: RazorpaySubscriptionResponse) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const secret = env.RAZOR_PAY_SECRET_KEY;

    const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest("hex");

    if (generated_signature !== razorpay_signature)
        throw new Error("Invalid signature");

    const existingUser = await userCache.get(userId);
    if (!existingUser) throw new Error("User not found");
    if (!existingUser.brand) throw new Error("User does not have a brand");

    const existingBrand = await brandCache.get(existingUser.brand.id);
    if (!existingBrand) throw new Error("Brand not found");

    const existingSubscription = existingBrand.subscriptions.find(
        (sub) => sub.id === razorpay_subscription_id
    );
    if (!existingSubscription) throw new Error("Subscription not found");

    return existingSubscription;
}
