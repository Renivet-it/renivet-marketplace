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
import PriceInput from "@/components/ui/price-input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import {
    cn,
    convertBytesToHumanReadable,
    convertPaiseToRupees,
    convertPriceToPaise,
    generateSKU,
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
import Papa from "papaparse";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";
import { ProductVariantManage } from "./product-variant-manage";

interface PageProps {
    brandId: string;
    product?: ProductWithBrand;
}

export function ProductManageForm({ brandId, product }: PageProps) {
    const router = useRouter();

    const [bulkUploadProgress, setBulkUploadProgress] = useState<number>(0);
    const [isBulkUploading, setIsBulkUploading] = useState<boolean>(false);

    const editorRef = useRef<EditorRef>(null!);
    const csvUploadInputRef = useRef<HTMLInputElement>(null!);

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
            basePrice: product?.basePrice
                ? parseFloat(convertPaiseToRupees(product.basePrice))
                : 0,
            taxRate: product?.taxRate ?? 0,
            price: product?.price
                ? parseFloat(convertPaiseToRupees(product.price))
                : 0,
            description:
                product?.description ??
                // eslint-disable-next-line quotes
                '<p><strong>Product Details </strong></p><p>Grey tartan checked opaque Casual shirt,  has a spread collar, button placket, 1 patch pocket, long regular sleeves, curved hem</p><p></p><p><strong>Size &amp; Fit</strong></p><p>Brand Fit:</p><p>Fit: Slim Fit</p><p>Size worn by the model: M</p><p>Chest: 38"</p><p>Height: 6\'1"</p><p></p><p><strong>Material &amp; Care</strong></p><p>100% Cotton</p><p>Machine Wash</p>',
            brandId,
            imageUrls: product?.imageUrls ?? [],
            sustainabilityCertificateUrl:
                product?.sustainabilityCertificateUrl ?? null,
            variants: !!product?.variants.length
                ? product?.variants
                : [
                      {
                          sku: generateSKU(),
                          size: "M",
                          color: {
                              name: "White",
                              hex: "#FFFFFF",
                          },
                          quantity: 0,
                      },
                  ],
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

    useEffect(() => {
        const basePrice = +form.watch("basePrice");
        const taxRate = +form.watch("taxRate");

        const percentage = (basePrice * taxRate) / 100;
        const price = basePrice + percentage;

        form.setValue("price", +price.toFixed(2));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch("basePrice"), form.watch("taxRate")]);

    const { fields, append, remove, replace } = useFieldArray({
        control: form.control,
        name: "variants",
    });

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

    const handleBulkVariantUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsBulkUploading(true);
            setBulkUploadProgress(0);

            Papa.parse(file, {
                complete: async (result) => {
                    try {
                        const seenCombinations = new Set<string>();
                        const parsedVariants = result.data
                            .slice(1)
                            .filter(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (row: any) => {
                                    if (
                                        !row[0] ||
                                        !row[1] ||
                                        !row[2] ||
                                        !row[3]
                                    )
                                        return false;
                                    const combination = `${row[0]}-${row[1]}-${row[2]}`;
                                    if (seenCombinations.has(combination))
                                        return false;
                                    seenCombinations.add(combination);
                                    return true;
                                }
                            )
                            .map(
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                (row: any) => ({
                                    size: row[0],
                                    color: { name: row[1], hex: row[2] },
                                    quantity: parseInt(row[3]),
                                })
                            );

                        const currentFields = fields;
                        const newVariants: CreateProduct["variants"] = [];

                        parsedVariants.forEach((newVariant) => {
                            const existingVariantIndex =
                                currentFields.findIndex(
                                    (field) =>
                                        field.size === newVariant.size &&
                                        field.color.name ===
                                            newVariant.color.name &&
                                        field.color.hex === newVariant.color.hex
                                );

                            if (existingVariantIndex !== -1)
                                currentFields[existingVariantIndex].quantity =
                                    newVariant.quantity;
                            else
                                newVariants.push({
                                    sku: generateSKU(),
                                    ...newVariant,
                                });
                        });

                        const combinedVariants = [
                            ...currentFields,
                            ...newVariants,
                        ];

                        const validatedVariants =
                            createProductSchema.shape.variants.parse(
                                combinedVariants
                            );

                        replace(validatedVariants);
                        toast.success("Variants uploaded successfully");
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to upload variants");
                    } finally {
                        setIsBulkUploading(false);
                        setBulkUploadProgress(0);
                        e.target.value = "";
                    }
                },
            });
        },
        [fields, replace]
    );

    const hasDuplicatedSizeColorCombination = () => {
        const seenCombinations = new Set<string>();
        return fields.some((field) => {
            const combination = `${field.size}-${field.color.name}-${field.color.hex}`;
            if (seenCombinations.has(combination)) return true;
            seenCombinations.add(combination);
            return false;
        });
    };

    const filterDuplicatedSizeColorCombination = () => {
        const seenCombinations = new Set<string>();
        return fields.filter((field) => {
            const combination = `${field.size}-${field.color.name}-${field.color.hex}`;
            if (seenCombinations.has(combination)) return false;
            seenCombinations.add(combination);
            return true;
        });
    };

    const calculateProperPrice = () => {
        const basePrice = +form.watch("basePrice");
        const taxRate = +form.watch("taxRate");
        const price = +form.watch("price");

        const percentage = (basePrice * taxRate) / 100;
        const calculatedPrice = basePrice + percentage;

        return {
            isProper: price === calculatedPrice,
            calculatedPrice: calculatedPrice,
        };
    };

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
        onSuccess: (data, __, { toastId }) => {
            toast.success(
                "Product has been added, categorize it now and send for review",
                { id: toastId }
            );
            router.push(
                `/dashboard/brands/${brandId}/products/p/${data.id}/categorize`
            );
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
                onSubmit={form.handleSubmit((values) => {
                    if (hasDuplicatedSizeColorCombination()) {
                        const filteredVariants =
                            filterDuplicatedSizeColorCombination();
                        form.setValue("variants", filteredVariants);

                        toast.error(
                            "Duplicate size and color combinations are not allowed, and have been removed. Click the button again to proceed."
                        );
                        return;
                    }

                    const { isProper, calculatedPrice } =
                        calculateProperPrice();
                    if (!isProper) {
                        form.setValue("price", calculatedPrice);
                        toast.error(
                            "Price has been recalculated based on base price and tax rate. Click the button again to proceed."
                        );
                        return;
                    }

                    return product
                        ? updateProduct({
                              ...values,
                              isPublished: product.isPublished,
                              isAvailable: product.isAvailable,
                              price: convertPriceToPaise(values.price),
                              basePrice: convertPriceToPaise(values.basePrice),
                          })
                        : createProduct({
                              ...values,
                              price: convertPriceToPaise(values.price),
                              basePrice: convertPriceToPaise(values.basePrice),
                          });
                })}
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

                <div className="flex flex-col gap-4 md:flex-row">
                    <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Base Price</FormLabel>

                                <FormControl>
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
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="taxRate"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Tax Rate (%)</FormLabel>

                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="18"
                                        disabled={isCreating || isUpdating}
                                        onChange={(e) => {
                                            const regex =
                                                /^[0-9]*\.?[0-9]{0,2}$/;
                                            if (
                                                regex.test(e.target.value) &&
                                                Number(e.target.value) <= 100
                                            )
                                                if (regex.test(e.target.value))
                                                    field.onChange(e);
                                        }}
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
                                    <PriceInput
                                        {...field}
                                        placeholder="998.00"
                                        currency="INR"
                                        symbol="₹"
                                        disabled
                                        readOnly
                                        onChange={(e) => {
                                            const regex =
                                                /^[0-9]*\.?[0-9]{0,2}$/;
                                            if (regex.test(e.target.value))
                                                field.onChange(e);
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
                                                ) : index ===
                                                      imagePreviews.length &&
                                                  imagePreviews.length < 5 ? (
                                                    <div
                                                        {...getImageRootProps()}
                                                        className={cn(
                                                            "flex size-full cursor-pointer items-center justify-center rounded-md border border-dashed border-foreground/40",
                                                            isImagesDragActive &&
                                                                "border-green-500 bg-green-500/10"
                                                        )}
                                                    >
                                                        <input
                                                            {...getImagesInputProps()}
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
                                                    !certificateFile
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
                                                    isCreating || isUpdating
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
                                        disabled={isCreating || isUpdating}
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

                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-foreground">
                            Product Variants
                        </h2>

                        <Button size="sm" disabled={isCreating || isUpdating}>
                            Download Template
                            <Icons.Download />
                        </Button>
                    </div>

                    <div className="flex min-h-32 items-center justify-center rounded-md bg-muted p-4">
                        <input
                            type="file"
                            accept=".csv"
                            ref={csvUploadInputRef}
                            className="hidden"
                            onChange={handleBulkVariantUpload}
                            disabled={
                                isBulkUploading || isCreating || isUpdating
                            }
                        />

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => csvUploadInputRef.current.click()}
                            disabled={
                                isBulkUploading || isCreating || isUpdating
                            }
                        >
                            Bulk Upload Variants
                        </Button>
                    </div>

                    {isBulkUploading && (
                        <Progress
                            value={bulkUploadProgress}
                            className="border border-green-700 bg-transparent"
                            indicatorClassName="bg-green-700"
                        />
                    )}

                    <div className="relative">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm">
                            OR
                        </span>
                    </div>

                    <Table className="border">
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {fields.map((field, index) => (
                                <ProductVariantManage
                                    key={field.sku}
                                    field={field}
                                    index={index}
                                    isCreating={isCreating}
                                    isUpdating={isUpdating}
                                    form={form}
                                    remove={remove}
                                    product={product}
                                />
                            ))}
                        </TableBody>
                    </Table>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                            const newSku = generateSKU();

                            append({
                                sku: newSku,
                                size: "M",
                                color: { name: "White", hex: "#FFFFFF" },
                                quantity: 0,
                            });
                        }}
                        disabled={isCreating || isUpdating}
                    >
                        <Icons.Plus className="size-4" />
                        Add Variant
                    </Button>
                </div>

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
