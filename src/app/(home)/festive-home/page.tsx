import { FestiveBrandShowcase } from "@/components/festive-home/festive-brand-showcase";
import { FestiveProductCarousel } from "@/components/festive-home/festive-product-carousel";
import { buildFestiveCatalogOrdering } from "@/lib/catalog/merchandising";
import { productQueries } from "@/lib/db/queries";
import {
    brandCache,
    categoryCache,
    subCategoryCache,
    userWishlistCache,
} from "@/lib/redis/methods";
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
        const [festiveSelection, categories, subCategories] = await Promise.all(
            [
                productQueries.getFestiveSeasonProducts(),
                categoryCache.getAll(),
                subCategoryCache.getAll(),
            ]
        );
        const { curatedProductIds, curatedDefaultOrder } =
            buildFestiveCatalogOrdering(
                festiveSelection,
                categories,
                subCategories
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
            curatedDefaultOrder,
        });

        return festiveProducts.data;
    },
    ["festive-home-edit-products-v5"],
    { revalidate: 300 }
);

const editorialCards = [
    {
        title: "Festive dressing",
        titleLines: ["Festive", "dressing"],
        copy: "Thoughtfully chosen festive wear.",
        action: "Shop apparel",
        href: "/festive?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1",
        tone: "from-[#572c2a] to-[#b47d6d]",
        image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQwOnMhg0rgXZuWwadPABUqnljV5RbJMFsx1",
        desktopImage: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN91LVBGPkHuXil56hen8kSx4MtRwUbOEyZdap",
        objectPosition: "center 30%",
        overlay: "from-black/50 via-black/10 to-transparent",
    },
    {
        title: "Gifts with a story",
        titleLines: ["Gifts", "with a story"],
        copy: "Made with care, meant to be remembered.",
        action: "Explore gifts",
        href: "/festive?subCategoryId=72d7d263-fde3-4e70-9544-afbd5b24294b",
        tone: "from-[#53624d] to-[#9e8b70]",
        image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNoMBQif0WvnGEidmOVIP6xXt4S7befYUykMJq",
        desktopImage: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQbYcggYvbyYEoZ78eJzNIKWdcxq1Of9wlHtA",
        objectPosition: "center 45%",
        overlay: "from-black/70 via-black/15 to-black/5",
    },
    {
        title: "Home for the season",
        titleLines: ["Home", "for the season"],
        copy: "Create warmth around every ritual.",
        action: "Shop home",
        href: "/festive?subCategoryId=cd98e50e-02d6-4bc4-bc1e-7b0ba5b6dd0e",
        tone: "from-[#3d1714] to-[#7d463d]",
        image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzN2dYwWpMQOYTpvrXwqtZHon4P85jVxyMmDkf3",
        desktopImage: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtjOiPoRj63QywZkxrW40qSphaIEcmUdXDAVl",
        objectPosition: "center 55%",
        overlay: "from-black/50 via-black/10 to-transparent",
    },
] as const;

