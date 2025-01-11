"use client";

import {
    MediaDeleteModal,
    MediaUpdateModal,
} from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { handleClientError } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { generatePermittedFileTypes } from "uploadthing/client";
import { TableMedia } from "./media-table";

interface PageProps {
    data: TableMedia;
}

export function MediaAction({ data }: PageProps) {
    const router = useRouter();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null!);

    const { startUpload, routeConfig } = useUploadThing("brandMediaUploader", {
        onUploadError(e) {
            toast.error(e.message);
        },
    });

    const { mutateAsync: replaceAsync } =
        trpc.brands.media.updateMediaItem.useMutation();

    const { mutate: replaceMedia, isPending: isReplacing } = useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Replacing media, please do not close or refresh the page..."
            );
            return { toastId };
        },
        mutationFn: async (file: File) => {
            const res = await startUpload([file]);
            if (!res?.length) throw new Error("Failed to upload media");
            const uploadedFile = res[0];

            return await replaceAsync({
                id: data.id,
                values: {
                    name: data.name,
                    url: uploadedFile.appUrl,
                    type: uploadedFile.type,
                    size: uploadedFile.size,
                },
            });
        },
        onSuccess: (_, __, { toastId }) => {
            toast.success("Media replaced successfully", { id: toastId });
            router.refresh();
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        disabled={isReplacing}
                        variant="ghost"
                        className="size-8 p-0"
                    >
                        <span className="sr-only">Open menu</span>
                        <Icons.MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(data.url);
                                toast.success("Link copied to clipboard");
                            }}
                        >
                            <Icons.Link className="size-4" />
                            <span>Copy Link</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            disabled={isReplacing}
                            onClick={() => inputRef.current.click()}
                        >
                            <Icons.RefreshCcw className="size-4" />
                            <span>Replace</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <Icons.Pencil className="size-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        <Icons.Trash className="size-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <input
                ref={inputRef}
                type="file"
                className="hidden"
                disabled={isReplacing}
                accept={generatePermittedFileTypes(
                    routeConfig
                ).fileTypes.join()}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    replaceMedia(file);
                }}
            />

            <MediaDeleteModal
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                media={data}
            />

            <MediaUpdateModal
                isOpen={isEditModalOpen}
                setIsOpen={setIsEditModalOpen}
                media={data}
            />
        </>
    );
}
