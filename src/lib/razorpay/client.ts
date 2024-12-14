import { env } from "@/../env";
import { verifyPayment } from "@/actions";
import { siteConfig } from "@/config/site";
import { CachedUser } from "@/lib/validations";
import { RazorPayOptions } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { wait } from "../utils";

export function createRazorPayOptions({
    orderId,
    deliveryAddress,
    prices,
    user,
    setIsProcessing,
    setIsProcessingModalOpen,
    setProcessingModalTitle,
    setProcessingModalDescription,
    setProcessingModalState,
}: {
    orderId: string;
    deliveryAddress: CachedUser["addresses"][number];
    prices: {
        items: number;
        platform: number;
        devliery: number;
        total: number;
    };
    user: {
        id: string;
        email: string;
    };
    setIsProcessing: Dispatch<SetStateAction<boolean>>;
    setIsProcessingModalOpen: Dispatch<SetStateAction<boolean>>;
    setProcessingModalTitle: Dispatch<SetStateAction<string>>;
    setProcessingModalDescription: Dispatch<SetStateAction<string>>;
    setProcessingModalState: Dispatch<
        SetStateAction<"pending" | "success" | "error">
    >;
}) {
    const options: RazorPayOptions = {
        key: env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID,
        amount: prices.total,
        currency: "INR",
        name: siteConfig.name,
        description: siteConfig.description,
        prefill: {
            name: deliveryAddress.fullName,
            email: user.email,
            contact: deliveryAddress.phone,
        },
        notes: {
            address:
                deliveryAddress.street +
                ", " +
                deliveryAddress.city +
                ", " +
                deliveryAddress.state +
                ", " +
                deliveryAddress.zip,
        },
        theme: {
            color: "#0070ba",
        },
        order_id: orderId,
        handler: async (payload) => {
            setIsProcessingModalOpen(true);
            setProcessingModalTitle("Processing payment...");
            setProcessingModalDescription(
                "Please wait while we process your payment"
            );

            try {
                await verifyPayment(payload);

                setProcessingModalTitle("Payment successful");
                setProcessingModalDescription(
                    "Your payment has been processed, and your order has been placed successfully. Redirecting..."
                );
                setProcessingModalState("success");

                await wait(2000);
                setIsProcessingModalOpen(false);

                window.location.href = "/profile/orders";
            } catch (error) {
                setProcessingModalTitle("Payment processing failed");
                setProcessingModalDescription(
                    "Your payment could not be processed. Please try again later. Reason: " +
                        (error instanceof Error ? error.message : "Unknown") +
                        ". If you were charged, please contact support."
                );
                setProcessingModalState("error");

                await wait(2000);
                setIsProcessingModalOpen(false);
                setIsProcessing(false);
            }
        },
        modal: {
            ondismiss: async () => {
                setIsProcessing(false);
            },
        },
    };

    return options;
}

export const initializeRazorpayPayment = (options: RazorPayOptions) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
};
