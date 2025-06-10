"use client";

import { Button } from "@/components/ui/button-general";
import { useReturnStore } from "@/lib/store/return-store";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { ReturnPaymentDetails } from "./return-payment-details";
import ReturnReasonsAccordion from "./return-reason-accordian";
import { ReturnStepAddress } from "./return-step-address";

interface Props extends GenericProps {
    className?: string;
}

export default function ReturnPageStepper({ className, ...props }: Props) {
    const step = useReturnStore((s) => s.step);
    const nextStep = useReturnStore((s) => s.nextStep);
    const prevStep = useReturnStore((s) => s.prevStep);
    const STEPS = {
        REASONS: 1,
        ADDRESS: 2,
        PAYMENT: 3,
        FINAL_STEP: 3,
    };

    const validatorRef = useRef<() => boolean | Promise<boolean>>(null);

    const handleNext = async () => {
        if (validatorRef.current) {
            const result = validatorRef.current();

            // Handle both Promise and boolean
            const isValid = result instanceof Promise ? await result : result;

            if (!isValid) return;
        } else {
            console.warn("Validator not set");
            return;
        }
        if (step === STEPS.FINAL_STEP) return;
        nextStep();
    };

    return (
        <div className={cn("space-y-6", className)}>
            {step === STEPS.REASONS && (
                <ReturnReasonsAccordion
                    setValidator={(fn) => (validatorRef.current = fn)}
                />
            )}
            {step === STEPS.ADDRESS && (
                <ReturnStepAddress
                    setValidator={(fn) => (validatorRef.current = fn)}
                />
            )}
            {step === STEPS.PAYMENT && (
                <ReturnPaymentDetails
                    setValidator={(fn) => (validatorRef.current = fn)}
                />
            )}

            {/* NAVIGATION BUTTONS */}
            <div className="flex justify-between">
                {step > 1 ? (
                    <Button variant="outline" onClick={prevStep}>
                        Back
                    </Button>
                ) : (
                    <div />
                )}

                <Button onClick={handleNext}>
                    {step === STEPS.FINAL_STEP ? "Submit" : "Continue"}
                </Button>
            </div>
        </div>
    );
}
