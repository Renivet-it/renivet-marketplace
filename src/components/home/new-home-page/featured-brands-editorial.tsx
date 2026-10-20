import Image from "next/image";

export function FeaturedBrandsEditorial() {
    return (
        <section className="w-full bg-[#FAF7F2] px-5 pb-1 pt-0 md:px-8 md:pb-1 md:pt-0">
            <div className="overflow-hidden md:mx-auto md:max-w-[1184px]">
                <div className="relative mx-5 h-[288px] overflow-hidden rounded-[12px] md:mx-0 md:h-[260px] md:rounded-[20px] md:shadow-[0_18px_36px_rgba(62,33,39,0.14)]">
                    <Image
                        src="/assets/featured-brands-editorial/artisan-hand-weaving-textiles.png"
                        alt="Artisan hand weaving textiles"
                        fill
                        className="object-cover md:hidden"
                        sizes="calc(100vw - 40px)"
                        priority={false}
                    />
                    <Image
                        src="/assets/featured-brands-editorial/artisan-hand-weaving-textiles-desktop.png"
                        alt="Artisan hand weaving textiles"
                        fill
                        className="hidden object-cover md:block"
                        sizes="1184px"
                    />
                    <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[#3E2127]/25 via-transparent to-transparent md:block" />
                    <div className="absolute bottom-4 right-4 rotate-[-5deg] bg-[#FAF7F2] px-5 py-2 font-serif text-[17px] italic leading-tight text-[#3E2127] shadow-sm md:bottom-7 md:left-8 md:right-auto md:rotate-0 md:rounded-[2px] md:border md:border-white/60 md:bg-[#FAF7F2]/95 md:px-7 md:py-4 md:text-[23px] md:shadow-[0_12px_24px_rgba(62,33,39,0.16)]">
                        Crafted
                        <br />
                        for tomorrow.
                    </div>
                </div>
            </div>
        </section>
    );
}
