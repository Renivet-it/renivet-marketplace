import Link from "next/link";

export function DiscoverPrompt() {
    return (
        <section className="w-full bg-white py-8 md:py-10">
            <div className="mx-auto flex max-w-screen-3xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div className="max-w-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f7b5a] md:text-[11px]">
                        Discover Mode
                    </span>
                    <h2 className="mt-2 font-playfair text-[28px] font-normal uppercase leading-[1.2] text-gray-900 md:text-[36px]">
                        Pick up where you left off
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 md:text-[15px]">
                        Swipe through a saved discovery feed without interrupting the main homepage flow.
                    </p>
                </div>

                <div className="flex shrink-0">
                    <Link
                        href="/discover"
                        className="inline-flex items-center gap-2 rounded-full border border-[#1f2b24] bg-[#1f2b24] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-transparent hover:text-[#1f2b24]"
                    >
                        Open Discover
                    </Link>
                </div>
            </div>
        </section>
    );
}
