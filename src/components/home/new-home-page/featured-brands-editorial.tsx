import Image from "next/image";

export function FeaturedBrandsEditorial() {
    return (
        <section className="w-full bg-[#FAF7F2] px-5 pb-1 pt-0 md:px-0 md:pb-1 md:pt-0">
            <div className="overflow-hidden md:w-full">
                <div className="relative mx-5 h-[288px] overflow-hidden rounded-[12px] md:left-1/2 md:mx-0 md:h-auto md:aspect-[3.4/1] md:w-screen md:-translate-x-1/2 md:rounded-none md:shadow-none">
                    <Image
                        src="/assets/featured-brands-editorial/artisan-hand-weaving-textiles.png"
                        alt="Artisan hand weaving textiles"
                        fill
                        className="object-cover md:hidden"
                        sizes="calc(100vw - 40px)"
                        priority={false}
                    />
                    <Image
                        src="/assets/featured-brands-editorial/crafted-for-tomorrow-desktop.png"
                        alt="A sunset landscape with a woven basket and the words Crafted for Tomorrow"
                        fill
                        className="hidden object-cover md:block"
                        sizes="100vw"
                    />
                    <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[#3E2127]/25 via-transparent to-transparent md:block" />
                    <div className="absolute bottom-4 right-4 rotate-[-5deg] bg-[#FAF7F2] px-5 py-2 font-serif text-[17px] italic leading-tight text-[#3E2127] shadow-sm md:hidden">
                        Crafted
                        <br />
                        for tomorrow.
                    </div>
                </div>
            </div>
        </section>
    );
}
