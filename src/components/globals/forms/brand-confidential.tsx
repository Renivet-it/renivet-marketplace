"use client";

import { Icons } from "@/components/icons";
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
import { handleClientError } from "@/lib/utils";
import {
    BrandConfidentialWithBrand,
    BrandMediaItem,
    CachedBrand,
    CreateBrandConfidential,
    createBrandConfidentialSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { State } from "country-state-city";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MediaSelectModal } from "../modals";

interface PageProps {
    brand: CachedBrand;
    brandConfidential?: BrandConfidentialWithBrand;
    allMedia: BrandMediaItem[];
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

    const {
        data: { data: mediaRaw },
    } = trpc.brands.media.getMediaItems.useQuery(
        { brandId: brand.id },
        { initialData: { data: allMedia, count: allMedia.length } }
    );

    const docs = mediaRaw.filter((m) => m.type.includes("pdf"));

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
            addressLine1: brandConfidential?.addressLine1 ?? "",
            addressLine2: brandConfidential?.addressLine2 ?? "",
            city: brandConfidential?.city ?? "",
            state: brandConfidential?.state ?? "",
            postalCode: brandConfidential?.postalCode ?? "",
            country: "IN",
        },
    });

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
                    onSubmit={form.handleSubmit((values) =>
                        brandConfidential?.verificationStatus === "rejected"
                            ? resendRequest({
                                  id: brandConfidential.id,
                                  values,
                              })
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
                            {/* Udyam and IEC */}
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
        </>
    );
}
