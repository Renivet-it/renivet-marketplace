import { useReturnStore } from "@/lib/store/return-store";
import { ReturnOrderPayload } from "@/lib/store/validation/return-store-validation";
import { trpc } from "@/lib/trpc/client";
import { useEffect, useRef } from "react";
import PaymentDetailsForm, {
    PaymentDetailsFormHandles,
} from "./payment-details-form";

interface Props extends GenericProps {
    className?: string;
    setValidator: (fn: () => Promise<boolean>) => void;
}

export function ReturnPaymentDetails({
    className,
    setValidator,
    ...props
}: Props) {
    const formRef = useRef<PaymentDetailsFormHandles>(null);
    const { mutateAsync, isPending, error } =
        trpc.general.orderReturns.createReturnOrder.useMutation();

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
                            console.log("Final Payload:", typedPayload);
                            const response = await mutateAsync(typedPayload);
                            console.log("Return API Response:", response);
                        } catch (error) {
                            console.error("API call failed:", error);
                            return false;
                        }
                    }
                }
                return isValid ?? false;
            });
        }
    }, [setValidator, mutateAsync]);
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
            <PaymentDetailsForm ref={formRef} />
        </>
    );
}
