"use client";

import { Icons } from "@/components/icons";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import {
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    filterStorefrontBrands,
    sortStorefrontBrands,
    type StorefrontBrand,
} from "@/lib/brands/storefront-brand-order";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const PREVIEW_LIMIT = 9;

function BrandMark({
    brand,
    compact = false,
}: {
    brand: StorefrontBrand;
    compact?: boolean;
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const showImage = Boolean(brand.logoUrl) && !imageFailed;

    return (
        <div
            className={cn(
                "relative shrink-0 overflow-hidden rounded-xl border border-[#e8e1d5] bg-[#f8f5ef]",
                compact ? "size-11" : "size-14"
            )}
        >
            {showImage ? (
                <Image
                    src={brand.logoUrl!}
                    alt={`${brand.name} logo`}
                    fill
                    sizes={compact ? "44px" : "56px"}
                    className="object-contain p-1.5"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <span className="flex h-full w-full items-center justify-center font-serif text-lg text-[#264638]">
                    {brand.name.slice(0, 1).toUpperCase()}
                </span>
            )}
        </div>
    );
}

function BrandLink({
    brand,
    compact = false,
    onNavigate,
}: {
    brand: StorefrontBrand;
    compact?: boolean;
    onNavigate?: () => void;
}) {
    return (
        <Link
            href={`/brands/${brand.slug}/shop`}
            onClick={onNavigate}
            className={cn(
                "group flex min-w-0 items-center gap-3 rounded-2xl border border-[#e9e2d7] bg-white text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#b9aa91] hover:shadow-[0_12px_30px_-22px_rgba(36,65,54,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244136] focus-visible:ring-offset-2",
                compact ? "p-2.5" : "p-3"
            )}
        >
            <BrandMark brand={brand} compact={compact} />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[#202720]">
                    {brand.name}
                </span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-[#8b8377]">
                    Explore brand
                </span>
            </span>
            <Icons.ChevronRight className="size-4 shrink-0 text-[#8d978f] transition-transform group-hover:translate-x-0.5" />
        </Link>
    );
}

function EmptyBrands({ isLoading }: { isLoading: boolean }) {
    return (
        <div className="col-span-full flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-[#ded5c7] bg-[#faf8f3] px-6 text-center text-sm text-[#766f66]">
            {isLoading
                ? "Loading brands…"
                : "No brands are available right now."}
        </div>
    );
}

function AllBrandsDialog({
    brands,
    open,
    onOpenChange,
}: {
    brands: StorefrontBrand[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [query, setQuery] = useState("");
    const matches = useMemo(
        () => filterStorefrontBrands(brands, query),
        [brands, query]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] w-[calc(100%-24px)] max-w-5xl overflow-hidden rounded-[28px] border border-[#e5ddd0] bg-[#fbf9f4] p-0 sm:w-[calc(100%-48px)]">
                <DialogHeader className="border-b border-[#e9e2d7] px-5 pb-5 pt-7 text-left sm:px-8 sm:pt-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#987b55]">
                        Brand directory
                    </p>
                    <DialogTitle className="font-serif text-3xl font-normal text-[#241f1a] sm:text-4xl">
                        All Brands
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#756d63]">
                        Discover independent brands, all in one place.
                    </DialogDescription>
                    <label className="relative mt-3 block">
                        <span className="sr-only">Search brands</span>
                        <Icons.Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#918a80]" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search brands…"
                            className="h-11 w-full rounded-full border border-[#e2dbcf] bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#244136] focus:ring-2 focus:ring-[#244136]/15"
                        />
                    </label>
                </DialogHeader>

                <div className="max-h-[58dvh] overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
                    <div className="mb-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#726a60]">
                        <span>{matches.length} conscious brands</span>
                        <span>Priority · A–Z</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {matches.length ? (
                            matches.map((brand) => (
                                <BrandLink
                                    key={brand.id}
                                    brand={brand}
                                    onNavigate={() => onOpenChange(false)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full rounded-2xl border border-dashed border-[#ded5c7] py-12 text-center text-sm text-[#766f66]">
                                No brands match “{query}”.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function BrandDesktopNavigationItem({
    brands,
    isLoading,
}: {
    brands: StorefrontBrand[];
    isLoading: boolean;
}) {
    const [directoryOpen, setDirectoryOpen] = useState(false);
    const preview = useMemo(
        () => sortStorefrontBrands(brands).slice(0, PREVIEW_LIMIT),
        [brands]
    );

    return (
        <>
            <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10 rounded-none border-b-2 border-transparent bg-transparent px-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#33413a] transition-colors duration-200 hover:bg-transparent hover:text-primary data-[state=open]:border-primary data-[state=open]:text-primary min-[1500px]:px-3 min-[1500px]:text-[13px] min-[1500px]:tracking-[0.08em]">
                    BRANDS
                </NavigationMenuTrigger>
                <NavigationMenuContent className="pt-3">
                    <div className="w-[1180px] max-w-[95vw] overflow-hidden rounded-[24px] border border-[#e7e0d5] bg-[#fbf9f4] shadow-[0_30px_80px_-42px_rgba(15,23,42,0.38)]">
                        <div className="flex items-end justify-between border-b border-[#e9e2d7] px-6 py-5">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#987b55]">
                                    Brands
                                </p>
                                <h2 className="mt-1 font-serif text-[28px] text-[#241f1a]">
                                    Shop by Brand
                                </h2>
                                <p className="mt-1 text-xs text-[#756d63]">
                                    Discover homegrown brands, all in one place.
                                </p>
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777066]">
                                Priority · A–Z
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 p-5">
                            {preview.length ? (
                                preview.map((brand) => (
                                    <BrandLink
                                        key={brand.id}
                                        brand={brand}
                                        compact
                                    />
                                ))
                            ) : (
                                <EmptyBrands isLoading={isLoading} />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setDirectoryOpen(true)}
                            className="m-5 mt-0 flex h-11 w-[calc(100%-40px)] items-center justify-center gap-2 rounded-xl bg-[#244136] text-xs font-semibold uppercase tracking-[0.13em] text-white transition hover:bg-[#193128] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244136] focus-visible:ring-offset-2"
                        >
                            View All Brands
                            <Icons.ArrowRight className="size-4" />
                        </button>
                    </div>
                </NavigationMenuContent>
            </NavigationMenuItem>
            <AllBrandsDialog
                brands={brands}
                open={directoryOpen}
                onOpenChange={setDirectoryOpen}
            />
        </>
    );
}

export function BrandMobileNavigation({
    brands,
    isLoading,
    className,
    triggerClassName,
}: {
    brands: StorefrontBrand[];
    isLoading: boolean;
    className?: string;
    triggerClassName?: string;
}) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const orderedBrands = useMemo(() => sortStorefrontBrands(brands), [brands]);
    const preview = useMemo(
        () => orderedBrands.slice(0, PREVIEW_LIMIT),
        [orderedBrands]
    );
    const visibleBrands = showAll ? orderedBrands : preview;

    const handleSheetOpenChange = (open: boolean) => {
        setSheetOpen(open);
        if (!open) setShowAll(false);
    };

    return (
        <div className={cn("lg:hidden", className)}>
            <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetTrigger asChild>
                    <button
                        type="button"
                        aria-label="Browse brands"
                        className={cn(
                            "flex size-9 items-center justify-center rounded-full bg-[#244136] text-white shadow-sm transition hover:bg-[#193128] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244136] focus-visible:ring-offset-2",
                            triggerClassName
                        )}
                    >
                        <Icons.Tag className="size-5" />
                    </button>
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    className="max-h-[86dvh] overflow-y-auto rounded-t-[28px] border-[#e4dccf] bg-[#fbf9f4] px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-7"
                >
                    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#cfc7bb]" />
                    <SheetHeader className="px-1 text-left">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#987b55]">
                            Brands
                        </p>
                        <SheetTitle className="font-serif text-[28px] font-normal text-[#241f1a]">
                            {showAll ? "All Brands" : "Shop by Brand"}
                        </SheetTitle>
                        <SheetDescription className="text-xs text-[#756d63]">
                            Discover homegrown brands, all in one place.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-5 grid grid-cols-2 gap-2.5">
                        {visibleBrands.length ? (
                            visibleBrands.map((brand) => (
                                <BrandLink
                                    key={brand.id}
                                    brand={brand}
                                    compact
                                    onNavigate={() => setSheetOpen(false)}
                                />
                            ))
                        ) : (
                            <EmptyBrands isLoading={isLoading} />
                        )}
                    </div>
                    {!showAll && (
                        <button
                            type="button"
                            onClick={() => setShowAll(true)}
                            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#244136] text-xs font-semibold uppercase tracking-[0.13em] text-white"
                        >
                            View All Brands
                            <Icons.ArrowRight className="size-4" />
                        </button>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
