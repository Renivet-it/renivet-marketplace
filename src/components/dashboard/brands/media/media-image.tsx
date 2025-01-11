"use client";

import { Icons } from "@/components/icons";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import Image from "next/image";
import { useState } from "react";
import { TableMedia } from "./media-table";

interface PageProps {
    media: TableMedia;
}

export function MediaImage({ media }: PageProps) {
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

    const fileName = media.name.split(".").slice(0, -1).join(".");
    if (!fileName) return "unnamed";

    return (
        <>
            <div
                className="flex items-center gap-2 hover:cursor-pointer hover:underline"
                onClick={() => {
                    if (!media.type.includes("image"))
                        return window.open(media.url);
                    setIsImageDialogOpen(true);
                }}
            >
                <div>
                    {media.type.includes("image") ? (
                        <div className="aspect-square size-10 overflow-hidden rounded-md">
                            <Image
                                src={media.url}
                                alt={media.alt || media.name}
                                width={100}
                                height={100}
                                className="size-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex aspect-square size-10 items-center justify-center overflow-hidden rounded-md bg-gray-200 text-gray-500">
                            <Icons.FileText className="size-5" />
                        </div>
                    )}
                </div>

                <p className="break-words">{fileName}</p>
            </div>

            <Dialog
                open={isImageDialogOpen}
                onOpenChange={setIsImageDialogOpen}
            >
                <DialogContent className="overflow-hidden p-0">
                    <DialogHeader className="hidden">
                        <DialogTitle>{fileName}</DialogTitle>
                    </DialogHeader>

                    <div className="size-full">
                        <Image
                            src={media.url}
                            alt={media.name}
                            width={500}
                            height={500}
                            className="size-full object-cover"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
