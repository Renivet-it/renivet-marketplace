import { FooterWithLegal } from "./footer/footer-with-legal";
import { NavbarHome } from "./navbar/navbar-home";
import { NavbarMob } from "./navbar/navbar-mob";

export function StorefrontLoadingShell() {
    return (
        <div className="relative flex min-h-screen flex-col bg-[#fcfcf5]">
            <NavbarHome />
            <main className="flex flex-1 flex-col" aria-busy="true">
                <section className="flex w-full justify-center">
                    <div className="w-full max-w-6xl space-y-4 p-4 py-5 md:p-8 md:py-10 xl:max-w-[110rem]">
                        <div className="mx-auto w-full max-w-2xl space-y-4">
                            <div className="h-10 animate-pulse rounded-xl bg-gray-200" />
                            <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
                            <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
                            <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
                        </div>
                    </div>
                </section>
            </main>
            <FooterWithLegal />
            <NavbarMob />
        </div>
    );
}
