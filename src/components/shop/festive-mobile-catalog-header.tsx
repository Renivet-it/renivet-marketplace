import type { ReactNode } from "react";

interface FestiveMobileCatalogHeaderProps {
    children: ReactNode;
    enabled: boolean;
    topClass?: string;
}

export function FestiveMobileCatalogHeader({
    children,
    enabled,
    topClass = "top-0",
}: FestiveMobileCatalogHeaderProps) {
    if (!enabled) {
        return <div className="block md:hidden">{children}</div>;
    }

    return (
        <div
            className={`sticky inset-x-0 ${topClass} z-40 bg-[#F0EBE2] shadow-[0_6px_18px_rgba(45,38,26,0.1)]`}
        >
            {children}
        </div>
    );
}
