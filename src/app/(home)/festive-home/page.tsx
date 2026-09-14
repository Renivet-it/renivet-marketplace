import { FestiveProductCarousel } from "@/components/festive-home/festive-product-carousel";
import { productQueries } from "@/lib/db/queries";
import { userWishlistCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: "A More Conscious Festive Season",
    description:
        "Thoughtfully chosen fashion, home, and beauty for every celebration.",
    alternates: { canonical: "/festive-home" },
};

const assetRoot = "/assets/festive-home";

const getFestiveEditProducts = unstable_cache(
    async () => {
        const festiveSelection =
            await productQueries.getFestiveSeasonProducts();
        const curatedProductIds = Array.from(
            new Set(festiveSelection.map((entry) => entry.productId))
        );
        const festiveProducts = await productQueries.getProducts({
            page: 1,
            limit: Math.max(curatedProductIds.length, 1),
            isAvailable: true,
            isActive: true,
            isPublished: true,
            isDeleted: false,
            verificationStatus: "approved",
            requireMedia: true,
            curatedProductIds,
            curatedDefaultOrder: curatedProductIds,
        });

        return festiveProducts.data;
    },
    ["festive-home-edit-products-v3"],
    { revalidate: 300 }
);

const editorialCards = [
    {
        title: "Festive dressing",
        titleLines: ["Festive", "dressing"],
        copy: "Thoughtfully chosen festive wear.",
        action: "Shop apparel",
        tone: "from-[#572c2a] to-[#b47d6d]",
        image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNm2vhhBZNpGL6AgslOfF3vz5Wa1NUerQXMBIP",
        objectPosition: "center 30%",
    },
    {
        title: "Gifts with a story",
        titleLines: ["Gifts", "with a story"],
        copy: "Made with care, meant to be remembered.",
        action: "Explore gifts",
        tone: "from-[#53624d] to-[#9e8b70]",
        image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNRrXG4iwzxCX9qouDwr5d6fTcizLeZ0I4snJv",
        objectPosition: "center 45%",
    },
    {
        title: "Home for the season",
        titleLines: ["Home", "for the season"],
        copy: "Create warmth around every ritual.",
        action: "Shop home",
        tone: "from-[#3d1714] to-[#7d463d]",
        image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNKP6iPRoXWY4M9GmONJv38rnKquVZUx0pjkQE",
        objectPosition: "center 55%",
    },
];

const brands = [
    "Rasa",
    "Sui",
    "Bare Necessities",
    "The Indian Earth",
    "Mèli",
    "My Mithila",
];
const giftItems = [
    "For her",
    "For him",
    "For home",
    "Under ₹2,000",
    "Host gifts",
];

function ImagePlaceholder({
    label,
    className = "",
    hideLabel = false,
}: {
    label: string;
    className?: string;
    hideLabel?: boolean;
}) {
    return (
        <div
            aria-label={`${label} image placeholder`}
            className={`relative flex items-center justify-center overflow-hidden bg-[#c9b39a] ${className}`}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,246,220,0.45),transparent_42%),linear-gradient(145deg,rgba(83,48,37,0.2),rgba(255,255,255,0.08))]" />
            {hideLabel ? null : (
                <span className="relative rounded-full border border-white/45 bg-[#4f3328]/20 px-4 py-2 text-[9px] uppercase tracking-[0.2em] text-white/80">
                    {label} image placeholder
                </span>
            )}
        </div>
    );
}

function MiniLink({ children }: { children: React.ReactNode }) {
    return (
        <span className="mt-4 inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.18em]">
            {children} <span aria-hidden>→</span>
        </span>
    );
}

