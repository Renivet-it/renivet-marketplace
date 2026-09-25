"use client";

import { ProductMediaPreview } from "@/components/globals/media/product-media-preview";
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
    getVisibleMedia,
    MEDIA_PREVIEW_BATCH_SIZE,
    moveSelectedMedia,
    removeSelectedMedia,
    uniqueSelectedMedia,
} from "@/lib/product-media-selection";
import { trpc } from "@/lib/trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { uploadFilesInBatches } from "@/lib/uploadthing/batch-upload";
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
    const [uploadProgress, setUploadProgress] = useState<{
        completed: number;
        total: number;
    } | null>(null);
    const [visibleMediaCount, setVisibleMediaCount] = useState(
        MEDIA_PREVIEW_BATCH_SIZE
    );
    const [selectedItems, setSelectedItems] = useState<BrandMediaItem[]>(() =>
        uniqueSelectedMedia(selectedMedia)
    );
    const [optimisticMedia, setOptimisticMedia] = useState<BrandMediaItem[]>(
        []
    );

    useEffect(() => {
        if (isOpen) setSelectedItems(uniqueSelectedMedia(selectedMedia));
    }, [isOpen, selectedMedia]);

    const inputRef = useRef<HTMLInputElement>(null!);
    const optimisticObjectUrlsRef = useRef<string[]>([]);
    const uploadToastIdRef = useRef<
        ReturnType<typeof toast.loading> | undefined
    >(undefined);

    const mediaQuery = trpc.brands.media.getMediaItems.useQuery(
        { brandId },
        { initialData: { data: allMedia, count: allMedia.length } }
    );
    const persistedMedia = mediaQuery.data?.data ?? allMedia;
    const mediaItems = useMemo(
        () => [...optimisticMedia, ...persistedMedia],
        [optimisticMedia, persistedMedia]
    );

    const itemsToMap = useMemo(() => {
        if (search.length === 0) return mediaItems;
        return mediaItems.filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [mediaItems, search]);
    const visibleMedia = useMemo(
        () => getVisibleMedia(itemsToMap, visibleMediaCount),
        [itemsToMap, visibleMediaCount]
    );

    useEffect(() => {
        setVisibleMediaCount(MEDIA_PREVIEW_BATCH_SIZE);
    }, [mediaItems, search]);

    const { startUpload } = useUploadThing("brandMediaUploader", {
        onUploadError: (e) => {
            toast.error(e.message);
        },
    });

    const { refetch } = mediaQuery;
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
            optimisticObjectUrlsRef.current.forEach((url) =>
                URL.revokeObjectURL(url)
            );
            optimisticObjectUrlsRef.current = [];
            setOptimisticMedia([]);
            setUploadProgress(null);
            toast.success("Media uploaded successfully", { id: toastId });
            void refetch();
        },
        onError: (err, _, ctx) => {
            optimisticObjectUrlsRef.current.forEach((url) =>
                URL.revokeObjectURL(url)
            );
            optimisticObjectUrlsRef.current = [];
            setOptimisticMedia([]);
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
                        {isUploading && uploadProgress
                            ? `Uploaded ${uploadProgress.completed} of ${uploadProgress.total} images`
                            : "Upload Media"}
                    </Button>

                    <input
                        ref={inputRef}
                        multiple
                        type="file"
                        className="hidden"
                        accept={accept}
                        onChange={(e) => {
                            if (!e.target.files?.length) return;
                            const files = Array.from(e.target.files);
                            const previews = files.map((file) => {
                                const url = URL.createObjectURL(file);
                                optimisticObjectUrlsRef.current.push(url);
                                return {
                                    id: crypto.randomUUID(),
                                    brandId,
                                    url,
                                    type: file.type || "image/*",
                                    name: file.name,
                                    alt: null,
                                    size: file.size,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                } satisfies BrandMediaItem;
                            });
                            setOptimisticMedia((current) => [
                                ...previews,
                                ...current,
                            ]);
                            uploadMedia(files);
                            e.target.value = "";
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
                                        <ProductMediaPreview
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

                    <div
                        className="grid max-h-80 grid-cols-2 gap-4 overflow-scroll rounded-lg border p-2 md:grid-cols-6"
                        onScroll={(event) => {
                            const target = event.currentTarget;
                            if (
                                target.scrollTop + target.clientHeight >=
                                target.scrollHeight - 160
                            ) {
                                setVisibleMediaCount((count) =>
                                    Math.min(
                                        count + MEDIA_PREVIEW_BATCH_SIZE,
                                        itemsToMap.length
                                    )
                                );
                            }
                        }}
                    >
                        {visibleMedia.map((media) => (
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
                        {visibleMedia.length < itemsToMap.length && (
                            <Button
                                type="button"
                                variant="outline"
                                className="col-span-full"
                                onClick={() =>
                                    setVisibleMediaCount((count) =>
                                        Math.min(
                                            count + MEDIA_PREVIEW_BATCH_SIZE,
                                            itemsToMap.length
                                        )
                                    )
                                }
                            >
                                Load more media
                            </Button>
                        )}
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
