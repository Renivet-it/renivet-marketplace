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
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    CreateProductJourney,
    createProductJourneySchema,
    ProductWithBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    FieldArrayWithId,
    useFieldArray,
    useForm,
    UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";

const JOURNEY_TITLES = [
    "Raw Material",
    "Manufacturing",
    "Trim & Components",
    "Packaging",
    "Warehouse Distribution",
] as const;

interface PageProps {
    brandId: string;
    product: ProductWithBrand;
}

export function ProductJourneyManageForm({ brandId, product }: PageProps) {
    const router = useRouter();

    const form = useForm<CreateProductJourney>({
        resolver: zodResolver(createProductJourneySchema),
        defaultValues: {
            productId: product.id,
            data:
                product.journey?.data ??
                JOURNEY_TITLES.map((title) => ({
                    id: crypto.randomUUID(),
                    title,
                    entries: [],
                })),
        },
    });

    const { fields: journeyFields } = useFieldArray({
        control: form.control,
        name: "data",
    });

    const { mutate: createJourney, isPending: isCreating } =
        trpc.brands.products.createProductJourney.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating product journey...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product journey created successfully", {
                    id: toastId,
                });
                router.refresh();
                router.push(`/dashboard/brands/${brandId}/products`);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateJourney, isPending: isUpdating } =
        trpc.brands.products.updateProductJourney.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating product journey...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product journey updated successfully", {
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

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) => {
                    return product.journey?.id
                        ? updateJourney({
                              id: product.journey.id,
                              values: {
                                  data: values.data,
                              },
                          })
                        : createJourney(values);
                })}
            >
                {journeyFields.map((journeyField, journeyIndex) => (
                    <JourneySection
                        key={journeyField.id}
                        journeyField={journeyField}
                        journeyIndex={journeyIndex}
                        form={form}
                        isPending={isPending}
                    />
                ))}

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending || !form.formState.isDirty}
                >
                    {product.journey?.id ? "Update" : "Create"} Journey
                </Button>
            </form>
        </Form>
    );
}

interface JourneySectionProps {
    journeyField: FieldArrayWithId<CreateProductJourney, "data", "id">;
    journeyIndex: number;
    form: UseFormReturn<CreateProductJourney>;
    isPending: boolean;
}

function JourneySection({
    journeyField,
    journeyIndex,
    form,
    isPending,
}: JourneySectionProps) {
    const entries = useFieldArray({
        control: form.control,
        name: `data.${journeyIndex}.entries`,
    });

    return (
        <Card>
            <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg font-medium">
                    {journeyField.title}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
                {entries.fields.map((entry, entryIndex) => (
                    <div key={entry.id} className="flex items-start gap-2">
                        <div className="flex-1 space-y-4">
                            <FormField
                                control={form.control}
                                name={`data.${journeyIndex}.entries.${entryIndex}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter name"
                                                className="h-9"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={`data.${journeyIndex}.entries.${entryIndex}.location`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter location"
                                                className="h-9"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={`data.${journeyIndex}.entries.${entryIndex}.docUrl`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Document URL</FormLabel>
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
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-8"
                            onClick={() => entries.remove(entryIndex)}
                            disabled={isPending}
                        >
                            <Icons.Trash2 className="size-4" />
                        </Button>
                    </div>
                ))}

                {entries.fields.length > 0 && <Separator />}

                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                        entries.append({
                            id: crypto.randomUUID(),
                            name: "",
                            location: "",
                            docUrl: "",
                        })
                    }
                    disabled={isPending}
                >
                    <Icons.Plus className="mr-2 size-4" />
                    Add Info
                </Button>
            </CardContent>
        </Card>
    );
}