const giftItems = [
    {
        label: "For her",
        image: "gift-for-her.png",
        href: "/festive?categoryId=16d40bb3-3061-4790-b9b7-253cb078dfe1",
    },
    {
        label: "For him",
        image: "gift-for-him.png",
        href: "/festive?categoryId=0b7046fc-6962-4469-81c2-412ed6949c02",
    },
    {
        label: "For home",
        image: "gift-for-home.png",
        href: "/festive?categoryId=173e1e71-e298-4301-b542-caa29d3950bf",
    },
    {
        label: "Under ₹2,000",
        image: "gift-under-2000.png",
        href: "/festive?maxPrice=2000",
    },
    {
        label: "Host gifts",
        image: "gift-host.png",
        href: "/festive?subCategoryId=72d7d263-fde3-4e70-9544-afbd5b24294b",
    },
] as const;

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
    const festiveBrandsPromise = brandCache
        .getAll()
        .then((brands) =>
            brands
                .filter((brand) => brand.isActive)
                .map(({ id, name, slug, logoUrl }) => ({
                    id,
                    name,
                    slug,
                    logoUrl: logoUrl || null,
                }))
                .sort((left, right) =>
                    left.name.localeCompare(right.name, "en", {
                        sensitivity: "base",
                    })
                )
        )
        .catch(() => []);
    const { userId } = await auth();
    const [festiveProducts, festiveBrands, wishlist] = await Promise.all([
        festiveProductsPromise,
        festiveBrandsPromise,
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
                        className="absolute bottom-0 left-[7.7%] hidden h-[94%] w-[35%] max-w-[530px] flex-col items-center justify-center px-[4%] text-center md:flex"
                    >
                        <Image
                            src={`${assetRoot}/hero-shape-desktop.svg`}
                            alt=""
                            fill
                            sizes="(min-width: 1600px) 530px, 35vw"
                            data-festive-hero-shape="desktop"
                            className="pointer-events-none object-fill"
                            aria-hidden
                        />
                        <div className="relative font-serif text-[clamp(32px,4vw,66px)] font-normal leading-[0.95] tracking-[-0.03em] text-[#30221c]">
                            A more
                            <br />
                            <em>conscious</em>
                            <br />
                            festive season
                        </div>
                        <p className="relative mt-[8%] max-w-[310px] text-[clamp(8px,0.76vw,12px)] leading-relaxed text-[#75675d]">
                            Thoughtfully chosen fashion, home &amp; beauty for
                            every celebration.
                        </p>
                        <Link
                            href="/festive"
                            data-festive-hero-cta="true"
                            className="relative mt-[5%] bg-[#26321c] px-7 py-3 text-[clamp(7px,0.58vw,9px)] font-semibold uppercase tracking-[0.18em] text-white"
                        >
                            Shop the edit&nbsp; →
                        </Link>
                        <p className="relative mt-[7%] text-[clamp(6px,0.5vw,8px)] uppercase tracking-[0.42em] text-[#6f6258]">
                            People&nbsp; | &nbsp;Planet&nbsp; |
                            &nbsp;Sustainability
                        </p>
                        <Image
                            src={`${assetRoot}/pond-peacock.png`}
                            alt=""
                            width={280}
                            height={100}
                            className="absolute bottom-0 right-[-8%] z-10 w-[38%]"
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
                        <div className="absolute bottom-[12%] left-[8%] flex h-[55%] w-[53%] flex-col items-center justify-center px-4 text-center">
                            <Image
                                src={`${assetRoot}/hero-shape-mobile.svg`}
                                alt=""
                                fill
                                sizes="53vw"
                                data-festive-hero-shape="mobile"
                                className="pointer-events-none object-fill"
                                aria-hidden
                            />
                            <div className="relative font-serif text-[clamp(24px,7.4vw,31px)] leading-[1.05] tracking-[-0.025em] text-[#30221c]">
                                A more
                                <br />
                                <em>conscious</em>
                                <br />
                                festive season
                            </div>
                            <p className="relative mt-5 text-[9px] leading-[1.45] text-[#4f443c]">
                                Thoughtfully chosen fashion, home &amp; beauty
                                for every celebration.
                            </p>
                            <Link
                                href="/festive"
                                data-festive-hero-cta="true"
                                className="relative mt-4 w-fit bg-[#26321c] px-5 py-3 text-[8px] font-semibold uppercase tracking-[0.12em] text-white"
                            >
                                Shop the edit&nbsp; →
                            </Link>
                            <Image
                                src={`${assetRoot}/pond-peacock.png`}
                                alt=""
                                width={280}
                                height={100}
                                className="absolute bottom-0 right-[-8%] z-10 w-[45%]"
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
                        className="absolute bottom-0 left-0 w-[170px] -scale-x-100"
                    />
                    <Image
                        src={`${assetRoot}/sandstone-arch.png`}
                        alt=""
                        width={180}
                        height={100}
                        className="absolute bottom-0 right-0 w-[170px]"
                    />
                </div>

                <section
                    data-festive-section="editorial-cards"
                    className="grid gap-5 px-3 pb-10 pt-8 md:gap-6 md:px-8 md:pt-0 lg:grid-cols-3"
                >
                    {editorialCards.map((card) => (
                        <Link
                            href={card.href}
                            key={card.title}
                            className="group relative aspect-[0.94] overflow-hidden md:aspect-[1.75]"
                        >
                            <Image
                                data-festive-editorial-image="true"
                                src={card.image}
                                alt=""
                                fill
                                sizes="(min-width: 1024px) 32vw, calc(100vw - 24px)"
                                className="object-cover md:hidden"
                                style={{ objectPosition: card.objectPosition }}
                            />
                            <Image
                                data-festive-editorial-image="true"
                                src={card.desktopImage}
                                alt=""
                                fill
                                sizes="(min-width: 1024px) 32vw, 0px"
                                className="hidden object-cover md:block"
                                style={{ objectPosition: card.objectPosition }}
                            />
                            <div
                                className={`absolute inset-0 bg-gradient-to-t ${card.overlay}`}
                            />
                            <div className="absolute inset-0 flex flex-col justify-end px-6 py-7 text-[#fff8ec] md:hidden">
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
                    className="grid min-h-[390px] lg:aspect-[2.9] lg:min-h-0 lg:grid-cols-[30%_41.5%_28.5%]"
                >
                    <div className="relative aspect-[1.52] overflow-hidden bg-[#c48d79] lg:aspect-auto lg:h-full lg:min-h-0">
                        <Image
                            src={`${assetRoot}/brand-story-mobile-uruli.png`}
                            alt="Hand placing a lotus blossom in a brass water uruli"
                            fill
                            sizes="100vw"
                            className="object-cover lg:hidden"
                        />
                        <Image
                            src={`${assetRoot}/brand-story-women.png`}
                            alt="Woman wearing a pink festive saree"
                            fill
                            sizes="(min-width: 1024px) 30vw, 100vw"
                            className="hidden object-cover lg:block lg:object-contain"
                        />
                    </div>
                    <div className="flex min-h-[390px] flex-col items-center justify-center bg-[#741f2a] px-12 text-center text-[#fff1dc] lg:h-full lg:min-h-0">
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
                            data-festive-our-story="true"
                            className="mt-7 border border-white/55 px-7 py-3 text-[9px] uppercase tracking-[0.18em]"
                        >
                            Our story&nbsp; →
                        </Link>
                    </div>
                    <div className="relative aspect-[1.52] overflow-hidden bg-[#6e645d] lg:aspect-auto lg:h-full lg:min-h-0">
                        <Image
                            src={`${assetRoot}/brand-story-mobile-lotus-field.png`}
                            alt="Lotus pond representing people, planet, and better choices"
                            fill
                            sizes="100vw"
                            className="object-cover lg:hidden"
                        />
                        <Image
                            src={`${assetRoot}/brand-story-men.png`}
                            alt="Man wearing festive everyday menswear"
                            fill
                            sizes="(min-width: 1024px) 28.5vw, 100vw"
                            className="hidden object-cover grayscale lg:block lg:object-contain"
                        />
                    </div>
                </section>

                <FestiveBrandShowcase brands={festiveBrands} />

                <div
                    data-festive-heritage-divider="true"
                    className="flex min-h-[62px] items-center justify-center md:min-h-[132px]"
                >
                    <Image
                        src={`${assetRoot}/heritage-rail.png`}
                        alt=""
                        width={1600}
                        height={120}
                        className="h-[38px] w-full object-cover md:h-auto md:w-[94%] md:object-contain"
                    />
                </div>

                <section
                    data-festive-section="gift-intention"
                    className="px-3 pb-10 pt-6 md:px-8 md:pb-12 md:pt-5"
                >
                    <h2 className="font-serif text-[28px] leading-none md:text-[34px]">
                        Gift by intention
                    </h2>
                    <p className="mt-3 text-[10px] text-[#806f60]">
                        Thoughtful curation for everyone on your list.
                    </p>
                    <div
                        data-festive-gift-grid="true"
                        className="mt-7 grid grid-cols-2 gap-x-3 gap-y-4 md:mt-8 lg:grid-cols-5 lg:gap-5"
                    >
                        {giftItems.map((gift) => (
                            <Link
                                href={gift.href}
                                key={gift.label}
                                className="group min-w-0 last:col-span-2 lg:last:col-span-1"
                            >
                                <div className="relative aspect-[1.35] w-full overflow-hidden bg-[#d6b893]">
                                    <Image
                                        src={`${assetRoot}/${gift.image}`}
                                        alt={gift.label}
                                        fill
                                        sizes="(min-width: 1024px) 20vw, 100vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                    />
                                </div>
                                <p className="mt-3 text-[10px] font-medium">
                                    {gift.label} <span aria-hidden>→</span>
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                <section
                    data-festive-benefits="true"
                    className="grid grid-cols-2 gap-y-7 border-y border-[#e2d2b9] bg-[#fffaf0] px-4 py-8 lg:relative lg:left-1/2 lg:w-screen lg:-translate-x-1/2 lg:grid-cols-4 lg:gap-y-0 lg:px-8 lg:py-7"
                >
                    {[
                        [
                            "benefit-curated.png",
                            "Curated & Verified",
                            "Conscious brands",
                        ],
                        [
                            "benefit-delivery.png",
                            "Pan India Delivery",
                            "3–7 working days",
                        ],
                        ["benefit-returns.png", "Easy Returns", "Hassle free"],
                        [
                            "benefit-tomorrow.png",
                            "A Kinder Tomorrow",
                            "With every purchase",
                        ],
                    ].map(([icon, title, copy]) => (
                        <div
                            key={title}
                            className="flex items-center justify-start gap-3 px-2 lg:justify-center lg:gap-4 lg:border-r lg:border-[#e2d2b9] lg:px-5 lg:last:border-0"
                        >
                            <Image
                                src={`${assetRoot}/${icon}`}
                                alt=""
                                width={28}
                                height={28}
                                className="size-6 shrink-0 object-contain lg:size-7"
                                aria-hidden
                            />
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
                <div
                    data-festive-bottom-spacer="true"
                    className="h-12 md:h-20"
                    aria-hidden
                />
            </main>
        </div>
    );
}
