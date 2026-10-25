import { RewearPickupForm } from "@/components/rewear/rewear-form";
import { RenivetText } from "@/components/svgs";
import { REWEAR_WHATSAPP_URL } from "@/config/rewear";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Rewear",
    description: "Give your wardrobe a new beginning with Rewear by Renivet.",
};
const maroon = "#63303c";
const cream = "#fbf4dc";

function AssetPlaceholder({
    label,
    className = "",
}: {
    label: string;
    className?: string;
}) {
    return (
        <div
            aria-label={`Asset placeholder: ${label}`}
            className={`flex items-center justify-center bg-[#d6d1c5] text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[#766e62] ${className}`}
        >
            <span>{label} — assets will be placed here</span>
        </div>
    );
}

function RewearPhoto({
    src,
    alt,
    className = "",
}: {
    src: string;
    alt: string;
    className?: string;
}) {
    return (
        <div
            className={`relative overflow-hidden border-[6px] border-[#f7f2e4] bg-[#f7f2e4] ${className}`}
        >
            <Image
                src={src}
                alt={alt}
                fill
                sizes="(min-width: 1024px) 178px, 42vw"
                className="object-cover"
            />
        </div>
    );
}

function RewearStepPhoto({
    src,
    alt,
    className = "",
}: {
    src: string;
    alt: string;
    className?: string;
}) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <Image
                src={src}
                alt={alt}
                fill
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="object-cover"
            />
        </div>
    );
}

