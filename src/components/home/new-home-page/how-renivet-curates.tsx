import { HeartHandshake, Search, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const CURATION_IMAGE =
    "/assets/how-renivet-curates/handmade-packaging-desktop.png";

export const CURATION_DESKTOP_DIMENSIONS = {
    width: 1360,
    height: 591,
} as const;

export const CURATION_IMAGE_DESKTOP_DIMENSIONS = {
    width: 656,
    height: 410,
} as const;

export const CURATION_STEPS = [
    {
        title: "We know the brands",
        description:
            "We partner only with verified, purpose-led Indian homegrown brands that prioritise integrity over mass yield.",
        icon: ShieldCheck,
    },
    {
        title: "We look closer",
        description:
            "Every product is evaluated strictly for materials, ethical making, artisan livelihoods, and environmental impact.",
        icon: Search,
    },
    {
        title: "We choose better together",
        description:
            "Thoughtful everyday products that make life easier for people and gentler for our planet.",
        icon: HeartHandshake,
    },
] as const;

export function HowRenivetCurates() {
    return (
        <section className="w-full bg-[#f8f5ef] px-4 pb-2 sm:px-6 md:bg-[#FAF7F2] md:pb-2 lg:px-8">
            <div className="mx-auto grid w-full gap-8 rounded-[18px] border border-[#e9e2d8] bg-white px-4 py-6 md:grid-cols-2 md:items-center md:gap-8 md:border-[#e9d7d3] md:bg-[#f5ebe7] md:px-12 md:py-12 lg:min-h-[520px] lg:w-[1360px] lg:max-w-full lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-14 lg:py-10">
                <div className="min-w-0">
                    <div>
                        <h2 className="font-serif text-[23px] font-normal leading-tight text-[#3E2127] md:text-[32px] md:leading-[1.08]">
                            How Renivet curates
                        </h2>
                        <p className="mt-2 font-serif text-[17px] italic leading-snug text-[#61333d] md:max-w-[390px] md:text-[19px]">
                            More than a marketplace. A movement!
                        </p>
                    </div>

                    <div className="mt-6 space-y-5 md:mt-8 md:space-y-5">
                        {CURATION_STEPS.map((step) => {
                            const Icon = step.icon;

                            return (
                                <div
                                    key={step.title}
                                    className="flex items-start gap-3.5"
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#eadaca] bg-[#fff8ed] text-[#a66e47] md:size-11 md:border-[#d9b9ad] md:bg-[#FAF7F2] md:text-[#8f5d4b] md:shadow-sm">
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4"
                                            strokeWidth={1.5}
                                        />
                                    </span>
                                    <div className="min-w-0 pt-0.5">
                                        <h3 className="font-serif text-[14px] font-medium leading-tight text-[#3E2127] md:text-[16px]">
                                            {step.title}
                                        </h3>
                                        <p className="mt-1 max-w-[430px] text-[10px] leading-[1.45] text-[#77716a] md:text-[11px] md:leading-[1.5]">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Link
                        href="/about"
                        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#61333d] px-6 text-[10px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#4d2931] md:mt-8 md:h-12 md:w-fit md:min-w-[270px] md:tracking-[0.06em] md:shadow-[0_8px_18px_rgba(97,51,61,0.18)]"
                    >
                        Explore our curation process
                        <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>

                <div className="relative hidden w-full md:block">
                    <div className="relative aspect-[8/5] w-full overflow-hidden rounded-[12px] md:shadow-[0_16px_30px_rgba(62,33,39,0.14)]">
                        <Image
                            src={CURATION_IMAGE}
                            alt="Hands stamping a handmade fabric package beside natural craft materials"
                            fill
                            className="object-cover"
                            sizes="(min-width: 1424px) 656px, (min-width: 1024px) calc((100vw - 232px) * 0.55), 48vw"
                        />
                    </div>
                    <div className="absolute bottom-5 left-5 w-[250px] rounded-[10px] bg-white px-5 py-4 shadow-sm md:border md:border-[#e9d7d3] md:bg-[#FAF7F2] md:shadow-[0_12px_24px_rgba(62,33,39,0.12)]">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.04em] text-[#61333d]">
                            <span aria-hidden="true" className="mr-1.5">
                                &#10024;
                            </span>
                            Thoughtful promise
                        </p>
                        <p className="mt-1 font-serif text-[11px] italic leading-snug text-[#4a4540]">
                            We&apos;ll help you find products that feel good to
                            bring home.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
