import ShippingAddress from "@/app/(protected)/profile/cart/component/shipping-address";
import { useCartStore } from "@/lib/store/cart-store";
import { useReturnStore } from "@/lib/store/return-store";
import { returnOrderPhaseTwo } from "@/lib/store/validation/return-store-validation";
import { trpc } from "@/lib/trpc/client";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ZodError } from "zod";

interface Props extends GenericProps {
    className?: string;
    setValidator: (fn: () => boolean) => void;
}

export function ReturnStepAddress({
    className,
    setValidator,
    ...props
}: Props) {
    const { data: user } = trpc.general.users.currentUser.useQuery();
    const selectedAddress = useCartStore(
        (state) => state.selectedShippingAddress
    );
    const setReturnItemPayload = useReturnStore((s) => s.setReturnItemPayload);

    const validate = useCallback(() => {
        if (!selectedAddress) {
            toast.error("Unexpected error occurred during address validation");
            return false;
        };
        try {
            const payload = {
                customerName: selectedAddress.fullName,
                pickupAddress: selectedAddress.street,
                pickupCity: selectedAddress.city,
                pickupState: selectedAddress.state,
                pickupCountry: "India",
                pickupPincode: selectedAddress.zip,
                pickupEmail: user?.email ?? "",
                pickupPhone: selectedAddress.phone,
            };

            returnOrderPhaseTwo.parse(payload);
            setReturnItemPayload(payload);
            return true;
        } catch (err) {
            if (err instanceof ZodError) {
                const errorMessages = err.errors.map((e) => e.message);
                errorMessages.forEach((msg) => toast.error(msg));
            } else {
                toast.error("Unexpected error occurred during validation");
            }
            return false;
        }
    }, [user, selectedAddress, setReturnItemPayload]);

    useEffect(() => {
        setValidator(validate);
    }, [validate, setValidator]);

    return (
        <>
            <div className="text-center">
                <h2 className="text-lg font-semibold">
                    Provide your preferred order pickup address
                </h2>
                <p className="text-sm text-muted-foreground">
                    Please provide the address where you would like to pick up
                    your return order. This address will be used for the return
                    process.
                </p>
            </div>
            <ShippingAddress title={"Pickup Address"} />
        </>
    );
}
