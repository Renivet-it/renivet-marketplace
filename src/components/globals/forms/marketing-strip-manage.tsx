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
    CreateMarketingStrip,
    createMarketingStripSchema,
    MarketingStrip,
    UpdateMarketingStrip,
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
    marketingStrip?: MarketingStrip;
}

export function MarketingStripManageForm({ marketingStrip }: PageProps) {
    const router = useRouter();

    const [preview, setPreview] = useState<string | null>(
        marketingStrip?.imageUrl || null
    );
    const [file, setFile] = useState<File | null>(null);

    const { startUpload, routeConfig } = useUploadThing("contentUploader");

    const form = useForm<CreateMarketingStrip>({
        resolver: zodResolver(createMarketingStripSchema),
        defaultValues: {
            title: marketingStrip?.title || "",
            description: marketingStrip?.description || "",
            imageUrl: marketingStrip?.imageUrl || null,
            isActive: marketingStrip?.isActive || false,
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

    const { mutateAsync: createMarketingStripAsync } =
        trpc.general.content.marketingStrips.createMarketingStrip.useMutation();
    const { mutateAsync: updateMarketingStripAsync } =
        trpc.general.content.marketingStrips.updateMarketingStrip.useMutation();

    const { mutate: createMarketingStrip, isPending: isCreating } = useMutation(
        {
            onMutate: () => {
                const toastId = toast.loading("Adding marketing strip...");
                return { toastId };
            },
            mutationFn: async (values: CreateMarketingStrip) => {
                if (file) {
                    const res = await startUpload([file]);
                    if (!res?.length) throw new Error("Failed to upload image");

                    const image = res[0];
                    values.imageUrl = image.appUrl;
                }

                await createMarketingStripAsync(values);
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Marketing strip added successfully", {
                    id: toastId,
                });
                router.push("/dashboard/general/marketing-strip");
                setPreview(null);
                setFile(null);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        }
    );

    const { mutate: updateMarketingStrip, isPending: isUpdating } = useMutation(
        {
            onMutate: () => {
                const toastId = toast.loading("Updating marketing strip...");
                return { toastId };
            },
            mutationFn: async (values: UpdateMarketingStrip) => {
                if (!marketingStrip)
                    throw new Error("Marketing strip not found");

                if (file) {
                    const res = await startUpload([file]);
                    if (!res?.length) throw new Error("Failed to upload image");

                    const image = res[0];
                    values.imageUrl = image.appUrl;
                }

                await updateMarketingStripAsync({
                    id: marketingStrip.id,
                    data: values,
                });
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Marketing strip updated successfully", {
                    id: toastId,
                });
                router.push("/dashboard/general/marketing-strip");
                setPreview(null);
                setFile(null);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        }
    );

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) =>
                    marketingStrip
                        ? updateMarketingStrip(values)
                        : createMarketingStrip(values)
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
                                    placeholder="Enter marketing strip title"
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
                                <Input
                                    placeholder="Enter a brief description/tagline of the marketing strip (optional)"
                                    disabled={isCreating || isUpdating}
                                    {...field}
                                    value={field.value || ""}
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
                                        (isCreating || isUpdating) &&
                                            "cursor-not-allowed opacity-50"
                                    )}
                                >
                                    <input
                                        {...getInputProps()}
                                        disabled={isCreating || isUpdating}
                                    />

                                    {preview ? (
                                        <div className="relative aspect-[6/7] w-full overflow-hidden rounded-md">
                                            <Image
                                                src={preview}
                                                alt="Thumbnail preview"
                                                width={2000}
                                                height={2000}
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
                                        disabled={isCreating || isUpdating}
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
                        isCreating ||
                        isUpdating ||
                        (preview === (marketingStrip?.imageUrl ?? null) &&
                            !form.formState.isDirty)
                    }
                    className="w-full"
                >
                    {marketingStrip ? "Update" : "Create"} Item
                </Button>
            </form>
        </Form>
    );
}
