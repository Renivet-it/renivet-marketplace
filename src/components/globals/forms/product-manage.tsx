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
    convertBytesToHumanReadable,
    getUploadThingFileKey,
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
import Link from "next/link";
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

    const [imagePreviews, setImagePreviews] = useState<string[]>(
        product?.imageUrls ?? []
    );
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    const [certificatePreview, setCertificatePreview] = useState<string | null>(
        product?.sustainabilityCertificateUrl ?? null
    );
    const [certificateFile, setCertificateFile] = useState<File | null>(null);

    const docInputRef = useRef<HTMLInputElement>(null!);

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
            sustainabilityCertificateUrl:
                product?.sustainabilityCertificateUrl ?? null,
        },
    });

    const { startUpload: startImageUpload, routeConfig: imageRouteConfig } =
        useUploadThing("productImageUploader");
    const { startUpload: startDocUpload, routeConfig: docRouteConfig } =
        useUploadThing("productCertificateUploader");

    useEffect(() => {
        return () => {
            imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
        };
    }, [imagePreviews]);

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

    const onImagesDrop = (acceptedFiles: File[]) => {
        const remainingSlots = 5 - imagePreviews.length;
        const newFiles = acceptedFiles.slice(0, remainingSlots);

        if (newFiles.length > 0) {
            setImageFiles((prev) => [...prev, ...newFiles]);

            const newPreviews = newFiles.map((file) =>
                URL.createObjectURL(file)
            );
            setImagePreviews((prev) => [...prev, ...newPreviews]);

            const currentUrls = form.getValues("imageUrls");
            form.setValue("imageUrls", [...currentUrls, ...newPreviews]);
        }
    };

    const onCertificateDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setCertificateFile(file);
            const previewUrl = URL.createObjectURL(file);
            setCertificatePreview(previewUrl);
        }
    };

    const removeImage = (index: number) => {
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
        setImageFiles((prev) => prev.filter((_, i) => i !== index));

        const currentUrls = form.getValues("imageUrls");
        form.setValue(
            "imageUrls",
            currentUrls.filter((_, i) => i !== index)
        );
    };

    const removeDoc = () => {
        setCertificatePreview(null);
        setCertificateFile(null);
        form.setValue("sustainabilityCertificateUrl", "");
    };

    const {
        getRootProps: getImageRootProps,
        getInputProps: getImagesInputProps,
        isDragActive: isImagesDragActive,
    } = useDropzone({
        onDrop: onImagesDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(imageRouteConfig).fileTypes
        ),
        maxFiles: 5 - imagePreviews.length,
        maxSize: 4 * 1024 * 1024,
    });

    const {
        getRootProps: getDocRootProps,
        getInputProps: getDocInputProps,
        isDragActive: isDocDragActive,
    } = useDropzone({
        onDrop: onCertificateDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(docRouteConfig).fileTypes
        ),
        maxFiles: 1,
        maxSize: 4 * 1024 * 1024,
    });

    const fileKey = getUploadThingFileKey(certificatePreview || "");

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
            if (!imageFiles.length)
                throw new Error("At least 1 image is required");
            if (!certificateFile)
                throw new Error("Sustainability certificate is required");

            const [imageRes, docRes] = await Promise.all([
                startImageUpload(imageFiles),
                startDocUpload([certificateFile]),
            ]);

            if (!imageRes?.length) throw new Error("Failed to upload images");
            if (!docRes?.length) throw new Error("Failed to upload document");

            const imageUrls = imageRes.map((file) => file.appUrl);
            const docUrl = docRes[0].appUrl;

            values.imageUrls = imageUrls;
            values.sustainabilityCertificateUrl = docUrl;

            if (values.imageUrls.length > 5)
                throw new Error("Maximum 5 images allowed");

            return await createProductAsync(values);
        },
        onSuccess: (data, _, { toastId }) => {
            toast.success(
                "Product has been added, you can now send it for review",
                { id: toastId }
            );
            router.push(`/dashboard/brands/${brandId}/products`);
            setImagePreviews([]);
            setImageFiles([]);
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
            if (product.isSentForReview)
                throw new Error("Product is under review");

            if (values.imageUrls.length + imageFiles.length > 5)
                throw new Error("Maximum 5 images allowed");

            const [imageRes, docRes] = await Promise.all([
                imageFiles.length > 0
                    ? startImageUpload(imageFiles)
                    : undefined,
                certificateFile ? startDocUpload([certificateFile]) : undefined,
            ]);

            if (imageRes && !imageRes.length)
                throw new Error("Failed to upload images");
            if (docRes && !docRes.length)
                throw new Error("Failed to upload document");

            const imageUrls = imageRes
                ? imageRes.map((file) => file.appUrl)
                : [];
            const docUrl = docRes
                ? docRes[0].appUrl
                : values.sustainabilityCertificateUrl;

            values.imageUrls = [...values.imageUrls, ...imageUrls];
            values.sustainabilityCertificateUrl = docUrl;

            await updateProductAsync({ productId: product.id, values });
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Product updated successfully", { id: toastId });
            router.push(`/dashboard/brands/${brandId}/products`);
            setImagePreviews([]);
            setImageFiles([]);
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
                              isPublished: product.isPublished,
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
                                    disabled={
                                        isCreating ||
                                        isUpdating ||
                                        product?.status === "approved"
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
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>

                            <FormControl>
                                <Editor
                                    {...field}
                                    disabled={
                                        isCreating ||
                                        isUpdating ||
                                        product?.status === "approved"
                                    }
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
                                                {index <
                                                imagePreviews.length ? (
                                                    <>
                                                        <Image
                                                            src={
                                                                imagePreviews[
                                                                    index
                                                                ]
                                                            }
                                                            alt={`Image ${index + 1}`}
                                                            width={1500}
                                                            height={1500}
                                                            className={cn(
                                                                "object-cover",
                                                                product?.status ===
                                                                    "approved" &&
                                                                    "opacity-70"
                                                            )}
                                                        />

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-1 top-1 size-6 rounded-full bg-foreground/50 hover:bg-foreground/70"
                                                            disabled={
                                                                isCreating ||
                                                                isUpdating ||
                                                                product?.status ===
                                                                    "approved"
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
                                                ) : index ===
                                                      imagePreviews.length &&
                                                  imagePreviews.length < 5 ? (
                                                    <div
                                                        {...getImageRootProps()}
                                                        className={cn(
                                                            "flex size-full cursor-pointer items-center justify-center rounded-md border border-dashed border-foreground/40",
                                                            isImagesDragActive &&
                                                                "border-green-500 bg-green-500/10",
                                                            product?.status ===
                                                                "approved" &&
                                                                "cursor-not-allowed"
                                                        )}
                                                    >
                                                        <input
                                                            {...getImagesInputProps()}
                                                            disabled={
                                                                isCreating ||
                                                                isUpdating ||
                                                                product?.status ===
                                                                    "approved"
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
                    name="sustainabilityCertificateUrl"
                    render={() => (
                        <FormItem>
                            <FormLabel>
                                Sustainability Certificate or Declarations
                            </FormLabel>

                            {certificatePreview && (
                                <div
                                    className={cn(
                                        "hidden space-y-2",
                                        certificatePreview && "block"
                                    )}
                                >
                                    <div className="size-full">
                                        <object
                                            data={certificatePreview}
                                            type="application/pdf"
                                            width="100%"
                                            height={600}
                                        >
                                            <Link href={certificatePreview}>
                                                Download Document
                                            </Link>
                                        </object>
                                    </div>

                                    <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                                        <p className="text-sm font-semibold">
                                            {certificateFile
                                                ? `${
                                                      certificateFile.name
                                                          .length > 20
                                                          ? `${certificateFile.name.slice(0, 20)}...`
                                                          : certificateFile.name
                                                  } (${convertBytesToHumanReadable(certificateFile.size)})`
                                                : fileKey.length > 20
                                                  ? `${fileKey.slice(0, 20)}...`
                                                  : fileKey}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={removeDoc}
                                                disabled={
                                                    isCreating ||
                                                    isUpdating ||
                                                    !certificateFile ||
                                                    !!product
                                                }
                                            >
                                                Remove Document
                                            </Button>

                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    docInputRef.current.click()
                                                }
                                                disabled={
                                                    isCreating ||
                                                    isUpdating ||
                                                    product?.status ===
                                                        "approved"
                                                }
                                            >
                                                Change Document
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div
                                {...getDocRootProps()}
                                className={cn(
                                    "relative cursor-pointer rounded-md border-2 border-dashed border-input p-8 py-16 text-center",
                                    isDocDragActive &&
                                        "border-green-500 bg-green-50",
                                    isCreating ||
                                        (isUpdating &&
                                            "cursor-not-allowed opacity-50"),
                                    certificatePreview && "hidden"
                                )}
                                onClick={() => docInputRef.current.click()}
                            >
                                <FormControl>
                                    <input
                                        {...getDocInputProps()}
                                        disabled={
                                            isCreating ||
                                            isUpdating ||
                                            product?.status === "approved"
                                        }
                                        ref={docInputRef}
                                    />
                                </FormControl>

                                <div className="space-y-2 md:space-y-4">
                                    <div className="flex justify-center">
                                        <Icons.CloudUpload className="size-10 md:size-12" />
                                    </div>

                                    <div className="space-y-1 md:space-y-0">
                                        <p className="text-sm md:text-base">
                                            Choose a file or Drag and Drop
                                        </p>
                                        <p className="text-xs text-muted-foreground md:text-sm">
                                            Document (4 MB | .pdf)
                                        </p>
                                    </div>
                                </div>
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
                        product?.isSentForReview ||
                        (imagePreviews.every((preview) =>
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
