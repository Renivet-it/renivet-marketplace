"use server";


import { shiprocket } from "@/lib/shiprocket";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "@/../env";
import { RazorpayPaymentResponse } from "@/lib/validations";
// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID!,
    key_secret: process.env.RAZOR_PAY_SECRET_KEY!,
});

export async function getShiprocketBalance(amount: number): Promise<string> {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
        console.error("Authentication failed: No user ID found");
        throw new Error("Unauthorized");
    }

    // Check Shiprocket balance
    const sr = await shiprocket();
    const srBalance = await sr.getBalance();
    if (!srBalance.status || !srBalance.data) {
        console.error("Failed to fetch Shiprocket balance", srBalance);
        throw new Error("Cannot proceed with payment, please try again later");
    }

    if (srBalance.data < 101) {
        console.error("Insufficient Shiprocket balance", srBalance);
        throw new Error("Cannot proceed with payment, please try again later");
    }

    // Create Razorpay order if balance check passes
    try {
        const order = await razorpay.orders.create({
            amount: amount, // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });
        if (!order.id) {
            console.error("Razorpay order creation failed: No order ID returned");
            throw new Error("Failed to create Razorpay order");
        }
        console.log("Razorpay order created successfully:", order.id);
        return order.id; // Return the Razorpay order_id
    } catch (error) {
        console.error("Error creating Razorpay order:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}
export async function verifyPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
}: RazorpayPaymentResponse): Promise<boolean> {
    try {
        console.log("Verifying payment with payload:", {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        });

        // Step 1: Check user authentication
        const { userId } = await auth();
        if (!userId) {
            console.error("Authentication failed: No user ID found");
            throw new Error("Unauthorized");
        }
        console.log("User authenticated successfully:", userId);

        // Step 2: Verify the payment signature
        const secret = env.RAZOR_PAY_SECRET_KEY;
        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            console.error("Payment signature verification failed:", {
                generated_signature,
                provided_signature: razorpay_signature,
            });
            throw new Error("Invalid signature");
        }
        console.log("Payment signature verified successfully");

        return true;
    } catch (error) {
        console.error("Payment verification failed:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}