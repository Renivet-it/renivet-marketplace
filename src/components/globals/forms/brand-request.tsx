"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-general";
import { Textarea } from "@/components/ui/textarea-general";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import {
    cn,
    convertBytesToHumanReadable,
    getUploadThingFileKey,
    handleClientError,
} from "@/lib/utils";
import {
    CreateBrandRequest,
    createBrandRequestSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "@uploadthing/react";
import Player from "next-video/player";
import { useRouter } from "next/navigation";
import { ElementRef, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
} from "uploadthing/client";

export function BrandRequestForm() {
    const router = useRouter();

    const [preview, setPreview] = useState<string | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const inputRef = useRef<ElementRef<"input">>(null!);

    const form = useForm<CreateBrandRequest>({
        resolver: zodResolver(createBrandRequestSchema),
        defaultValues: {
            name: "",
            email: "",
            website: "",
            demoUrl: "",
            message: "",
        },
    });

    const { startUpload, routeConfig } = useUploadThing(
        "brandRequestDemoUploader"
    );

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setFile(file);
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
        }
    }, []);

    const removeVideo = () => {
        setFile(null);
        setPreview(null);
        form.setValue("demoUrl", "");
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: generateClientDropzoneAccept(
            generatePermittedFileTypes(routeConfig).fileTypes
        ),
        maxFiles: 1,
        maxSize: 32 * 1024 * 1024,
    });

    const { mutateAsync: createRequestAsync } =
        trpc.general.brands.requests.createRequest.useMutation();

    const { mutate: sendRequest, isPending: isRequestSending } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Sending request...");
            return { toastId };
        },
        mutationFn: async (values: CreateBrandRequest) => {
            if (file) {
                const res = await startUpload([file]);
                if (!res?.length) throw new Error("Failed to upload video");

                const video = res[0];
                values.demoUrl = video.url;
            }

            await createRequestAsync(values);
        },
        onSuccess: (_, data, { toastId }) => {
            toast.success(
                "Request sent successfully, we'll get back to you soon",
                { id: toastId }
            );
            setPreview(null);
            setFile(null);
            form.reset(data);
            router.refresh();
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) => sendRequest(values))}
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Brand Name</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter brand name"
                                    disabled={isRequestSending}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex flex-col items-center gap-4 md:flex-row">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Brand Email</FormLabel>

                                <FormControl>
                                    <Input
                                        placeholder="Enter brand email"
                                        disabled={isRequestSending}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Brand Website</FormLabel>

                                <FormControl>
                                    <Input
                                        placeholder="Enter brand website"
                                        disabled={isRequestSending}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Message</FormLabel>

                            <FormControl>
                                <Textarea
                                    placeholder="Briefly discuss about your brand, your goals, and why you want to work with us"
                                    minRows={8}
                                    disabled={isRequestSending}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="demoUrl"
                    render={() => (
                        <FormItem>
                            <FormLabel>Demo Video</FormLabel>

                            {preview && (
                                <div
                                    className={cn(
                                        "hidden space-y-2",
                                        preview && "block"
                                    )}
                                >
                                    <Player src={preview} autoPlay muted />

                                    <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                                        <p className="text-sm font-semibold">
                                            {file
                                                ? `${
                                                      file.name.length > 20
                                                          ? `${file.name.slice(
                                                                0,
                                                                20
                                                            )}...`
                                                          : file.name
                                                  } (${convertBytesToHumanReadable(file.size)})`
                                                : getUploadThingFileKey(preview)
                                                        .length > 20
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
                                                    isRequestSending || !file
                                                }
                                            >
                                                Remove Video
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    inputRef.current.click()
                                                }
                                                disabled={isRequestSending}
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
                                    isRequestSending &&
                                        "cursor-not-allowed opacity-50",
                                    preview && "hidden"
                                )}
                                onClick={() => inputRef.current.click()}
                            >
                                <FormControl>
                                    <input
                                        {...getInputProps()}
                                        disabled={isRequestSending}
                                        ref={inputRef}
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
                    disabled={isRequestSending || !form.formState.isDirty}
                >
                    Send Request
                </Button>
            </form>
        </Form>
    );
}
