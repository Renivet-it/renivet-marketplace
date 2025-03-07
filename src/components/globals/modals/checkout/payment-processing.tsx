"use client";

import { Icons } from "@/components/icons";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-general";
import { Spinner } from "@/components/ui/spinner";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    title: string;
    description: string;
    state: "pending" | "success" | "error";
}

export function PaymentProcessingModal({
    isOpen,
    setIsOpen,
    title,
    description,
    state,
}: PageProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogTitle className="sr-only">
                    <AlertDialogHeader>{title}</AlertDialogHeader>
                </AlertDialogTitle>

                <div className="flex flex-col items-center gap-5 py-10">
                    <div>
                        {state === "pending" && <Spinner className="size-12" />}
                        {state === "success" && (
                            <Icons.CircleCheck className="size-12" />
                        )}
                        {state === "error" && (
                            <Icons.AlertTriangle className="size-12" />
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-center text-xl font-semibold">
                            {title}
                        </h3>
                        <p className="text-balance text-center text-sm">
                            {description}
                        </p>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
