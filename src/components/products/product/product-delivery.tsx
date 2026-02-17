"use client";

import { getEstimatedDelivery } from "@/actions/shiprocket/get-estimate-delivery";
import { Icons } from "@/components/icons";
import { useState, useTransition } from "react";

interface DeliveryOptionProps {
    initialZipCode: string | undefined;
    warehousePincode: string | null | undefined;
    estimatedDelivery: string;
    setZipCode: (zip: string) => void;
    setEstimatedDelivery: (date: string) => void;
}

export function DeliveryOption({
    initialZipCode,
    warehousePincode,
    estimatedDelivery,
    setZipCode,
    setEstimatedDelivery,
}: DeliveryOptionProps) {
    const [newZipCode, setNewZipCode] = useState(initialZipCode || "");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    // Handle check delivery estimate
    const handleCheck = () => {
        const deliveryPincode = parseInt(newZipCode, 10);
        // @ts-ignore
        const pickupPincode = parseInt(warehousePincode as any, 10);

        if (isNaN(deliveryPincode) || isNaN(pickupPincode)) {
            setError("Please enter a valid 6-digit pincode.");
            return;
        }

        startTransition(async () => {
            try {
                setError("");
                const result = await getEstimatedDelivery({
                    pickupPostcode: pickupPincode,
                    deliveryPostcode: deliveryPincode,
                });

                if (
                    result?.data?.data?.available_courier_companies?.length > 0
                ) {
                    const estimatedDateStr =
                        result.data.data.available_courier_companies[0].etd;

                    if (!estimatedDateStr) {
                        setError("Unable to retrieve estimated delivery date.");
                        return;
                    }

                    const estimatedDate = new Date(estimatedDateStr);
                    const today = new Date();

                    if (isNaN(estimatedDate.getTime())) {
                        setError("Invalid estimated delivery date received.");
                        return;
                    }

                    if (estimatedDate <= today) {
                        setError(
                            "Estimated delivery date must be in the future."
                        );
                        return;
                    }

                    const formattedDate = estimatedDate.toLocaleDateString(
                        "en-US",
                        {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                        }
                    );

                    setZipCode(newZipCode);
                    setEstimatedDelivery(formattedDate);
                } else {
                    setError(
                        result.message ||
                            "No delivery options available for this pincode."
                    );
                }
            } catch (err) {
                console.error("Failed to fetch delivery estimate:", err);
                setError(
                    "Failed to fetch delivery estimate. Please try again."
                );
            }
        });
    };

    return (
        <div className="mb-5 w-full max-w-xs space-y-3">
            {/* Inline pincode check */}
            <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-1 items-center gap-2 px-3">
                    <Icons.MapPin className="size-4 shrink-0 text-gray-400" />
                    <input
                        type="text"
                        inputMode="numeric"
                        value={newZipCode}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setNewZipCode(val);
                            setError("");
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleCheck();
                            }
                        }}
                        placeholder="Enter pincode"
                        className="w-full py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                        maxLength={6}
                    />
                </div>
                <button
                    type="button"
                    disabled={isPending || !newZipCode || newZipCode.length < 6}
                    onClick={handleCheck}
                    className="border-l border-gray-200 bg-[#84abd6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6d96c2] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                >
                    {isPending ? "Checking..." : "Check"}
                </button>
            </div>

            {/* Error message */}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Delivery estimate banner */}
            <div className="flex items-center gap-3 rounded-xl border border-[#84abd6]/30 bg-gradient-to-r from-[#84abd6]/10 to-[#e8f0f8] px-4 py-3.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#84abd6]/20">
                    <Icons.Truck className="size-4 text-[#84abd6]" />
                </div>
                <div className="flex-1">
                    {estimatedDelivery ? (
                        <p className="text-[13px] font-medium text-gray-800">
                            Get it by{" "}
                            <span className="font-bold text-[#4a7faa]">
                                {estimatedDelivery}
                            </span>
                        </p>
                    ) : (
                        <p className="text-[13px] font-medium text-gray-700">
                            Estimated delivery in{" "}
                            <span className="font-bold text-gray-900">
                                4-6 days
                            </span>
                        </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-gray-400">
                        {estimatedDelivery
                            ? "Based on your pincode"
                            : "Enter pincode for exact date"}
                    </p>
                </div>
                {estimatedDelivery && (
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#84abd6] text-[11px] font-bold text-white shadow-sm">
                        ✓
                    </span>
                )}
            </div>
        </div>
    );
}
