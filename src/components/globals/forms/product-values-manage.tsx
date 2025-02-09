"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Notice,
    NoticeContent,
    NoticeTitle,
} from "@/components/ui/notice-dash";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { handleClientError } from "@/lib/utils";
import {
    CreateProductValue,
    createProductValueSchema,
    ProductValueData,
    ProductWithBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

const VALUE_STATUSES = [
    { label: "Verified", value: "verified" },
    { label: "Self Declared", value: "self-declared" },
] as const;

const PRODUCT_VALUES = [
    "Recycled",
    "Craftmanship",
    "Organic",
    "Block Chain Traced",
    "Upcycled",
    "Transparent Pricing",
    "Carbon Neutral",
    "Responsible Animal Origin",
    "Save Water",
    "Size Inclusive",
    "Woman Empowermenet",
    "Thirfting",
    "Small Business",
    "Made to Order",
    "Ethical Labor",
    "Material Of Future",
    "Vintage",
    "Timeless",
    "Slow Fashion",
    "Support Communities",
    "Modular Concept",
    "Lower Emission",
    "Closing the Loop",
] as const;

interface PageProps {
    brandId: string;
    product: ProductWithBrand;
}

export function ProductValuesManageForm({ brandId, product }: PageProps) {
    const router = useRouter();

    const form = useForm<CreateProductValue>({
        resolver: zodResolver(createProductValueSchema),
        defaultValues: {
            productId: product.id,
            data: product.values?.data ?? [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "data",
    });

    const { mutate: createValues, isPending: isCreating } =
        trpc.brands.products.createProductValue.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating product values...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product values created successfully", {
                    id: toastId,
                });
                router.refresh();
                router.push(`/dashboard/brands/${brandId}/products`);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateValues, isPending: isUpdating } =
        trpc.brands.products.updateProductValue.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating product values...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product values updated successfully", {
                    id: toastId,
                });
                router.refresh();
                form.reset(form.getValues());
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const isPending = isCreating || isUpdating;

    const addValue = () => {
        append({
            title: "",
            description: "",
            status: "self-declared",
            docUrl: "",
        } satisfies ProductValueData);
    };

    return (
        <>
            <Notice>
                <NoticeContent>
                    <NoticeTitle>
                        <Icons.Info className="size-4" />
                        <span>Info</span>
                    </NoticeTitle>

                    <p className="text-sm">
                        Mark status as &ldquo;Verified&rdquo; if the value is
                        verified by Global Recycled Standard (GRS) or GOTS or
                        other certifying bodies. Mark status as &ldquo;Self-
                        Declared&rdquo; if the brand claims the value without
                        certification.
                    </p>
                </NoticeContent>
            </Notice>

            <Form {...form}>
                <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit((values) => {
                        return product.values?.id
                            ? updateValues({
                                  id: product.values.id,
                                  values: {
                                      data: values.data,
                                  },
                              })
                            : createValues(values);
                    })}
                >
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <Card key={field.id}>
                                <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
                                    <CardTitle className="text-lg font-medium">
                                        Value {index + 1}
                                    </CardTitle>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        disabled={isPending}
                                    >
                                        <Icons.X className="size-4" />
                                    </Button>
                                </CardHeader>

                                <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
                                    <FormField
                                        control={form.control}
                                        name={`data.${index}.title`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Title</FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                        disabled={isPending}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="Select a value" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {PRODUCT_VALUES.map(
                                                                (value) => (
                                                                    <SelectItem
                                                                        key={
                                                                            value
                                                                        }
                                                                        value={
                                                                            value
                                                                        }
                                                                    >
                                                                        {value}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`data.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Description
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Enter description"
                                                        className="min-h-[100px]"
                                                        disabled={isPending}
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`data.${index}.status`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
                                                        disabled={isPending}
                                                    >
                                                        {VALUE_STATUSES.map(
                                                            (status) => (
                                                                <FormItem
                                                                    key={
                                                                        status.value
                                                                    }
                                                                >
                                                                    <FormControl>
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem
                                                                                value={
                                                                                    status.value
                                                                                }
                                                                                id={`status-${index}-${status.value}`}
                                                                            />
                                                                            <FormLabel
                                                                                htmlFor={`status-${index}-${status.value}`}
                                                                                className="font-normal"
                                                                            >
                                                                                {
                                                                                    status.label
                                                                                }
                                                                            </FormLabel>
                                                                        </div>
                                                                    </FormControl>
                                                                </FormItem>
                                                            )
                                                        )}
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`data.${index}.docUrl`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Document URL
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="url"
                                                        placeholder="Enter document URL"
                                                        className="h-9"
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {fields.length > 0 && <Separator />}

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={addValue}
                        disabled={isPending}
                    >
                        <Icons.Plus className="mr-2 size-4" />
                        Add Value
                    </Button>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending || !form.formState.isDirty}
                    >
                        {product.values?.id ? "Update" : "Create"} Values
                    </Button>
                </form>
            </Form>
        </>
    );
}
