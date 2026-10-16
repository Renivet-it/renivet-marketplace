import { Infinity, Layers3, Sparkles, UserRoundCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const THOUGHTFUL_PRODUCTS_MOBILE_IMAGE =
    "/assets/thoughtful-products/mobile-incense.png";

export const THOUGHTFUL_PRODUCT_BENEFITS = [
    {
        title: "Fairer Making",
        description:
            "People are paid fairly with dignified wages and safe workshops.",
        icon: UserRoundCheck,
    },
    {
        title: "Better Materials",
        description:
            "Natural, recycled, toxin-free and strictly considered raw ingredients.",
        icon: Sparkles,
    },
    {
        title: "Smaller Production",
        description:
            "Crafted in mindful micro-batches. Less waste, more intention.",
        icon: Layers3,
    },
    {
        title: "Made to Last",
        description:
            "Heirloom longevity designed far beyond disposable fleeting trends.",
        icon: Infinity,
    },
] as const;

export function ThoughtfulProducts() {
    return (
        <section className="w-full bg-[#f8f5ef] pb-10 md:px-8 md:py-12">
            <div className="relative aspect-[5/4] w-full overflow-hidden md:hidden">
                <Image
                    src={THOUGHTFUL_PRODUCTS_MOBILE_IMAGE}
                    alt="Handmade incense packaging and burning incense arranged outdoors"
                    fill
                    className="object-cover"
                    sizes="100vw"
                />
            </div>

            <div className="mx-auto w-full px-5 pt-6 md:px-0 md:pt-0">
                <div className="md:text-center">
                    <h2 className="max-w-[270px] font-serif text-[24px] font-normal leading-[1.2] text-[#302e2b] md:mx-auto md:max-w-none md:text-[30px]">
                        Why thoughtful products cost more.
                    </h2>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-[#827b70] md:text-[11px]">
                        Because better things take more care, time, and honesty.
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-6 md:mt-9 md:grid-cols-4 md:gap-4">
                    {THOUGHTFUL_PRODUCT_BENEFITS.map((benefit) => {
                        const Icon = benefit.icon;

                        return (
                            <div
                                key={benefit.title}
                                className="md:flex md:min-h-[150px] md:flex-col md:items-center md:justify-center md:rounded-[12px] md:border md:border-[#e8e0d5] md:bg-[#f5f1e9] md:px-5 md:py-5 md:text-center"
                            >
                                <span className="flex size-8 items-center justify-center rounded-full border border-[#dfd8ce] bg-white text-[#302e2b] md:size-10">
                                    <Icon
                                        aria-hidden="true"
                                        className="size-3.5 md:size-4"
                                        strokeWidth={1.5}
                                    />
                                </span>
                                <h3 className="mt-2.5 font-serif text-[13px] font-medium leading-tight text-[#302e2b] md:text-[14px] md:font-semibold">
                                    {benefit.title}
                                </h3>
                                <p className="mt-1 max-w-[250px] text-[9px] leading-[1.4] text-[#77716a] md:text-[10px]">
                                    {benefit.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-7 md:mt-8 md:flex md:justify-center">
                    <Link
                        href="/about"
                        className="inline-flex h-10 min-w-[140px] items-center justify-center gap-2 rounded-full bg-[#e92368] px-6 text-[9px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#cf1859] md:min-w-[130px]"
                    >
                        Learn more
                        <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
