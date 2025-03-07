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
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";

interface PageProps {
    banner?: Banner;
}

export function BannerManageForm({ banner }: PageProps) {
    const router = useRouter();

    const [preview, setPreview] = useState<string | null>(
        banner?.imageUrl ?? null
    );
    const [file, setFile] = useState<File | null>(null);

    const { startUpload, routeConfig } = useUploadThing("contentUploader");

    const form = useForm<CreateBanner>({
        resolver: zodResolver(createBannerSchema),
        defaultValues: {
            title: banner?.title ?? "",
            description: banner?.description ?? "",
            imageUrl: banner?.imageUrl ?? null,
            isActive: banner?.isActive ?? false,
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
        form.setValue("imageUrl", null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(routeConfig).fileTypes
        ),
        maxFiles: 1,
        maxSize: 4 * 1024 * 1024,
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
            router.push("/dashboard/general/banners");
            setPreview(null);
            setFile(null);
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
            router.push("/dashboard/general/banners");
            setPreview(null);
            setFile(null);
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
                                            isBannerUpdating) &&
                                            "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    <input
                                        {...getInputProps()}
                                        disabled={
                                            isBannerCreating || isBannerUpdating
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
                                                    Image (4 MB)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </FormControl>

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
