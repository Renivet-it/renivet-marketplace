"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { convertValueToLabel } from "@/lib/utils";
import {
    BrandRequest,
    brandRequestConfidentialsSchema,
} from "@/lib/validations";
import Link from "next/link";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    brandRequest: BrandRequest;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ViewConfidentialModal({
    brandRequest,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Brand Confidential Data</DialogTitle>
                    <DialogDescription>
                        View confidential data for {brandRequest.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
                    {Object.keys(brandRequestConfidentialsSchema.shape).map(
                        (key) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const value = (brandRequest as any)[key];
                            const finalValue = !value ? (
                                "N/A"
                            ) : typeof value === "string" &&
                              (value.startsWith("http://") ||
                                  value.startsWith("https://")) ? (
                                <Link
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                >
                                    Click here
                                </Link>
                            ) : (
                                value
                            );

                            return (
                                <div key={key}>
                                    <h5 className="text-sm font-medium">
                                        {convertValueToLabel(key)}
                                    </h5>
                                    <p className="text-sm">{finalValue}</p>
                                </div>
                            );
                        }
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
