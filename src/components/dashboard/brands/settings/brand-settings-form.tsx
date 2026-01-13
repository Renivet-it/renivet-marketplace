"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button-dash";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, handleClientError } from "@/lib/utils";
import {
    BrandConfidentialWithBrand,
    CachedBrand,
    UpdateBrand,
    updateBrandSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { State } from "country-state-city";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { generatePermittedFileTypes } from "uploadthing/client";
import { z } from "zod";

interface BrandSettingsFormProps {
    brand: CachedBrand;
    brandConfidential?: BrandConfidentialWithBrand | null;
}

// Schema for editable confidential fields
const editableConfidentialSchema = z.object({
    gstin: z.string().min(15, "GSTIN must be at least 15 characters"),
    pan: z.string().min(10, "PAN must be at least 10 characters"),
    bankName: z.string().min(1, "Bank name is required"),
    bankAccountHolderName: z.string().min(1, "Account holder name is required"),
    bankAccountNumber: z.string().min(1, "Account number is required"),
    bankIfscCode: z.string().min(1, "IFSC code is required"),
    authorizedSignatoryName: z
        .string()
        .min(5, "Name must be at least 5 characters"),
    authorizedSignatoryEmail: z.string().email("Invalid email"),
    authorizedSignatoryPhone: z
        .string()
        .min(10, "Phone must be at least 10 digits"),
    addressLine1: z
        .string()
        .min(10, "Address must be at least 10 characters")
        .max(80),
    addressLine2: z.string().nullable().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().default("IN"),
    isSameAsWarehouseAddress: z.boolean().default(true),
    warehouseAddressLine1: z.string().nullable().optional(),
    warehouseAddressLine2: z.string().nullable().optional(),
    warehouseCity: z.string().nullable().optional(),
    warehouseState: z.string().nullable().optional(),
    warehousePostalCode: z.string().nullable().optional(),
    warehouseCountry: z.string().nullable().optional(),
    bankAccountVerificationDocument: z.string().optional(),
    udyamRegistrationCertificate: z.string().nullable().optional(),
    iecCertificate: z.string().nullable().optional(),
    hasAcceptedTerms: z.boolean().default(true),
});

type EditableConfidential = z.infer<typeof editableConfidentialSchema>;

export function BrandSettingsForm({
    brand,
    brandConfidential,
}: BrandSettingsFormProps) {
    const router = useRouter();
    const coverInputRef = useRef<HTMLInputElement>(null!);
    const logoInputRef = useRef<HTMLInputElement>(null!);

    const [logoPreview, setLogoPreview] = useState<string>(brand.logoUrl);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const [coverPreview, setCoverPreview] = useState<string | null>(
        brand.coverUrl
    );
    const [coverFile, setCoverFile] = useState<File | null>(null);

    const states = useMemo(() => State.getStatesOfCountry("IN"), []);

    const { refetch } = trpc.brands.brands.getBrand.useQuery(
        { id: brand.id },
        { initialData: brand }
    );

    // Brand details form (bio, website)
    const detailsForm = useForm<UpdateBrand>({
        resolver: zodResolver(updateBrandSchema),
        defaultValues: {
            bio: brand.bio ?? "",
            website: brand.website ?? "",
            coverUrl: brand.coverUrl,
            logoUrl: brand.logoUrl,
        },
    });

    // Confidential/business form
    const confidentialForm = useForm<EditableConfidential>({
        resolver: zodResolver(editableConfidentialSchema),
        defaultValues: {
            gstin: brandConfidential?.gstin ?? "",
            pan: brandConfidential?.pan ?? "",
            bankName: brandConfidential?.bankName ?? "",
            bankAccountHolderName:
                brandConfidential?.bankAccountHolderName ?? "",
            bankAccountNumber: brandConfidential?.bankAccountNumber ?? "",
            bankIfscCode: brandConfidential?.bankIfscCode ?? "",
            authorizedSignatoryName:
                brandConfidential?.authorizedSignatoryName ?? "",
            authorizedSignatoryEmail:
                brandConfidential?.authorizedSignatoryEmail ?? "",
            authorizedSignatoryPhone:
                brandConfidential?.authorizedSignatoryPhone ?? "",
            addressLine1: brandConfidential?.addressLine1 ?? "",
            addressLine2: brandConfidential?.addressLine2 ?? "",
            city: brandConfidential?.city ?? "",
            state: brandConfidential?.state ?? "",
            postalCode: brandConfidential?.postalCode ?? "",
            country: brandConfidential?.country ?? "IN",
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
            bankAccountVerificationDocument:
                typeof brandConfidential?.bankAccountVerificationDocument ===
                "object"
                    ? brandConfidential?.bankAccountVerificationDocument?.id
                    : (brandConfidential?.bankAccountVerificationDocument ??
                      ""),
            udyamRegistrationCertificate:
                typeof brandConfidential?.udyamRegistrationCertificate ===
                "object"
                    ? brandConfidential?.udyamRegistrationCertificate?.id
                    : (brandConfidential?.udyamRegistrationCertificate ?? ""),
            iecCertificate:
                typeof brandConfidential?.iecCertificate === "object"
                    ? brandConfidential?.iecCertificate?.id
                    : (brandConfidential?.iecCertificate ?? ""),
            hasAcceptedTerms: brandConfidential?.hasAcceptedTerms ?? true,
        },
    });

    const isSameAsWarehouseAddress = confidentialForm.watch(
        "isSameAsWarehouseAddress"
    );

    const { startUpload: startCoverUpload, routeConfig } = useUploadThing(
        "brandCoverUploader",
        {
            onUploadError(e) {
                toast.error(e.message);
            },
        }
    );
    const { startUpload: startLogoUpload } = useUploadThing(
        "brandLogoUploader",
        {
            onUploadError(e) {
                toast.error(e.message);
            },
        }
    );

    const { mutateAsync: updateAsync } =
        trpc.brands.brands.updateBrand.useMutation();

    const { mutate: updateCover, isPending: isCoverUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Uploading cover, please do not close or refresh the page..."
            );
            return { toastId };
        },
        mutationFn: async (file: File) => {
            if (!file) throw new Error("No file selected");

            const res = await startCoverUpload([file]);
            if (!res?.length) throw new Error("Failed to upload cover");

            const [{ appUrl }] = res;
            await updateAsync({
                id: brand.id,
                values: {
                    ...brand,
                    coverUrl: appUrl,
                },
            });
            return appUrl;
        },
        onSuccess: (appUrl, __, { toastId }) => {
            refetch();
            setCoverPreview(appUrl);
            setCoverFile(null);
            detailsForm.setValue("coverUrl", appUrl);
            toast.success("Cover uploaded successfully", { id: toastId });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: updateLogo, isPending: isLogoUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Uploading logo, please do not close or refresh the page..."
            );
            return { toastId };
        },
        mutationFn: async (file: File) => {
            if (!file) throw new Error("No file selected");

            const res = await startLogoUpload([file]);
            if (!res?.length) throw new Error("Failed to upload logo");

            const [{ appUrl }] = res;
            await updateAsync({
                id: brand.id,
                values: {
                    ...brand,
                    logoUrl: appUrl,
                },
            });
            return appUrl;
        },
        onSuccess: (appUrl, __, { toastId }) => {
            refetch();
            setLogoPreview(appUrl);
            setLogoFile(null);
            detailsForm.setValue("logoUrl", appUrl);
            toast.success("Logo uploaded successfully", { id: toastId });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: updateBrandDetails, isPending: isDetailsUpdating } =
        trpc.brands.brands.updateBrand.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating brand details...");
                return { toastId };
            },
            onSuccess: (_, values, { toastId }) => {
                refetch();
                detailsForm.reset(values.values as UpdateBrand);
                router.refresh();
                return toast.success("Brand details updated successfully", {
                    id: toastId,
                });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateConfidential, isPending: isConfidentialUpdating } =
        trpc.brands.confidentials.updateConfidentialDetails.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Updating business information..."
                );
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                router.refresh();
                toast.success("Business information updated successfully.", {
                    id: toastId,
                });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const isAnyPending =
        isCoverUpdating ||
        isLogoUpdating ||
        isDetailsUpdating ||
        isConfidentialUpdating;

    const handleConfidentialSubmit = (values: EditableConfidential) => {
        // If same as warehouse, copy office address to warehouse
        const finalValues = {
            ...values,
            warehouseAddressLine1: values.isSameAsWarehouseAddress
                ? values.addressLine1
                : values.warehouseAddressLine1,
            warehouseAddressLine2: values.isSameAsWarehouseAddress
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

        updateConfidential({
            id: brand.id,
            values: finalValues,
        });
    };

    return (
        <div className="space-y-6">
            {/* Branding Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Brand Appearance</CardTitle>
                    <CardDescription>
                        Customize your brand&apos;s visual identity with a logo
                        and cover image
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Cover Image */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Cover Image
                        </label>
                        <div
                            className={cn(
                                "relative flex aspect-[4/1] items-center justify-center overflow-hidden rounded-md border border-dashed",
                                !coverPreview && "bg-muted",
                                coverPreview && "group"
                            )}
                        >
                            {coverPreview ? (
                                <>
                                    <div className="absolute inset-0 bg-black opacity-0 transition-all ease-in-out group-hover:opacity-50" />
                                    <Image
                                        src={coverPreview}
                                        alt="Brand Cover"
                                        height={2000}
                                        width={2000}
                                        className="size-full object-cover"
                                    />
                                    <Button
                                        size="sm"
                                        type="button"
                                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                                        onClick={() =>
                                            coverInputRef.current.click()
                                        }
                                        disabled={isCoverUpdating}
                                    >
                                        <Icons.Upload />
                                        Change Cover
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    type="button"
                                    onClick={() =>
                                        coverInputRef.current.click()
                                    }
                                    disabled={isCoverUpdating}
                                >
                                    <Icons.Upload />
                                    Upload Cover
                                </Button>
                            )}
                            <input
                                ref={coverInputRef}
                                type="file"
                                className="hidden"
                                accept={generatePermittedFileTypes(
                                    routeConfig
                                ).fileTypes.join()}
                                onChange={(e) => {
                                    if (!e.target.files) return;
                                    setCoverFile(e.target.files[0]);
                                    updateCover(e.target.files[0]);
                                }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Recommended size: 1200x300 pixels
                        </p>
                    </div>

                    <Separator />

                    {/* Logo */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Brand Logo
                        </label>
                        <div className="flex items-center gap-4">
                            <Avatar className="group relative size-24 border-2">
                                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black opacity-0 group-hover:opacity-50" />
                                <Button
                                    size="icon"
                                    type="button"
                                    className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent opacity-0 hover:bg-background hover:text-foreground group-hover:opacity-100"
                                    onClick={() => logoInputRef.current.click()}
                                    disabled={isLogoUpdating}
                                >
                                    <Icons.Upload />
                                    <span className="sr-only">Change Logo</span>
                                </Button>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    className="hidden"
                                    accept={generatePermittedFileTypes(
                                        routeConfig
                                    ).fileTypes.join()}
                                    onChange={(e) => {
                                        if (!e.target.files) return;
                                        setLogoFile(e.target.files[0]);
                                        updateLogo(e.target.files[0]);
                                    }}
                                />
                                <AvatarImage
                                    src={logoPreview}
                                    alt="Brand Logo"
                                    className="size-full object-cover"
                                />
                                <AvatarFallback>{brand.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">
                                    {brand.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Click the logo to upload a new one
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Brand Details Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Brand Details</CardTitle>
                    <CardDescription>
                        Update your brand&apos;s bio and website information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...detailsForm}>
                        <form
                            className="space-y-4"
                            onSubmit={detailsForm.handleSubmit((values) =>
                                updateBrandDetails({ id: brand.id, values })
                            )}
                        >
                            <FormField
                                control={detailsForm.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bio</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Textarea
                                                    {...field}
                                                    placeholder="Tell customers about your brand..."
                                                    minRows={4}
                                                    maxLength={255}
                                                    value={field.value ?? ""}
                                                    disabled={isAnyPending}
                                                />
                                                <div className="absolute bottom-2 right-2 flex items-center text-xs text-muted-foreground">
                                                    {255 -
                                                        (field.value ?? "")
                                                            .length}{" "}
                                                    characters left
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={detailsForm.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="https://yourbrand.com"
                                                value={field.value ?? ""}
                                                disabled={isAnyPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={
                                        isAnyPending ||
                                        !detailsForm.formState.isDirty
                                    }
                                >
                                    {isDetailsUpdating && (
                                        <Icons.Loader2 className="animate-spin" />
                                    )}
                                    Save Details
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Basic Info - Read Only */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                        Your brand&apos;s core information (contact support to
                        change)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Brand Name
                            </label>
                            <Input value={brand.name} disabled />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Brand Slug
                            </label>
                            <Input value={brand.slug} disabled />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input value={brand.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <Input value={brand.phone} disabled />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Business/Confidential Information - Editable */}
            {brandConfidential && (
                <Form {...confidentialForm}>
                    <form
                        onSubmit={confidentialForm.handleSubmit(
                            handleConfidentialSubmit
                        )}
                        className="space-y-6"
                    >
                        {/* Business Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Business Information</CardTitle>
                                <CardDescription>
                                    Your GSTIN, PAN, and bank details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={confidentialForm.control}
                                        name="gstin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>GSTIN</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter GSTIN"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="pan"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>PAN</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter PAN"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator />
                                <h4 className="font-medium">Bank Details</h4>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={confidentialForm.control}
                                        name="bankName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bank Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter bank name"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="bankAccountHolderName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Account Holder Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter account holder name"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="bankAccountNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Account Number
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter account number"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="bankIfscCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>IFSC Code</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter IFSC code"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Authorized Contact Person */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Authorized Contact Person</CardTitle>
                                <CardDescription>
                                    Contact person for warehouse and business
                                    operations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <FormField
                                        control={confidentialForm.control}
                                        name="authorizedSignatoryName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="First Last Name"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="authorizedSignatoryEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="email"
                                                        placeholder="email@example.com"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="authorizedSignatoryPhone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="+91 XXXXX XXXXX"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Office Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Office Address</CardTitle>
                                <CardDescription>
                                    Your brand&apos;s registered office address
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={confidentialForm.control}
                                        name="addressLine1"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>
                                                    Address Line 1
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Street address"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="addressLine2"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>
                                                    Address Line 2 (Optional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                        placeholder="Apartment, suite, etc."
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="City"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State</FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                    disabled={isAnyPending}
                                                >
                                                    <SelectTrigger>
                                                        <FormControl>
                                                            <SelectValue placeholder="Select state" />
                                                        </FormControl>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {states.map((state) => (
                                                            <SelectItem
                                                                key={
                                                                    state.isoCode
                                                                }
                                                                value={
                                                                    state.name
                                                                }
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
                                        control={confidentialForm.control}
                                        name="postalCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Postal Code
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="PIN Code"
                                                        disabled={isAnyPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={confidentialForm.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled
                                                        placeholder="India"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Warehouse Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Warehouse Address</CardTitle>
                                <CardDescription>
                                    Your brand&apos;s warehouse/pickup address
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={confidentialForm.control}
                                    name="isSameAsWarehouseAddress"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                    disabled={isAnyPending}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    Same as office address
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                {!isSameAsWarehouseAddress && (
                                    <div className="grid gap-4 pt-4 md:grid-cols-2">
                                        <FormField
                                            control={confidentialForm.control}
                                            name="warehouseAddressLine1"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>
                                                        Address Line 1
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                            placeholder="Street address"
                                                            disabled={
                                                                isAnyPending
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={confidentialForm.control}
                                            name="warehouseAddressLine2"
                                            render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>
                                                        Address Line 2
                                                        (Optional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                            placeholder="Apartment, suite, etc."
                                                            disabled={
                                                                isAnyPending
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={confidentialForm.control}
                                            name="warehouseCity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                            placeholder="City"
                                                            disabled={
                                                                isAnyPending
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={confidentialForm.control}
                                            name="warehouseState"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>State</FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                        disabled={isAnyPending}
                                                    >
                                                        <SelectTrigger>
                                                            <FormControl>
                                                                <SelectValue placeholder="Select state" />
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
                                        <FormField
                                            control={confidentialForm.control}
                                            name="warehousePostalCode"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Postal Code
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                            placeholder="PIN Code"
                                                            disabled={
                                                                isAnyPending
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={confidentialForm.control}
                                            name="warehouseCountry"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Country
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                            disabled
                                                            placeholder="India"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Save Business Info Button */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={
                                    isAnyPending ||
                                    !confidentialForm.formState.isDirty
                                }
                            >
                                {isConfidentialUpdating && (
                                    <Icons.Loader2 className="animate-spin" />
                                )}
                                Save All Business Information
                            </Button>
                        </div>
                    </form>
                </Form>
            )}

            {/* Verification Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Verification Status</CardTitle>
                    <CardDescription>
                        Your brand&apos;s verification status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        {brand.confidentialVerificationStatus === "approved" ? (
                            <>
                                <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                                    <Icons.CircleCheck className="size-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-green-600">
                                        Verified
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Your brand has been verified and is
                                        ready to sell
                                    </p>
                                </div>
                            </>
                        ) : brand.confidentialVerificationStatus ===
                          "pending" ? (
                            <>
                                <div className="flex size-10 items-center justify-center rounded-full bg-yellow-100">
                                    <Icons.Clock className="size-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-yellow-600">
                                        Pending
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Your verification is under review
                                    </p>
                                </div>
                            </>
                        ) : brand.confidentialVerificationStatus ===
                          "rejected" ? (
                            <>
                                <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                                    <Icons.X className="size-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-red-600">
                                        Rejected
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {brand.confidentialVerificationRejectedReason ??
                                            "Your verification was rejected. Please update your information above."}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
                                    <Icons.AlertCircle className="size-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Not Started</p>
                                    <p className="text-sm text-muted-foreground">
                                        Please complete your verification to
                                        start selling
                                    </p>
                                    <Link
                                        href={`/dashboard/brands/${brand.id}/verification`}
                                    >
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-sm"
                                        >
                                            Start Verification →
                                        </Button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
