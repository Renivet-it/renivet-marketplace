"use client";

import type { ReactNode } from "react";

export function ProfileLayoutShell({
    navbar,
    footer,
    mobileNav,
    bottomNav,
    children,
}: {
    navbar: ReactNode;
    footer: ReactNode;
    mobileNav: ReactNode;
    bottomNav?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col bg-[#f8f7f4]">
            {navbar}
            <main className="flex flex-1 flex-col pb-[calc(74px+env(safe-area-inset-bottom))] md:pb-0">
                {children}
            </main>
            {footer}
            {mobileNav}
            {bottomNav}
        </div>
    );
}
