"use client";

import { siteConfig } from "@/config/site";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import {
    cn,
    convertBytesToHumanReadable,
    getUploadThingFileKey,
    handleClientError,
} from "@/lib/utils";
import {
    AddBrandWaitlistDemoUrl,
    addBrandWaitlistDemoUrlSchema,
    BrandWaitlist,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "@uploadthing/react";
import Player from "next-video/player";
import { ElementRef, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";
import { GeneralShell } from "../globals/layouts";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Separator } from "../ui/separator";

interface PageProps extends GenericProps {
    brand: BrandWaitlist;
    token: string;
}

export function BrandDemoPage({
    className,
    brand,
    token,
    ...props
}: PageProps) {
    const [preview, setPreview] = useState<string | null>(
        brand?.demoUrl ?? null
    );
    const [file, setFile] = useState<File | null>(null);

    const inputRef = useRef<ElementRef<"input">>(null!);

    const { startUpload, routeConfig } = useUploadThing("brandDemoUploader");

    const form = useForm<AddBrandWaitlistDemoUrl>({
        resolver: zodResolver(addBrandWaitlistDemoUrlSchema),
        defaultValues: {
            demoUrl: brand?.demoUrl,
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

    const removeVideo = () => {
        setPreview(null);
        setFile(null);
        form.setValue("demoUrl", null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(routeConfig).fileTypes
        ),
        maxFiles: 1,
        maxSize: 32 * 1024 * 1024,
    });

    const { mutateAsync: addDemoAsync } =
        trpc.brandsWaitlist.addBrandsWaitlistDemo.useMutation();

    const { mutate: addDemo, isPending: isDemoAdding } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Uploading demo video...");
            return { toastId };
        },
        mutationFn: async (values: AddBrandWaitlistDemoUrl) => {
            if (!file) throw new Error("No file selected");

            const res = await startUpload([file], {
                token,
            });
            if (!res?.length) throw new Error("Failed to upload file");

            const video = res[0];
            values.demoUrl = video.url;

            await addDemoAsync({
                id: brand.id,
                data: values,
            });

            return video;
        },
        onSuccess: (video, _, { toastId }) => {
            toast.success("Demo video uploaded successfully", { id: toastId });
            setPreview(null);
            setFile(null);
            form.reset({
                demoUrl: video.appUrl,
            });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <GeneralShell
            classNames={{
                innerWrapper: "xl:max-w-5xl",
            }}
        >
            <div className={cn("w-full space-y-4", className)} {...props}>
                <h1 className="text-3xl font-semibold">
                    Hi, {brand.brandName}
                </h1>

                <p className="text-sm">
                    Welcome to {siteConfig.name}. Please upload a demo video to
                    get started. We will review your video and get back to you
                    soon. The video should represent your brand and its
                    products/services.
                </p>

                <p className="text-sm">
                    Please make sure the video is in .mp4 format and is less
                    than 32 MB in size.
                </p>

                <Separator />

                <Form {...form}>
                    <form
                        className="space-y-6"
                        onSubmit={form.handleSubmit((values) =>
                            addDemo(values)
                        )}
                    >
                        <FormField
                            control={form.control}
                            name="demoUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Video</FormLabel>

                                    {preview && (
                                        <div
                                            className={cn(
                                                "hidden space-y-2",
                                                preview && "block"
                                            )}
                                        >
                                            <Player
                                                src={preview}
                                                autoPlay
                                                muted
                                            />

                                            <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                                                <p className="text-sm font-semibold">
                                                    {file
                                                        ? `${
                                                              file.name.length >
                                                              20
                                                                  ? `${file.name.slice(
                                                                        0,
                                                                        20
                                                                    )}...`
                                                                  : file.name
                                                          } (${convertBytesToHumanReadable(file.size)})`
                                                        : getUploadThingFileKey(
                                                                preview
                                                            ).length > 20
                                                          ? `${getUploadThingFileKey(
                                                                preview
                                                            ).slice(0, 20)}...`
                                                          : getUploadThingFileKey(
                                                                preview
                                                            )}
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={removeVideo}
                                                        disabled={
                                                            isDemoAdding ||
                                                            !file
                                                        }
                                                    >
                                                        Remove Video
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() =>
                                                            inputRef.current.click()
                                                        }
                                                        disabled={isDemoAdding}
                                                    >
                                                        Change Video
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        {...getRootProps()}
                                        className={cn(
                                            "relative cursor-pointer border-2 border-dashed border-input p-8 py-16 text-center",
                                            isDragActive &&
                                                "border-green-500 bg-green-50",
                                            isDemoAdding &&
                                                "cursor-not-allowed opacity-50",
                                            preview && "hidden"
                                        )}
                                        onClick={() => inputRef.current.click()}
                                    >
                                        <FormControl>
                                            <input
                                                {...getInputProps()}
                                                disabled={isDemoAdding}
                                                ref={inputRef}
                                            />
                                        </FormControl>

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
                                                    Video (32 MB | .mp4)
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
                            disabled={isDemoAdding || !file}
                        >
                            Upload Demo
                        </Button>
                    </form>
                </Form>
            </div>
        </GeneralShell>
    );
}
