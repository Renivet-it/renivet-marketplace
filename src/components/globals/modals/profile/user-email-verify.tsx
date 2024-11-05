"use client";

import { EmailOTPVerificationForm } from "@/components/globals/forms";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-general";
import { EmailAddressResource } from "@clerk/types";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    emailObj?: EmailAddressResource;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function UserEmailVerifyModal({
    emailObj,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Enter OTP</AlertDialogTitle>
                    <AlertDialogDescription>
                        We have sent an OTP to your email address. Please enter
                        it below to verify your email address.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <EmailOTPVerificationForm emailObj={emailObj} />
            </AlertDialogContent>
        </AlertDialog>
    );
}
