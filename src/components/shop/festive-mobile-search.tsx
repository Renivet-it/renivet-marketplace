import Image from "next/image";
import type { ReactNode } from "react";

export function FestiveMobileSearch({ children }: { children: ReactNode }) {
    return (
        <div className="flex w-full flex-col items-center">
            <Image
                data-festive-search-lotus="true"
                src="/assets/festive-season/festive-mobile-actions-lotus.svg"
                alt=""
                aria-hidden="true"
                width={28}
                height={32}
                className="mb-2 h-8 w-7 self-end object-contain"
            />
            <div className="w-full">{children}</div>
        </div>
    );
}
