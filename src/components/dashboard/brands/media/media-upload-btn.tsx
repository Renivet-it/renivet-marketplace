"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { uploadFilesInBatches } from "@/lib/uploadthing/batch-upload";
import { useUploadThing } from "@/lib/uploadthing";
import { handleClientError } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { generatePermittedFileTypes } from "uploadthing/client";

interface PageProps {
    brandId: string;
}

export function BrandMediaUpload({ brandId }: PageProps) {
    const router = useRouter();

    const inputRef = useRef<HTMLInputElement>(null!);
    const uploadToastIdRef = useRef<ReturnType<typeof toast.loading> | undefined>(
        undefined
    );
    const [uploadProgress, setUploadProgress] = useState<{
        completed: number;
        total: number;
    } | null>(null);

    const { startUpload, routeConfig } = useUploadThing("brandMediaUploader", {
        onUploadError(e) {
            toast.error(e.message);
        },
    });
    const { mutateAsync: createAsync } =
        trpc.brands.media.createMediaItems.useMutation();

    const { mutate: uploadMedia, isPending: isUploading } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Uploading media, please do not close or refresh the page..."
            );
            uploadToastIdRef.current = toastId;
            return { toastId };
        },
        mutationFn: async (files: File[]) => {
            setUploadProgress({ completed: 0, total: files.length });
            const res = await uploadFilesInBatches(
                files,
                async (batch) => {
                    const uploaded = await startUpload(batch);
                    if (!uploaded?.length)
                        throw new Error("Upload batch returned no files");
                    return uploaded;
                },
                {
                    onBatchComplete: async (uploaded) => {
                        await createAsync({
                            id: brandId,
                            values: uploaded.map((file) => ({
                                name: file.name,
                                url: file.appUrl,
                                type: file.type,
                                size: file.size,
                                brandId,
                            })),
                        });
                    },
                    onProgress: (completed) => {
                        setUploadProgress({
                            completed,
                            total: files.length,
                        });
                        toast.loading(
                            `Uploaded ${completed} of ${files.length} images`,
                            { id: uploadToastIdRef.current }
                        );
                    },
                }
            );

            return res;
        },
        onSuccess: (_, __, { toastId }) => {
            setUploadProgress(null);
            toast.success("Media uploaded successfully", { id: toastId });
            router.refresh();
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <>
            <Button
                className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                disabled={isUploading}
                onClick={() => inputRef.current.click()}
            >
                <Icons.CloudUpload className="size-5" />
                {isUploading && uploadProgress
                    ? `Uploaded ${uploadProgress.completed} of ${uploadProgress.total} images`
                    : "Upload Media"}
            </Button>

            <input
                ref={inputRef}
                multiple
                type="file"
                className="hidden"
                accept={generatePermittedFileTypes(
                    routeConfig
                ).fileTypes.join()}
                onChange={(e) => {
                    if (!e.target.files) return;
                    uploadMedia(Array.from(e.target.files));
                }}
            />
        </>
    );
}
