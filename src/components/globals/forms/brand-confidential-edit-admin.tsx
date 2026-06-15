"use client";

import {
    BRAND_SUSTAINABILITY_CERTIFICATES,
    BrandSustainabilityCertificateKey,
} from "@/config/brand-program";
import { Icons } from "@/components/icons";
import { MediaSelectModal } from "@/components/globals/modals/brand/media-select";
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
import { SheetFooter } from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    BrandMediaItem,
    BrandConfidentialWithBrand,
    UpdateBrandConfidentialByAdmin,
    updateBrandConfidentialByAdminSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { State } from "country-state-city";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    data: BrandConfidentialWithBrand;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BrandConfidentialEditAdmin({ data, setIsOpen }: PageProps) {
    const router = useRouter();
    const [activeSustainabilityCertificateKey, setActiveSustainabilityCertificateKey] =
        useState<BrandSustainabilityCertificateKey | null>(null);
    const [
        selectedSustainabilityCertificateMedia,
        setSelectedSustainabilityCertificateMedia,
    ] = useState<Record<string, BrandMediaItem | null>>(() =>
        Object.fromEntries(
            (data.sustainabilityCertificates ?? [])
                .filter((item) => item.document)
                .map((item) => [item.key, item.document ?? null])
        )
    );

    const form = useForm<UpdateBrandConfidentialByAdmin>({
        resolver: zodResolver(updateBrandConfidentialByAdminSchema),
        defaultValues: data,
    });

    const {
        data: { data: mediaRaw },
    } = trpc.brands.media.getMediaItems.useQuery(
        { brandId: data.brand.id },
        { initialData: { data: [], count: 0 } }
    );
    const certificateMedia = mediaRaw.filter(
        (m) => m.type.includes("pdf") || m.type.startsWith("image/")
    );
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
            (certificate) => {
                const existing = form
                    .getValues("sustainabilityCertificates")
                    ?.find((entry) => entry.key === certificate.key);

                return {
                    key: certificate.key,
                    documentId:
                        certificate.key === key
                            ? item?.id ?? null
                            : existing?.documentId ?? null,
                };
            }
        );

        form.setValue("sustainabilityCertificates", nextValue, {
            shouldDirty: true,
        });
        setSelectedSustainabilityCertificateMedia((prev) => ({
            ...prev,
            [key]: item,
        }));
    };

    const states = State.getStatesOfCountry("IN");

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });
    const [status] = useQueryState(
        "status",
        parseAsStringLiteral([
            "pending",
            "approved",
            "rejected",
        ] as const).withDefault("pending")
    );
    const { refetch } =
        trpc.general.brands.verifications.getVerifications.useQuery({
            page,
            limit,
            search,
            status,
        });

    const { mutate: updateData, isPending: isUpdating } =
        trpc.general.brands.verifications.editDetails.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating brand details...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Brand details updated", { id: toastId });
                refetch();
                setIsOpen(false);
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
                        updateData({
                            id: data.id,
                            values,
                        })
                    )}
                >
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            Business Information
                        </h2>

                        <Separator />

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="gstin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GSTIN</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter your brand's GST Identification Number"
                                                {...field}
                                                disabled={isUpdating}
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
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Bank Name</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter your brand's bank name"
                                                {...field}
                                                disabled={isUpdating}
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
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                                {...field}
                                                disabled={isUpdating}
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
                                                {...field}
                                                disabled={isUpdating}
                                            />
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
                                                {...field}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                                {...field}
                                                disabled={isUpdating}
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
                                                {...field}
                                                disabled={isUpdating}
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

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            Address Information
                        </h2>

                        <Separator />

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="addressLine1"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Street 1</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered street address"
                                                {...field}
                                                disabled={isUpdating}
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
                                                {...field}
                                                disabled={isUpdating}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>City</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered city"
                                                {...field}
                                                disabled={isUpdating}
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
                                            disabled={isUpdating}
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

                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Postal Code</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Enter brand's registered postal code"
                                                {...field}
                                                disabled={isUpdating}
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

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            Sustainability Certificates
                        </h2>

                        <Separator />

                        <div className="space-y-4">
                            {BRAND_SUSTAINABILITY_CERTIFICATES.map(
                                (certificate) => {
                                    const selectedMedia =
                                        selectedSustainabilityCertificateMedia[
                                            certificate.key
                                        ] ??
                                        data.sustainabilityCertificates.find(
                                            (item) =>
                                                item.key === certificate.key
                                        )?.document ??
                                        null;

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

                                            <div className="rounded-md border border-dashed border-foreground/20 p-4">
                                                {selectedMedia ? (
                                                    <div className="space-y-3">
                                                        <Link
                                                            href={
                                                                selectedMedia.url
                                                            }
                                                            target="_blank"
                                                            className="text-sm text-primary underline"
                                                        >
                                                            View uploaded file
                                                        </Link>

                                                        <div className="flex justify-end">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-9"
                                                                disabled={
                                                                    isUpdating
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
                                                    <div className="flex min-h-20 items-center justify-center">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="text-xs"
                                                            disabled={
                                                                isUpdating
                                                            }
                                                            onClick={() =>
                                                                setActiveSustainabilityCertificateKey(
                                                                    certificate.key
                                                                )
                                                            }
                                                        >
                                                            <Icons.CloudUpload />
                                                            Upload Verification
                                                            File
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <SheetFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isUpdating || !form.formState.isDirty}
                        >
                            Save Changes
                        </Button>
                    </SheetFooter>
                </form>
            </Form>

            <MediaSelectModal
                brandId={data.brand.id}
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
