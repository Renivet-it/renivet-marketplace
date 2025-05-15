import { env } from "@/../env";
import { verifyPayment } from "@/actions";
import { siteConfig } from "@/config/site";
import { CachedUser } from "@/lib/validations";
import { RazorpayPaymentOptions } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { wait } from "../utils";
import { sendWhatsAppNotification } from "@/actions/whatsapp/send-order-notification";
import { toast } from "sonner";
import { handleClientError } from "@/lib/utils";

export function createRazorpayPaymentOptions({
    orderId,
    deliveryAddress,
    prices,
    user,
    setIsProcessing,
    setIsProcessingModalOpen,
    setProcessingModalTitle,
    setProcessingModalDescription,
    setProcessingModalState,
    refetch,
    createOrder,
    orderDetailsByBrand,
    deleteItemFromCart,
}: {
    orderId: string;
    deliveryAddress: any;
    prices: {
        items: number;
        delivery: number;
        discount: number;
        total: number;
    };
    user: {
        id: string;
        email: string;
        firstName: string;
    };
    setIsProcessing: Dispatch<SetStateAction<boolean>>;
    setIsProcessingModalOpen: Dispatch<SetStateAction<boolean>>;
    setProcessingModalTitle: Dispatch<SetStateAction<string>>;
    setProcessingModalDescription: Dispatch<SetStateAction<string>>;
    setProcessingModalState: Dispatch<SetStateAction<"pending" | "success" | "error">>;
    refetch: () => void;
    createOrder: (input: {
        userId: string;
        coupon?: string;
        addressId: string;
        deliveryAmount: string;
        taxAmount: string;
        totalAmount: string;
        discountAmount: string;
        paymentMethod: string | null;
        totalItems: number;
        shiprocketOrderId: string | null;
        shiprocketShipmentId: string | null;
        items: Array<{
            price: number;
            brandId: string;
            productId: string;
            variantId: string | null;
            sku: string;
            quantity: number;
            categoryId: string;
        }>;
        razorpayOrderId: string;
    }) => void;
    orderDetailsByBrand: Array<{
        userId: string;
        coupon?: string;
        addressId: string;
        deliveryAmount: string;
        taxAmount: string;
        totalAmount: string;
        discountAmount: string;
        paymentMethod: string | null;
        totalItems: number;
        shiprocketOrderId: string | null;
        shiprocketShipmentId: string | null;
        items: Array<{
            price: number;
            brandId: string;
            productId: string;
            variantId: string | null;
            sku: string;
            quantity: number;
            categoryId: string;
        }>;
        razorpayOrderId: string;
    }>;
    deleteItemFromCart: (input: { userId: string }) => void;
}) {
    const options: RazorpayPaymentOptions = {
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
        order_id: orderId, // Use the single Razorpay order_id for payment
        handler: async (payload) => {
            setIsProcessingModalOpen(true);
            setProcessingModalTitle("Processing payment...");
            setProcessingModalDescription("Please wait while we process your payment");

            try {
                await verifyPayment(payload);

                // Create multiple orders (one per brand) after payment verification
                await Promise.all(
                    orderDetailsByBrand.map((orderDetails) => {
                        return createOrder(orderDetails);
                    })
                );

                setProcessingModalTitle("Awaiting Confirmation");
                setProcessingModalDescription(
                    "You will receive an email with the order details shortly with a payment confirmation. Redirecting..."
                );
                setProcessingModalState("success");

                // Send WhatsApp notification
                const formattedPhone = deliveryAddress.phone.startsWith("+")
                    ? deliveryAddress.phone
                    : `+91${deliveryAddress.phone}`;
                await sendWhatsAppNotification({
                    phone: formattedPhone,
                    template: "order_confirmation",
                    parameters: [user.firstName, orderId],
                });

                // Clear cart
                deleteItemFromCart({ userId: user.id });
                refetch();

                await wait(2000);
                setIsProcessingModalOpen(false);

                window.location.href = "/profile/orders";
            } catch (error) {
                console.error("Payment verification or order creation failed:", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    stack: error instanceof Error ? error.stack : undefined,
                });
                setProcessingModalTitle("Order processing failed");
                setProcessingModalDescription(
                    "Your order could not be processed. Please try again later. Reason: " +
                        (error instanceof Error ? error.message : "Unknown") +
                        ". If you were charged, please contact support."
                );
                setProcessingModalState("error");
                refetch();

                await wait(10000);
                setIsProcessingModalOpen(false);
                setIsProcessing(false);
            }
        },
        modal: {
            ondismiss: async () => {
                setIsProcessing(false);
                setProcessingModalTitle("Payment Cancelled");
                setProcessingModalDescription("You cancelled the payment process.");
                setProcessingModalState("error");
                setIsProcessingModalOpen(true);
                await wait(3000);
                setIsProcessingModalOpen(false);
                window.location.href = "/mycart";
            },
        },
    };

    return options;
}

export const initializeRazorpayPayment = (options: RazorpayPaymentOptions) => {
    try {
        console.log("Razorpay payment options:", options);
        if (!(window as any).Razorpay) {
            throw new Error("Razorpay SDK not loaded");
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        console.log("Razorpay payment modal opened successfully");
    } catch (error) {
        console.error("Razorpay initialization failed:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            errorCode: (error as any)?.code || "N/A",
            errorDescription: (error as any)?.description || "N/A",
            errorMetadata: (error as any)?.metadata || "N/A",
        });
        throw error;
    }
};