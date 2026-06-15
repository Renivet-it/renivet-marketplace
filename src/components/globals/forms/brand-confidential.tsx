"use client";

import {
    BRAND_SUSTAINABILITY_CERTIFICATES,
    BrandSustainabilityCertificateKey,
} from "@/config/brand-program";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    BrandConfidentialWithBrand,
    BrandMediaItem,
    BrandSustainabilityCertificate,
    CachedBrand,
    CreateBrandConfidential,
    createBrandConfidentialSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { State } from "country-state-city";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MediaSelectModal } from "../modals";

interface PageProps {
    brand: CachedBrand;
    brandConfidential?: BrandConfidentialWithBrand;
    allMedia: BrandMediaItem[];
}

const getDefaultSustainabilityCertificates = (
    certificates?: BrandSustainabilityCertificate[] | null
) =>
    BRAND_SUSTAINABILITY_CERTIFICATES.map((certificate) => ({
        key: certificate.key,
        documentId:
            certificates?.find((item) => item.key === certificate.key)
                ?.documentId ?? null,
    }));

function VerificationPreview({ media }: { media: BrandMediaItem }) {
    if (media.type.startsWith("image/")) {
        return (
            <img
                src={media.url}
                alt={media.alt ?? media.name}
                className="h-40 w-full rounded-md object-cover"
            />
        );
    }

    return (
        <object
            data={media.url}
            type={media.type}
            width="100%"
            height={220}
            className="rounded-md"
        >
            <Link href={media.url} target="_blank" className="underline">
                View uploaded file
            </Link>
        </object>
    );
}

