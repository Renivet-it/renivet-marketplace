"use client";

import {
    Product,
    ProductCard,
} from "@/components/home/new-home-page/new-arrivals";
import { cn } from "@/lib/utils";
import { Gift, Grid2X2, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface FestiveSeasonProps {
    products: Product[];
    userId?: string;
    className?: string;
    showAllProducts?: boolean;
}

const categories = [
    { label: "All Items", icon: null },
    { label: "Gifts", icon: Gift },
    { label: "Organisers", icon: Grid2X2 },
    { label: "Fashion", icon: Sparkles },
];

const PAGE_SIZE = 6;

export function FestiveSeason({
    products,
    userId,
    className,
    showAllProducts = false,
}: FestiveSeasonProps) {
    const [page, setPage] = useState(1);
    if (!products.length) return null;
    const paginatedProducts = showAllProducts ? products : products.slice(0, PAGE_SIZE);
    const pageCount = Math.max(1, Math.ceil(paginatedProducts.length / PAGE_SIZE));
    const displayedProducts = paginatedProducts.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    return (
        <section className={cn("festive-v2", className)}>
            <main>
                <div className="festive-v2-banner">
                    <Image
                        src="/assets/festive-season/festive-banner-desktop.png"
                        alt="Celebrate consciously — sustainable festive picks"
                        fill
                        priority
                        unoptimized
                        className="festive-v2-banner-desktop"
                        sizes="(min-width: 768px) 100vw, 0px"
                    />
                    <Image
                        src="/assets/festive-season/festive-banner.png"
                        alt="Celebrate consciously — sustainable festive picks"
                        fill
                        priority
                        unoptimized
                        className="festive-v2-banner-mobile"
                        sizes="(max-width: 767px) 100vw, 960px"
                    />
                </div>

                <div className="festive-v2-breadcrumb">Home <span>›</span> <strong>Shop</strong></div>

                <label className="festive-v2-search">
                    <Search aria-hidden="true" />
                    <input aria-label="Search products" placeholder="Search products, brands..." />
                </label>

                <nav className="festive-v2-categories" aria-label="Festive categories">
                    {categories.map(({ label, icon: Icon }, index) => (
                        <button type="button" className={cn(index === 0 && "is-active")} key={label}>
                            {Icon ? <Icon aria-hidden="true" /> : null}
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="festive-v2-rail" aria-hidden="true">
                    <Image src="/assets/festive-season/festive-floral-rail.svg" alt="" fill sizes="100vw" />
                </div>

                <div className="festive-v2-products" aria-label="Festive products">
                    {displayedProducts.map((product) => (
                        <div className="festive-v2-card" key={product.id}>
                            <ProductCard product={product} userId={userId} className="festive-v2-product-card" />
                        </div>
                    ))}
                </div>

                <div className="festive-v2-sortbar">
                    <button type="button"><SlidersHorizontal /> Filters</button>
                    <Image src="/assets/festive-season/festive-lotus.png" alt="" width={44} height={44} />
                    <button type="button">↯ &nbsp; Recommended</button>
                </div>
                {pageCount > 1 ? (
                    <nav className="festive-v2-pagination" aria-label="Festive product pages">
                        <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
                            Previous
                        </button>
                        <span>Page {page} of {pageCount}</span>
                        <button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>
                            Next
                        </button>
                    </nav>
                ) : null}
            </main>
            <style jsx global>{festiveStyles}</style>
        </section>
    );
}

// The page is intentionally styled here because this editorial surface has a distinct visual system.
// It still delegates product behavior to the shared ProductCard.
const festiveStyles = `
    .festive-v2 { --cream: #f5eee4; --ink: #1d1c19; --pink: #ef2867; --green: #485d3b; width: 100%; overflow: hidden; background: var(--cream); color: var(--ink); }
    .festive-v2 main { padding: 8px 3.5% 0; }
    .festive-v2-banner { position: relative; width: 100%; aspect-ratio: 2048 / 865; overflow: hidden; background: #f5eee4; }
    .festive-v2-banner img { object-fit: contain; }
    .festive-v2-banner-mobile { display: none; }
    .festive-v2-breadcrumb { margin: 12px 3% 8px; color: #716b64; font-size: 17px; }
    .festive-v2-breadcrumb span { padding: 0 4px; color: #25221f; }
    .festive-v2-breadcrumb strong { color: #24211e; font-weight: 500; }
    .festive-v2-search { height: 48px; display: flex; align-items: center; gap: 12px; margin: 0 1.5%; padding: 0 22px; border: 1px solid #ef2867; border-radius: 30px; background: transparent; }
    .festive-v2-search svg { width: 25px; height: 25px; stroke-width: 1.2; }
    .festive-v2-search input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--ink); font-size: 16px; }
    .festive-v2-categories { display: flex; gap: 12px; justify-content: center; margin: 20px 0 14px; }
    .festive-v2-categories button { height: 40px; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 0 25px; border: 1px solid #ef2867; border-radius: 24px; background: transparent; color: #27231f; font-size: 14px; }
    .festive-v2-categories button svg { width: 16px; height: 16px; }
    .festive-v2-categories button.is-active { background: var(--pink); color: white; }
    .festive-v2-rail { position: relative; height: 23px; margin: 0 -3.5%; border-top: 2px solid #efbc42; border-bottom: 2px solid #efbc42; }
    .festive-v2-rail img { object-fit: cover; }
    .festive-v2-products { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; padding: 28px 1.5% 16px; background: #fff; }
    .festive-v2-card { min-width: 0; overflow: hidden; background: #fff; }
    .festive-v2-product-card { height: 100%; padding: 0; background: #fff; }
    .festive-v2-product-card .product-card-media { aspect-ratio: 3 / 4; border-radius: 0; }
    .festive-v2-product-card .product-card-copy { padding: 10px 0 5px; }
    .festive-v2-product-card .product-card-title { color: #24211e; font-size: 16px; font-weight: 600; }
    .festive-v2-product-card .product-card-brand { color: #77716c; font-size: 12px; }
    .festive-v2-product-card .product-card-current-price { color: #1f1c19; font-size: 17px; font-weight: 700; }
    .festive-v2-sortbar { display: flex; align-items: center; justify-content: space-between; max-width: 680px; margin: 0 auto; padding: 20px 4% 26px; color: #45563b; font-size: 17px; }
    .festive-v2-sortbar button { display: flex; align-items: center; border: 0; background: transparent; color: inherit; font: inherit; }
    .festive-v2-sortbar svg { width: 18px; margin-right: 10px; }
    .festive-v2-pagination { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 0 0 28px; color: #4b5a42; font-size: 13px; }
    .festive-v2-pagination button { border: 1px solid #d8cdbd; border-radius: 20px; background: transparent; padding: 8px 14px; color: inherit; }
    .festive-v2-pagination button:disabled { cursor: not-allowed; opacity: .45; }
    @media (max-width: 767px) {
        .festive-v2 main { padding: 8px 10px 0; }
        .festive-v2-banner { aspect-ratio: 1.86; }
        .festive-v2-banner-desktop { display: none; }
        .festive-v2-banner-mobile { display: block; }
        .festive-v2-breadcrumb { margin: 12px 10px 8px; font-size: 17px; }
        .festive-v2-search { height: 48px; margin: 0 6px; padding: 0 25px; }
        .festive-v2-categories { justify-content: flex-start; gap: 10px; margin: 20px 10px 24px; overflow-x: auto; scrollbar-width: none; }
        .festive-v2-categories::-webkit-scrollbar { display: none; }
        .festive-v2-categories button { flex: 0 0 auto; height: 40px; padding: 0 21px; font-size: 14px; }
        .festive-v2-rail { height: 22px; margin: 0 -10px; }
        .festive-v2-products { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding: 28px 22px 26px; }
        .festive-v2-product-card .product-card-copy { padding: 9px 0 4px; }
        .festive-v2-product-card .product-card-title { font-size: 15px; }
        .festive-v2-product-card .product-card-current-price { font-size: 16px; }
        .festive-v2-sortbar { padding-top: 20px; font-size: 17px; }
    }
`;