function WhatsAppCta({
    dark = false,
    children = "Request a pickup",
    className = "",
}: {
    dark?: boolean;
    children?: React.ReactNode;
    className?: string;
}) {
    return (
        <a
            href={REWEAR_WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className={`mt-6 inline-block px-8 py-3 text-[9px] font-bold uppercase tracking-[0.14em] ${dark ? "bg-[#63303c] text-[#fbf4dc]" : "bg-[#d4aa1d] text-[#63303c]"} ${className}`}
        >
            {children} <span className="ml-2">→</span>
        </a>
    );
}

function Ticker() {
    return (
        <div className="rewear-ticker overflow-hidden border-y border-[#b28a17] bg-[#63303c] py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#f8efc7]">
            <div className="rewear-ticker-track flex min-w-max gap-8 whitespace-nowrap">
                {Array.from({ length: 2 }).map((_, index) => (
                    <span key={index}>
                        PICKUP <i className="px-2 text-[#d4aa1d]">✦</i> SORTING{" "}
                        <i className="px-2 text-[#d4aa1d]">✦</i> PROCESSING{" "}
                        <i className="px-2 text-[#d4aa1d]">✦</i> UPCYCLING{" "}
                        <i className="px-2 text-[#d4aa1d]">✦</i> RECYCLING{" "}
                        <i className="px-2 text-[#d4aa1d]">✦</i> KARMA POINTS{" "}
                        <i className="px-2 text-[#d4aa1d]">✦</i> BENGALURU
                    </span>
                ))}
            </div>
        </div>
    );
}

function HeroScallop() {
    return (
        <div
            aria-hidden="true"
            className="relative z-10 hidden h-4 overflow-visible bg-[#d79698] lg:block"
        >
            <div className="absolute inset-x-0 top-0 flex h-7 min-w-max">
                {Array.from({ length: 16 }).map((_, index) => (
                    <Image
                        key={index}
                        src="/assets/rewear/ellipse.png"
                        alt=""
                        width={166}
                        height={29}
                        className="h-7 w-[166px] shrink-0"
                    />
                ))}
            </div>
        </div>
    );
}

const steps = [
    ["SIGN UP FOR A PICKUP", "Fill out our quick form to get started."],
    [
        "TELL US HOW MANY CLOTHES YOU HAVE",
        "Share an approximate count of the clothes you want to give away.",
    ],
    [
        "WE'LL ARRANGE YOUR PICKUP",
        "Our team will contact you to confirm your location and pickup details.",
    ],
    ["LOG IN TO RENIVET", "Visit your account to see how Rewear updates."],
    [
        "SEE WHAT HAPPENS TO YOUR CLOTHES",
        "Find out how many clothes sent for upcycling or recycling are sorted and processed.",
    ],
    [
        "EARN KARMA POINTS",
        "Get Karma Points for eligible clothes and use them to shop on Renivet.",
    ],
] as const;

const stepImages = [
    "/assets/rewear/step-1.png",
    "/assets/rewear/step-2.png",
    "/assets/rewear/step-3.png",
    "/assets/rewear/step-4.png",
    "/assets/rewear/step-5.png",
    "/assets/rewear/step-6.png",
] as const;

export default function RewearPage() {
    return (
        <div
            className="rewear-page font-sans"
            style={{ backgroundColor: cream, color: maroon }}
        >
            <div className="flex h-[52px] items-center justify-between border-b border-[#eadfb9] px-5 text-[8px] font-bold uppercase tracking-[0.16em] sm:h-7 sm:px-9">
                <span className="hidden sm:inline">Bengaluru</span>
                <span className="sm:hidden">
                    <RenivetText
                        aria-label="Renivet"
                        width={96}
                        height={20}
                        fill={maroon}
                    />
                </span>
                <span className="hidden sm:inline">
                    <RenivetText
                        aria-label="Renivet"
                        width={44}
                        height={9}
                        fill={maroon}
                    />
                </span>
                <span className="hidden sm:inline">Serviceable areas</span>
            </div>
            <HeroScallop />
            <section className="rewear-hero relative overflow-hidden bg-[#63303c] text-[#fbf4dc]">
                <span className="absolute right-[12%] top-8 size-2 rounded-full bg-[#c8959c]" />
                <span className="absolute left-[19%] top-[47%] size-2 rounded-full bg-[#f7f2e4]" />
                <span className="absolute bottom-10 left-[27%] size-2 rounded-full bg-[#c8959c]" />
                <span className="absolute bottom-10 right-[14%] size-2 rounded-full bg-[#f7f2e4]" />
                <div className="rewear-hero-inner relative mx-auto grid min-h-0 max-w-[1440px] items-center gap-7 px-6 py-9 sm:min-h-[560px] sm:gap-10 sm:px-12 sm:py-16 lg:min-h-[630px] lg:grid-cols-[1fr_0.95fr] lg:items-start lg:px-[60px] lg:pt-[84px]">
                    <div className="rewear-hero-copy max-w-xl">
                        <p className="rewear-hero-kicker text-[9px] font-bold uppercase tracking-[0.2em] text-[#d4aa1d]">
                            Introducing Renivet Rewear
                        </p>
                        <h1 className="rewear-hero-title mt-4 max-w-[11ch] font-sans text-[2.85rem] leading-[0.9] tracking-[-0.035em] sm:mt-5 sm:text-7xl">
                            Make space for new beginnings.
                        </h1>
                        <p className="rewear-hero-subtitle mt-5 max-w-md font-sans text-sm italic leading-6 text-[#d9a0a0]">
                            This Diwali, start with your wardrobe.
                        </p>
                        <p className="rewear-hero-body mt-3 max-w-md text-xs leading-5 text-[#f4e9d3]/90">
                            <span className="sm:hidden">
                                Give your unworn clothes a next chapter with
                                Renivet. We&apos;ll arrange pickup for eligible
                                garments in Bengaluru, track their journey
                                through sorting and processing, and reward you
                                with Karma Points to shop on Renivet.
                            </span>
                            <span className="hidden sm:inline">
                                Give your old clothes a new chapter. Get
                                eligible garments picked up in Bengaluru,
                                track their journey, and earn Karma Points to
                                shop on Renivet.
                            </span>
                        </p>
                        <WhatsAppCta className="rewear-hero-cta" />
                        <div className="rewear-hero-badges mt-8 flex flex-wrap gap-3">
                            {[
                                ["Upcycling", "#d4aa1d", maroon],
                                ["Recycling", "#d9c9bd", maroon],
                                ["Karma points", cream, maroon],
                            ].map(([label, background, color]) => (
                                <span
                                    key={label}
                                    className="rounded-full px-4 py-2 text-[8px] font-bold uppercase tracking-[0.12em]"
                                    style={{
                                        backgroundColor: background,
                                        color,
                                    }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="rewear-hero-gallery grid w-full grid-cols-2 gap-4 justify-self-center sm:gap-7 lg:absolute lg:left-[calc(50%+124px)] lg:top-[90px] lg:w-[455px] lg:max-w-none lg:grid-cols-[178px_178px] lg:gap-x-[99px] lg:gap-y-[65px]">
                        {[
                            ["/assets/rewear/clothes.png", "Folded clothes"],
                            ["/assets/rewear/pickup.png", "Rewear pickup"],
                            [
                                "/assets/rewear/sorting.png",
                                "Clothes being sorted",
                            ],
                            ["/assets/rewear/karma.png", "Karma points gift"],
                        ].map(([src, alt], index) => (
                            <RewearPhoto
                                key={src}
                                src={src}
                                alt={alt}
                                className={`${index > 1 ? "hidden sm:block" : "block"} aspect-square lg:aspect-auto lg:h-[197px] lg:w-[178px] lg:border-[10px] lg:border-b-[30px] ${index === 0 ? "lg:translate-y-[22px]" : index === 2 ? "lg:translate-x-[9px] lg:translate-y-[11px]" : index === 3 ? "lg:-translate-x-[40px]" : ""}`}
                            />
                        ))}
                    </div>
                </div>
                <a
                    href="#pickup-form"
                    aria-label="Go to pickup form"
                    className="rewear-hero-arrow absolute bottom-2 left-1/2 text-3xl leading-none text-[#d4aa1d]"
                >
                    ↓
                </a>
            </section>
            <section className="rewear-next-section px-6 text-center">
                <p className="rewear-next-kicker italic text-[#b77b72]">
                    Simple to start.
                </p>
                <h2 className="rewear-next-title font-extrabold uppercase tracking-[-0.05em]">
                    Clear about
                    <br />
                    what happens next.
                </h2>
                <p className="rewear-next-copy mx-auto text-[#765c5e]">
                    Give your unworn clothes a next chapter with Renivet.
                    We&apos;ll arrange pickup for eligible garments in
                    Bengaluru, track their journey through sorting and
                    processing, and reward you with Karma Points to shop on
                    Renivet.
                </p>
                <WhatsAppCta dark className="rewear-next-cta" />
                <p className="rewear-next-availability font-bold uppercase tracking-[0.12em] text-[#8c7770]">
                    <span className="mr-2 text-[#d4aa1d]">■</span> Currently
                    available in Bengaluru.
                </p>
            </section>
            <Ticker />
            <section className="rewear-about-section">
                <div className="rewear-about-media">
                    <Image
                        src="/assets/rewear/about-chair.png"
                        alt="A chair with clothes ready for a new purpose"
                        fill
                        sizes="(min-width: 1024px) 43vw, 100vw"
                        className="rewear-about-image rewear-about-chair"
                    />
                    <Image
                        src="/assets/rewear/about-clothes.png"
                        alt="Folded and worn clothes ready to be reused"
                        fill
                        sizes="(min-width: 1024px) 43vw, 100vw"
                        className="rewear-about-image rewear-about-clothes"
                    />
                </div>
                <div className="rewear-about-copy bg-[#63303c] text-[#fbf4dc]">
                    <p className="rewear-about-eyebrow italic text-[#d4aa1d]">
                        a new purpose
                    </p>
                    <h2 className="rewear-about-title font-extrabold uppercase">
                        What Renivet
                        <br />
                        Rewear is
                    </h2>
                    <p className="rewear-about-body text-[#f4e9d3]/90">
                        Renivet Rewear is our initiative to help you declutter
                        your wardrobe and give eligible garments a new purpose.
                        We collect your clothes, coordinate their sorting and
                        processing, and make the verified outcomes visible to
                        you.
                    </p>
                    <a
                        href="#how-it-works"
                        className="rewear-about-button border border-[#fbf4dc] font-bold uppercase tracking-[0.12em] text-[#fbf4dc]"
                    >
                        See how it works <span className="ml-2">→</span>
                    </a>
                </div>
            </section>
            <section id="how-it-works" className="px-6 py-20 sm:px-12 lg:px-20">
                <div className="mx-auto">
                    <p className="text-2xl italic text-[#b77b72] sm:text-3xl">
                        6 simple steps
                    </p>
                    <h2 className="rewear-display-font mt-1 text-[clamp(2.2rem,8.9vw,3.25rem)] uppercase leading-[0.92] tracking-[-0.035em] sm:text-7xl">
                        How it works
                    </h2>
                    <p className="mt-4 max-w-sm text-xs leading-5 text-[#765c5e] sm:text-sm sm:leading-6">
                        6 simple steps to a clutter-free wardrobe this Diwali.
                    </p>
                    <div className="relative mx-auto mt-10 grid w-full max-w-[1648px] gap-[clamp(12px,3.76vw,22px)] md:mt-12 md:grid-cols-2 md:items-center md:gap-x-[169px] md:gap-y-8">
                        <div className="absolute bottom-0 left-[clamp(16px,4.96vw,29px)] top-0 w-px bg-[#63303c] md:left-1/2 md:-translate-x-1/2" />
                        {steps.map(([title, copy], index) => {
                            const even = index % 2 === 0;
                            return (
                                <article
                                    key={title}
                                    className="relative grid gap-3 pl-[clamp(42px,13.33vw,78px)] md:col-span-2 md:grid-cols-2 md:items-center md:gap-x-[169px] md:gap-y-5 md:pl-0"
                                >
                                    <div
                                        className={`${even ? "md:col-start-1 md:min-h-[190px] md:pr-10 md:text-right" : "md:col-start-2 md:min-h-[225px] md:pl-10 md:text-left"} relative row-start-1 flex h-[clamp(116px,29.74vw,174px)] w-[clamp(290px,74.36vw,435px)] min-h-0 flex-col justify-start border-2 border-[#63303c] bg-[#fffaf0] px-[clamp(16px,5.13vw,30px)] pb-5 pt-[clamp(28px,4.8vw,28px)] md:h-auto md:w-auto md:justify-center md:px-5 md:py-5`}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`absolute left-5 top-3 h-[3px] w-9 bg-[#d4aa1d] md:top-7 md:h-1 md:w-16 ${even ? "md:left-auto md:right-7" : "md:left-7"}`}
                                        />
                                        <h3 className="rewear-display-font text-[clamp(14px,3.8vw,23px)] uppercase leading-[0.95] tracking-[-0.015em] md:text-2xl">
                                            {title}
                                        </h3>
                                        <p className="mt-2 max-w-[600px] text-[clamp(12px,2.75vw,18px)] leading-[1.45] text-[#765c5e] md:text-lg md:leading-7">
                                            {copy}
                                        </p>
                                    </div>
                                    <RewearStepPhoto
                                        src={stepImages[index]}
                                        alt={`Rewear step ${index + 1}: ${title}`}
                                        className={`${even ? "md:col-start-2 md:order-2 md:justify-self-start" : "md:col-start-1 md:order-1 md:justify-self-end"} row-start-1 hidden h-[220px] w-[300px] sm:block`}
                                    />
                                    <span className="absolute left-0 top-1/2 z-10 flex size-[clamp(32px,10.25vw,60px)] -translate-y-1/2 items-center justify-center border border-[#8e7321] bg-[#d4aa1d] text-[clamp(12px,2.75vw,18px)] font-bold md:left-1/2 md:size-20 md:-translate-x-1/2 md:text-2xl">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>
            <section
                id="pickup-form"
                className="border-t border-[#eadfb9] px-5 py-20 sm:px-10 lg:px-14 lg:py-24"
            >
                <div className="mx-auto max-w-[1388px]">
                    <p className="text-2xl italic text-[#b77b72] sm:text-3xl">
                        right here on this page
                    </p>
                    <h2 className="mt-3 max-w-[480px] text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.05em] sm:text-7xl">
                        Request your
                        <br />
                        Rewear pickup
                    </h2>
                    <p className="mt-5 max-w-[720px] text-base leading-7 text-[#756f64]">
                        Tell us a little about yourself and your clothes. Our
                        team will get in touch with the next steps.
                    </p>
                    <div className="mt-8 overflow-hidden border-2 border-[#63303c]">
                        <div className="flex min-h-[68px] items-center justify-between bg-[#63303c] px-8 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[#fbf4dc] sm:px-9">
                            <span className="text-lg text-[#d4aa1d]">
                                Pickup request
                            </span>
                            <span className="hidden sm:inline">
                                Bengaluru · Serviceable areas
                            </span>
                        </div>
                        <RewearPickupForm />
                    </div>
                </div>
            </section>
            <div className="h-9 bg-[repeating-linear-gradient(90deg,#d4aa1d_0_24px,transparent_24px_47px)]" />
            <section className="px-6 pb-16 pt-16 sm:px-12 sm:pb-20 sm:pt-20 lg:px-[65px] lg:pb-[70px] lg:pt-[92px]">
                <div className="mx-auto max-w-[1388px] border-b border-[#63303c] pb-8">
                    <p className="text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.05em] sm:text-[68px]">
                        You clear your closet.
                    </p>
                    <h2 className="mt-4 max-w-none text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.05em] text-[#a96460] sm:text-[68px]">
                        We help your clothes find their next chapter.
                    </h2>
                    <p className="mt-5 max-w-[980px] text-xl italic leading-[1.65] text-[#765c5e] sm:text-[22px]">
                        Your wardrobe&apos;s next chapter starts here. Make
                        space before Diwali. We&apos;ll help you take it from
                        there.
                    </p>
                    <WhatsAppCta className="mt-5 w-full max-w-[306px] py-4 text-center">
                        Start your closet detox
                    </WhatsAppCta>
                </div>
                <p className="mx-auto mt-5 max-w-[1388px] text-xs text-[#8c7770]">
                    Currently available in serviceable areas of Bengaluru.
                    Garment eligibility and rewards are subject to programme
                    terms.
                </p>
            </section>
        </div>
    );
}
