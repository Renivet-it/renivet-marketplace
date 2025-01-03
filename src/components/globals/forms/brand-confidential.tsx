"use client";

import { Button } from "@/components/ui/button-dash";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { handleClientError } from "@/lib/utils";
import {
    BrandConfidential,
    CachedBrand,
    CreateBrandConfidential,
    createBrandConfidentialSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { State } from "country-state-city";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    BrandRequestBankVerificationUploaderDropzone,
    BrandRequestIECCertificateUploaderDropzone,
    BrandRequestUdyamCertificateUploaderDropzone,
} from "../dropzones";

interface PageProps {
    brand: CachedBrand;
    brandConfidential?: BrandConfidential;
}

export function BrandConfidentialForm({ brand, brandConfidential }: PageProps) {
    const router = useRouter();

    const [bankVerificationPreview, setBankVerificationPreview] = useState<
        string | null
    >(brandConfidential?.bankAccountVerificationDocumentUrl ?? null);
    const [bankVerificationFile, setBankVerificationFile] =
        useState<File | null>(null);

    const [udyamCertificatePreview, setUdyamCertificatePreview] = useState<
        string | null
    >(brandConfidential?.udyamRegistrationCertificateUrl ?? null);
    const [udyamCertificateFile, setUdyamCertificateFile] =
        useState<File | null>(null);

    const [iecCertificatePreview, setIecCertificatePreview] = useState<
        string | null
    >(brandConfidential?.iecCertificateUrl ?? null);
    const [iecCertificateFile, setIecCertificateFile] = useState<File | null>(
        null
    );

    const states = State.getStatesOfCountry("IN");

    const form = useForm<CreateBrandConfidential>({
        resolver: zodResolver(createBrandConfidentialSchema),
        defaultValues: {
            id: brand.id,
            gstin: brandConfidential?.gstin ?? "",
            pan: brandConfidential?.pan ?? "",
            bankName: brandConfidential?.bankName ?? "",
            bankAccountHolderName:
                brandConfidential?.bankAccountHolderName ?? "",
            bankAccountNumber: brandConfidential?.bankAccountNumber ?? "",
            bankIfscCode: brandConfidential?.bankIfscCode ?? "",
            bankAccountVerificationDocumentUrl:
                brandConfidential?.bankAccountVerificationDocumentUrl ?? "",
            authorizedSignatoryName:
                brandConfidential?.authorizedSignatoryName ?? "",
            authorizedSignatoryEmail:
                brandConfidential?.authorizedSignatoryEmail ?? "",
            authorizedSignatoryPhone:
                brandConfidential?.authorizedSignatoryPhone ?? "",
            udyamRegistrationCertificateUrl:
                brandConfidential?.udyamRegistrationCertificateUrl ?? "",
            iecCertificateUrl: brandConfidential?.iecCertificateUrl ?? "",
            addressLine1: brandConfidential?.addressLine1 ?? "",
            addressLine2: brandConfidential?.addressLine2 ?? "",
            city: brandConfidential?.city ?? "",
            state: brandConfidential?.state ?? "",
            postalCode: brandConfidential?.postalCode ?? "",
            country: "IN",
        },
    });

    const { startUpload: startDocUpload } = useUploadThing(
        "brandRequestDocUploader"
    );

    const { mutateAsync: createConfAsync } =
        trpc.brands.confidentials.createConfidential.useMutation();

    const { mutateAsync: updateConfAsync } =
        trpc.brands.confidentials.updateConfidential.useMutation();

    const { mutate: sendRequest, isPending: isRequestSending } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Sending request...");
            return { toastId };
        },
        mutationFn: async (values: CreateBrandConfidential) => {
            if (!bankVerificationFile)
                throw new Error("Bank verification document is required");

            const [bankVerificationRes, udyamCertRes, iecCertRes] =
                await Promise.all([
                    startDocUpload([bankVerificationFile]),
                    udyamCertificateFile
                        ? startDocUpload([udyamCertificateFile])
                        : null,
                    iecCertificateFile
                        ? startDocUpload([iecCertificateFile])
                        : null,
                ]);

            if (!bankVerificationRes?.length)
                throw new Error("Failed to upload bank verification document");
            if (udyamCertificateFile && !udyamCertRes?.length)
                throw new Error("Failed to upload Udyam certificate");
            if (iecCertificateFile && !iecCertRes?.length)
                throw new Error("Failed to upload IEC certificate");

            const bankVerification = bankVerificationRes[0];
            const udyamCert = udyamCertRes ? udyamCertRes[0] : null;
            const iecCert = iecCertRes ? iecCertRes[0] : null;

            values.bankAccountVerificationDocumentUrl = bankVerification.appUrl;
            if (udyamCert)
                values.udyamRegistrationCertificateUrl = udyamCert.appUrl;
            if (iecCert) values.iecCertificateUrl = iecCert.appUrl;

            await createConfAsync(values);
        },
        onSuccess: (_, data, { toastId }) => {
            toast.success(
                "Request sent successfully, we'll get back to you soon",
                { id: toastId }
            );

            setBankVerificationFile(null);
            setUdyamCertificateFile(null);
            setIecCertificateFile(null);

            form.reset(data);
            router.refresh();
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: resendRequest, isPending: isRequestResending } =
        useMutation({
            onMutate: () => {
                const toastId = toast.loading("Resending request...");
                return { toastId };
            },
            mutationFn: async (values: CreateBrandConfidential) => {
                if (!brandConfidential)
                    throw new Error("Brand confidential data not found");

                const [bankVerificationRes, udyamCertRes, iecCertRes] =
                    await Promise.all([
                        bankVerificationFile
                            ? startDocUpload([bankVerificationFile])
                            : null,
                        udyamCertificateFile
                            ? startDocUpload([udyamCertificateFile])
                            : null,
                        iecCertificateFile
                            ? startDocUpload([iecCertificateFile])
                            : null,
                    ]);

                if (bankVerificationRes && !bankVerificationRes?.length)
                    throw new Error(
                        "Failed to upload bank verification document"
                    );
                if (udyamCertificateFile && !udyamCertRes?.length)
                    throw new Error("Failed to upload Udyam certificate");
                if (iecCertificateFile && !iecCertRes?.length)
                    throw new Error("Failed to upload IEC certificate");

                const bankVerificationUrl = bankVerificationRes
                    ? bankVerificationRes[0].appUrl
                    : brandConfidential.bankAccountVerificationDocumentUrl;
                const udyamCert = udyamCertRes ? udyamCertRes[0] : null;
                const iecCert = iecCertRes ? iecCertRes[0] : null;

                values.bankAccountVerificationDocumentUrl = bankVerificationUrl;
                if (udyamCert)
                    values.udyamRegistrationCertificateUrl = udyamCert.appUrl;
                if (iecCert) values.iecCertificateUrl = iecCert.appUrl;

                await updateConfAsync({ id: brand.id, values });
            },
            onSuccess: (_, data, { toastId }) => {
                toast.success(
                    "Request resent successfully, we'll get back to you soon",
                    { id: toastId }
                );

                setBankVerificationFile(null);
                setUdyamCertificateFile(null);
                setIecCertificateFile(null);

                form.reset(data);
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) =>
                    brandConfidential?.verificationStatus === "rejected"
                        ? resendRequest(values)
                        : sendRequest(values)
                )}
            >
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Business Information
                    </h2>

                    <Separator />

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="gstin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>GSTIN</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter your brand's GST Identification Number"
                                            disabled={
                                                isRequestSending ||
                                                isRequestResending ||
                                                (!!brandConfidential &&
                                                    brand.confidentialVerificationStatus !==
                                                        "rejected")
                                            }
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="pan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>PAN</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter your brand's Permanent Account Number"
                                            disabled={
                                                isRequestSending ||
                                                isRequestResending ||
                                                (!!brandConfidential &&
                                                    brand.confidentialVerificationStatus !==
                                                        "rejected")
                                            }
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Bank Name</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter your brand's bank name"
                                                disabled={
                                                    isRequestSending ||
                                                    isRequestResending ||
                                                    (!!brandConfidential &&
                                                        brand.confidentialVerificationStatus !==
                                                            "rejected")
                                                }
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bankAccountHolderName"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            Bank Account Holder Name
                                        </FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter bank account holder name (with proper casing)"
                                                disabled={
                                                    isRequestSending ||
                                                    isRequestResending ||
                                                    (!!brandConfidential &&
                                                        brand.confidentialVerificationStatus !==
                                                            "rejected")
                                                }
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="bankAccountNumber"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            Bank Account Number
                                        </FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter bank account number"
                                                disabled={
                                                    isRequestSending ||
                                                    isRequestResending ||
                                                    (!!brandConfidential &&
                                                        brand.confidentialVerificationStatus !==
                                                            "rejected")
                                                }
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bankIfscCode"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Bank IFSC Code</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter bank IFSC code"
                                                disabled={
                                                    isRequestSending ||
                                                    isRequestResending ||
                                                    (!!brandConfidential &&
                                                        brand.confidentialVerificationStatus !==
                                                            "rejected")
                                                }
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="bankAccountVerificationDocumentUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>
                                        Bank Verification Document (Cancelled
                                        Cheque, Bank Statement, etc.)
                                    </FormLabel>

                                    <BrandRequestBankVerificationUploaderDropzone
                                        file={bankVerificationFile}
                                        form={form}
                                        isPending={
                                            isRequestSending ||
                                            isRequestResending ||
                                            (!!brandConfidential &&
                                                brand.confidentialVerificationStatus !==
                                                    "rejected")
                                        }
                                        preview={bankVerificationPreview}
                                        setFile={setBankVerificationFile}
                                        setPreview={setBankVerificationPreview}
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="authorizedSignatoryName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Authorized Contact Person Name
                                    </FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter authorized contact person name"
                                            disabled={
                                                isRequestSending ||
                                                isRequestResending ||
                                                (!!brandConfidential &&
                                                    brand.confidentialVerificationStatus !==
                                                        "rejected")
                                            }
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="authorizedSignatoryEmail"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            Authorized Contact Person Email
                                        </FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter authorized contact person email"
                                                disabled={
                                                    isRequestSending ||
                                                    isRequestResending ||
                                                    (!!brandConfidential &&
                                                        brand.confidentialVerificationStatus !==
                                                            "rejected")
                                                }
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="authorizedSignatoryPhone"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            Authorized Contact Person Phone
                                        </FormLabel>

                                        <FormControl>
                                            <Input
                                                inputMode="tel"
                                                placeholder="Enter authorized contact person phone number"
                                                disabled={
                                                    isRequestSending ||
                                                    isRequestResending ||
                                                    (!!brandConfidential &&
                                                        brand.confidentialVerificationStatus !==
                                                            "rejected")
                                                }
                                                {...field}
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value.replace(
                                                            /[^0-9-+]/g,
                                                            ""
                                                        );

                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Address Information
                    </h2>

                    <Separator />

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="addressLine1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Street 1</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter brand's registered street address"
                                            disabled={
                                                isRequestSending ||
                                                isRequestResending ||
                                                (!!brandConfidential &&
                                                    brand.confidentialVerificationStatus !==
                                                        "rejected")
                                            }
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="addressLine2"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Street 2</FormLabel>

                                    <FormControl>
                                        <Input
                                            placeholder="Enter brand's registered street address"
                                            disabled={
                                                isRequestSending ||
                                                isRequestResending ||
                                                (!!brandConfidential &&
                                                    brand.confidentialVerificationStatus !==
                                                        "rejected")
                                            }
                                            {...field}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>City</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered city"
                                                disabled={
                                                    isRequestSending ||
                                                    isRequestResending ||
                                                    (!!brandConfidential &&
                                                        brand.confidentialVerificationStatus !==
                                                            "rejected")
                                                }
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>State</FormLabel>

                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={
                                                isRequestSending ||
                                                isRequestResending ||
                                                (!!brandConfidential &&
                                                    brand.confidentialVerificationStatus !==
                                                        "rejected")
                                            }
                                        >
                                            <SelectTrigger>
                                                <FormControl>
                                                    <SelectValue placeholder="Select brand's registered state" />
                                                </FormControl>
                                            </SelectTrigger>

                                            <SelectContent>
                                                {states.map((state) => (
                                                    <SelectItem
                                                        key={state.isoCode}
                                                        value={state.name}
                                                    >
                                                        {state.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex flex-col items-center gap-4 md:flex-row">
                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Postal Code</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered postal code"
                                                disabled={
                                                    isRequestSending ||
                                                    isRequestResending ||
                                                    (!!brandConfidential &&
                                                        brand.confidentialVerificationStatus !==
                                                            "rejected")
                                                }
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Country</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered country"
                                                disabled
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        Optional Information
                    </h2>

                    <Separator />

                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="udyamRegistrationCertificateUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>
                                        Udyam Certificate (if applicable for
                                        MSMEs)
                                    </FormLabel>

                                    <BrandRequestUdyamCertificateUploaderDropzone
                                        file={udyamCertificateFile}
                                        form={form}
                                        isPending={
                                            isRequestSending ||
                                            isRequestResending ||
                                            (!!brandConfidential &&
                                                brand.confidentialVerificationStatus !==
                                                    "rejected")
                                        }
                                        preview={udyamCertificatePreview}
                                        setFile={setUdyamCertificateFile}
                                        setPreview={setUdyamCertificatePreview}
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="iecCertificateUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>IEC Certificate</FormLabel>

                                    <BrandRequestIECCertificateUploaderDropzone
                                        file={iecCertificateFile}
                                        form={form}
                                        isPending={
                                            isRequestSending ||
                                            isRequestResending ||
                                            (!!brandConfidential &&
                                                brand.confidentialVerificationStatus !==
                                                    "rejected")
                                        }
                                        preview={iecCertificatePreview}
                                        setFile={setIecCertificateFile}
                                        setPreview={setIecCertificatePreview}
                                    />

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {(!brand.isConfidentialSentForVerification &&
                    !brandConfidential) ||
                (!brand.isConfidentialSentForVerification &&
                    brandConfidential?.verificationStatus === "rejected") ? (
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={
                            isRequestSending ||
                            isRequestResending ||
                            (bankVerificationPreview ===
                                brandConfidential?.bankAccountVerificationDocumentUrl &&
                                udyamCertificatePreview ===
                                    brandConfidential?.udyamRegistrationCertificateUrl &&
                                iecCertificatePreview ===
                                    brandConfidential?.iecCertificateUrl &&
                                !form.formState.isDirty)
                        }
                    >
                        {brandConfidential?.verificationStatus === "rejected"
                            ? "Resend"
                            : "Add & Send"}{" "}
                        for Review
                    </Button>
                ) : null}
            </form>
        </Form>
    );
}
