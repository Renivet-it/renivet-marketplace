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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn, formatPriceTag } from "@/lib/utils";
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

    const stock = product.sizes.reduce((acc, x) => acc + x.quantity, 0);

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
                    <h5 className="text-sm font-medium">Name</h5>
                    <p className="text-sm">{product.name}</p>
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
                    <p className="text-sm">
                        {formatPriceTag(parseFloat(product.price), true)}
                    </p>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Categories</h5>
                    {product.categories.length === 0 ? (
                        <span className="text-sm">N/A</span>
                    ) : (
                        <Popover>
                            <PopoverTrigger
                                title="Click to view"
                                className="text-sm underline"
                            >
                                View
                            </PopoverTrigger>

                            <PopoverContent className="w-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Count</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Subcategory</TableHead>
                                            <TableHead className="text-right">
                                                Product Type
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {product.categories.map((x, i) => (
                                            <TableRow key={x.id}>
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell>
                                                    {x.category.name}
                                                </TableCell>
                                                <TableCell>
                                                    {x.subcategory.name}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {x.productType.name}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                <div>
                    <h5 className="text-sm font-medium">Colors</h5>
                    {product.colors.length === 0 ? (
                        <span className="text-sm">N/A</span>
                    ) : (
                        <div className="flex gap-1">
                            {product.colors.map((color, i) => (
                                <div
                                    key={i}
                                    title={color.name}
                                    className="size-5 rounded-full"
                                    style={{
                                        backgroundColor: color.hex,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h5 className="text-sm font-medium">Sizes</h5>
                    {product.colors.length === 0 ? (
                        <span className="text-sm">N/A</span>
                    ) : (
                        <div className="flex gap-1">
                            {product.sizes.length === 0 ? (
                                <span>N/A</span>
                            ) : (
                                <Popover>
                                    <PopoverTrigger
                                        title="Click to view"
                                        className="text-sm underline"
                                    >
                                        View
                                    </PopoverTrigger>

                                    <PopoverContent className="w-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Count</TableHead>
                                                    <TableHead>Size</TableHead>
                                                    <TableHead className="text-right">
                                                        Quantity
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {product.sizes.map((x, i) => (
                                                    <TableRow key={x.name}>
                                                        <TableCell>
                                                            {i + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            {x.name}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {x.quantity}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>

                                            <TableFooter>
                                                <TableRow>
                                                    <TableCell colSpan={2}>
                                                        Total
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {stock}
                                                    </TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <h5 className="text-sm font-medium">Images</h5>
                    <button
                        className="text-sm text-primary underline"
                        onClick={() => setIsImagesModalOpen(true)}
                    >
                        View
                    </button>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Certificate</h5>
                    <Link
                        href={product.sustainabilityCertificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline"
                    >
                        View
                    </Link>
                </div>

                <div>
                    <h5 className="text-sm font-medium">Created On</h5>
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
                            Description of &ldquo;{product.name}&rdquo;
                        </DialogTitle>
                    </DialogHeader>

                    <RichTextViewer content={product.description} />
                </DialogContent>
            </Dialog>

            <Dialog
                open={isImagesModalOpen}
                onOpenChange={setIsImagesModalOpen}
            >
                <DialogContent className="p-0">
                    <DialogHeader className="sr-only">
                        <DialogTitle>
                            Images of &ldquo;{product.name}&rdquo;
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
                            {product.imageUrls.map((url, index) => (
                                <CarouselItem
                                    key={index}
                                    className="h-full p-0"
                                >
                                    <div className="relative size-full">
                                        <Image
                                            src={url}
                                            alt={product.name}
                                            width={2000}
                                            height={2000}
                                            className="size-full object-cover"
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>

                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </DialogContent>
            </Dialog>
        </>
    );
}
