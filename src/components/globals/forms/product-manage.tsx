"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Editor, EditorRef } from "@/components/ui/editor";
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import PriceInput from "@/components/ui/price-input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { PRESET_COLORS } from "@/config/const";
import { SIZES } from "@/config/sizes";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import {
    calculatePriceWithGST,
    calculatePriceWithoutGST,
    cn,
    handleClientError,
} from "@/lib/utils";
import {
    CreateProduct,
    createProductSchema,
    ProductWithBrand,
    UpdateProduct,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "@uploadthing/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";

interface PageProps {
    brandId: string;
    product?: ProductWithBrand;
}

export function ProductManageForm({ brandId, product }: PageProps) {
    const router = useRouter();
    const [activeColor, setActiveColor] = useState<string>("#ffffff");
    const [newColorName, setNewColorName] = useState<string>("");

    const editorRef = useRef<EditorRef>(null!);

    const [selectedSizes, setSelectedSizes] = useState<string[]>(
        product?.sizes.map((size) => size.name) ?? []
    );
    const [previews, setPreviews] = useState<string[]>(
        product?.imageUrls ?? []
    );
    const [files, setFiles] = useState<File[]>([]);

    const form = useForm<CreateProduct>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            name: product?.name ?? "",
            price: product?.price
                ? calculatePriceWithoutGST(parseFloat(product.price)).toString()
                : "",
            description:
                product?.description ??
                // eslint-disable-next-line quotes
                '<p><strong>Product Details </strong></p><p>Grey tartan checked opaque Casual shirt,  has a spread collar, button placket, 1 patch pocket, long regular sleeves, curved hem</p><p></p><p><strong>Size &amp; Fit</strong></p><p>Brand Fit:</p><p>Fit: Slim Fit</p><p>Size worn by the model: M</p><p>Chest: 38"</p><p>Height: 6\'1"</p><p></p><p><strong>Material &amp; Care</strong></p><p>100% Cotton</p><p>Machine Wash</p>',
            brandId,
            sizes: product?.sizes ?? [],
            colors: product?.colors ?? [],
            imageUrls: product?.imageUrls ?? [],
            isPublished: product?.isPublished ?? false,
        },
    });

    const { startUpload, routeConfig } = useUploadThing("productImageUploader");

    useEffect(() => {
        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview));
        };
    }, [previews]);

    const {
        fields: sizesFields,
        append: appendSizes,
        remove: removeSizes,
    } = useFieldArray({
        name: "sizes",
        control: form.control,
    });

    const {
        fields: colorsFields,
        append: appendColors,
        remove: removeColors,
    } = useFieldArray({
        name: "colors",
        control: form.control,
    });

    const handleSizeToggle = (size: string) => {
        if (size === "One Size") {
            if (selectedSizes.includes("One Size")) {
                setSelectedSizes([]);
                form.setValue("sizes", []);
            } else {
                setSelectedSizes(["One Size"]);
                form.setValue("sizes", [
                    { name: "One Size" as const, quantity: 0 },
                ]);
            }
            return;
        }

        if (selectedSizes.includes("One Size")) return;

        setSelectedSizes((prev) => {
            const newSizes = selectedSizes.includes(size)
                ? prev.filter((s) => s !== size)
                : [...prev, size];

            if (selectedSizes.includes(size)) {
                const index = selectedSizes.findIndex(
                    (field) => field === size
                );
                if (index !== -1) removeSizes(index);
            } else {
                const existingIndex = sizesFields.findIndex(
                    (field) => field.name === size
                );
                if (existingIndex === -1)
                    appendSizes({
                        name: size as ProductWithBrand["sizes"][number]["name"],
                        quantity: 0,
                    });
            }

            return newSizes;
        });
    };

    const isSizeDisabled = (size: string) =>
        (size === "One Size" &&
            selectedSizes.length > 0 &&
            !selectedSizes.includes("One Size")) ||
        (size !== "One Size" && selectedSizes.includes("One Size"));

    const addColor = (
        color: { name: string; hex: string },
        forceAdd = true
    ) => {
        if (
            !forceAdd &&
            PRESET_COLORS.some(
                (preset) =>
                    preset.name.toLowerCase() === color.name.toLowerCase() ||
                    preset.hex === color.hex
            )
        )
            return toast.error("Color already exists in presets");

        if (
            !colorsFields.some(
                (field) => field.name === color.name || field.hex === color.hex
            )
        )
            appendColors(color);
    };

    const isCustomColorPresent = colorsFields.some(
        (field) =>
            !PRESET_COLORS.some(
                (preset) =>
                    preset.name.toLowerCase() === field.name.toLowerCase() ||
                    preset.hex === field.hex
            )
    );

    const onDrop = (acceptedFiles: File[]) => {
        const remainingSlots = 5 - previews.length;
        const newFiles = acceptedFiles.slice(0, remainingSlots);

        if (newFiles.length > 0) {
            setFiles((prev) => [...prev, ...newFiles]);

            const newPreviews = newFiles.map((file) =>
                URL.createObjectURL(file)
            );
            setPreviews((prev) => [...prev, ...newPreviews]);

            const currentUrls = form.getValues("imageUrls");
            form.setValue("imageUrls", [...currentUrls, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setPreviews((prev) => prev.filter((_, i) => i !== index));
        setFiles((prev) => prev.filter((_, i) => i !== index));

        const currentUrls = form.getValues("imageUrls");
        form.setValue(
            "imageUrls",
            currentUrls.filter((_, i) => i !== index)
        );
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(routeConfig).fileTypes
        ),
        maxFiles: 5 - previews.length,
        maxSize: 4 * 1024 * 1024,
    });

    const { mutateAsync: createProductAsync } =
        trpc.brands.products.createProduct.useMutation();
    const { mutateAsync: updateProductAsync } =
        trpc.brands.products.updateProduct.useMutation();

    const { mutate: createProduct, isPending: isCreating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Adding product...");
            return { toastId };
        },
        mutationFn: async (values: CreateProduct) => {
            const res = await startUpload(files);
            if (!res?.length) throw new Error("Failed to upload images");

            const imageUrls = res.map((file) => file.appUrl);
            values.imageUrls = imageUrls;

            if (values.imageUrls.length > 5)
                throw new Error("Maximum 5 images allowed");

            return await createProductAsync(values);
        },
        onSuccess: (data, _, { toastId }) => {
            toast.success(
                "Product has been added, please add categorize your product for better organization",
                { id: toastId }
            );
            router.push(
                `/dashboard/brands/${brandId}/products/p/${data.id}/categorize`
            );
            setPreviews([]);
            setFiles([]);
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: updateProduct, isPending: isUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Updating product...");
            return { toastId };
        },
        mutationFn: async (values: UpdateProduct) => {
            if (!product) throw new Error("Product not found");

            if (files.length > 0) {
                const res = await startUpload(files);
                if (!res?.length) throw new Error("Failed to upload images");

                const imageUrls = res.map((file) => file.appUrl);
                values.imageUrls = [...values.imageUrls, ...imageUrls];
            }

            if (values.imageUrls.length > 5)
                throw new Error("Maximum 5 images allowed");

            await updateProductAsync({ productId: product.id, values });
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Product updated successfully", { id: toastId });
            router.push(`/dashboard/brands/${brandId}/products`);
            setPreviews([]);
            setFiles([]);
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
                    product
                        ? updateProduct({
                              ...values,
                              isAvailable: product.isAvailable,
                              price: calculatePriceWithGST(
                                  parseFloat(values.price)
                              ).toString(),
                          })
                        : createProduct({
                              ...values,
                              price: calculatePriceWithGST(
                                  parseFloat(values.price)
                              ).toString(),
                          })
                )}
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="THE BEAR HOUSE - Men Grey Slim Fit Tartan Checks Checked Casual Shirt"
                                    disabled={isCreating || isUpdating}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>

                            <FormControl>
                                <Editor
                                    {...field}
                                    disabled={isCreating || isUpdating}
                                    ref={editorRef}
                                    content={field.value ?? ""}
                                    onChange={field.onChange}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel>Price</FormLabel>

                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <PriceInput
                                        placeholder="998.00"
                                        currency="INR"
                                        symbol="₹"
                                        disabled={isCreating || isUpdating}
                                        {...field}
                                        onChange={(e) => {
                                            const regex =
                                                /^[0-9]*\.?[0-9]{0,2}$/;
                                            if (regex.test(e.target.value))
                                                field.onChange(e);
                                        }}
                                    />

                                    <span>+</span>

                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="cursor-pointer rounded-md bg-foreground/80 p-1 px-2 text-sm text-background">
                                                    GST
                                                </span>
                                            </TooltipTrigger>

                                            <TooltipContent>
                                                We will add GST to the price
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <span>=</span>

                                    <span>
                                        {calculatePriceWithGST(
                                            parseFloat(
                                                field.value.length > 0
                                                    ? field.value
                                                    : "0"
                                            )
                                        )}
                                    </span>
                                </div>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="sizes"
                    render={() => (
                        <FormItem
                            className={cn(
                                sizesFields.length > 0 && "space-y-4"
                            )}
                        >
                            <div className="space-y-2">
                                <FormLabel>Sizes</FormLabel>

                                <FormControl>
                                    <div className="flex flex-wrap gap-2">
                                        {SIZES.map((size) => (
                                            <Button
                                                key={size}
                                                type="button"
                                                variant={
                                                    selectedSizes.includes(size)
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() =>
                                                    handleSizeToggle(size)
                                                }
                                                disabled={
                                                    isSizeDisabled(size) ||
                                                    isCreating ||
                                                    isUpdating
                                                }
                                                className="min-w-[80px]"
                                            >
                                                {size}
                                            </Button>
                                        ))}
                                    </div>
                                </FormControl>

                                <FormMessage />
                            </div>

                            <div className="space-y-2">
                                {sizesFields.length > 0 && <Separator />}

                                {sizesFields
                                    .sort(
                                        (a, b) =>
                                            SIZES.indexOf(a.name) -
                                            SIZES.indexOf(b.name)
                                    )
                                    .map((field, index) => (
                                        <FormField
                                            key={field.id}
                                            control={form.control}
                                            name={`sizes.${index}.quantity`}
                                            render={({
                                                field: {
                                                    value,
                                                    onChange,
                                                    ...fieldProps
                                                },
                                            }) => (
                                                <FormItem className="flex items-center gap-4">
                                                    <FormLabel className="min-w-6 whitespace-nowrap">
                                                        {
                                                            sizesFields[index]
                                                                .name
                                                        }
                                                        :
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter quantity"
                                                            type="number"
                                                            disabled={
                                                                isCreating ||
                                                                isUpdating
                                                            }
                                                            {...fieldProps}
                                                            value={value || ""}
                                                            onChange={(e) =>
                                                                onChange(
                                                                    parseInt(
                                                                        e.target
                                                                            .value
                                                                    ) || 0
                                                                )
                                                            }
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                            </div>
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Colors</div>

                        <Tabs defaultValue="preset" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="preset">
                                    Presets
                                </TabsTrigger>
                                <TabsTrigger value="custom">Custom</TabsTrigger>
                            </TabsList>

                            <TabsContent value="preset" className="mt-4">
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {PRESET_COLORS.map((color) => (
                                        <Button
                                            key={color.hex}
                                            type="button"
                                            variant="outline"
                                            className="h-12 w-full overflow-hidden p-0 hover:bg-muted hover:text-foreground"
                                            onClick={() => addColor(color)}
                                        >
                                            <div className="flex size-full items-center">
                                                <div
                                                    className="h-full w-1/3"
                                                    style={{
                                                        backgroundColor:
                                                            color.hex,
                                                    }}
                                                />
                                                <span className="flex h-full w-2/3 items-center justify-center border-l text-center text-xs">
                                                    {color.name}
                                                </span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="custom" className="mt-4">
                                <div className="flex items-end space-x-4">
                                    <div className="grow">
                                        <Input
                                            placeholder="Color name"
                                            value={newColorName}
                                            onChange={(e) =>
                                                setNewColorName(e.target.value)
                                            }
                                            className="mb-2"
                                        />

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-10 w-full overflow-hidden p-0"
                                                >
                                                    <div className="flex size-full items-center">
                                                        <div
                                                            className="h-full w-1/3"
                                                            style={{
                                                                backgroundColor:
                                                                    activeColor,
                                                            }}
                                                        />

                                                        <span className="flex h-full w-2/3 items-center justify-center border-l text-xs uppercase">
                                                            {activeColor}
                                                        </span>
                                                    </div>
                                                </Button>
                                            </PopoverTrigger>

                                            <PopoverContent className="w-auto border-0 bg-transparent p-0">
                                                <HexColorPicker
                                                    color={activeColor}
                                                    onChange={setActiveColor}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={() =>
                                            addColor(
                                                {
                                                    name:
                                                        newColorName.length > 0
                                                            ? newColorName
                                                            : "Custom",
                                                    hex: activeColor,
                                                },
                                                false
                                            )
                                        }
                                        className="mb-2"
                                    >
                                        <Icons.Plus className="mr-2 size-4" />
                                        Add
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {colorsFields.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                Selected Colors
                            </div>

                            {colorsFields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="flex items-center gap-2 md:gap-4"
                                >
                                    <div>
                                        <div
                                            className="size-8 rounded-full border"
                                            style={{
                                                backgroundColor: field.hex,
                                            }}
                                        />
                                    </div>

                                    <div className="grow">
                                        <FormField
                                            control={form.control}
                                            name={`colors.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Color name"
                                                            readOnly
                                                            className="focus-visible:ring-0 focus-visible:ring-offset-0"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="w-24">
                                        <FormField
                                            control={form.control}
                                            name={`colors.${index}.hex`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Hex"
                                                            readOnly
                                                            className="focus-visible:ring-0 focus-visible:ring-offset-0"
                                                            {...field}
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
                                        onClick={() => removeColors(index)}
                                        className="text-destructive"
                                    >
                                        <Icons.X className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {isCustomColorPresent && (
                        <p className="text-sm text-destructive">
                            * Custom colors are not included while filtering the
                            products
                        </p>
                    )}
                </div>

                <FormField
                    control={form.control}
                    name="imageUrls"
                    render={() => (
                        <FormItem>
                            <FormLabel>Images</FormLabel>

                            <FormControl>
                                <div className="flex w-full flex-col gap-2 md:flex-row">
                                    {[...Array(5)].map((_, index) => (
                                        <div key={index} className="basis-1/5">
                                            <div className="relative aspect-square overflow-hidden rounded-md">
                                                {index < previews.length ? (
                                                    <>
                                                        <Image
                                                            src={
                                                                previews[index]
                                                            }
                                                            alt={`Image ${index + 1}`}
                                                            width={1500}
                                                            height={1500}
                                                            className="object-cover"
                                                        />

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-1 top-1 size-6 rounded-full bg-foreground/50 hover:bg-foreground/70"
                                                            disabled={
                                                                isCreating ||
                                                                isUpdating
                                                            }
                                                            onClick={() =>
                                                                removeImage(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <Icons.X className="size-4 text-background" />
                                                        </Button>
                                                    </>
                                                ) : index === previews.length &&
                                                  previews.length < 5 ? (
                                                    <div
                                                        {...getRootProps()}
                                                        className={cn(
                                                            "flex size-full cursor-pointer items-center justify-center rounded-md border border-dashed border-foreground/40",
                                                            isDragActive &&
                                                                "border-green-500 bg-green-500/10"
                                                        )}
                                                    >
                                                        <input
                                                            {...getInputProps()}
                                                            disabled={
                                                                isCreating ||
                                                                isUpdating
                                                            }
                                                        />

                                                        <Icons.Plus className="size-6" />
                                                    </div>
                                                ) : (
                                                    <div className="flex size-full items-center justify-center rounded-md border border-dashed border-foreground/40 bg-muted"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex w-min flex-row-reverse items-center justify-start gap-2">
                                <FormLabel className="whitespace-nowrap font-semibold">
                                    Publish Immediately
                                </FormLabel>

                                <FormControl>
                                    <Switch
                                        disabled={
                                            !!product ||
                                            isCreating ||
                                            isUpdating
                                        }
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </div>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={
                        isCreating ||
                        isUpdating ||
                        (previews.every((preview) =>
                            product?.imageUrls.includes(preview)
                        ) &&
                            !form.formState.isDirty)
                    }
                >
                    {product ? "Update Product" : "Create Product"}
                </Button>
            </form>
        </Form>
    );
}
