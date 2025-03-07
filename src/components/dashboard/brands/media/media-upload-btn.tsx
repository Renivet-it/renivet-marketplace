"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { handleClientError } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import { generatePermittedFileTypes } from "uploadthing/client";

interface PageProps {
    brandId: string;
}

export function BrandMediaUpload({ brandId }: PageProps) {
    const router = useRouter();

    const inputRef = useRef<HTMLInputElement>(null!);

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
            return { toastId };
        },
        mutationFn: async (files: File[]) => {
            const res = await startUpload(files);
            if (!res?.length) throw new Error("Failed to upload media");

            return await createAsync({
                id: brandId,
                values: res.map((file) => ({
                    name: file.name,
                    url: file.appUrl,
                    type: file.type,
                    size: file.size,
                    brandId,
                })),
            });
        },
        onSuccess: (_, __, { toastId }) => {
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
                Upload Media
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
