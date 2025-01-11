"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { format } from "date-fns";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
}

export function ProductReviewPage({ className, product, ...props }: PageProps) {
    const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
    const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
    const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);

    let productRootPrice: string;

    if (!product.productHasVariants)
        productRootPrice = formatPriceTag(
            parseFloat(convertPaiseToRupees(product.price ?? 0)),
            true
        );
    else {
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

        if (minPriceRaw === maxPriceRaw) productRootPrice = minPrice;
        productRootPrice = `${minPrice} - ${maxPrice}`;
    }

    return (
        <>
            <div
                className={cn(
                    "grid grid-cols-1 gap-5 md:grid-cols-3",
                    className
                )}
                {...props}
            >
                <div>
                    <h5 className="text-sm font-medium">Title</h5>
                    <p className="text-sm">{product.title}</p>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Description</h5>
                    <button
                        className="text-sm text-primary underline"
                        onClick={() => setIsDescriptionModalOpen(true)}
                    >
                        View
                    </button>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Price</h5>
                    <p className="text-sm">{productRootPrice}</p>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Category</h5>
                    <p className="text-sm">{product.category.name}</p>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Subcategory</h5>
                    <p className="text-sm">{product.subcategory.name}</p>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Product Type</h5>
                    <p className="text-sm">{product.productType.name}</p>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Images</h5>
                    {product.media.map((m) => m.mediaItem?.url).filter(Boolean)
                        .length > 0 ? (
                        <button
                            className="text-sm text-primary underline"
                            onClick={() => setIsImagesModalOpen(true)}
                        >
                            View
                        </button>
                    ) : (
                        <p className="text-sm">N/A</p>
                    )}
                </div>

                <div>
                    <h5 className="text-sm font-medium">Variants</h5>
                    {product.variants.length > 0 ? (
                        <button
                            className="text-sm text-primary underline"
                            onClick={() => setIsVariantsModalOpen(true)}
                        >
                            View
                        </button>
                    ) : (
                        <p className="text-sm">N/A</p>
                    )}
                </div>

                <div>
                    <h5 className="text-sm font-medium">Certificate</h5>
                    {product.sustainabilityCertificate?.url ? (
                        <Link
                            href={product.sustainabilityCertificate.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary underline"
                        >
                            View
                        </Link>
                    ) : (
                        <p className="text-sm">N/A</p>
                    )}
                </div>

                <div>
                    <h5 className="text-sm font-medium">Meta Title</h5>
                    <p className="text-sm">{product.metaTitle ?? "N/A"}</p>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Meta Description</h5>
                    <p className="text-sm">
                        {product.metaDescription ?? "N/A"}
                    </p>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Meta Keywords</h5>
                    <p className="text-sm">
                        {product.metaKeywords.length > 0
                            ? product.metaKeywords.join(", ")
                            : "N/A"}
                    </p>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Added On</h5>
                    <p className="text-sm">
                        {format(new Date(product.createdAt), "MMM dd, yyyy")}
                    </p>
                </div>
            </div>

            <Dialog
                open={isDescriptionModalOpen}
                onOpenChange={setIsDescriptionModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Description of &ldquo;{product.title}&rdquo;
                        </DialogTitle>
                    </DialogHeader>

                    <RichTextViewer
                        content={product.description ?? "<p></p>"}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={isImagesModalOpen}
                onOpenChange={setIsImagesModalOpen}
            >
                <DialogContent className="p-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            Images of &ldquo;{product.title}&rdquo;
                        </DialogTitle>
                    </DialogHeader>

                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 2000,
                            }),
                        ]}
                    >
                        <CarouselContent>
                            {product.media
                                .map((m) => m.mediaItem)
                                .filter(Boolean)
                                .map((m, i) => {
                                    if (!m) return null;

                                    return (
                                        <CarouselItem
                                            key={i}
                                            className="h-full p-0"
                                        >
                                            <div className="relative size-full">
                                                <Image
                                                    src={m.url}
                                                    alt={m.alt || m.name}
                                                    width={2000}
                                                    height={2000}
                                                    className="size-full object-cover"
                                                />
                                            </div>
                                        </CarouselItem>
                                    );
                                })}
                        </CarouselContent>

                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isVariantsModalOpen}
                onOpenChange={setIsVariantsModalOpen}
            >
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            Variants of &quot;{product.title}&quot;
                        </DialogTitle>
                        <DialogDescription>
                            {product.variants.length} variants
                        </DialogDescription>
                    </DialogHeader>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Variant</TableHead>
                                <TableHead>Native SKU</TableHead>
                                <TableHead>Custom SKU</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {product.variants.map((variant) => {
                                const variantName = Object.entries(
                                    variant.combinations
                                )
                                    .map(([optionId, valueId]) => {
                                        const option = product.options.find(
                                            (opt) => opt.id === optionId
                                        );
                                        const value = option?.values.find(
                                            (val) => val.id === valueId
                                        );
                                        return value?.name;
                                    })
                                    .filter(Boolean)
                                    .join(" / ");

                                return (
                                    <TableRow key={variant.id}>
                                        <TableCell>{variantName}</TableCell>

                                        <TableCell>
                                            {variant.nativeSku}
                                        </TableCell>

                                        <TableCell>
                                            {variant.sku || "N/A"}
                                        </TableCell>

                                        <TableCell>
                                            {formatPriceTag(
                                                parseFloat(
                                                    convertPaiseToRupees(
                                                        variant.price
                                                    )
                                                ),
                                                true
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {variant.quantity}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>

                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4}>Total</TableCell>
                                <TableCell>
                                    {product.variants.reduce(
                                        (acc, variant) =>
                                            acc + variant.quantity,
                                        0
                                    )}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </DialogContent>
            </Dialog>
        </>
    );
}
