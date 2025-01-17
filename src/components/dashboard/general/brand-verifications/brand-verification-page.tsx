"use client";

import { BrandConfidentialEditAdmin } from "@/components/globals/forms";
import {
    VerificationApproveModal,
    VerificationRejectModal,
} from "@/components/globals/modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { convertValueToLabel } from "@/lib/utils";
import { BrandConfidentialWithBrand } from "@/lib/validations";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface PageProps {
    data: BrandConfidentialWithBrand;
}

export function BrandVerificationPage({ data }: PageProps) {
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const websiteUrlRaw = data.brand.website;
    const doesUrlIncludeHttp =
        websiteUrlRaw?.includes("http://") ||
        websiteUrlRaw?.includes("https://");
    const websiteUrl = doesUrlIncludeHttp
        ? websiteUrlRaw
        : `http://${websiteUrlRaw}`;

    return (
        <>
            <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">
                        Verification Request from {data.brand.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View and Manage the brand verification request from{" "}
                        {data.brand.name}
                    </p>
                </div>

                <Badge
                    variant={
                        data.verificationStatus === "pending"
                            ? "default"
                            : data.verificationStatus === "approved"
                              ? "secondary"
                              : "destructive"
                    }
                >
                    {convertValueToLabel(data.verificationStatus)}
                </Badge>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Brand Information</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <h5 className="text-sm font-medium">Name</h5>
                                <p className="text-sm">{data.brand.name}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Email</h5>
                                <Link
                                    href={`mailto:${data.brand.email}`}
                                    className="break-words text-sm text-primary underline"
                                >
                                    {data.brand.email}
                                </Link>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Phone</h5>
                                <p className="text-sm">{data.brand.phone}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Website</h5>
                                {websiteUrl ? (
                                    <Link
                                        href={websiteUrl}
                                        className="break-words text-sm text-primary underline"
                                        target="_blank"
                                    >
                                        {data.brand.website}
                                    </Link>
                                ) : (
                                    <p className="text-sm text-primary">N/A</p>
                                )}
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Logo</h5>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="text-sm text-primary underline">
                                            Click here
                                        </button>
                                    </PopoverTrigger>

                                    <PopoverContent className="overflow-hidden p-0">
                                        <div className="aspect-square size-full overflow-hidden">
                                            <Image
                                                src={data.brand.logoUrl}
                                                alt={data.brand.name}
                                                width={500}
                                                height={500}
                                                className="size-full object-cover"
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Requested On
                                </h5>
                                <p className="text-sm">
                                    {format(
                                        new Date(data.brand.createdAt),
                                        "MMM dd, yyyy"
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Confidential Information</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <h5 className="text-sm font-medium">GST</h5>
                                <p className="text-sm">{data.gstin}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">PAN</h5>
                                <p className="text-sm">{data.pan}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Bank Account Holder Name
                                </h5>
                                <p className="text-sm">
                                    {data.bankAccountHolderName}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Bank Name
                                </h5>
                                <p className="text-sm">{data.bankName}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Bank Account Number
                                </h5>
                                <p className="text-sm">
                                    {data.bankAccountNumber}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Bank IFSC Code
                                </h5>
                                <p className="text-sm">{data.bankIfscCode}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Bank Account Verification Document
                                </h5>

                                <Link
                                    href={
                                        data.bankAccountVerificationDocument!
                                            .url
                                    }
                                    className="text-sm text-primary underline"
                                    target="_blank"
                                >
                                    View
                                </Link>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Authorized Signatory Name
                                </h5>
                                <p className="text-sm">
                                    {data.authorizedSignatoryName}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Authorized Signatory Email
                                </h5>
                                <Link
                                    href={`mailto:${data.authorizedSignatoryEmail}`}
                                    className="break-words text-sm text-primary underline"
                                >
                                    {data.authorizedSignatoryEmail}
                                </Link>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Authorized Signatory Phone
                                </h5>
                                <p className="text-sm">
                                    {data.authorizedSignatoryPhone}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Udyam Registration Certificate
                                </h5>

                                {data.udyamRegistrationCertificate?.url ? (
                                    <Link
                                        href={
                                            data.udyamRegistrationCertificate
                                                .url
                                        }
                                        className="text-sm text-primary underline"
                                        target="_blank"
                                    >
                                        View
                                    </Link>
                                ) : (
                                    <p className="text-sm text-primary">N/A</p>
                                )}
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    IEC Certificate
                                </h5>

                                {data.iecCertificate?.url ? (
                                    <Link
                                        href={data.iecCertificate.url}
                                        className="text-sm text-primary underline"
                                        target="_blank"
                                    >
                                        View
                                    </Link>
                                ) : (
                                    <p className="text-sm text-primary">N/A</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Address Information</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <h5 className="text-sm font-medium">
                                    Office Address Line 1
                                </h5>
                                <p className="text-sm">{data.addressLine1}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Office Address Line 2
                                </h5>
                                <p className="text-sm">{data.addressLine2}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Office City
                                </h5>
                                <p className="text-sm">{data.city}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Office State
                                </h5>
                                <p className="text-sm">{data.state}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Office Postal Code
                                </h5>
                                <p className="text-sm">{data.postalCode}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Office Country
                                </h5>
                                <p className="text-sm">{data.country}</p>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <h5 className="text-sm font-medium">
                                    Warehouse Address Line 1
                                </h5>
                                <p className="text-sm">
                                    {data.warehouseAddressLine1}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Warehouse Address Line 2
                                </h5>
                                <p className="text-sm">
                                    {data.warehouseAddressLine2}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Warehouse City
                                </h5>
                                <p className="text-sm">{data.warehouseCity}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Warehouse State
                                </h5>
                                <p className="text-sm">{data.warehouseState}</p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Warehouse Postal Code
                                </h5>
                                <p className="text-sm">
                                    {data.warehousePostalCode}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Warehouse Country
                                </h5>
                                <p className="text-sm">
                                    {data.warehouseCountry}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {data.verificationStatus === "pending" && (
                    <div className="flex flex-col items-center gap-2 md:flex-row">
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => setIsRejectModalOpen(true)}
                        >
                            Reject
                        </Button>

                        <Button
                            className="w-full"
                            variant="secondary"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            Edit
                        </Button>

                        <Button
                            className="w-full"
                            onClick={() => setIsApproveModalOpen(true)}
                        >
                            Verify & Approve
                        </Button>
                    </div>
                )}
            </div>

            <VerificationApproveModal
                data={data}
                isOpen={isApproveModalOpen}
                setIsOpen={setIsApproveModalOpen}
            />

            <VerificationRejectModal
                data={data}
                isOpen={isRejectModalOpen}
                setIsOpen={setIsRejectModalOpen}
            />

            <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <SheetContent
                    className="h-screen overflow-auto"
                    style={{
                        scrollbarWidth: "none",
                    }}
                >
                    <SheetHeader className="hidden">
                        <SheetTitle>Edit Brand Verification Request</SheetTitle>
                        <SheetDescription>
                            Edit the brand verification request before approving
                        </SheetDescription>
                    </SheetHeader>

                    <BrandConfidentialEditAdmin
                        data={data}
                        setIsOpen={setIsEditModalOpen}
                    />
                </SheetContent>
            </Sheet>
        </>
    );
}
