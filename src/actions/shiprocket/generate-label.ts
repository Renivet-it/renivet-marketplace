"use server";

import { shiprocket } from "@/lib/shiprocket";

export async function generateLabel(shipmentId: any) {
    try {
        console.log("Generating label for shipmentId:", shipmentId);

        const sr = await shiprocket();
        console.log("Shiprocket client initialized successfully");

        // Convert shipmentId to number
        const numericId = parseInt(shipmentId, 10);
        if (isNaN(numericId)) {
            console.error("Invalid shipment ID: Not a number", shipmentId);
            throw new Error("Invalid shipment ID");
        }
        console.log("Numeric shipment ID:", numericId);

        // Ensure the shipment_id is passed as an array of numbers
        const response = await sr.generateLabel({ shipment_id: [numericId] });
        console.log("Shiprocket API response:", JSON.stringify(response, null, 2));

        if (!response.status || !response.data) {
            console.error("Failed to generate label. Response:", response);
            throw new Error(response.message || "Failed to generate label");
        }

        return { labelUrl: response.data };
    } catch (error: any) {
        console.error("Error in generateLabel:", {
            message: error.message,
            stack: error.stack,
            shipmentId,
        });
        throw new Error(error.message || "Failed to generate label");
    }
}