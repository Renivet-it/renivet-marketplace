"use client";

import {
    BrandPageSectionManage,
    BrandPageSectionProductManage,
} from "@/components/globals/forms";
import { Icons } from "@/components/icons";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
} from "@/components/ui/alert-dialog-dash";
import { Button } from "@/components/ui/button-dash";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import {
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedBrand, ProductWithBrand } from "@/lib/validations";
import { AlertDialogTitle } from "@radix-ui/react-alert-dialog";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface PageProps {
    brand: CachedBrand;
    pageSection: CachedBrand["pageSections"][number];
    products: ProductWithBrand[];
}

export function PageSectionCarousel({
    pageSection,
    brand,
    products,
}: PageProps) {
    const [isProductAddModalOpen, setIsProductAddModalOpen] = useState(false);
    const [isSectionEditModalOpen, setIsSectionEditModalOpen] = useState(false);
    const [isSectionDeleteModalOpen, setIsSectionDeleteModalOpen] =
        useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const isMobile = window.innerWidth < 768;
        const cardWidth = isMobile ? 160 : 200;
        const gap = isMobile ? 12 : 16;
        const scrollAmount = cardWidth + gap;

        const currentScroll = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;

        const newScroll =
            direction === "left"
                ? Math.max(0, currentScroll - scrollAmount)
                : Math.min(maxScroll, currentScroll + scrollAmount);

        container.scrollTo({
            left: newScroll,
            behavior: "smooth",
        });
    };

    const { refetch } = trpc.brands.brands.getBrand.useQuery({ id: brand.id });

    const { mutate: deleteSection, isPending: isDeleting } =
        trpc.brands.pageSections.deleteBrandPageSection.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting section...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                refetch();
                setIsSectionDeleteModalOpen(false);
                toast.success("Section deleted", { id: toastId });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <>
            <div className="space-y-2 md:space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold md:text-xl">
                        {pageSection.name}
                    </h2>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs md:h-8"
                                onClick={() => setIsProductAddModalOpen(true)}
                            >
                                <Icons.Plus className="size-3 md:size-4" />
                                <span className="hidden md:inline">
                                    Add Product
                                </span>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="icon"
                                        className="size-7 md:size-8"
                                        variant="outline"
                                    >
                                        <Icons.MoreVertical />
                                        <span className="sr-only">More</span>
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                        Actions
                                    </DropdownMenuLabel>

                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsSectionEditModalOpen(true)
                                        }
                                    >
                                        <Icons.Pencil className="size-4" />
                                        <span>Edit</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsSectionDeleteModalOpen(true)
                                        }
                                    >
                                        <Icons.Trash className="size-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="flex gap-1 md:gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-7 md:size-8"
                                onClick={() => scroll("left")}
                            >
                                <Icons.ChevronLeft className="size-3 md:size-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="size-7 md:size-8"
                                onClick={() => scroll("right")}
                            >
                                <Icons.ChevronRight className="size-3 md:size-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div
                        ref={scrollContainerRef}
                        className="scrollbar-hide flex snap-x gap-3 overflow-x-auto md:gap-4"
                        style={{
                            scrollBehavior: "smooth",
                            WebkitOverflowScrolling: "touch",
                        }}
                    >
                        {pageSection.sectionProducts.map(({ product }) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                pageSection={pageSection}
                                brand={brand}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <Dialog
                open={isProductAddModalOpen}
                onOpenChange={setIsProductAddModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                            Add a new product to this section
                        </DialogDescription>
                    </DialogHeader>

                    <BrandPageSectionProductManage
                        brand={brand}
                        products={products}
                        pageSection={pageSection}
                        setIsOpen={setIsProductAddModalOpen}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={isSectionEditModalOpen}
                onOpenChange={setIsSectionEditModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Section</DialogTitle>
                        <DialogDescription>
                            Update the section name and description
                        </DialogDescription>
                    </DialogHeader>

                    <BrandPageSectionManage
                        brand={brand}
                        pageSection={pageSection}
                        setIsOpen={setIsSectionEditModalOpen}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={isSectionDeleteModalOpen}
                onOpenChange={setIsSectionDeleteModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to delete this section?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Deleting this section will remove all products
                            listed under it. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => setIsSectionDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() =>
                                deleteSection({ id: pageSection.id })
                            }
                        >
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

interface ProductCardProps {
    pageSection: CachedBrand["pageSections"][number];
    product: CachedBrand["pageSections"][number]["sectionProducts"][number]["product"];
    brand: CachedBrand;
}

function ProductCard({ product, brand, pageSection }: ProductCardProps) {
    const { refetch } = trpc.brands.brands.getBrand.useQuery({
        id: brand.id,
    });

    const { mutate: deleteProduct, isPending: isDeleting } =
        trpc.brands.pageSections.products.deleteBrandPageSectionProduct.useMutation(
            {
                onMutate: () => {
                    const toastId = toast.loading("Removing product...");
                    return { toastId };
                },
                onSuccess: (_, __, { toastId }) => {
                    refetch();
                    toast.success("Product removed", { id: toastId });
                },
                onError: (err, _, ctx) => {
                    return handleClientError(err, ctx?.toastId);
                },
            }
        );

    const price = useMemo(() => {
        if (product.variants.length === 0) {
            return formatPriceTag(
                parseFloat(convertPaiseToRupees(product.price ?? 0)),
                true
            );
        }

        const minPriceRaw = Math.min(...product.variants.map((x) => x.price));
        const maxPriceRaw = Math.max(...product.variants.map((x) => x.price));

        const minPrice = formatPriceTag(
            parseFloat(convertPaiseToRupees(minPriceRaw)),
            true
        );
        const maxPrice = formatPriceTag(
            parseFloat(convertPaiseToRupees(maxPriceRaw)),
            true
        );

        return minPriceRaw === maxPriceRaw
            ? minPrice
            : `${minPrice} - ${maxPrice}`;
    }, [product.variants, product.price]);

    const item = useMemo(
        () =>
            pageSection.sectionProducts.find(
                (x) => x.product.id === product.id
            ),
        [pageSection.sectionProducts, product.id]
    );

    return (
        <Card
            key={product.id}
            className="relative w-[160px] shrink-0 snap-start md:w-[200px]"
        >
            <button
                className="absolute right-1.5 top-1.5 z-10 rounded-full bg-foreground/30 p-1 text-background disabled:cursor-not-allowed disabled:opacity-50 md:right-2 md:top-2"
                disabled={isDeleting}
                onClick={() => {
                    if (!item) return toast.error("Product not found");
                    deleteProduct({ id: item.id });
                }}
            >
                <Icons.X className="size-2.5 md:size-3" />
                <span className="sr-only">Remove product from section</span>
            </button>

            <Link href={`/products/${product.slug}`} target="_blank">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <Image
                        src={product?.media[0].mediaItem!.url}
                        alt={product.title}
                        width={200}
                        height={200}
                        className="size-full object-cover"
                    />
                </div>

                <div className="p-3">
                    <h3 className="line-clamp-1 text-sm font-medium md:text-base">
                        {product.title}
                    </h3>
                    <p className="text-xs text-muted-foreground md:text-sm">
                        {price}
                    </p>
                </div>
            </Link>
        </Card>
    );
}
