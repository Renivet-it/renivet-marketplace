"use server";

import { shiprocket } from "@/lib/shiprocket";

export async function generateManifest(shipmentId: any) {
    try {
        console.log("Generating manifest for shipmentId:", shipmentId);

        const sr = await shiprocket();
        console.log("Shiprocket client initialized successfully");

        // Convert shipmentId to number
        const numericId = parseInt(shipmentId, 10);
        if (isNaN(numericId)) {
            console.error("Invalid shipment ID: Not a number", shipmentId);
            throw new Error("Invalid shipment ID");
        }
        console.log("Numeric shipment ID:", numericId);

        // Call Shiprocket's generateManifest endpoint
        const response = await sr.generateManifest({ shipment_id: [numericId] });
        console.log("Shiprocket API response:", JSON.stringify(response, null, 2));

        if (!response.status || !response.data) {
            console.error("Failed to generate manifest. Response:", response);
            throw new Error(response.message || "Failed to generate manifest");
        }

        return { manifestUrl: response.data };
    } catch (error: any) {
        console.error("Error in generateManifest:", {
            message: error.message,
            stack: error.stack,
            shipmentId,
        });
        throw new Error(error.message || "Failed to generate manifest");
    }
}