"use client";

import { useRouter, useSearchParams } from "next/navigation";

// Custom Stepper component styled like Myntra
export default function CheckoutStepper({ currentStep }: { currentStep: number }) {
    const steps = ["Bag", "Address", "Payment"];
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleStepChange = (step: number) => {
        router.push(`?step=${step}`);
    };

    return (
        <div className="mb-8 flex items-center justify-center">
            {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                    {/* Step Label */}
                    <div
                        onClick={() => handleStepChange(index)}
                        className={`cursor-pointer rounded-md px-4 py-2 ${
                            currentStep >= index
                                ? "bg-gray-800 text-white"
                                : "bg-gray-200 text-gray-400"
                        } transition-all duration-300`}
                    >
                        {step}
                    </div>
                    {/* Connecting Line */}
                    {index < steps.length - 1 && (
                        <div
                            className={`h-1 w-12 md:w-16 ${
                                currentStep > index
                                    ? "bg-gray-800"
                                    : "bg-gray-200"
                            } transition-all duration-300`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}