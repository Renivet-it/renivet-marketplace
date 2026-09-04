"use client";

import { ReactNode } from "react";
import { FestiveMobileActionsFrame } from "./festive-mobile-actions-frame";
import { ShopSortByWithDefault } from "./shop-filters";

interface ShopMobileActionsProps {
    filters: ReactNode;
    defaultSortBy?: "price" | "createdAt" | "recommended" | "best-sellers";
    defaultSortOrder?: "asc" | "desc";
    hideRecommendationSorts?: boolean;
    theme?: "festive";
}

export function ShopMobileActions({
    filters,
    defaultSortBy,
    defaultSortOrder,
    hideRecommendationSorts,
    theme,
}: ShopMobileActionsProps) {
    if (theme === "festive") {
        return (
            <div className="fixed inset-x-0 bottom-0 z-50 bg-[#F0EBE2] pb-[max(env(safe-area-inset-bottom),0px)] shadow-[0_-6px_18px_rgba(45,38,26,0.08)] md:hidden">
                <FestiveMobileActionsFrame
                    filters={filters}
                    sort={
                        <ShopSortByWithDefault
                            className="size-full justify-center rounded-none border-0 bg-transparent px-2 text-base font-medium text-[#25321d] shadow-none hover:bg-transparent active:bg-transparent"
                            defaultSortBy={defaultSortBy}
                            defaultSortOrder={defaultSortOrder}
                            hideRecommendationSorts={hideRecommendationSorts}
                        />
                    }
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 border-y border-[#e7dece] bg-[#fffdfa] pb-[max(env(safe-area-inset-bottom),0px)] shadow-[0_-6px_18px_rgba(45,38,26,0.08)] md:hidden">
            <div className="grid h-14 w-full grid-cols-2">
                {filters}
                <ShopSortByWithDefault
                    className="size-full rounded-none border-0 bg-transparent text-[15px] font-semibold text-[#25321d] shadow-none hover:bg-[#faf7f1] active:bg-[#f6f0e7]"
                    defaultSortBy={defaultSortBy}
                    defaultSortOrder={defaultSortOrder}
                    hideRecommendationSorts={hideRecommendationSorts}
                />
            </div>
        </div>
    );
}
