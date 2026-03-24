"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormValues = {
    brandId: string;
    subcategoryId: string;
    mainMaterial: string;
    rawMaterialSupplierName: string;
    rawMaterialSupplierLocation: string;
    manufacturerName: string;
    manufacturingLocation: string;
    packingDispatchSource: string;
    packingDispatchLocation: string;
    virginPlasticUsed: boolean | null;
    supplierDeclarationAvailable: boolean | null;
    certifications: string;
    certificationShareable: boolean | null;
    storyHuman: string;
    storyTruth: string;
    storyImpact: string;
    storyWhy: string;
    storyPriceBreakdown: string;
};

const nullableBooleanToOption = (value: boolean | null) => {
    if (value === true) return "yes";
    if (value === false) return "no";
    return "unset";
};

const optionToNullableBoolean = (value: string): boolean | null => {
    if (value === "yes") return true;
    if (value === "no") return false;
    return null;
};

const defaultValues: FormValues = {
    brandId: "",
    subcategoryId: "",
    mainMaterial: "",
    rawMaterialSupplierName: "",
    rawMaterialSupplierLocation: "",
    manufacturerName: "",
    manufacturingLocation: "",
    packingDispatchSource: "",
    packingDispatchLocation: "",
    virginPlasticUsed: null,
    supplierDeclarationAvailable: null,
    certifications: "",
    certificationShareable: null,
    storyHuman: "",
    storyTruth: "",
    storyImpact: "",
    storyWhy: "",
    storyPriceBreakdown: "",
};

