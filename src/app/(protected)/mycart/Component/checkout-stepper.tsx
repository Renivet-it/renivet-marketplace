"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface CheckoutStepperProps {
    currentStep: number;
}

export default function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");

    const steps = [
        { label: "Bag", step: 0 },
        { label: "Address", step: 1 },
        { label: "Payment", step: 2 },
    ];

    const handleStepChange = (step: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("step", step.toString());
        if (orderId) {
            params.set("orderId", orderId); // Preserve orderId in the URL
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center justify-center gap-4 py-4">
            {steps.map((stepItem) => (
                <div key={stepItem.step} className="flex items-center gap-2">
                    <button
                        onClick={() => handleStepChange(stepItem.step)}
                        className={cn(
                            "flex items-center gap-2 text-sm font-medium",
                            currentStep === stepItem.step
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <span
                            className={cn(
                                "flex size-6 items-center justify-center rounded-full",
                                currentStep === stepItem.step
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-600"
                            )}
                        >
                            {stepItem.step + 1}
                        </span>
                        {stepItem.label}
                    </button>
                    {stepItem.step < steps.length - 1 && (
                        <div className="h-1 w-12 bg-gray-200" />
                    )}
                </div>
            ))}
        </div>
    );
}