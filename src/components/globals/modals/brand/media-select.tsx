"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Input } from "@/components/ui/input-dash";
import {
    moveSelectedMedia,
    removeSelectedMedia,
    uniqueSelectedMedia,
} from "@/lib/product-media-selection";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { handleClientError } from "@/lib/utils";
import { BrandMediaItem } from "@/lib/validations";
import { useMutation } from "@tanstack/react-query";
import {
    Dispatch,
    SetStateAction,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { toast } from "sonner";
import { ProductMediaSelectSingle } from "./product-media-select-single";

interface PageProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    selectedMedia: BrandMediaItem[];
    allMedia: BrandMediaItem[];
    brandId: string;
    multiple?: boolean;
    accept?: string;
    onSelectionComplete?: (items: BrandMediaItem[]) => void;
}

export function MediaSelectModal({
    isOpen,
    setIsOpen,
    selectedMedia,
    allMedia,
    brandId,
    multiple = false,
    accept = "*",
    onSelectionComplete,
}: PageProps) {
    const [search, setSearch] = useState("");
    const [selectedItems, setSelectedItems] = useState<BrandMediaItem[]>(() =>
        uniqueSelectedMedia(selectedMedia)
    );

    useEffect(() => {
        if (isOpen) setSelectedItems(uniqueSelectedMedia(selectedMedia));
    }, [isOpen, selectedMedia]);

    const inputRef = useRef<HTMLInputElement>(null!);

    const itemsToMap = useMemo(() => {
        if (search.length === 0) return allMedia;
        return allMedia.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [allMedia, search]);

    const { startUpload } = useUploadThing("brandMediaUploader", {
        onUploadError: (e) => {
            toast.error(e.message);
        },
    });

    const { refetch } = trpc.brands.media.getMediaItems.useQuery(
        { brandId },
        { initialData: { data: allMedia, count: allMedia.length } }
    );
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
            refetch();
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const handleSelectionChange = (
        media: BrandMediaItem,
        isSelected: boolean
    ) => {
        setSelectedItems((prev) => {
            if (!multiple) return isSelected ? [media] : [];
            return isSelected
                ? uniqueSelectedMedia([...prev, media])
                : removeSelectedMedia(prev, media.id);
        });
    };

    const moveSelection = (index: number, offset: -1 | 1) => {
        setSelectedItems((prev) => moveSelectedMedia(prev, index, offset));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Select file</DialogTitle>
                    <DialogDescription>
                        Select existing media or upload new media
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <Button
                        className="h-9 w-full px-3 text-xs md:h-10 md:px-4 md:text-sm"
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
                        accept={accept}
                        onChange={(e) => {
                            if (!e.target.files) return;
                            uploadMedia(Array.from(e.target.files));
                        }}
                    />

                    <div className="relative h-px w-full bg-foreground/20">
                        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm font-medium">
                            OR
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Input
                            className="h-8"
                            type="search"
                            placeholder="Search files..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {multiple && selectedItems.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                Selected sequence
                            </p>
                            <div className="grid gap-2 rounded-lg border p-2 sm:grid-cols-2">
                                {selectedItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
                                    >
                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                                            {index + 1}
                                        </span>
                                        <img
                                            src={item.url}
                                            alt={item.alt || item.name}
                                            className="size-10 shrink-0 rounded object-cover"
                                        />
                                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                                            {item.name}
                                        </span>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                aria-label={`Move ${item.name} up`}
                                                disabled={index === 0}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    moveSelection(index, -1);
                                                }}
                                            >
                                                <Icons.ArrowUp className="size-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7"
                                                aria-label={`Move ${item.name} down`}
                                                disabled={
                                                    index ===
                                                    selectedItems.length - 1
                                                }
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    moveSelection(index, 1);
                                                }}
                                            >
                                                <Icons.ArrowDown className="size-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-destructive hover:text-destructive"
                                                aria-label={`Remove ${item.name}`}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setSelectedItems((prev) =>
                                                        removeSelectedMedia(
                                                            prev,
                                                            item.id
                                                        )
                                                    );
                                                }}
                                            >
                                                <Icons.X className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid max-h-80 grid-cols-2 gap-4 overflow-scroll rounded-lg border p-2 md:grid-cols-6">
                        {itemsToMap.map((media) => (
                            <ProductMediaSelectSingle
                                key={media.id}
                                media={media}
                                selectedItems={selectedItems}
                                multiple={multiple}
                                onSelectionChange={(isSelected) =>
                                    handleSelectionChange(media, isSelected)
                                }
                            />
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            className="h-8"
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="button"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                            onSelectionComplete?.(selectedItems);
                            setIsOpen(false);
                        }}
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
