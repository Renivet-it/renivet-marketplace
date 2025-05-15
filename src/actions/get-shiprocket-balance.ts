"use server";

import { shiprocket } from "@/lib/shiprocket";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
    key_id: process.env.RAZOR_PAY_KEY_ID!,
    key_secret: process.env.RAZOR_PAY_SECRET_KEY!,
});

export async function getShiprocketBalance(amount: number): Promise<string> {
    // Check authentication
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

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
            throw new Error("Failed to create Razorpay order");
        }
        return order.id; // Return the Razorpay order_id
    } catch (error) {
        console.error("Error creating Razorpay order:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}