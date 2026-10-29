import Image from "next/image";
import Link from "next/link";

const steps = [
    {
        number: "01",
        label: "Declutter",
        image: "/assets/rewear/home-declutter.png",
    },
    {
        number: "02",
        label: "Track",
        image: "/assets/rewear/home-track.png",
    },
    {
        number: "03",
        label: "Earn Karma",
        image: "/assets/rewear/home-earn-karma.png",
    },
];

export function RewearMobileCta() {
    return (
        <section
            aria-label="Explore ReWear"
            className="w-full px-[10px] py-3 md:hidden"
        >
            <Link
                href="/rewear"
                aria-label="Explore ReWear with Renivet"
                className="relative isolate flex aspect-[2.62/1] min-h-[132px] w-full items-center overflow-hidden rounded-[24px] border border-[#e7dcc3] bg-[#f8f2df] p-[10px] shadow-[0_2px_7px_rgba(78,61,34,0.05)]"
            >
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-[5px] rounded-[19px] border border-[#eee6d1]"
                />

                <div className="relative aspect-square w-[31%] max-w-[250px] shrink-0 rounded-full border-[1.5px] border-[#d0a51b] p-[3px]">
                    <span
                        aria-hidden="true"
                        className="absolute -top-[3px] left-[49%] z-10 size-[7px] rotate-45 border-r-[2px] border-t-[2px] border-[#d0a51b] bg-[#f8f2df]"
                    />
                    <div className="relative size-full overflow-hidden rounded-full bg-white p-[3px]">
                        <Image
                            src="/assets/rewear/home-clothes.png"
                            alt="Folded clothes ready for ReWear"
                            fill
                            sizes="(max-width: 768px) 31vw, 250px"
                            className="object-contain"
                        />
                    </div>
                </div>

                <div className="relative z-10 ml-[4%] grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto_1fr] items-center">
                    <span className="mb-[2px] h-[2px] w-[clamp(18px,3.4vw,34px)] rounded-full bg-[#d0a51b]" />
                    <span className="col-start-2 row-span-2 row-start-1 ml-1 grid size-[clamp(38px,8.7vw,82px)] place-items-center rounded-full border border-[#dfd4bd] p-[5px]">
                        <Image
                            src="/assets/rewear/home-cta-arrow.png"
                            alt=""
                            width={132}
                            height={132}
                            className="size-full object-contain"
                        />
                    </span>

                    <div className="col-start-1 row-start-2 min-w-0">
                        <h2 className="font-sans text-[clamp(17px,4.8vw,42px)] font-semibold leading-[0.98] tracking-[-0.045em] text-[#302d27]">
                            Rewear with Renivet
                        </h2>
                        <p className="mt-1 font-sans text-[clamp(8px,1.65vw,16px)] italic leading-tight text-[#8e887a]">
                            Give your clothes a next chapter.
                        </p>
                    </div>

                    <div className="relative col-start-1 row-start-3 mt-[clamp(6px,1.8vw,18px)] grid grid-cols-3 items-start text-center">
                        <span
                            aria-hidden="true"
                            className="absolute inset-x-[6%] bottom-[2px] h-px bg-[#d5ac27]"
                        />
                        <span
                            aria-hidden="true"
                            className="absolute bottom-0 left-[16.66%] size-[6px] -translate-x-1/2 rotate-45 bg-[#d5ac27]"
                        />
                        <span
                            aria-hidden="true"
                            className="absolute bottom-0 left-1/2 size-[6px] -translate-x-1/2 rotate-45 bg-[#d5ac27]"
                        />
                        <span
                            aria-hidden="true"
                            className="absolute bottom-0 left-[83.33%] size-[6px] -translate-x-1/2 rotate-45 bg-[#d5ac27]"
                        />
                        {steps.map((step) => (
                            <span
                                key={step.number}
                                className="relative z-10 flex min-w-0 flex-col items-center pb-[clamp(5px,1.2vw,12px)]"
                            >
                                <Image
                                    src={step.image}
                                    alt=""
                                    width={150}
                                    height={150}
                                    className="size-[clamp(28px,7.4vw,70px)] object-contain"
                                />
                                <span className="mt-[2px] font-sans text-[clamp(8px,1.5vw,14px)] font-semibold leading-none text-[#c77f78]">
                                    {step.number}
                                </span>
                                <span className="mt-[2px] whitespace-nowrap font-sans text-[clamp(7px,1.35vw,13px)] leading-none text-[#37352f]">
                                    {step.label}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </Link>
        </section>
    );
}
