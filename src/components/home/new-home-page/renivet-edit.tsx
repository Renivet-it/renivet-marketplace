import Image from "next/image";
import Link from "next/link";

export const RENIVET_EDIT_CARDS = [
    {
        title: "Everyday Conscious",
        description: "Timeless staples for a brighter tomorrow.",
        image: "/assets/renivet-edit/everyday-conscious.png",
        href: "/home-living",
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
        href: "/home-living",
    },
] as const;

export const RENIVET_EDIT_DESKTOP_LAYOUT = {
    fullWidth: true,
    imageAspectRatio: "4 / 3",
} as const;

export function RenivetEdit() {
    return (
        <section className="w-full bg-[#f8f5ef] py-8 md:py-10 lg:py-14">
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
                <div className="mb-5 flex items-end justify-between gap-4 md:mb-6 lg:mb-10">
                    <div>
                        <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-[#827b70] md:text-[9px] lg:text-[12px]">
                            Seasonal curations
                        </p>
                        <h2 className="mt-1 font-serif text-[24px] font-normal leading-tight text-[#302e2b] md:text-[28px] lg:mt-2 lg:text-[38px]">
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
                            className="group relative flex min-h-[126px] overflow-hidden rounded-[10px] border border-[#ebe3d4] bg-[#f6efe3] transition-transform hover:-translate-y-0.5 md:min-h-0 md:flex-col lg:rounded-[14px]"
                        >
                            <div className="flex min-w-0 flex-1 flex-col items-start p-4 pb-2 md:flex-none md:p-4 md:pb-3 lg:p-7 lg:pb-5">
                                <h3 className="max-w-[125px] whitespace-pre-line font-serif text-[16px] leading-[1.15] text-[#302e2b] md:max-w-none md:text-[17px] lg:text-[25px]">
                                    {card.title.replace(" ", "\n")}
                                </h3>
                                <p className="mt-2 max-w-[160px] text-[9px] leading-[1.35] text-[#827b70] md:text-[9px] lg:mt-4 lg:max-w-none lg:text-[13px]">
                                    {card.description}
                                </p>
                            </div>

                            <div className="relative h-[126px] w-[47%] shrink-0 overflow-hidden md:mx-4 md:aspect-[4/3] md:h-auto md:w-auto md:rounded-[7px] lg:mx-7 lg:rounded-[10px]">
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

                            <span className="absolute bottom-3 left-4 flex size-6 items-center justify-center rounded-full bg-[#e92368] text-sm leading-none text-white transition-transform group-hover:translate-x-0.5 md:static md:mb-3 md:ml-4 md:mt-3 md:self-start lg:mb-6 lg:ml-7 lg:mt-5 lg:size-11 lg:text-xl">
                                <span aria-hidden="true">→</span>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
