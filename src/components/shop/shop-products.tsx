"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { CachedWishlist, ProductWithBrand } from "@/lib/validations";
import Link from "next/link";
import {
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
} from "nuqs";
import { ProductCard } from "../globals/cards";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import { Pagination } from "../ui/data-table-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "../ui/empty-placeholder-general";
import { Separator } from "../ui/separator";
import { trackProductClick } from "@/actions/track-product";

interface PageProps extends GenericProps {
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
    initialWishlist?: CachedWishlist[];
    userId?: string;
}

export function ShopProducts({
    className,
    initialData,
    initialWishlist,
    userId,
    ...props
}: PageProps) {

        const handleProductClick = async (productId: string, brandId: string) => {
        try {
            // Track the click
            await trackProductClick(productId, brandId);
            // You can also navigate to product page or perform other actions
            // window.location.href = `/product/${productId}`;
        } catch (error) {
            console.error("Failed to track click:", error);
        }
    };
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(30));
    const [search] = useQueryState("search", { defaultValue: "" });
    const [brandIds] = useQueryState(
        "brandIds",
        parseAsArrayOf(parseAsString, ",").withDefault([])
    );
    const [minPrice] = useQueryState("minPrice", parseAsInteger.withDefault(0));
    const [maxPrice] = useQueryState(
        "maxPrice",
        parseAsInteger.withDefault(10000)
    );
    const [categoryId] = useQueryState("categoryId", { defaultValue: "" });
    const [subCategoryId] = useQueryState("subcategoryId", {
        defaultValue: "",
    });
    const [productTypeId] = useQueryState("productTypeId", {
        defaultValue: "",
    });
    const [sortBy] = useQueryState(
        "sortBy",
        parseAsStringLiteral(["price", "createdAt"] as const).withDefault(
            "createdAt"
        )
    );
    const [sortOrder] = useQueryState(
        "sortOrder",
        parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc")
    );

    const {
        data: { data: products, count },
    } = trpc.brands.products.getProducts.useQuery(
        {
            page,
            limit,
            search,
            isPublished: true,
            isAvailable: true,
            isActive: true,
            isDeleted: false,
            verificationStatus: "approved",
            brandIds,
            minPrice: minPrice < 0 ? 0 : minPrice,
            maxPrice: maxPrice > 10000 ? 10000 : maxPrice,
            categoryId: !!categoryId.length ? categoryId : undefined,
            subcategoryId: !!subCategoryId.length ? subCategoryId : undefined,
            productTypeId: !!productTypeId.length ? productTypeId : undefined,
            sortBy,
            sortOrder,
        },
        { initialData }
    );

    const { data: wishlist } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: userId! },
        { enabled: !!userId, initialData: initialWishlist }
    );

    const pages = Math.ceil(count / limit) ?? 1;

    if (!products.length) return <NoProductCard />;

    return (
        <>
            <div
                className={cn(
                    "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-20 lg:grid-cols-3 xl:grid-cols-4",
                    className
                )}
                {...props}
            >
                {products.length > 0 ? (
                    products.map((product) => {
                        const isWishlisted =
                            wishlist?.some(
                                (item) => item.productId === product.id
                            ) ?? false;

                        return (
                            <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id, product.brandId)}
                    className="cursor-pointer"
                >
                            <ProductCard
                                key={product.id}
                                product={product}
                                isWishlisted={isWishlisted}
                                userId={userId}
                            />
                            </div>
                        );
                    })
                ) : (
                    <p>No products found</p>
                )}
            </div>

            <Separator />

            <Pagination total={pages} />
        </>
    );
}

function NoProductCard() {
    return (
        <div className="flex flex-col items-center justify-center gap-5 p-6">
            <EmptyPlaceholder
                isBackgroundVisible={false}
                className="w-full max-w-full border-none"
            >
                <EmptyPlaceholderIcon>
                    <Icons.AlertTriangle className="size-10" />
                </EmptyPlaceholderIcon>

                <EmptyPlaceholderContent>
                    <EmptyPlaceholderTitle>
                        No products found
                    </EmptyPlaceholderTitle>
                    <EmptyPlaceholderDescription>
                        We couldn&apos;t find any products matching your search.
                        Try again with different filters.
                    </EmptyPlaceholderDescription>
                </EmptyPlaceholderContent>

                <Button asChild>
                    <Link href="/">Go back</Link>
                </Button>
            </EmptyPlaceholder>
        </div>
    );
}
