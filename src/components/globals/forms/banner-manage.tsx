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
import { Switch } from "@/components/ui/switch";
import {
    compressBannerImage,
    MAX_BANNER_SOURCE_BYTES,
} from "@/lib/image-compression";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { cn, handleClientError } from "@/lib/utils";
import {
    Banner,
    CreateBanner,
    createBannerSchema,
    UpdateBanner,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "@uploadthing/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { generateClientDropzoneAccept } from "uploadthing/client";

interface PageProps {
    banner?: Banner;
    isMobile?: boolean;
}

export function BannerManageForm({ banner, isMobile = false }: PageProps) {
    const mobilePlacement = banner?.isMobile ?? isMobile;
    const router = useRouter();

    const [preview, setPreview] = useState<string | null>(
        banner?.imageUrl ?? null
    );
    const [file, setFile] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    useEffect(() => {
        if (!preview?.startsWith("blob:")) return;
        return () => URL.revokeObjectURL(preview);
    }, [preview]);

    const { startUpload } = useUploadThing("contentUploader");

    const form = useForm<CreateBanner>({
        resolver: zodResolver(createBannerSchema),
        defaultValues: {
            title: banner?.title ?? "",
            description: banner?.description ?? "",
            imageUrl: banner?.imageUrl ?? null,
            url: banner?.url ?? "",
            isActive: banner?.isActive ?? false,
            isMobile: mobilePlacement,
        },
    });

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        setIsCompressing(true);
        try {
            const compressedFile = await compressBannerImage(selectedFile);
            setFile(compressedFile);
            setPreview(URL.createObjectURL(compressedFile));

            if (compressedFile !== selectedFile) {
                toast.success(
                    `Image compressed to ${(compressedFile.size / (1024 * 1024)).toFixed(2)} MB.`
                );
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "The selected image could not be compressed."
            );
        } finally {
            setIsCompressing(false);
        }
    }, []);

    const removeImage = () => {
        setPreview(null);
        setFile(null);
        setIsCompressing(false);
        form.setValue("imageUrl", null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: generateClientDropzoneAccept(["image/png", "image/jpeg"]),
        maxFiles: 1,
        maxSize: MAX_BANNER_SOURCE_BYTES,
        onDropRejected: (rejections) => {
            const tooLarge = rejections.some((rejection) =>
                rejection.errors.some(
                    (error) => error.code === "file-too-large"
                )
            );
            toast.error(
                tooLarge
                    ? "Choose an image up to 20 MB; it will be compressed before upload."
                    : "Choose a PNG or JPEG image."
            );
        },
    });

    const { mutateAsync: createBannerAsync } =
        trpc.general.content.banners.createBanner.useMutation();
    const { mutateAsync: updateBannerAsync } =
        trpc.general.content.banners.updateBanner.useMutation();

    const { mutate: createBanner, isPending: isBannerCreating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Creating banner...");
            return { toastId };
        },
        mutationFn: async (values: CreateBanner) => {
            if (file) {
                const res = await startUpload([file]);
                if (!res?.length) throw new Error("Failed to upload image");

                const image = res[0];
                values.imageUrl = image.appUrl;
            }

            await createBannerAsync(values);
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Banner created successfully", { id: toastId });
            router.push(
                mobilePlacement
                    ? "/dashboard/general/banners/mobile"
                    : "/dashboard/general/banners"
            );
            setPreview(null);
            setFile(null);
            setIsCompressing(false);
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: updateBanner, isPending: isBannerUpdating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Updating banner...");
            return { toastId };
        },
        mutationFn: async (values: UpdateBanner) => {
            if (!banner) throw new Error("Banner not found");

            if (file) {
                const res = await startUpload([file]);
                if (!res?.length) throw new Error("Failed to upload image");

                const image = res[0];
                values.imageUrl = image.appUrl;
            }

            await updateBannerAsync({ id: banner.id, data: values });
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Banner updated successfully", { id: toastId });
            router.push(
                mobilePlacement
                    ? "/dashboard/general/banners/mobile"
                    : "/dashboard/general/banners"
            );
            setPreview(null);
            setFile(null);
            setIsCompressing(false);
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
                    banner ? updateBanner(values) : createBanner(values)
                )}
            >
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter banner title"
                                    disabled={
                                        isBannerCreating || isBannerUpdating
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
                                <Input
                                    placeholder="Enter a brief description/tagline of the banner"
                                    disabled={
                                        isBannerCreating || isBannerUpdating
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
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Redirect URL</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter the banner redirect URL"
                                    disabled={
                                        isBannerCreating || isBannerUpdating
                                    }
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="imageUrl"
                    render={() => (
                        <FormItem>
                            <FormLabel>Image</FormLabel>

                            <FormControl>
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "relative cursor-pointer rounded-md border-2 border-dashed border-input p-8 py-16 text-center",
                                        isDragActive &&
                                            "border-green-500 bg-green-50",
                                        preview && "border-0 p-0",
                                        (isBannerCreating ||
                                            isBannerUpdating ||
                                            isCompressing) &&
                                            "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    <input
                                        {...getInputProps()}
                                        disabled={
                                            isBannerCreating ||
                                            isBannerUpdating ||
                                            isCompressing
                                        }
                                    />

                                    {preview ? (
                                        <div className="relative aspect-video w-full overflow-hidden rounded-md">
                                            <Image
                                                src={preview}
                                                alt="Thumbnail preview"
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
                                                    Choose a file or Drag and
                                                    Drop
                                                </p>
                                                <p className="text-xs text-muted-foreground md:text-sm">
                                                    PNG or JPEG up to 20 MB;
                                                    larger images are compressed
                                                    below 4 MB.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </FormControl>

                            {isCompressing && (
                                <p className="text-sm text-muted-foreground">
                                    Compressing image…
                                </p>
                            )}
                            {file && !isCompressing && (
                                <p className="text-sm text-muted-foreground">
                                    Ready to upload: {file.name} (
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB)
                                </p>
                            )}

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex w-min flex-row-reverse items-center justify-start gap-2">
                                <FormLabel className="whitespace-nowrap font-semibold">
                                    Publish Immediately
                                </FormLabel>

                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={
                                            isBannerCreating || isBannerUpdating
                                        }
                                    />
                                </FormControl>
                            </div>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={
                        isBannerCreating ||
                        isBannerUpdating ||
                        isCompressing ||
                        (preview === (banner?.imageUrl ?? null) &&
                            !form.formState.isDirty)
                    }
                    className="w-full"
                >
                    {banner ? "Update Banner" : "Create Banner"}
                </Button>
            </form>
        </Form>
    );
}
