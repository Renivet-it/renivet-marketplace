import { HeartHandshake, Search, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const CURATION_IMAGE =
    "/assets/how-renivet-curates/artisanal-incense.png";

export const CURATION_DESKTOP_DIMENSIONS = {
    width: 1184,
    height: 591,
} as const;

export const CURATION_IMAGE_DESKTOP_DIMENSIONS = {
    width: 507,
    height: 350,
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
        <section className="w-full bg-[#f8f5ef] px-4 pb-8 sm:px-6 md:pb-10 lg:px-8">
            <div className="mx-auto grid w-full gap-8 rounded-[18px] border border-[#e9e2d8] bg-white px-4 py-6 md:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] md:items-center md:gap-12 md:px-12 md:py-12 lg:h-[591px] lg:w-[1184px] lg:max-w-full lg:grid-cols-[minmax(0,1fr)_507px] lg:gap-10 lg:px-14">
                <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="font-serif text-[23px] font-normal leading-tight text-[#3E2127] md:text-[30px]">
                                How Renivet curates
                            </h2>
                            <p className="mt-2 font-serif text-[17px] italic leading-snug text-[#61333d] md:text-[20px]">
                                More than a marketplace. A movement!
                            </p>
                        </div>
                        <span className="mt-1 shrink-0 rounded-sm bg-[#f4efe8] px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-[#8c8479]">
                            01 / 03
                        </span>
                    </div>

                    <div className="mt-6 space-y-5 md:mt-7 md:space-y-6">
                        {CURATION_STEPS.map((step) => {
                            const Icon = step.icon;

                            return (
                                <div
                                    key={step.title}
                                    className="flex items-start gap-3.5"
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#eadaca] bg-[#fff8ed] text-[#a66e47]">
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4"
                                            strokeWidth={1.5}
                                        />
                                    </span>
                                    <div className="min-w-0 pt-0.5">
                                        <h3 className="font-serif text-[14px] font-medium leading-tight text-[#3E2127] md:text-[15px]">
                                            {step.title}
                                        </h3>
                                        <p className="mt-1 max-w-[430px] text-[10px] leading-[1.45] text-[#77716a] md:text-[11px]">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Link
                        href="/about"
                        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#61333d] px-6 text-[10px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#4d2931] md:mt-8 md:w-fit md:min-w-[270px]"
                    >
                        Explore our curation process
                        <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>

                <div className="relative hidden md:block md:justify-self-end lg:h-[350px] lg:w-[507px]">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] lg:aspect-auto lg:h-full lg:w-full">
                        <Image
                            src={CURATION_IMAGE}
                            alt="Artisanal incense and conscious packaging arranged on a wooden table"
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 507px, 48vw"
                        />
                    </div>
                    <div className="absolute bottom-5 left-5 w-[250px] rounded-[10px] bg-white px-5 py-4 shadow-sm">
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
