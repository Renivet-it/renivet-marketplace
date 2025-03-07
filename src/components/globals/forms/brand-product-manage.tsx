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
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, handleClientError } from "@/lib/utils";
import {
    CreateHomeBrandProduct,
    createHomeBrandProductSchema,
    HomeBrandProduct,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "@uploadthing/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";

interface PageProps {
    brandProduct?: HomeBrandProduct;
}

export function BrandProductManageManageForm({ brandProduct }: PageProps) {
    const router = useRouter();

    const [preview, setPreview] = useState<string | null>(
        brandProduct?.imageUrl ?? null
    );
    const [file, setFile] = useState<File | null>(null);

    const { startUpload, routeConfig } = useUploadThing("contentUploader");

    const form = useForm<CreateHomeBrandProduct>({
        resolver: zodResolver(createHomeBrandProductSchema),
        defaultValues: {
            imageUrl: brandProduct?.imageUrl ?? "",
            url: brandProduct?.url ?? null,
        },
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setFile(file);
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
        }
    }, []);

    const removeImage = () => {
        setPreview(null);
        setFile(null);
        form.setValue("imageUrl", "");
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(routeConfig).fileTypes
        ),
        maxFiles: 1,
        maxSize: 4 * 1024 * 1024,
    });

    const { mutateAsync: createAdAsync } =
        trpc.general.content.homeBrandProducts.createHomeBrandProduct.useMutation();
    const { mutateAsync: updateAdAsync } =
        trpc.general.content.homeBrandProducts.updateHomeBrandProduct.useMutation();

    const { mutate: createBrandProduct, isPending: isCreating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Creating brand product...");
            return { toastId };
        },
        mutationFn: async (values: CreateHomeBrandProduct) => {
            if (!file) throw new Error("Image is required");

            const res = await startUpload([file]);
            if (!res?.length) throw new Error("Failed to upload image");

            const image = res[0];
            values.imageUrl = image.appUrl;

            await createAdAsync(values);
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Brand product created successfully", {
                id: toastId,
            });
            router.push("/dashboard/general/brand-products");
            setPreview(null);
            setFile(null);
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: updateBrandProduct, isPending: isUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Updating brand product...");
            return { toastId };
        },
        mutationFn: async (values: CreateHomeBrandProduct) => {
            if (!brandProduct) throw new Error("Brand product not found");

            if (file) {
                const res = await startUpload([file]);
                if (!res?.length) throw new Error("Failed to upload image");

                const image = res[0];
                values.imageUrl = image.appUrl;
            }

            await updateAdAsync({ id: brandProduct.id, values });
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Brand product updated successfully", {
                id: toastId,
            });
            router.push("/dashboard/general/brand-products");
            setPreview(null);
            setFile(null);
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
                onSubmit={form.handleSubmit((values) =>
                    brandProduct
                        ? updateBrandProduct(values)
                        : createBrandProduct(values)
                )}
            >
                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={() => (
                        <FormItem>
                            <FormLabel>Image</FormLabel>

                            <div
                                {...getRootProps()}
                                className={cn(
                                    "relative cursor-pointer rounded-md border-2 border-dashed border-input p-8 py-16 text-center",
                                    isDragActive &&
                                        "border-green-500 bg-green-50",
                                    preview && "border-0 p-0",
                                    isPending && "cursor-not-allowed opacity-50"
                                )}
                            >
                                <FormControl>
                                    <input {...getInputProps()} />
                                </FormControl>

                                {preview ? (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-md">
                                        <Image
                                            src={preview}
                                            alt="Image preview"
                                            width={1000}
                                            height={1000}
                                            className="size-full object-cover"
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-2 size-5 rounded-full bg-white/20 text-background backdrop-blur-md"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage();
                                            }}
                                        >
                                            <Icons.X className="size-4" />
                                            <span className="sr-only">
                                                Remove image
                                            </span>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 md:space-y-4">
                                        <div className="flex justify-center">
                                            <Icons.CloudUpload className="size-10 md:size-12" />
                                        </div>

                                        <div className="space-y-1 md:space-y-0">
                                            <p className="text-sm md:text-base">
                                                Choose a file or Drag and Drop
                                            </p>
                                            <p className="text-xs text-muted-foreground md:text-sm">
                                                Image (4 MB | 4:5)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL</FormLabel>

                            <FormControl>
                                <Input
                                    {...field}
                                    placeholder="Enter URL"
                                    value={field.value ?? ""}
                                    disabled={isPending}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isPending}>
                    {brandProduct
                        ? "Update Brand Product"
                        : "Create Brand Product"}
                </Button>
            </form>
        </Form>
    );
}