export function BrandConfidentialForm({
    brand,
    allMedia,
    brandConfidential,
}: PageProps) {
    const router = useRouter();

    const [isBankVerSelectorOpen, setIsBankVerSelectorOpen] = useState(false);
    const [selectedBankVer, setSelectedBankVer] = useState<
        BrandMediaItem | null | undefined
    >(brandConfidential?.bankAccountVerificationDocument);

    const [isUdyamCertSelectorOpen, setIsUdyamCertSelectorOpen] =
        useState(false);
    const [selectedUdyamCert, setSelectedUdyamCert] = useState<
        BrandMediaItem | null | undefined
    >(brandConfidential?.udyamRegistrationCertificate);

    const [isIecCertSelectorOpen, setIsIecCertSelectorOpen] = useState(false);
    const [selectedIecCert, setSelectedIecCert] = useState<
        BrandMediaItem | null | undefined
    >(brandConfidential?.iecCertificate);
    const [activeSustainabilityCertificateKey, setActiveSustainabilityCertificateKey] =
        useState<BrandSustainabilityCertificateKey | null>(null);
    const [
        selectedSustainabilityCertificateMedia,
        setSelectedSustainabilityCertificateMedia,
    ] = useState<Record<string, BrandMediaItem | null>>(() =>
        Object.fromEntries(
            (brandConfidential?.sustainabilityCertificates ?? [])
                .filter((item) => item.document)
                .map((item) => [item.key, item.document ?? null])
        )
    );

    const {
        data: { data: mediaRaw },
    } = trpc.brands.media.getMediaItems.useQuery(
        { brandId: brand.id },
        { initialData: { data: allMedia, count: allMedia.length } }
    );

    const docs = mediaRaw.filter((m) => m.type.includes("pdf"));
    const certificateMedia = mediaRaw.filter(
        (m) => m.type.includes("pdf") || m.type.startsWith("image/")
    );
    const isFormLocked =
        isRequestSending ||
        isRequestResending ||
        (!!brandConfidential &&
            brand.confidentialVerificationStatus !== "rejected");

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
            bankAccountVerificationDocument:
                brandConfidential?.bankAccountVerificationDocument?.id ?? "",
            authorizedSignatoryName:
                brandConfidential?.authorizedSignatoryName ?? "",
            authorizedSignatoryEmail:
                brandConfidential?.authorizedSignatoryEmail ?? "",
            authorizedSignatoryPhone:
                brandConfidential?.authorizedSignatoryPhone ?? "",
            udyamRegistrationCertificate:
                brandConfidential?.udyamRegistrationCertificate?.id ?? "",
            iecCertificate: brandConfidential?.iecCertificate?.id ?? "",
            sustainabilityCertificates: getDefaultSustainabilityCertificates(
                brandConfidential?.sustainabilityCertificates
            ),
            addressLine1: brandConfidential?.addressLine1 ?? "",
            addressLine2: brandConfidential?.addressLine2 ?? "",
            city: brandConfidential?.city ?? "",
            state: brandConfidential?.state ?? "",
            postalCode: brandConfidential?.postalCode ?? "",
            country: "IN",
            isSameAsWarehouseAddress:
                brandConfidential?.isSameAsWarehouseAddress ?? true,
            warehouseAddressLine1:
                brandConfidential?.warehouseAddressLine1 ?? "",
            warehouseAddressLine2:
                brandConfidential?.warehouseAddressLine2 ?? "",
            warehouseCity: brandConfidential?.warehouseCity ?? "",
            warehouseState: brandConfidential?.warehouseState ?? "",
            warehousePostalCode: brandConfidential?.warehousePostalCode ?? "",
            warehouseCountry: brandConfidential?.warehouseCountry ?? "IN",
            hasAcceptedTerms: brandConfidential?.hasAcceptedTerms ?? false,
        },
    });
    const activeSustainabilitySelectedMedia = useMemo(() => {
        if (!activeSustainabilityCertificateKey) return [];

        const selected =
            selectedSustainabilityCertificateMedia[
                activeSustainabilityCertificateKey
            ];

        return selected ? [selected] : [];
    }, [
        activeSustainabilityCertificateKey,
        selectedSustainabilityCertificateMedia,
    ]);

    const updateSustainabilityCertificateSelection = (
        key: BrandSustainabilityCertificateKey,
        item: BrandMediaItem | null
    ) => {
        const nextValue = BRAND_SUSTAINABILITY_CERTIFICATES.map(
            (certificate) => ({
                key: certificate.key,
                documentId:
                    certificate.key === key ? item?.id ?? null : null,
            })
        ).map((certificate) => {
            if (certificate.key === key) return certificate;

            const existing = form
                .getValues("sustainabilityCertificates")
                ?.find((item) => item.key === certificate.key);

            return {
                key: certificate.key,
                documentId: existing?.documentId ?? null,
            };
        });

        form.setValue("sustainabilityCertificates", nextValue, {
            shouldDirty: true,
        });
        setSelectedSustainabilityCertificateMedia((prev) => ({
            ...prev,
            [key]: item,
        }));
    };

    const { mutate: sendRequest, isPending: isRequestSending } =
        trpc.brands.confidentials.createConfidential.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Sending request...");
                return { toastId };
            },
            onSuccess: (_, data, { toastId }) => {
                toast.success(
                    "Request sent successfully, we'll get back to you soon",
                    { id: toastId }
                );

                form.reset({
                    ...data,
                    udyamRegistrationCertificate:
                        data.udyamRegistrationCertificate as string | undefined,
                    iecCertificate: data.iecCertificate as string | undefined,
                    country: "IN",
                    addressLine2:
                        (data.addressLine2 as string | undefined) ?? "",
                    warehouseAddressLine1:
                        (data.warehouseAddressLine1 as string | undefined) ??
                        "",
                    warehouseAddressLine2:
                        (data.warehouseAddressLine2 as string | undefined) ??
                        "",
                    warehouseCity:
                        (data.warehouseCity as string | undefined) ?? "",
                    warehouseState:
                        (data.warehouseState as string | undefined) ?? "",
                    warehousePostalCode:
                        (data.warehousePostalCode as string | undefined) ?? "",
                    warehouseCountry:
                        (data.warehouseCountry as string | undefined) ?? "IN",
                    sustainabilityCertificates:
                        getDefaultSustainabilityCertificates(
                            data.sustainabilityCertificates
                        ),
                });
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: resendRequest, isPending: isRequestResending } =
        trpc.brands.confidentials.updateConfidential.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Resending request...");
                return { toastId };
            },
            onSuccess: (_, data, { toastId }) => {
                toast.success(
                    "Request resent successfully, we'll get back to you soon",
                    { id: toastId }
                );

                form.reset(data);
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <>
            <Form {...form}>
                <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit((values) => {
                        values = {
                            ...values,
                            warehouseAddressLine1:
                                values.isSameAsWarehouseAddress
                                    ? values.addressLine1
                                    : values.warehouseAddressLine1,
                            warehouseAddressLine2:
                                values.isSameAsWarehouseAddress
                                    ? values.addressLine2
                                    : values.warehouseAddressLine2,
                            warehouseCity: values.isSameAsWarehouseAddress
                                ? values.city
                                : values.warehouseCity,
                            warehouseState: values.isSameAsWarehouseAddress
                                ? values.state
                                : values.warehouseState,
                            warehousePostalCode: values.isSameAsWarehouseAddress
                                ? values.postalCode
                                : values.warehousePostalCode,
                            warehouseCountry: values.isSameAsWarehouseAddress
                                ? values.country
                                : values.warehouseCountry,
                        };

                        return brandConfidential?.verificationStatus ===
                            "rejected"
                            ? resendRequest({
                                  id: brandConfidential.id,
                                  values,
                              })
                            : sendRequest(values);
                    })}
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
                                                disabled={isFormLocked}
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
                                                disabled={isFormLocked}
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
                                                    disabled={isFormLocked}
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
                                                    disabled={isFormLocked}
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
                                            <FormLabel>
                                                Bank IFSC Code
                                            </FormLabel>

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
                                name="bankAccountVerificationDocument"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>
                                            Bank Account Verification Document
                                        </FormLabel>

                                        <FormControl>
                                            {selectedBankVer ? (
                                                <div className="space-y-2">
                                                    <div className="size-full">
                                                        <object
                                                            data={
                                                                selectedBankVer.url
                                                            }
                                                            type="application/pdf"
                                                            width="100%"
                                                            height={300}
                                                        >
                                                            <Link
                                                                href={
                                                                    selectedBankVer.url
                                                                }
                                                            >
                                                                Download
                                                                Document
                                                            </Link>
                                                        </object>
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-9"
                                                            onClick={() =>
                                                                setIsBankVerSelectorOpen(
                                                                    true
                                                                )
                                                            }
                                                            disabled={
                                                                isRequestSending ||
                                                                isRequestResending ||
                                                                (!!brandConfidential &&
                                                                    brand.confidentialVerificationStatus !==
                                                                        "rejected")
                                                            }
                                                        >
                                                            <Icons.RefreshCcw />
                                                            Replace
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-foreground/40 p-5">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() =>
                                                            setIsBankVerSelectorOpen(
                                                                true
                                                            )
                                                        }
                                                        disabled={
                                                            isRequestSending ||
                                                            isRequestResending ||
                                                            (!!brandConfidential &&
                                                                brand.confidentialVerificationStatus !==
                                                                    "rejected")
                                                        }
                                                    >
                                                        <Icons.CloudUpload />
                                                        Upload Bank Verification
                                                        Document
                                                    </Button>
                                                </div>
                                            )}
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            Address Information
                        </h2>

                        <Separator />

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">
                                    Office Address
                                </h3>

                                <div className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="addressLine1"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Address Line 1
                                                </FormLabel>

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
                                                <FormLabel>
                                                    Address Line 2
                                                </FormLabel>

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
                                                        value={
                                                            field.value ?? ""
                                                        }
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
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
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
                                                            {states.map(
                                                                (state) => (
                                                                    <SelectItem
                                                                        key={
                                                                            state.isoCode
                                                                        }
                                                                        value={
                                                                            state.name
                                                                        }
                                                                    >
                                                                        {
                                                                            state.name
                                                                        }
                                                                    </SelectItem>
                                                                )
                                                            )}
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
                                                    <FormLabel>
                                                        Postal Code
                                                    </FormLabel>

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
                                                    <FormLabel>
                                                        Country
                                                    </FormLabel>

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

                            <FormField
                                control={form.control}
                                name="authorizedSignatoryName"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-1">
                                            <FormLabel>
                                                Authorized Contact Person Name
                                            </FormLabel>

                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button>
                                                            <Icons.CircleHelp className="size-4" />
                                                        </button>
                                                    </TooltipTrigger>

                                                    <TooltipContent className="max-w-72">
                                                        <p>
                                                            Should be the name
                                                            of the person who
                                                            will be present in
                                                            the warehouse during
                                                            the time of pickup.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

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
                                            <div className="flex items-center gap-1">
                                                <FormLabel>
                                                    Authorized Contact Person
                                                    Email
                                                </FormLabel>

                                                <TooltipProvider
                                                    delayDuration={0}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button>
                                                                <Icons.CircleHelp className="size-4" />
                                                            </button>
                                                        </TooltipTrigger>

                                                        <TooltipContent className="max-w-72">
                                                            <p>
                                                                Should be the
                                                                email of the
                                                                person who will
                                                                be present in
                                                                the warehouse
                                                                during the time
                                                                of pickup.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>

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
                                            <div className="flex items-center gap-1">
                                                <FormLabel>
                                                    Authorized Contact Person
                                                    Phone
                                                </FormLabel>

                                                <TooltipProvider
                                                    delayDuration={0}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button>
                                                                <Icons.CircleHelp className="size-4" />
                                                            </button>
                                                        </TooltipTrigger>

                                                        <TooltipContent className="max-w-72">
                                                            <p>
                                                                Should be the
                                                                phone of the
                                                                person who will
                                                                be present in
                                                                the warehouse
                                                                during the time
                                                                of pickup.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>

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

                            <FormField
                                control={form.control}
                                name="isSameAsWarehouseAddress"
                                render={({ field }) => (
                                    <FormItem className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                    disabled={
                                                        isRequestSending ||
                                                        isRequestResending ||
                                                        (!!brandConfidential &&
                                                            brand.confidentialVerificationStatus !==
                                                                "rejected")
                                                    }
                                                />
                                            </FormControl>

                                            <FormLabel>
                                                Warehouse Address is same as
                                                Office Address
                                            </FormLabel>
                                        </div>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch("isSameAsWarehouseAddress") ? null : (
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">
                                        Warehouse Address
                                    </h3>

                                    <div className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="warehouseAddressLine1"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Address Line 1
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter brand's warehouse street address"
                                                            disabled={
                                                                isRequestSending ||
                                                                isRequestResending ||
                                                                (!!brandConfidential &&
                                                                    brand.confidentialVerificationStatus !==
                                                                        "rejected")
                                                            }
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="warehouseAddressLine2"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Address Line 2
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter brand's warehouse street address"
                                                            disabled={
                                                                isRequestSending ||
                                                                isRequestResending ||
                                                                (!!brandConfidential &&
                                                                    brand.confidentialVerificationStatus !==
                                                                        "rejected")
                                                            }
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex flex-col items-center gap-4 md:flex-row">
                                            <FormField
                                                control={form.control}
                                                name="warehouseCity"
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel>
                                                            City
                                                        </FormLabel>

                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter brand's warehouse city"
                                                                disabled={
                                                                    isRequestSending ||
                                                                    isRequestResending ||
                                                                    (!!brandConfidential &&
                                                                        brand.confidentialVerificationStatus !==
                                                                            "rejected")
                                                                }
                                                                {...field}
                                                                value={
                                                                    field.value ??
                                                                    ""
                                                                }
                                                            />
                                                        </FormControl>

                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="warehouseState"
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel>
                                                            State
                                                        </FormLabel>

                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            defaultValue={
                                                                field.value ??
                                                                ""
                                                            }
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
                                                                    <SelectValue placeholder="Select brand's warehouse state" />
                                                                </FormControl>
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                {states.map(
                                                                    (state) => (
                                                                        <SelectItem
                                                                            key={
                                                                                state.isoCode
                                                                            }
                                                                            value={
                                                                                state.name
                                                                            }
                                                                        >
                                                                            {
                                                                                state.name
                                                                            }
                                                                        </SelectItem>
                                                                    )
                                                                )}
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
                                                name="warehousePostalCode"
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel>
                                                            Postal Code
                                                        </FormLabel>

                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter brand's warehouse postal code"
                                                                disabled={
                                                                    isRequestSending ||
                                                                    isRequestResending ||
                                                                    (!!brandConfidential &&
                                                                        brand.confidentialVerificationStatus !==
                                                                            "rejected")
                                                                }
                                                                {...field}
                                                                value={
                                                                    field.value ??
                                                                    ""
                                                                }
                                                            />
                                                        </FormControl>

                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="warehouseCountry"
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel>
                                                            Country
                                                        </FormLabel>

                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter brand's warehouse country"
                                                                disabled
                                                                {...field}
                                                                value={
                                                                    field.value ??
                                                                    "IN"
                                                                }
                                                            />
                                                        </FormControl>

                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            Optional Information
                        </h2>

                        <Separator />

                        <div className="space-y-6">
                            <div className="space-y-3 rounded-lg border border-dashed border-slate-300 p-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold">
                                        Sustainability Certificate Verification
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Upload certificate photos or PDFs for any
                                        applicable sustainability claims. These
                                        are optional, but they help our team
                                        verify your brand faster.
                                    </p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {BRAND_SUSTAINABILITY_CERTIFICATES.map(
                                        (certificate) => {
                                            const selectedMedia =
                                                selectedSustainabilityCertificateMedia[
                                                    certificate.key
                                                ];

                                            return (
                                                <div
                                                    key={certificate.key}
                                                    className="space-y-3 rounded-lg border p-4"
                                                >
                                                    <div className="space-y-1">
                                                        <p className="font-medium">
                                                            {certificate.label}
                                                        </p>
                                                        <Link
                                                            href={
                                                                certificate.verificationUrl
                                                            }
                                                            target="_blank"
                                                            className="break-all text-sm text-primary underline"
                                                        >
                                                            {
                                                                certificate.verificationUrl
                                                            }
                                                        </Link>
                                                    </div>

                                                    {selectedMedia ? (
                                                        <div className="space-y-3">
                                                            <VerificationPreview
                                                                media={
                                                                    selectedMedia
                                                                }
                                                            />
                                                            <div className="flex flex-wrap justify-end gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    className="h-9"
                                                                    disabled={
                                                                        isFormLocked
                                                                    }
                                                                    onClick={() =>
                                                                        updateSustainabilityCertificateSelection(
                                                                            certificate.key,
                                                                            null
                                                                        )
                                                                    }
                                                                >
                                                                    Remove
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="h-9"
                                                                    disabled={
                                                                        isFormLocked
                                                                    }
                                                                    onClick={() =>
                                                                        setActiveSustainabilityCertificateKey(
                                                                            certificate.key
                                                                        )
                                                                    }
                                                                >
                                                                    <Icons.RefreshCcw />
                                                                    Replace
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-foreground/40 p-4">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="text-xs"
                                                                disabled={
                                                                    isFormLocked
                                                                }
                                                                onClick={() =>
                                                                    setActiveSustainabilityCertificateKey(
                                                                        certificate.key
                                                                    )
                                                                }
                                                            >
                                                                <Icons.CloudUpload />
                                                                Upload
                                                                Verification
                                                                File
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="udyamRegistrationCertificate"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>
                                            Udyam Registration Certificate
                                        </FormLabel>

                                        <FormControl>
                                            {selectedUdyamCert ? (
                                                <div className="space-y-2">
                                                    <div className="size-full">
                                                        <object
                                                            data={
                                                                selectedUdyamCert.url
                                                            }
                                                            type="application/pdf"
                                                            width="100%"
                                                            height={300}
                                                        >
                                                            <Link
                                                                href={
                                                                    selectedUdyamCert.url
                                                                }
                                                            >
                                                                Download
                                                                Document
                                                            </Link>
                                                        </object>
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-9"
                                                            onClick={() =>
                                                                setIsUdyamCertSelectorOpen(
                                                                    true
                                                                )
                                                            }
                                                            disabled={
                                                                isRequestSending ||
                                                                isRequestResending ||
                                                                (!!brandConfidential &&
                                                                    brand.confidentialVerificationStatus !==
                                                                        "rejected")
                                                            }
                                                        >
                                                            <Icons.RefreshCcw />
                                                            Replace
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-foreground/40 p-5">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() =>
                                                            setIsUdyamCertSelectorOpen(
                                                                true
                                                            )
                                                        }
                                                        disabled={
                                                            isRequestSending ||
                                                            isRequestResending ||
                                                            (!!brandConfidential &&
                                                                brand.confidentialVerificationStatus !==
                                                                    "rejected")
                                                        }
                                                    >
                                                        <Icons.CloudUpload />
                                                        Upload Udyam
                                                        Registration Certificate
                                                    </Button>
                                                </div>
                                            )}
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="iecCertificate"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>IEC Certificate</FormLabel>

                                        <FormControl>
                                            {selectedIecCert ? (
                                                <div className="space-y-2">
                                                    <div className="size-full">
                                                        <object
                                                            data={
                                                                selectedIecCert.url
                                                            }
                                                            type="application/pdf"
                                                            width="100%"
                                                            height={300}
                                                        >
                                                            <Link
                                                                href={
                                                                    selectedIecCert.url
                                                                }
                                                            >
                                                                Download
                                                                Document
                                                            </Link>
                                                        </object>
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-9"
                                                            onClick={() =>
                                                                setIsIecCertSelectorOpen(
                                                                    true
                                                                )
                                                            }
                                                            disabled={
                                                                isRequestSending ||
                                                                isRequestResending ||
                                                                (!!brandConfidential &&
                                                                    brand.confidentialVerificationStatus !==
                                                                        "rejected")
                                                            }
                                                        >
                                                            <Icons.RefreshCcw />
                                                            Replace
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-foreground/40 p-5">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() =>
                                                            setIsIecCertSelectorOpen(
                                                                true
                                                            )
                                                        }
                                                        disabled={
                                                            isRequestSending ||
                                                            isRequestResending ||
                                                            (!!brandConfidential &&
                                                                brand.confidentialVerificationStatus !==
                                                                    "rejected")
                                                        }
                                                    >
                                                        <Icons.CloudUpload />
                                                        Upload IEC Certificate
                                                    </Button>
                                                </div>
                                            )}
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="hasAcceptedTerms"
                        render={({ field }) => (
                            <FormItem className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={
                                                isRequestSending ||
                                                isRequestResending ||
                                                (!!brandConfidential &&
                                                    brand.confidentialVerificationStatus !==
                                                        "rejected")
                                            }
                                        />
                                    </FormControl>

                                    <FormLabel>
                                        I agree to the{" "}
                                        <Link
                                            href="https://utfs.io/a/4o4vm2cu6g/HtysHtJpctzNolvtEF0WvnGEidmOVIP6xXt4S7befYUykMJq"
                                            target="_blank"
                                            className="text-primary underline"
                                        >
                                            Seller Agreement
                                        </Link>{" "}
                                        of this platform.
                                    </FormLabel>
                                </div>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {(brand.confidentialVerificationStatus === "idle" &&
                        !brandConfidential) ||
                    (brand.confidentialVerificationStatus === "rejected" &&
                        brandConfidential?.verificationStatus ===
                            "rejected") ? (
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={
                                isRequestSending ||
                                isRequestResending ||
                                !form.formState.isDirty
                            }
                        >
                            {brandConfidential?.verificationStatus ===
                            "rejected"
                                ? "Resend"
                                : "Add & Send"}{" "}
                            for Review
                        </Button>
                    ) : null}
                </form>
            </Form>

            <MediaSelectModal
                brandId={brand.id}
                allMedia={docs}
                selectedMedia={selectedBankVer ? [selectedBankVer] : []}
                isOpen={isBankVerSelectorOpen}
                setIsOpen={setIsBankVerSelectorOpen}
                accept="application/pdf"
                onSelectionComplete={(items) => {
                    const item = items[0];
                    if (!item) {
                        form.setValue("bankAccountVerificationDocument", "", {
                            shouldDirty: true,
                        });
                        setSelectedBankVer(null);
                        return;
                    }

                    form.setValue("bankAccountVerificationDocument", item.id, {
                        shouldDirty: true,
                    });
                    setSelectedBankVer(item);
                }}
            />

            <MediaSelectModal
                brandId={brand.id}
                allMedia={docs}
                selectedMedia={selectedUdyamCert ? [selectedUdyamCert] : []}
                isOpen={isUdyamCertSelectorOpen}
                setIsOpen={setIsUdyamCertSelectorOpen}
                accept="application/pdf"
                onSelectionComplete={(items) => {
                    const item = items[0];
                    if (!item) {
                        form.setValue("udyamRegistrationCertificate", null, {
                            shouldDirty: true,
                        });
                        setSelectedUdyamCert(null);
                        return;
                    }

                    form.setValue("udyamRegistrationCertificate", item.id, {
                        shouldDirty: true,
                    });
                    setSelectedUdyamCert(item);
                }}
            />

            <MediaSelectModal
                brandId={brand.id}
                allMedia={docs}
                selectedMedia={selectedIecCert ? [selectedIecCert] : []}
                isOpen={isIecCertSelectorOpen}
                setIsOpen={setIsIecCertSelectorOpen}
                accept="application/pdf"
                onSelectionComplete={(items) => {
                    const item = items[0];
                    if (!item) {
                        form.setValue("iecCertificate", null, {
                            shouldDirty: true,
                        });
                        setSelectedIecCert(null);
                        return;
                    }

                    form.setValue("iecCertificate", item.id, {
                        shouldDirty: true,
                    });
                    setSelectedIecCert(item);
                }}
            />

            <MediaSelectModal
                brandId={brand.id}
                allMedia={certificateMedia}
                selectedMedia={activeSustainabilitySelectedMedia}
                isOpen={activeSustainabilityCertificateKey !== null}
                setIsOpen={(value) => {
                    const nextValue =
                        typeof value === "function" ? value(true) : value;

                    if (!nextValue) {
                        setActiveSustainabilityCertificateKey(null);
                    }
                }}
                accept="application/pdf,image/*"
                onSelectionComplete={(items) => {
                    if (!activeSustainabilityCertificateKey) return;

                    updateSustainabilityCertificateSelection(
                        activeSustainabilityCertificateKey,
                        items[0] ?? null
                    );
                    setActiveSustainabilityCertificateKey(null);
                }}
            />
        </>
    );
}
