import { env } from "@/../env";
import { verifyPayment } from "@/actions";
import { siteConfig } from "@/config/site";
import { CachedUser } from "@/lib/validations";
import { RazorpayPaymentOptions } from "@/types";
import { Dispatch, SetStateAction } from "react";
import { wait } from "../utils";
import { sendWhatsAppNotification } from "@/actions/whatsapp/send-order-notification";
import { processOrderAfterPayment } from "@/actions/process-order-after-payment";
import { updatePaymentStatusAction } from "@/actions/update-payment-status";
import { toast } from "sonner";
import { handleClientError } from "@/lib/utils";
import { orderQueries, productQueries } from "@/lib/db/queries";
import { trpc } from "../trpc/client";

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
    orderIntentId,
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
        deliveryAmount: number;
        taxAmount: number;
        totalAmount: number;
        discountAmount: number;
        paymentMethod: string | null;
        totalItems: number;
        shiprocketOrderId: number | null | undefined;
        shiprocketShipmentId: number | null | undefined;
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
        razorpayPaymentId: string;
    }) => void;
    orderDetailsByBrand: Array<{
        userId: string;
        coupon?: string;
        addressId: string;
        deliveryAmount: number;
        taxAmount: number;
        totalAmount: number;
        discountAmount: number;
        paymentMethod: string | null;
        totalItems: number;
        shiprocketOrderId: number | null | undefined;
        shiprocketShipmentId: number | null | undefined;
        items: Array<{
            price: number;
            brandId: string;
            productId: string;
            variantId: string | null;
            sku: any;
            quantity: number;
            categoryId: string;
        }>;
        razorpayOrderId: string;
    }>;
    deleteItemFromCart: (input: { userId: string }) => void;
    orderIntentId: string;
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
        order_id: orderId,

        handler: async (payload) => {
            console.log("Payment handler triggered with payload:", payload);

            setIsProcessingModalOpen(true);
            setProcessingModalTitle("Processing payment...");
            setProcessingModalDescription("Please wait while we process your payment");
            setProcessingModalState("pending");

            try {
                // Step 1: Verify payment
                console.log("Verifying payment...");
                await verifyPayment(payload);
                console.log("Payment verified successfully");

//                 console.log("Updating payment status to 'paid'...");
// await updatePaymentStatusAction({
//                     userId: user.id,
//                     intentId: orderIntentId,
//                     status: "paid",
//                     paymentId: payload.razorpay_payment_id,
//                     paymentMethod: "razorpay",
//                 });
                console.log(orderIntentId, "Updating payment status to 'paid'...");

// Step 2: Validate order details
                if (!orderDetailsByBrand || orderDetailsByBrand.length === 0) {
                    throw new Error("No order details found to create orders");
                }
                console.log("Order details validated, proceeding to create orders...");

                // Step 3: Create orders for each brand and process stock and payment status
                const createdOrders = [];
                for (const [index, orderDetails] of orderDetailsByBrand.entries()) {
                    try {
                        console.log(`Creating order ${index + 1}/${orderDetailsByBrand.length} for brand...`, orderDetails);
                        // await createOrder(orderDetails);
                        await createOrder({
                            ...orderDetails,
                            razorpayPaymentId: payload.razorpay_payment_id, // Add payment ID
                          });
                        console.log(`Order ${index + 1} created successfully`);

                        // Call the new function to handle stock deduction and payment status
                        await processOrderAfterPayment({
                            orderDetails,
                            paymentId: payload.razorpay_payment_id,
                            orderIntentId: orderIntentId
                        });
                        console.log(`Order ${orderDetails.razorpayOrderId} processed successfully`);

                        createdOrders.push(orderDetails);
                    } catch (error) {
                        console.error(`Failed to create order ${index + 1}:`, {
                            error: error instanceof Error ? error.message : "Unknown error",
                            stack: error instanceof Error ? error.stack : undefined,
                            errorCode: (error as any)?.code || "N/A",
                            errorShape: (error as any)?.shape || "N/A",
                        });
                        // Continue with the next order even if one fails
                    }
                }

                if (createdOrders.length === 0) {
                    throw new Error("No orders were created successfully. Please contact support.");
                }

                // Step 4: Send WhatsApp notification
                console.log("Sending WhatsApp notification...");
                try {
                    const formattedPhone = deliveryAddress.phone.startsWith("+")
                        ? deliveryAddress.phone
                        : `+91${deliveryAddress.phone}`;
                    await sendWhatsAppNotification({
                        phone: formattedPhone,
                        template: "order_confirmation",
                        parameters: [user.firstName, orderId],
                    });
                    console.log("WhatsApp notification sent successfully");
                } catch (error) {
                    console.error("Failed to send WhatsApp notification:", {
                        error: error instanceof Error ? error.message : "Unknown error",
                        stack: error instanceof Error ? error.stack : undefined,
                    });
                    // Continue even if notification fails
                }

                // Step 5: Clear cart
                console.log("Clearing cart...");
                try {
                    await deleteItemFromCart({ userId: user.id });
                    console.log("Cart cleared successfully");
                } catch (error) {
                    console.error("Failed to clear cart:", {
                        error: error instanceof Error ? error.message : "Unknown error",
                        stack: error instanceof Error ? error.stack : undefined,
                    });
                    // Continue even if cart clearing fails
                }

                // Step 6: Update UI and redirect
                setProcessingModalTitle("Order Placed Successfully");
                setProcessingModalDescription(
                    `Your order${createdOrders.length > 1 ? "s have" : " has"} been placed successfully. Redirecting to your orders...`
                );
                setProcessingModalState("success");

                await wait(2000);
                setIsProcessingModalOpen(false);
                refetch();

                console.log("Redirecting to /profile/orders...");
                window.location.href = "/profile/orders";
            } catch (error) {
                console.error("Payment handler failed:", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                setProcessingModalTitle("Order Processing Failed");
                setProcessingModalDescription(
                    errorMessage.includes("signature")
                        ? "Failed to verify your payment. The payment details are invalid. Please try again or contact support."
                        : errorMessage.includes("Unauthorized")
                        ? "You are not authorized to perform this action. Please log in and try again."
                        : `Failed to process your order: ${errorMessage}. Please try again or contact support.`
                );
                setProcessingModalState("error");

                await wait(5000);
                setIsProcessingModalOpen(false);
                setIsProcessing(false);
            }
        },
        modal: {
            ondismiss: async () => {
                console.log("Payment modal dismissed by user");
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