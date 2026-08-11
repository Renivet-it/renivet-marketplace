"use client";

import { ReactNode } from "react";
import { ShopSortByWithDefault } from "./shop-filters";

interface ShopMobileActionsProps {
    filters: ReactNode;
    defaultSortBy?: "price" | "createdAt" | "recommended" | "best-sellers";
    defaultSortOrder?: "asc" | "desc";
    hideRecommendationSorts?: boolean;
}

export function ShopMobileActions({
    filters,
    defaultSortBy,
    defaultSortOrder,
    hideRecommendationSorts,
}: ShopMobileActionsProps) {
    return (
            <div className="fixed inset-x-0 bottom-[calc(74px+env(safe-area-inset-bottom))] z-30 border-t border-[#e7dece] bg-[#fffdfa]/95 shadow-[0_-6px_18px_rgba(45,38,26,0.08)] backdrop-blur-xl md:hidden">
            <div className="grid h-14 w-full grid-cols-2">
                {filters}
                <ShopSortByWithDefault
                    className="h-full w-full rounded-none border-0 bg-transparent text-[15px] font-semibold text-[#25321d] shadow-none hover:bg-[#faf7f1] active:bg-[#f6f0e7]"
                    defaultSortBy={defaultSortBy}
                    defaultSortOrder={defaultSortOrder}
                    hideRecommendationSorts={hideRecommendationSorts}
                />
            </div>
        </div>
    );
}
