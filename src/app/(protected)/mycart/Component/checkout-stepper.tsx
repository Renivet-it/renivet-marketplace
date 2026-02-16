"use client";

import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

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
            params.set("orderId", orderId);
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <>
            {/* Mobile Stepper */}
            <div className="md:hidden">
                {/* Header with back arrow and centered title */}
                <div className="relative flex items-center justify-center pb-3">
                    <button
                        onClick={() => router.back()}
                        className="absolute left-0 flex size-8 items-center justify-center rounded-full hover:bg-gray-100"
                    >
                        <Icons.ChevronLeft className="size-5 text-gray-700" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">
                        Your Bag
                    </h1>
                </div>

                {/* Progress stepper — compact, centered */}
                <div className="flex items-center justify-center pb-4">
                    <div className="flex w-full max-w-[220px] items-center">
                        {steps.map((stepItem, index) => (
                            <div
                                key={stepItem.step}
                                className="flex flex-1 items-center"
                            >
                                <button
                                    onClick={() =>
                                        handleStepChange(stepItem.step)
                                    }
                                    className="flex flex-col items-center gap-1"
                                >
                                    <div
                                        className={cn(
                                            "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
                                            currentStep >= stepItem.step
                                                ? "border-[#6B7A5E] bg-[#6B7A5E]"
                                                : "border-gray-300 bg-white"
                                        )}
                                    >
                                        {currentStep > stepItem.step && (
                                            <Icons.Check className="size-3 text-white" />
                                        )}
                                        {currentStep === stepItem.step && (
                                            <div className="size-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[11px] font-medium",
                                            currentStep >= stepItem.step
                                                ? "text-[#6B7A5E]"
                                                : "text-gray-400"
                                        )}
                                    >
                                        {stepItem.label}
                                    </span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            "mx-1 h-[2px] flex-1",
                                            currentStep > stepItem.step
                                                ? "bg-[#6B7A5E]"
                                                : "bg-gray-200"
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Desktop Stepper */}
            <div className="hidden items-center justify-center gap-2 py-5 md:flex">
                {steps.map((stepItem, index) => (
                    <div
                        key={stepItem.step}
                        className="flex items-center gap-2"
                    >
                        <button
                            onClick={() => handleStepChange(stepItem.step)}
                            className={cn(
                                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                                currentStep === stepItem.step
                                    ? "bg-green-50 text-green-700"
                                    : currentStep > stepItem.step
                                      ? "text-green-600"
                                      : "text-gray-400"
                            )}
                        >
                            <span
                                className={cn(
                                    "flex size-6 items-center justify-center rounded-full text-xs",
                                    currentStep === stepItem.step
                                        ? "bg-green-600 text-white"
                                        : currentStep > stepItem.step
                                          ? "bg-green-100 text-green-600"
                                          : "bg-gray-200 text-gray-500"
                                )}
                            >
                                {currentStep > stepItem.step ? (
                                    <Icons.Check className="size-3.5" />
                                ) : (
                                    stepItem.step + 1
                                )}
                            </span>
                            {stepItem.label}
                        </button>
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "h-[2px] w-16",
                                    currentStep > stepItem.step
                                        ? "bg-green-400"
                                        : "bg-gray-200"
                                )}
                            />
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}
