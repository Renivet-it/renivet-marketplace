"use client";

import { Icons } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { BrandMediaItem } from "@/lib/validations";
import Image from "next/image";

interface PageProps {
    media: BrandMediaItem;
    onSelectionChange: (isSelected: boolean) => void;
    selectedItems: BrandMediaItem[];
    multiple: boolean;
}

export function ProductMediaSelectSingle({
    media,
    onSelectionChange,
    selectedItems,
    multiple,
}: PageProps) {
    const fileType = media.name.split(".").pop();
    const fileName = media.name.split(".").slice(0, -1).join(".");

    const isMediaImage = media.type.includes("image");

    const isSelected = selectedItems.some((item) => item.id === media.id);

    const handleSelection = (value: boolean) => {
        if (!multiple && value) {
            onSelectionChange(true);
            return;
        }
        onSelectionChange(value);
    };

    return (
        <div key={media.id} className="space-y-2">
            <div
                className={cn(
                    "relative aspect-square overflow-hidden rounded-md border p-2 transition-all ease-in-out hover:bg-muted",
                    isSelected && "border-primary"
                )}
                onClick={() => handleSelection(!isSelected)}
            >
                {isMediaImage ? (
                    <Image
                        src={media.url}
                        alt={media.alt || media.name}
                        height={500}
                        width={500}
                        className="size-full rounded-sm object-cover"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center">
                        <div className="flex aspect-square size-10 items-center justify-center overflow-hidden rounded-md bg-gray-200 text-gray-500">
                            <Icons.FileText className="size-5" />
                        </div>
                    </div>
                )}

                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(value) => handleSelection(!!value)}
                    className="absolute left-3 top-3 bg-background"
                />
            </div>

            <div className="space-y-1 text-center">
                <p className="truncate text-xs font-semibold">{fileName}</p>

                <p className="text-sm font-medium uppercase text-muted-foreground">
                    {fileType}
                </p>
            </div>
        </div>
    );
}
