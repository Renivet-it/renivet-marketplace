"use server";

import { shiprocket } from "@/lib/shiprocket";

export async function generateInvoice(orderId: any) {
    try {
        const sr = await shiprocket();

        // Convert orderId to number and pass as array
        const numericId = parseInt(orderId, 10);
        if (isNaN(numericId)) {
            throw new Error("Invalid order ID");
        }

        const response = await sr.generateInvoice({ ids: [numericId] });

        if (!response.status || !response.data) {
            console.error("Failed to generate invoice", response.message);
            throw new Error(response.message || "Failed to generate invoice");
        }

        return { invoiceUrl: response.data };
    } catch (error: any) {
        console.error("Error in generateInvoice:", error);
        throw new Error(error.message || "Failed to generate invoice");
    }
}