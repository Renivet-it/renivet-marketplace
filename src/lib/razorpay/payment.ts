// import { env } from "@/../env";
// import { verifyPayment } from "@/actions";
// import { siteConfig } from "@/config/site";
// import { CachedUser } from "@/lib/validations";
// import { RazorpayPaymentOptions } from "@/types";
// import { Dispatch, SetStateAction } from "react";
// import { wait } from "../utils";
// import { sendWhatsAppNotification } from "@/actions/whatsapp/send-order-notification";

// export function createRazorpayPaymentOptions({
//     orderId,
//     deliveryAddress,
//     prices,
//     user,
//     setIsProcessing,
//     setIsProcessingModalOpen,
//     setProcessingModalTitle,
//     setProcessingModalDescription,
//     setProcessingModalState,
//     refetch,
// }: {
//     orderId: string;
//     deliveryAddress: any;
//     prices: {
//         items: number;
//         delivery: number;
//         discount: number;
//         total: number;
//     };
//     user: {
//         id: string;
//         email: string;
//         firstName: string;
//     };
//     setIsProcessing: Dispatch<SetStateAction<boolean>>;
//     setIsProcessingModalOpen: Dispatch<SetStateAction<boolean>>;
//     setProcessingModalTitle: Dispatch<SetStateAction<string>>;
//     setProcessingModalDescription: Dispatch<SetStateAction<string>>;
//     setProcessingModalState: Dispatch<
//         SetStateAction<"pending" | "success" | "error">
//     >;
//     refetch: () => void;
// }) {
//     const options: RazorpayPaymentOptions = {
//         key: env.NEXT_PUBLIC_RAZOR_PAY_KEY_ID,
//         amount: prices.total,
//         currency: "INR",
//         name: siteConfig.name,
//         description: siteConfig.description,
//         prefill: {
//             name: deliveryAddress.fullName,
//             email: user.email,
//             contact: deliveryAddress.phone,
//         },
//         notes: {
//             address:
//                 deliveryAddress.street +
//                 ", " +
//                 deliveryAddress.city +
//                 ", " +
//                 deliveryAddress.state +
//                 ", " +
//                 deliveryAddress.zip,
//         },
//         theme: {
//             color: "#0070ba",
//         },
//         order_id: orderId,
//         handler: async (payload) => {
//             setIsProcessingModalOpen(true);
//             setProcessingModalTitle("Processing payment...");
//             setProcessingModalDescription(
//                 "Please wait while we process your payment"
//             );

//             try {
//                 await verifyPayment(payload);

//                 setProcessingModalTitle("Awaiting Confirmation");
//                 setProcessingModalDescription(
//                     "You will receive an email with the order details shortly with a payment confirmation. Redirecting..."
//                 );
//                 setProcessingModalState("success");

//                 // Send WhatsApp notification after successful payment
//                 const formattedPhone = deliveryAddress.phone.startsWith("+")
//                     ? deliveryAddress.phone
//                     : `+91${deliveryAddress.phone}`; // Adjust country code as needed

//                 await sendWhatsAppNotification({
//                     phone: formattedPhone,
//                     template: "order_confirmation",
//                     parameters: [user.firstName, orderId],
//                 });
//                 refetch();

//                 await wait(2000);
//                 setIsProcessingModalOpen(false);

//                 window.location.href = "/profile/orders";
//             } catch (error) {
//                 setProcessingModalTitle("Order processing failed");
//                 setProcessingModalDescription(
//                     "Your order could not be processed. Please try again later. Reason: " +
//                         (error instanceof Error ? error.message : "Unknown") +
//                         ". If you were charged, please contact support."
//                 );
//                 setProcessingModalState("error");
//                 refetch();

//                 await wait(10000);
//                 setIsProcessingModalOpen(false);
//                 setIsProcessing(false);
//             }
//         },
//         modal: {
//             ondismiss: async () => {
//                 setIsProcessing(false);
//             },
//         },
//     };

//     return options;
// }

// export const initializeRazorpayPayment = (options: RazorpayPaymentOptions) => {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const rzp = new (window as any).Razorpay(options);
//     rzp.open();
// };

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
    createdOrderId,
    deleteOrder,
    deleteItemFromCart
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
    createdOrderId: string | null;
    deleteOrder: (input: { orderId: string}) => void; // Add cancelOrder type,
    deleteItemFromCart: (input: { userId: string }) => void
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
            setIsProcessingModalOpen(true);
            setProcessingModalTitle("Processing payment...");
            setProcessingModalDescription(
                "Please wait while we process your payment"
            );

            try {
                await verifyPayment(payload);

                setProcessingModalTitle("Awaiting Confirmation");
                setProcessingModalDescription(
                    "You will receive an email with the order details shortly with a payment confirmation. Redirecting..."
                );
                setProcessingModalState("success");

                // Send WhatsApp notification after successful payment
                const formattedPhone = deliveryAddress.phone.startsWith("+")
                    ? deliveryAddress.phone
                    : `+91${deliveryAddress.phone}`; // Adjust country code as needed

                await sendWhatsAppNotification({
                    phone: formattedPhone,
                    template: "order_confirmation",
                    parameters: [user.firstName, orderId],
                });

                // Clear cart
                refetch();
                deleteItemFromCart({
                    userId: user.id,
                });
                await wait(2000);
                setIsProcessingModalOpen(false);

                window.location.href = "/profile/orders";
            } catch (error) {
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
                //  setProcessingModalTitle("Payment Cancelled");
                //     setProcessingModalDescription("You cancelled the payment process.");
                // cancelOrder({
                //     orderId: orderId,
                //     userId: user.id,
                // });
                // window.location.href = "/mycart";

                if (createdOrderId) {
                    try {
                        const toastId = toast.loading("Cancelling order...");
                        deleteOrder({
                            orderId: createdOrderId,
                        });
                        toast.success("Order cancelled successfully", { id: toastId });
                        setProcessingModalTitle("Payment Cancelled");
                        setProcessingModalDescription(
                            `You cancelled the payment, and order ${createdOrderId} has been cancelled.`
                        );
                        setProcessingModalState("error");
                        setIsProcessingModalOpen(true);
                    } catch (err) {
                        toast.error(handleClientError(err));
                        setProcessingModalTitle("Cancellation Error");
                        setProcessingModalDescription(
                            `Payment was cancelled, but we couldn't cancel order ${createdOrderId}. Please contact support.`
                        );
                        setProcessingModalState("error");
                        setIsProcessingModalOpen(true);
                    }
                } else {
                    console.log(createdOrderId, "createdOrderId is createdOrderId");
                    console.log(orderId, "orderId is orderId");
                    setProcessingModalTitle("Payment Cancelled");
                    setProcessingModalDescription("You cancelled the payment process.");
                    deleteOrder({
                        orderId: orderId,
                    });
                    setProcessingModalState("error");
                    setIsProcessingModalOpen(true);

                }
            },
        },
    };

    return options;
}

export const initializeRazorpayPayment = (options: RazorpayPaymentOptions) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
};