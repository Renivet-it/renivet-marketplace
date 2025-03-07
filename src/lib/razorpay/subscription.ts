"use client";

import { env } from "@/../env";
import { verifySubscription } from "@/actions";
import { siteConfig } from "@/config/site";
import { RazorpaySubscriptionOptions } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { wait } from "../utils";
import { CachedBrand } from "../validations";

export function createRazorpaySubscriptionOptions({
    subcriptionId,
    brand,
    setIsProcessingModalOpen,
    setProcessingModalTitle,
    setProcessingModalDescription,
    setProcessingModalState,
}: {
    subcriptionId: string;
    brand: CachedBrand;
    setIsProcessingModalOpen: Dispatch<SetStateAction<boolean>>;
    setProcessingModalTitle: Dispatch<SetStateAction<string>>;
    setProcessingModalDescription: Dispatch<SetStateAction<string>>;
    setProcessingModalState: Dispatch<
        SetStateAction<"pending" | "success" | "error">
    >;
}) {
    const options: RazorpaySubscriptionOptions = {
        key: env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID,
        subscription_id: subcriptionId,
        name: siteConfig.name,
        description: "Brand monthly subscription",
        prefill: {
            name: brand.name,
            email: brand.email,
            contact: brand.phone,
        },
        theme: {
            color: "#0070ba",
        },
        handler: async (payload) => {
            setIsProcessingModalOpen(true);
            setProcessingModalTitle("Processing subscription...");
            setProcessingModalDescription(
                "Please wait while we process your subscription"
            );

            try {
                await verifySubscription(payload);

                setProcessingModalTitle("Payment successful");
                setProcessingModalDescription(
                    "Your subscription has been processed successfully. Activation may take a few minutes, you will receive an email once it is done."
                );
                setProcessingModalState("success");

                await wait(10000);
                setIsProcessingModalOpen(false);
            } catch (error) {
                setProcessingModalTitle("Subscription processing failed");
                setProcessingModalDescription(
                    "Your subscription could not be processed. Please try again later. Reason: " +
                        (error instanceof Error ? error.message : "Unknown") +
                        ". If you were charged, please contact support."
                );
                setProcessingModalState("error");

                await wait(10000);
                setIsProcessingModalOpen(false);
            }
        },
        modal: {
            ondismiss: async () => {},
        },
    };

    return options;
}

export const initializeRazorpaySubscription = (
    options: RazorpaySubscriptionOptions
) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
};