export function DecodeXForm({
    id,
    onSuccess,
}: {
    id?: string;
    onSuccess: () => void;
}) {
    const utils = trpc.useUtils();
    const form = useForm<FormValues>({
        defaultValues,
    });

    const selectedBrandId = form.watch("brandId");

    const { data: brandOptions } = trpc.general.decodex.getBrands.useQuery();
    const { data: subcategoryOptions } =
        trpc.general.decodex.getSubcategoriesByBrand.useQuery(
            {
                brandId: selectedBrandId,
            },
            {
                enabled: !!selectedBrandId,
            }
        );

    const { data: existing } = trpc.general.decodex.getById.useQuery(
        { id: id! },
        { enabled: !!id }
    );

    useEffect(() => {
        if (!existing) return;

        form.reset({
            brandId: existing.brandId,
            subcategoryId: existing.subcategoryId,
            mainMaterial: existing.mainMaterial ?? "",
            rawMaterialSupplierName: existing.rawMaterialSupplierName ?? "",
            rawMaterialSupplierLocation:
                existing.rawMaterialSupplierLocation ?? "",
            manufacturerName: existing.manufacturerName ?? "",
            manufacturingLocation: existing.manufacturingLocation ?? "",
            packingDispatchSource: existing.packingDispatchSource ?? "",
            packingDispatchLocation: existing.packingDispatchLocation ?? "",
            virginPlasticUsed: existing.virginPlasticUsed ?? null,
            supplierDeclarationAvailable:
                existing.supplierDeclarationAvailable ?? null,
            certifications: existing.certifications ?? "",
            certificationShareable: existing.certificationShareable ?? null,
            storyHuman: existing.storyHuman ?? "",
            storyTruth: existing.storyTruth ?? "",
            storyImpact: existing.storyImpact ?? "",
            storyWhy: existing.storyWhy ?? "",
            storyPriceBreakdown: existing.storyPriceBreakdown ?? "",
        });
    }, [existing, form]);

    const createMutation = trpc.general.decodex.create.useMutation({
        onSuccess: () => {
            toast.success("DecodeX configuration created");
            utils.general.decodex.getAll.invalidate();
            onSuccess();
        },
        onError: (error) => toast.error(error.message),
    });

    const updateMutation = trpc.general.decodex.update.useMutation({
        onSuccess: () => {
            toast.success("DecodeX configuration updated");
            utils.general.decodex.getAll.invalidate();
            onSuccess();
        },
        onError: (error) => toast.error(error.message),
    });

    const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

    const onSubmit = (values: FormValues) => {
        if (!values.brandId || !values.subcategoryId) {
            toast.error("Please select brand and sub-category");
            return;
        }

        if (id) {
            updateMutation.mutate({
                id,
                ...values,
            });
            return;
        }

        createMutation.mutate(values);
    };

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-h-[75vh] space-y-5 overflow-y-auto pr-1"
        >
            <div className="rounded-lg border p-4">
                <h3 className="text-base font-semibold">Mapping Scope</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                    This applies to all products under the selected
                    brand and sub-category.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="Brand">
                        <Select
                            value={form.watch("brandId")}
                            onValueChange={(value) => {
                                form.setValue("brandId", value);
                                form.setValue("subcategoryId", "");
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select brand" />
                            </SelectTrigger>
                            <SelectContent>
                                {brandOptions?.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Sub-category">
                        <Select
                            value={form.watch("subcategoryId")}
                            onValueChange={(value) =>
                                form.setValue("subcategoryId", value)
                            }
                            disabled={!selectedBrandId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select sub-category" />
                            </SelectTrigger>
                            <SelectContent>
                                {subcategoryOptions?.map((subcategory) => (
                                    <SelectItem
                                        key={subcategory.id}
                                        value={subcategory.id}
                                    >
                                        {subcategory.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </div>

            <div className="rounded-lg border p-4">
                <h3 className="text-base font-semibold">
                    Product Journey and Transparency
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="Main Material">
                        <Input
                            placeholder="e.g. Organic Cotton"
                            {...form.register("mainMaterial")}
                        />
                    </Field>

                    <Field label="Raw Material Supplier Name">
                        <Input
                            placeholder="e.g. ABC Cotton Farms"
                            {...form.register("rawMaterialSupplierName")}
                        />
                    </Field>

                    <Field label="Raw Material Supplier Location">
                        <Input
                            placeholder="e.g. Gujarat, India"
                            {...form.register("rawMaterialSupplierLocation")}
                        />
                    </Field>

                    <Field label="Manufacturer Name">
                        <Input
                            placeholder="e.g. Green Stitch Pvt Ltd"
                            {...form.register("manufacturerName")}
                        />
                    </Field>

                    <Field label="Manufacturing Location">
                        <Input
                            placeholder="e.g. Tiruppur, India"
                            {...form.register("manufacturingLocation")}
                        />
                    </Field>

                    <Field label="Packing and Dispatch Source">
                        <Input
                            placeholder="e.g. Brand Warehouse"
                            {...form.register("packingDispatchSource")}
                        />
                    </Field>

                    <Field label="Packing and Dispatch Location">
                        <Input
                            placeholder="e.g. Bangalore, India"
                            {...form.register("packingDispatchLocation")}
                        />
                    </Field>

                    <Field label="Certifications">
                        <Input
                            placeholder="e.g. GOTS, Fair Trade"
                            {...form.register("certifications")}
                        />
                    </Field>

                    <Field label="Virgin Plastic Used">
                        <Select
                            value={nullableBooleanToOption(
                                form.watch("virginPlasticUsed")
                            )}
                            onValueChange={(value) =>
                                form.setValue(
                                    "virginPlasticUsed",
                                    optionToNullableBoolean(value)
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unset">Not specified</SelectItem>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Supplier Declaration Available">
                        <Select
                            value={nullableBooleanToOption(
                                form.watch("supplierDeclarationAvailable")
                            )}
                            onValueChange={(value) =>
                                form.setValue(
                                    "supplierDeclarationAvailable",
                                    optionToNullableBoolean(value)
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unset">Not specified</SelectItem>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Certification Shareable">
                        <Select
                            value={nullableBooleanToOption(
                                form.watch("certificationShareable")
                            )}
                            onValueChange={(value) =>
                                form.setValue(
                                    "certificationShareable",
                                    optionToNullableBoolean(value)
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unset">Not specified</SelectItem>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </div>

            <div className="rounded-lg border p-4">
                <h3 className="text-base font-semibold">Story Behind the Product</h3>

                <div className="mt-4 grid gap-4">
                    <Field label="Story - The Human">
                        <Textarea
                            minRows={2}
                            placeholder="Who made this product?"
                            {...form.register("storyHuman")}
                        />
                    </Field>

                    <Field label="Story - The Truth">
                        <Textarea
                            minRows={2}
                            placeholder="Share one uncommon truth about this product"
                            {...form.register("storyTruth")}
                        />
                    </Field>

                    <Field label="Story - The Impact">
                        <Textarea
                            minRows={2}
                            placeholder="What positive impact does one order create?"
                            {...form.register("storyImpact")}
                        />
                    </Field>

                    <Field label="Story - Why Choose This Product">
                        <Textarea
                            minRows={2}
                            placeholder="Why should customers choose this product?"
                            {...form.register("storyWhy")}
                        />
                    </Field>

                    <Field label="Story - Price Breakdown (Optional)">
                        <Textarea
                            minRows={2}
                            placeholder="What hidden cost elements go into pricing?"
                            {...form.register("storyPriceBreakdown")}
                        />
                    </Field>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {id ? "Update DecodeX Configuration" : "Save DecodeX Configuration"}
            </Button>
        </form>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}
