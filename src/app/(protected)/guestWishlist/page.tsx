import {
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { FooterWithLegal } from "@/components/globals/layouts/footer/footer-with-legal";
import GuestWishlistClient from "./guest-wishlist-client";

function StaticLegalFooter() {
    return (
        <footer className="border-t bg-white px-4 py-8 text-sm text-muted-foreground">
            <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2">
                <a href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                </a>
                <a href="/terms" className="hover:text-foreground">
                    Terms of Services
                </a>
                <a href="/contact" className="hover:text-foreground">
                    Contact
                </a>
            </div>
        </footer>
    );
}

export default async function GuestWishlistPage() {
    let footer: React.ReactNode;
    try {
        footer = await FooterWithLegal({});
    } catch {
        footer = <StaticLegalFooter />;
    }

    return (
        <div className="relative flex min-h-screen flex-col bg-[#fcfcf5]">
            <NavbarHome />
            <main className="flex flex-1 flex-col">
                <GeneralShell>
                    <GuestWishlistClient />
                </GeneralShell>
            </main>
            {footer}
            <NavbarMob />
        </div>
    );
}
