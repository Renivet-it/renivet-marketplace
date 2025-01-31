"use server";

import { shiprocket } from "@/lib/shiprocket";
import { auth } from "@clerk/nextjs/server";

export async function getShiprocketBalance() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

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

    return true;
}
