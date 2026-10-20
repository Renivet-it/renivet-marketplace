import Image from "next/image";
import Link from "next/link";

export const RENIVET_EDIT_CARDS = [
    {
        title: "Everyday Conscious",
        description: "Timeless staples for a brighter tomorrow.",
        image: "/assets/renivet-edit/everyday-conscious.png",
        href: "/shop",
    },
    {
        title: "Festive, Reimagined",
        description: "Celebrate traditions with a lighter footprint.",
        image: "/assets/renivet-edit/festive-reimagined.png",
        href: "/festive",
    },
    {
        title: "Home with Intention",
        description: "Thoughtful pieces for calmer, mindful spaces.",
        image: "/assets/renivet-edit/home-with-intention.png",
        mobileImage: "/assets/renivet-edit/home-with-intention-mobile.png",
        href: "/shop/home-and-living",
    },
] as const;

export const RENIVET_EDIT_DESKTOP_LAYOUT = {
    fullWidth: true,
    imageAspectRatio: "4 / 3",
} as const;

export function RenivetEdit() {
    return (
        <section className="w-full bg-[#f8f5ef] pb-8 pt-2 md:bg-[#FAF7F2] md:py-9 lg:py-10">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
                <div className="mb-5 flex items-end justify-between gap-4 md:mb-7 lg:mb-8">
                    <div>
                        <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-[#827b70] md:text-[9px] lg:text-[12px]">
                            Seasonal curations
                        </p>
                        <h2 className="mt-1 font-serif text-[24px] font-normal leading-tight text-[#302e2b] md:text-[30px] lg:mt-2 lg:text-[34px]">
                            The Renivet Edit
                        </h2>
                    </div>
                    <Link
                        href="/shop"
                        className="mb-1 inline-flex items-center gap-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#302e2b] transition-opacity hover:opacity-60 md:text-[9px] lg:text-[10px]"
                    >
                        See all <span aria-hidden="true">→</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4 lg:gap-6">
                    {RENIVET_EDIT_CARDS.map((card) => (
                        <Link
                            key={card.title}
                            href={card.href}
                            className="group relative flex min-h-[126px] overflow-hidden rounded-[10px] border border-[#dfc6c2] bg-[#FAF7F2] transition-all hover:-translate-y-0.5 md:min-h-0 md:flex-col md:rounded-[14px] md:border-0 md:bg-[#f0e2df] md:shadow-[0_10px_24px_rgba(62,33,39,0.08)] md:hover:shadow-[0_16px_34px_rgba(62,33,39,0.14)] lg:rounded-[16px]"
                        >
                            <div className="flex min-w-0 flex-1 flex-col items-start p-4 pb-2 md:flex-none md:p-5 md:pb-3 lg:p-6 lg:pb-4">
                                <h3 className="max-w-[125px] whitespace-pre-line font-serif text-[16px] leading-[1.15] text-[#302e2b] md:max-w-none md:text-[20px] md:leading-[1.12] lg:text-[23px]">
                                    {card.title.replace(" ", "\n")}
                                </h3>
                                <p className="mt-2 max-w-[160px] text-[9px] leading-[1.35] text-[#827b70] md:max-w-[280px] md:text-[10px] md:leading-[1.45] lg:mt-3 lg:max-w-none lg:text-[12px]">
                                    {card.description}
                                </p>
                            </div>

                            <div className="relative h-[126px] w-[47%] shrink-0 overflow-hidden md:mx-5 md:aspect-[1.5/1] md:h-auto md:w-auto md:rounded-[9px] lg:mx-6 lg:rounded-[11px]">
                                <Image
                                    src={card.image}
                                    alt=""
                                    fill
                                    className={`${card.mobileImage ? "hidden md:block" : "block"} object-cover transition-transform duration-500 group-hover:scale-[1.03]`}
                                    sizes="(max-width: 767px) 47vw, 33vw"
                                />
                                {card.mobileImage ? (
                                    <Image
                                        src={card.mobileImage}
                                        alt=""
                                        fill
                                        className="block object-cover transition-transform duration-500 group-hover:scale-[1.03] md:hidden"
                                        sizes="47vw"
                                    />
                                ) : null}
                            </div>

                            <span className="absolute bottom-3 left-4 flex size-6 items-center justify-center rounded-full bg-[#61333d] text-sm leading-none text-white transition-transform group-hover:translate-x-0.5 md:static md:mb-4 md:ml-5 md:mt-4 md:self-start lg:mb-5 lg:ml-6 lg:mt-4 lg:size-10 lg:text-lg">
                                <span aria-hidden="true">→</span>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
