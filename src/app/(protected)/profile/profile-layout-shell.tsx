"use client";

import type { ReactNode } from "react";

export function ProfileLayoutShell({
    navbar,
    footer,
    mobileNav,
    children,
}: {
    navbar: ReactNode;
    footer: ReactNode;
    mobileNav: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col bg-[#f8f7f4]">
            {navbar}
            <main className="flex flex-1 flex-col">{children}</main>
            {footer}
            {mobileNav}
        </div>
    );
}
