import {
    ProductActionPage,
    ProductReviewPage,
} from "@/components/dashboard/general/products";
import { DashShell } from "@/components/globals/layouts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { productQueries } from "@/lib/db/queries";
import { brandCache, userCache } from "@/lib/redis/methods";
import { convertValueToLabel } from "@/lib/utils";
import { format } from "date-fns";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id } = await params;

    const existingProduct = await productQueries.getProduct({ productId: id });
    if (!existingProduct)
        return {
            title: "Product not found",
            description: "The requested product was not found.",
        };

    return {
        title: `Review "${existingProduct.title}"`,
        description: `Review the product details for "${existingProduct.title}" by ${existingProduct.brand.name}`,
    };
}

export default function Page({ params }: PageProps) {
    return (
        <DashShell>
            <Suspense fallback={<ProductReviewSkeleton />}>
                <ProductReviewFetch params={params} />
            </Suspense>
        </DashShell>
    );
}

async function ProductReviewFetch({ params }: PageProps) {
    const { id } = await params;

    const existingProduct = await productQueries.getProduct({ productId: id });
    if (!existingProduct) notFound();

    const [existingBrand, existingOwner] = await Promise.all([
        brandCache.get(existingProduct.brand.id),
        userCache.get(existingProduct.brand.ownerId),
    ]);

    if (!existingBrand) notFound();
    if (!existingOwner) notFound();

    const websiteUrlRaw = existingProduct.brand.website;
    const doesUrlIncludeHttp =
        websiteUrlRaw?.includes("http://") ||
        websiteUrlRaw?.includes("https://");
    const websiteUrl = doesUrlIncludeHttp
        ? websiteUrlRaw
        : `http://${websiteUrlRaw}`;

    return (
        <>
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">
                        Review &ldquo;{existingProduct.title}&rdquo;
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Product submitted by {existingProduct.brand.name} (
                        {existingProduct.brand.id})
                    </p>
                </div>

                <Badge
                    variant={
                        existingProduct.verificationStatus === "pending"
                            ? "default"
                            : existingProduct.verificationStatus === "approved"
                              ? "secondary"
                              : "destructive"
                    }
                >
                    {convertValueToLabel(existingProduct.verificationStatus)}
                </Badge>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Brand Information</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <h5 className="text-sm font-medium">Name</h5>
                                <p className="text-sm">
                                    {existingProduct.brand.name}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Email</h5>
                                <Link
                                    href={`mailto:${existingProduct.brand.email}`}
                                    className="break-words text-sm text-primary underline"
                                >
                                    {existingProduct.brand.email}
                                </Link>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Phone</h5>
                                <p className="text-sm">
                                    {existingProduct.brand.phone}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Website</h5>
                                {websiteUrl ? (
                                    <Link
                                        href={websiteUrl}
                                        className="break-words text-sm text-primary underline"
                                        target="_blank"
                                    >
                                        {existingProduct.brand.website}
                                    </Link>
                                ) : (
                                    <p className="text-sm text-primary">N/A</p>
                                )}
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Logo</h5>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="text-sm text-primary underline">
                                            Click here
                                        </button>
                                    </PopoverTrigger>

                                    <PopoverContent className="overflow-hidden p-0">
                                        <div className="aspect-square size-full overflow-hidden">
                                            <Image
                                                src={
                                                    existingProduct.brand
                                                        .logoUrl
                                                }
                                                alt={existingProduct.brand.name}
                                                width={500}
                                                height={500}
                                                className="size-full object-cover"
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Verification Status
                                </h5>
                                <Badge
                                    variant={
                                        existingProduct.brand
                                            .confidentialVerificationStatus ===
                                        "approved"
                                            ? "secondary"
                                            : existingProduct.brand
                                                    .confidentialVerificationStatus ===
                                                "rejected"
                                              ? "destructive"
                                              : "default"
                                    }
                                >
                                    {convertValueToLabel(
                                        existingProduct.brand
                                            .confidentialVerificationStatus
                                    )}
                                </Badge>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    RazorPay ID
                                </h5>
                                <p className="text-sm">
                                    {existingProduct.brand.rzpAccountId ||
                                        "N/A"}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">
                                    Joined On
                                </h5>
                                <p className="text-sm">
                                    {format(
                                        new Date(
                                            existingProduct.brand.createdAt
                                        ),
                                        "MMM dd, yyyy"
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Owner Information</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            <div>
                                <h5 className="text-sm font-medium">Name</h5>
                                <p className="text-sm">
                                    {existingOwner.firstName}{" "}
                                    {existingOwner.lastName}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Email</h5>
                                <Link
                                    href={`mailto:${existingOwner.email}`}
                                    className="break-words text-sm text-primary underline"
                                >
                                    {existingOwner.email}
                                </Link>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium">Phone</h5>
                                <p className="text-sm">
                                    {existingOwner.phone ?? "N/A"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Information</CardTitle>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <ProductReviewPage product={existingProduct} />
                    </CardContent>
                </Card>

                {(existingProduct.verificationStatus === "pending" ||
                    existingProduct.verificationStatus === "approved") && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Action</CardTitle>
                        </CardHeader>

                        <Separator />

                        <CardContent className="pt-6">
                            <ProductActionPage product={existingProduct} />
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

function ProductReviewSkeleton() {
    return (
        <>
            <div className="flex items-center justify-between gap-2">
                <div className="w-full space-y-1">
                    <Skeleton className="h-7 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>

                <Skeleton className="h-5 w-24 rounded-full" />
            </div>

            <div className="space-y-6">
                <Skeleton className="h-52 rounded-md" />
                <Skeleton className="h-36 rounded-md" />
                <Skeleton className="h-96 rounded-md" />
            </div>
        </>
    );
}
