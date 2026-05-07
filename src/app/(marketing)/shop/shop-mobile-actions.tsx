"use client";

import { ShopSortBy } from "@/components/shop";
import { ReactNode } from "react";

export function ShopMobileActions({ filters }: { filters: ReactNode }) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-[999] border-t border-[#e7dece] bg-[#fffdfa] pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_rgba(45,38,26,0.08)] md:hidden">
            <div className="grid h-14 w-full grid-cols-2">
                {filters}
                <ShopSortBy className="h-full w-full rounded-none border-0 bg-transparent text-[15px] font-semibold text-[#25321d] shadow-none hover:bg-[#faf7f1] active:bg-[#f6f0e7]" />
            </div>
        </div>
    );
}
