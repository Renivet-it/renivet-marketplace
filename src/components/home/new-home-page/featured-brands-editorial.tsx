import Image from "next/image";

export function FeaturedBrandsEditorial() {
    return (
        <section className="w-full bg-[#FAF7F2] px-5 pb-2 pt-0 md:hidden">
            <div className="overflow-hidden">
                <div className="relative mx-5 h-[288px] overflow-hidden rounded-[12px]">
                    <Image
                        src="/assets/featured-brands-editorial/artisan-hand-weaving-textiles.png"
                        alt="Artisan hand weaving textiles"
                        fill
                        className="object-cover"
                        sizes="calc(100vw - 40px)"
                    />
                    <div className="absolute bottom-4 right-4 rotate-[-5deg] bg-[#FAF7F2] px-5 py-2 font-serif text-[17px] italic leading-tight text-[#3E2127] shadow-sm">
                        Crafted
                        <br />
                        for tomorrow.
                    </div>
                </div>
            </div>
        </section>
    );
}
