"use client";

import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { State } from "country-state-city";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { TableBrand } from "./brands-table";

interface PageProps {
    brand: TableBrand;
}

const editBrandSchema = z.object({
    bio: z.string().max(255).nullable().optional(),
    website: z
        .string()
        .url("Invalid URL")
        .nullable()
        .optional()
        .or(z.literal("")),
});

const editConfidentialSchema = z.object({
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
    bankAccountVerificationDocument: z.string().nullable().optional(),
    udyamRegistrationCertificate: z.string().nullable().optional(),
    iecCertificate: z.string().nullable().optional(),
    hasAcceptedTerms: z.boolean().default(true),
});

type EditBrandData = z.infer<typeof editBrandSchema>;
type EditConfidentialData = z.infer<typeof editConfidentialSchema>;

export function BrandAction({ brand }: PageProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", { defaultValue: "" });

    const states = useMemo(() => State.getStatesOfCountry("IN"), []);

    const { refetch } = trpc.general.brands.getBrands.useQuery({
        page,
        limit,
        search,
    });

    // Fetch confidential data (admin API)
    const { data: confidentialData } =
        trpc.general.brands.verifications.getBrandConfidential.useQuery(
            { id: brand.id },
            { enabled: isOpen }
        );

    const brandForm = useForm<EditBrandData>({
        resolver: zodResolver(editBrandSchema),
        defaultValues: {
            bio: brand.bio ?? "",
            website: brand.website ?? "",
        },
    });

    const confidentialForm = useForm<EditConfidentialData>({
        resolver: zodResolver(editConfidentialSchema),
        values: confidentialData
            ? {
                  gstin: confidentialData.gstin,
                  pan: confidentialData.pan,
                  bankName: confidentialData.bankName,
                  bankAccountHolderName: confidentialData.bankAccountHolderName,
                  bankAccountNumber: confidentialData.bankAccountNumber,
                  bankIfscCode: confidentialData.bankIfscCode,
                  authorizedSignatoryName:
                      confidentialData.authorizedSignatoryName,
                  authorizedSignatoryEmail:
                      confidentialData.authorizedSignatoryEmail,
                  authorizedSignatoryPhone:
                      confidentialData.authorizedSignatoryPhone,
                  addressLine1: confidentialData.addressLine1,
                  addressLine2: confidentialData.addressLine2,
                  city: confidentialData.city,
                  state: confidentialData.state,
                  postalCode: confidentialData.postalCode,
                  country: confidentialData.country,
                  isSameAsWarehouseAddress:
                      confidentialData.isSameAsWarehouseAddress,
                  warehouseAddressLine1: confidentialData.warehouseAddressLine1,
                  warehouseAddressLine2: confidentialData.warehouseAddressLine2,
                  warehouseCity: confidentialData.warehouseCity,
                  warehouseState: confidentialData.warehouseState,
                  warehousePostalCode: confidentialData.warehousePostalCode,
                  warehouseCountry: confidentialData.warehouseCountry,
                  bankAccountVerificationDocument:
                      confidentialData.bankAccountVerificationDocument?.id ||
                      null,
                  udyamRegistrationCertificate:
                      confidentialData.udyamRegistrationCertificate?.id || null,
                  iecCertificate: confidentialData.iecCertificate?.id || null,
                  hasAcceptedTerms: confidentialData.hasAcceptedTerms,
              }
            : {
                  gstin: "",
                  pan: "",
                  bankName: "",
                  bankAccountHolderName: "",
                  bankAccountNumber: "",
                  bankIfscCode: "",
                  authorizedSignatoryName: "",
                  authorizedSignatoryEmail: "",
                  authorizedSignatoryPhone: "",
                  addressLine1: "",
                  addressLine2: null,
                  city: "",
                  state: "",
                  postalCode: "",
                  country: "IN",
                  isSameAsWarehouseAddress: true,
                  warehouseAddressLine1: null,
                  warehouseAddressLine2: null,
                  warehouseCity: null,
                  warehouseState: null,
                  warehousePostalCode: null,
                  warehouseCountry: null,
                  bankAccountVerificationDocument: null,
                  udyamRegistrationCertificate: null,
                  iecCertificate: null,
                  hasAcceptedTerms: true,
              },
    });

    const { mutate: updateBrand, isPending: isUpdatingBrand } =
        trpc.brands.brands.updateBrand.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating brand...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Brand updated successfully", { id: toastId });
                router.refresh();
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateConfidential, isPending: isUpdatingConfidential } =
        trpc.general.brands.verifications.editDetails.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Updating confidential details..."
                );
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Confidential details updated successfully", {
                    id: toastId,
                });
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateActiveStatus, isPending: isUpdatingActiveStatus } =
        trpc.general.brands.updateBrandActiveStatus.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating brand status...");
                return { toastId };
            },
            onSuccess: (data, _, { toastId }) => {
                toast.success(
                    `Brand ${data.isActive ? "activated" : "deactivated"} successfully`,
                    { id: toastId }
                );
                router.refresh();
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const handleBrandSubmit = (values: EditBrandData) => {
        updateBrand({
            id: brand.id,
            values: {
                bio: values.bio ?? null,
                website: values.website || null,
                logoUrl: brand.logoUrl,
                coverUrl: brand.coverUrl,
            },
        });
    };

    const handleConfidentialSubmit = (values: EditConfidentialData) => {
        const finalValues = {
            ...values,
            addressLine2: values.addressLine2 ?? null,
            warehouseAddressLine1: values.isSameAsWarehouseAddress
                ? values.addressLine1
                : (values.warehouseAddressLine1 ?? null),
            warehouseAddressLine2: values.isSameAsWarehouseAddress
                ? (values.addressLine2 ?? null)
                : (values.warehouseAddressLine2 ?? null),
            warehouseCity: values.isSameAsWarehouseAddress
                ? values.city
                : (values.warehouseCity ?? null),
            warehouseState: values.isSameAsWarehouseAddress
                ? values.state
                : (values.warehouseState ?? null),
            warehousePostalCode: values.isSameAsWarehouseAddress
                ? values.postalCode
                : (values.warehousePostalCode ?? null),
            warehouseCountry: values.isSameAsWarehouseAddress
                ? values.country
                : (values.warehouseCountry ?? null),
        };

        updateConfidential({
            id: brand.id,
            values: finalValues,
        });
    };

    const getVerificationBadge = () => {
        switch (brand.confidentialVerificationStatus) {
            case "approved":
                return (
                    <Badge className="bg-green-500 hover:bg-green-600">
                        Verified
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                        Pending
                    </Badge>
                );
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="secondary">Not Started</Badge>;
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="size-8 p-0">
                    <Icons.Settings2 className="size-4" />
                    <span className="sr-only">Actions</span>
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full overflow-y-auto p-4 sm:max-w-xl">
                <SheetHeader>
                    <SheetTitle className="sr-only hidden">
                        Brand Actions
                    </SheetTitle>

                    <div className="flex items-center gap-3 text-start">
                        <Avatar className="size-12">
                            <AvatarImage src={brand.logoUrl} alt={brand.name} />
                            <AvatarFallback>{brand.name[0]}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                            <p className="text-base font-semibold">
                                {brand.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {brand.email}
                            </p>
                        </div>
                        {getVerificationBadge()}
                    </div>
                </SheetHeader>

                <div className="mt-4 grid grid-cols-3 items-center divide-x text-center">
                    {[
                        {
                            label: "Email",
                            value: brand.email,
                            icon: Icons.Mail,
                        },
                        {
                            label: "Phone",
                            value: brand.phone,
                            icon: Icons.Phone,
                        },
                        {
                            label: "Website",
                            value: brand.website,
                            icon: Icons.Globe,
                        },
                    ].map(({ label, value, icon: Icon }) => (
                        <button
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 text-xs",
                                !value &&
                                    "cursor-not-allowed text-foreground/50"
                            )}
                            key={label}
                            disabled={!value}
                            onClick={() => {
                                if (value) {
                                    navigator.clipboard.writeText(value);
                                    toast.success(
                                        `${label} copied to clipboard`
                                    );
                                }
                            }}
                        >
                            <Icon
                                className={cn(
                                    "size-4",
                                    !value && "text-foreground/50"
                                )}
                            />
                            Copy {label}
                        </button>
                    ))}
                </div>

                <Separator className="my-4" />

                {/* Brand Details */}
                <div className="mb-4 space-y-2 text-sm">
                    <p className="font-medium">Brand Overview</p>
                    <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Owner</span>
                            <span className="font-medium">
                                {brand.ownerName}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                Members
                            </span>
                            <span className="font-medium">
                                {brand.memberCount}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                Subscription
                            </span>
                            <span className="font-medium">
                                {brand.subscribedTo}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                Created
                            </span>
                            <span className="font-medium">
                                {format(
                                    new Date(brand.createdAt),
                                    "MMM dd, yyyy"
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Brand Status Toggle */}
                <div className="mb-4 flex items-center justify-between rounded-md border p-3">
                    <div>
                        <p className="text-sm font-medium">Brand Status</p>
                        <p className="text-xs text-muted-foreground">
                            {brand.isActive
                                ? "Brand is currently active and visible"
                                : "Brand is deactivated and hidden"}
                        </p>
                    </div>
                    <Switch
                        checked={brand.isActive}
                        disabled={isUpdatingActiveStatus}
                        onCheckedChange={(checked) => {
                            updateActiveStatus({
                                id: brand.id,
                                isActive: checked,
                            });
                        }}
                    />
                </div>

                <Tabs defaultValue="brand" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="brand">Brand Info</TabsTrigger>
                        <TabsTrigger value="confidential">
                            Confidential
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="brand" className="mt-4 space-y-4">
                        <Form {...brandForm}>
                            <form
                                onSubmit={brandForm.handleSubmit(
                                    handleBrandSubmit
                                )}
                                className="space-y-4"
                            >
                                <FormField
                                    control={brandForm.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bio</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Brand description..."
                                                    minRows={3}
                                                    maxLength={255}
                                                    value={field.value ?? ""}
                                                    disabled={isUpdatingBrand}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={brandForm.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="https://example.com"
                                                    value={field.value ?? ""}
                                                    disabled={isUpdatingBrand}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={
                                        isUpdatingBrand ||
                                        !brandForm.formState.isDirty
                                    }
                                >
                                    {isUpdatingBrand && (
                                        <Icons.Loader2 className="animate-spin" />
                                    )}
                                    Save Brand Info
                                </Button>
                            </form>
                        </Form>

                        <Separator />

                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                asChild
                                className="w-full"
                            >
                                <Link
                                    href={`/dashboard/general/brands/verifications/${brand.id}`}
                                >
                                    <Icons.Shield className="size-4" />
                                    View Verification
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                asChild
                                className="w-full"
                            >
                                <Link
                                    href={`/brands/${brand.slug}`}
                                    target="_blank"
                                >
                                    <Icons.ExternalLink className="size-4" />
                                    View Public Page
                                </Link>
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="confidential"
                        className="mt-4 space-y-4"
                    >
                        {!confidentialData ? (
                            <div className="flex items-center justify-center py-8">
                                <Icons.Loader2 className="size-6 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {!confidentialData && (
                                    <div className="rounded-md bg-blue-100 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                                        <strong>Note:</strong> This brand has
                                        not submitted any confidential data yet.
                                        You can start by filling the details
                                        below.
                                    </div>
                                )}

                                <Form {...confidentialForm}>
                                    <form
                                        onSubmit={confidentialForm.handleSubmit(
                                            handleConfidentialSubmit
                                        )}
                                        className="space-y-4"
                                    >
                                        {/* Business Info */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">
                                                Business Information
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="gstin"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                GSTIN
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="pan"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                PAN
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Bank Details */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">
                                                Bank Details
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="bankName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Bank Name
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="bankAccountHolderName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Account Holder
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="bankAccountNumber"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Account Number
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="bankIfscCode"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                IFSC Code
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Signatory */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">
                                                Authorized Signatory
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="authorizedSignatoryName"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <FormLabel>
                                                                Name
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="authorizedSignatoryEmail"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Email
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="email"
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="authorizedSignatoryPhone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Phone
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Office Address */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">
                                                Office Address
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="addressLine1"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <FormLabel>
                                                                Address Line 1
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="addressLine2"
                                                    render={({ field }) => (
                                                        <FormItem className="col-span-2">
                                                            <FormLabel>
                                                                Address Line 2
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    value={
                                                                        field.value ??
                                                                        ""
                                                                    }
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="city"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                City
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="state"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                State
                                                            </FormLabel>
                                                            <Select
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                                value={
                                                                    field.value
                                                                }
                                                                disabled={
                                                                    isUpdatingConfidential
                                                                }
                                                            >
                                                                <SelectTrigger>
                                                                    <FormControl>
                                                                        <SelectValue placeholder="Select state" />
                                                                    </FormControl>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {states.map(
                                                                        (
                                                                            state
                                                                        ) => (
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
                                                    control={
                                                        confidentialForm.control
                                                    }
                                                    name="postalCode"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Postal Code
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    disabled={
                                                                        isUpdatingConfidential
                                                                    }
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={
                                                isUpdatingConfidential ||
                                                !confidentialForm.formState
                                                    .isDirty
                                            }
                                        >
                                            {isUpdatingConfidential && (
                                                <Icons.Loader2 className="animate-spin" />
                                            )}
                                            Save Confidential Details
                                        </Button>
                                    </form>
                                </Form>
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
