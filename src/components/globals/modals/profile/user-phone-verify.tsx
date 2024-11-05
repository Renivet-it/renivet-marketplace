"use client";

import { PhoneOTPVerificationForm } from "@/components/globals/forms";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-general";
import { PhoneNumberResource } from "@clerk/types";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    phoneObj?: PhoneNumberResource;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function UserPhoneVerifyModal({
    phoneObj,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Enter OTP</AlertDialogTitle>
                    <AlertDialogDescription>
                        We have sent an OTP to your phone number. Please enter
                        it below to verify your phone number.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <PhoneOTPVerificationForm phoneObj={phoneObj} />
            </AlertDialogContent>
        </AlertDialog>
    );
}
