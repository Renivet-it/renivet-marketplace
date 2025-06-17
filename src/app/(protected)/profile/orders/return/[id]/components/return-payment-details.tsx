import { Dialog, DialogContent } from "@/components/ui/dialog-general";
import { useReturnStore } from "@/lib/store/return-store";
import { ReturnOrderPayload } from "@/lib/store/validation/return-store-validation";
import { trpc } from "@/lib/trpc/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PaymentDetailsForm, {
    PaymentDetailsFormHandles,
} from "./payment-details-form";

interface Props extends GenericProps {
    className?: string;
    setValidator: (fn: () => Promise<boolean>) => void;
    setIsLoading?: (loading: boolean) => void;
}

export function ReturnPaymentDetails({
    className,
    setValidator,
    setIsLoading,
    ...props
}: Props) {
    const formRef = useRef<PaymentDetailsFormHandles>(null);
    const router = useRouter();
    const { mutateAsync, isPending } =
        trpc.general.orderReturns.createReturnOrder.useMutation({
            onError: (error) => {
                toast.error(error.message || "Return failed");
            },
        });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [autoCloseTimeout, setAutoCloseTimeout] = useState<ReturnType<
        typeof setTimeout
    > | null>(null);

    useEffect(() => {
        if (setValidator) {
            setValidator(async () => {
                const isValid = await formRef.current?.validate?.();
                if (isValid) {
                    const values = formRef.current?.getValues?.();
                    if (values) {
                        useReturnStore.getState().setReturnItemPayload(values);
                        const finalPayload =
                            useReturnStore.getState().returnItemPayload;
                        if (!finalPayload) {
                            return false;
                        }
                        const typedPayload = finalPayload as ReturnOrderPayload;
                        try {
                            setIsLoading?.(true);
                            const response = await mutateAsync(typedPayload);
                            if (response.status === true) {
                                setDialogOpen(true);
                                const timeout = setTimeout(() => {
                                    router.push("/profile/orders");
                                    useReturnStore.getState().reset();
                                }, 2000);
                                setAutoCloseTimeout(timeout);
                            }
                            console.log("Return API Response:", response);
                        } catch (error) {
                            console.error("API call failed:", error);
                            toast.error("Failed to submit return order.");
                            return false;
                        } finally {
                            setIsLoading?.(false);
                        }
                    }
                }
                return isValid ?? false;
            });
        }
    }, [
        setValidator,
        mutateAsync,
        setAutoCloseTimeout,
        setDialogOpen,
        router,
        setIsLoading,
    ]);

    const handleDialogChange = (open: boolean) => {
        if (!open) {
            // If user closes manually, clear timeout and redirect
            if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
            router.push("/profile/orders");
            useReturnStore.getState().reset();
        }
        setDialogOpen(open);
    };
    return (
        <>
            <div className="text-center">
                <h2 className="text-lg font-semibold">
                    Provide your bank details
                </h2>
                <p className="text-sm text-muted-foreground">
                    Please provide the bank details where you would like to
                    receive the refund.
                </p>
            </div>
            <PaymentDetailsForm ref={formRef} isLoading={isPending} />
            <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="p-6 text-center">
                    <div className="relative mx-auto mb-4 aspect-square w-32">
                        <Image
                            src="/assets/order/order-return.svg"
                            alt="Success"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                        Return Confirmed!
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Your return order has been successfully submitted.
                    </p>
                    <div className="mt-4 flex justify-center gap-4">
                        <button
                            className="rounded bg-primary px-4 py-2 text-white"
                            onClick={() => {
                                router.push("/profile/orders");
                                useReturnStore.getState().reset();
                            }}
                        >
                            Go to Orders
                        </button>
                        <button
                            className="rounded bg-muted px-4 py-2 text-primary"
                            onClick={() => {
                                router.push("/shop");
                                useReturnStore.getState().reset();
                            }}
                        >
                            Continue Shopping
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