export default async function FestiveHomePage() {
    const festiveProductsPromise = getFestiveEditProducts();
    const { userId } = await auth();
    const [festiveProducts, wishlist] = await Promise.all([
        festiveProductsPromise,
        userId ? userWishlistCache.get(userId).catch(() => []) : [],
    ]);

    return (
        <div className="overflow-hidden bg-[#fbf4e7] text-[#3e2b24]">
            <main className="mx-auto w-full max-w-[1600px] bg-[#fbf4e7]">
                <section
                    data-festive-section="hero"
                    className="relative w-full overflow-hidden bg-[#542313]"
                >
                    <h1 className="sr-only">A more conscious festive season</h1>
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNxRLtEs1IezOinSmtdvjDw08UlbRkW2MQqNBX"
                        alt="A more conscious festive season"
                        width={2124}
                        height={740}
                        priority
                        sizes="(min-width: 1600px) 1600px, 100vw"
                        className="hidden h-auto w-full md:block"
                    />
                    <div
                        data-festive-hero-copy="true"
                        className="absolute bottom-0 left-[7.7%] hidden h-[94%] w-[35%] max-w-[530px] flex-col items-center justify-center rounded-t-[48%] border-[4px] border-[#b85609] bg-[#fff8e9] px-[4%] text-center shadow-[0_0_0_2px_rgba(67,27,8,0.55)] md:flex"
                    >
                        <div className="font-serif text-[clamp(32px,4vw,66px)] font-normal leading-[0.95] tracking-[-0.03em] text-[#30221c]">
                            A more
                            <br />
                            <em>conscious</em>
                            <br />
                            festive season
                        </div>
                        <p className="mt-[8%] max-w-[310px] text-[clamp(8px,0.76vw,12px)] leading-relaxed text-[#75675d]">
                            Thoughtfully chosen fashion, home &amp; beauty for
                            every celebration.
                        </p>
                        <Link
                            href="/shop"
                            className="mt-[5%] bg-[#26321c] px-7 py-3 text-[clamp(7px,0.58vw,9px)] font-semibold uppercase tracking-[0.18em] text-white"
                        >
                            Shop the edit&nbsp; →
                        </Link>
                        <p className="mt-[7%] text-[clamp(6px,0.5vw,8px)] uppercase tracking-[0.42em] text-[#6f6258]">
                            People&nbsp; | &nbsp;Planet&nbsp; |
                            &nbsp;Sustainability
                        </p>
                        <Image
                            src={`${assetRoot}/pond-peacock.png`}
                            alt=""
                            width={280}
                            height={100}
                            className="absolute bottom-0 right-[-8%] w-[38%]"
                        />
                    </div>

                    <div
                        data-festive-mobile-cover="true"
                        className="relative md:hidden"
                    >
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNboUTcKuZc50VbmLPHAdU9KwxEkCINyqDWJRr"
                            alt="A more conscious festive season"
                            width={1024}
                            height={1536}
                            priority
                            sizes="100vw"
                            className="block h-auto w-full"
                        />
                        <div className="absolute bottom-[12%] left-[8%] flex h-[55%] w-[53%] flex-col justify-center rounded-t-[48%] border-2 border-[#aa4d09] bg-[#fff8e9]/85 px-4 text-left shadow-[0_0_0_1px_rgba(67,27,8,0.45)] backdrop-blur-[1px]">
                            <div className="font-serif text-[clamp(24px,7.4vw,31px)] leading-[1.05] tracking-[-0.025em] text-[#30221c]">
                                A more
                                <br />
                                <em>conscious</em>
                                <br />
                                festive season
                            </div>
                            <p className="mt-5 text-[9px] leading-[1.45] text-[#4f443c]">
                                Thoughtfully chosen fashion, home &amp; beauty
                                for every celebration.
                            </p>
                            <Link
                                href="/shop"
                                className="mt-4 w-fit bg-[#26321c] px-5 py-3 text-[8px] font-semibold uppercase tracking-[0.12em] text-white"
                            >
                                Shop the edit&nbsp; →
                            </Link>
                            <Image
                                src={`${assetRoot}/pond-peacock.png`}
                                alt=""
                                width={280}
                                height={100}
                                className="absolute bottom-0 right-[-8%] w-[45%]"
                            />
                        </div>
                        <p className="absolute inset-x-[9%] bottom-[5.5%] border-t border-[#f5e5ca]/80 pt-3 text-center text-[7px] uppercase tracking-[0.34em] text-[#fff4df]">
                            People&nbsp; | &nbsp;Planet&nbsp; | &nbsp;Better
                            Choices
                        </p>
                    </div>
                </section>

                <div
                    data-festive-section="editorial-transition"
                    className="relative hidden h-[130px] bg-[#fff9eb] md:block"
                >
                    <Image
                        src={`${assetRoot}/sandstone-arch.png`}
                        alt=""
                        width={180}
                        height={100}
                        className="absolute bottom-0 left-0 w-[170px]"
                    />
                    <Image
                        src={`${assetRoot}/sandstone-arch.png`}
                        alt=""
                        width={180}
                        height={100}
                        className="absolute bottom-0 right-0 w-[170px] -scale-x-100"
                    />
                </div>

                <section
                    data-festive-section="editorial-cards"
                    className="grid gap-5 px-3 pb-10 pt-8 md:gap-6 md:px-8 md:pt-0 lg:grid-cols-3"
                >
                    {editorialCards.map((card) => (
                        <Link
                            href="/shop"
                            key={card.title}
                            className="group relative aspect-[0.94] overflow-hidden md:aspect-[1.75]"
                        >
                            <Image
                                data-festive-editorial-image="true"
                                src={card.image}
                                alt=""
                                fill
                                sizes="(min-width: 1024px) 32vw, calc(100vw - 24px)"
                                className="object-cover"
                                style={{ objectPosition: card.objectPosition }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/5" />
                            <div className="absolute inset-0 flex flex-col justify-end px-6 py-7 text-[#fff8ec] md:justify-center md:px-[7%] md:py-[6%]">
                                <h2 className="max-w-[220px] font-serif text-[26px] leading-[1.08] md:text-[clamp(24px,2vw,32px)]">
                                    {card.titleLines.map((line) => (
                                        <span key={line} className="block">
                                            {line}
                                        </span>
                                    ))}
                                </h2>
                                <p className="mt-4 max-w-[82%] text-[11px] leading-4 text-white/80">
                                    {card.copy}
                                </p>
                                <span className="w-fit border-b border-white/55 pb-2">
                                    <MiniLink>{card.action}</MiniLink>
                                </span>
                            </div>
                        </Link>
                    ))}
                </section>

                <FestiveProductCarousel
                    products={festiveProducts}
                    wishlist={wishlist}
                    userId={userId ?? undefined}
                />

                <section
                    data-festive-section="brand-story"
                    className="grid min-h-[390px] lg:grid-cols-3"
                >
                    <div className="relative min-h-[390px] overflow-hidden bg-[#c48d79]">
                        <Image
                            src={`${assetRoot}/brand-story-women.png`}
                            alt="Woman wearing a pink festive saree"
                            fill
                            sizes="(min-width: 1024px) 33vw, 100vw"
                            className="object-cover"
                        />
                    </div>
                    <div className="flex min-h-[390px] flex-col items-center justify-center bg-[#741f2a] px-12 text-center text-[#fff1dc]">
                        <h2 className="font-serif text-[42px] leading-[0.98]">
                            Celebrate beautifully.
                            <br />
                            <em>Choose thoughtfully.</em>
                        </h2>
                        <p className="mt-6 max-w-[370px] text-[11px] leading-5 text-white/70">
                            At Renivet, we bring you a curated selection of
                            homegrown brands that care—for people, for the
                            planet, and for a brighter tomorrow.
                        </p>
                        <Link
                            href="/about"
                            className="mt-7 border border-white/55 px-7 py-3 text-[9px] uppercase tracking-[0.18em]"
                        >
                            Our story&nbsp; →
                        </Link>
                    </div>
                    <div className="relative min-h-[390px] overflow-hidden bg-[#6e645d]">
                        <Image
                            src={`${assetRoot}/brand-story-men.png`}
                            alt="Man wearing festive everyday menswear"
                            fill
                            sizes="(min-width: 1024px) 33vw, 100vw"
                            className="object-cover grayscale"
                        />
                    </div>
                </section>

                <section data-festive-section="brands" className="px-8 py-9">
                    <div className="mb-7 flex items-end justify-between">
                        <div>
                            <h2 className="font-serif text-[34px] leading-none">
                                Brands worth discovering
                            </h2>
                            <p className="mt-3 text-[10px] text-[#806f60]">
                                Independent brands. Meaningful stories. A kinder
                                tomorrow.
                            </p>
                        </div>
                        <Link
                            href="/brands"
                            className="text-[8px] font-semibold uppercase tracking-[0.16em]"
                        >
                            View all brands&nbsp; →
                        </Link>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-6">
                        {brands.map((brand) => (
                            <Link
                                href="/brands"
                                key={brand}
                                className="flex h-[72px] items-center justify-center border border-[#dfccb0] bg-[#fffaf0] px-3 text-center text-[10px] uppercase tracking-[0.22em]"
                            >
                                {brand}
                            </Link>
                        ))}
                    </div>
                </section>

                <Image
                    src={`${assetRoot}/heritage-rail.png`}
                    alt=""
                    width={1600}
                    height={120}
                    className="h-[82px] w-full object-contain px-8"
                />

                <section
                    data-festive-section="gift-intention"
                    className="px-8 pb-12 pt-5"
                >
                    <h2 className="font-serif text-[34px] leading-none">
                        Gift by intention
                    </h2>
                    <p className="mt-3 text-[10px] text-[#806f60]">
                        Thoughtful curation for everyone on your list.
                    </p>
                    <div className="mt-8 grid gap-5 lg:grid-cols-5">
                        {giftItems.map((item, index) => (
                            <Link
                                href="/shop"
                                key={item}
                                className="group min-w-0"
                            >
                                <ImagePlaceholder
                                    label={`Gift ${index + 1}`}
                                    hideLabel
                                    className="aspect-[1.35] w-full bg-[#d6b893]"
                                />
                                <p className="mt-3 text-[10px] font-medium">
                                    {item} <span aria-hidden>→</span>
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="grid border-y border-[#e2d2b9] bg-[#fffaf0] px-8 py-7 lg:grid-cols-4">
                    {[
                        ["◎", "Curated & Verified", "Conscious brands"],
                        ["♧", "Pan India Delivery", "3–7 working days"],
                        ["▣", "Easy Returns", "Hassle free"],
                        ["☼", "A Kinder Tomorrow", "With every purchase"],
                    ].map(([icon, title, copy]) => (
                        <div
                            key={title}
                            className="flex items-center justify-center gap-4 border-r border-[#e2d2b9] px-5 last:border-0"
                        >
                            <span className="text-xl" aria-hidden>
                                {icon}
                            </span>
                            <div>
                                <p className="text-[9px] font-semibold">
                                    {title}
                                </p>
                                <p className="mt-1 text-[8px] text-[#8a7969]">
                                    {copy}
                                </p>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
