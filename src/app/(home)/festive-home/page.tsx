import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: "A More Conscious Festive Season",
    description:
        "Thoughtfully chosen fashion, home, and beauty for every celebration.",
    alternates: { canonical: "/festive-home" },
};

const assetRoot = "/assets/festive-home";

const editorialCards = [
    {
        title: "Festive dressing",
        copy: "Thoughtfully chosen festive wear.",
        action: "Shop apparel",
        tone: "from-[#572c2a] to-[#b47d6d]",
    },
    {
        title: "Gifts with a story",
        copy: "Made with care, meant to be remembered.",
        action: "Explore gifts",
        tone: "from-[#53624d] to-[#9e8b70]",
    },
    {
        title: "Home for the season",
        copy: "Create warmth around every ritual.",
        action: "Shop home",
        tone: "from-[#3d1714] to-[#7d463d]",
    },
];

const editItems = [
    { brand: "SUI", name: "Handwoven Silk Saree", price: "₹2,500" },
    { brand: "MÈLI", name: "Brass Moon Earrings", price: "₹2,800" },
    { brand: "RASA", name: "Natural Soy Candle", price: "₹1,799" },
    {
        brand: "BARE NECESSITIES",
        name: "Restorative Face Oil",
        price: "₹1,850",
    },
    {
        brand: "THE INDIAN EARTH",
        name: "Handblock Cushion Cover",
        price: "₹1,250",
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

export default function FestiveHomePage() {
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

                <div className="relative h-[82px] bg-[#fff9eb]">
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
                    className="grid gap-6 px-8 pb-10 lg:grid-cols-3"
                >
                    {editorialCards.map((card, index) => (
                        <Link
                            href="/shop"
                            key={card.title}
                            className="group relative min-h-[250px] overflow-hidden"
                        >
                            <ImagePlaceholder
                                label={`Editorial ${index + 1}`}
                                hideLabel
                                className="absolute inset-0 h-full"
                            />
                            <div
                                className={`absolute inset-0 bg-gradient-to-r ${card.tone} opacity-70`}
                            />
                            <div className="relative flex min-h-[250px] flex-col justify-center p-9 text-[#fff8ec]">
                                <h2 className="font-serif text-[36px] leading-none">
                                    {card.title}
                                </h2>
                                <p className="mt-4 text-[11px] text-white/80">
                                    {card.copy}
                                </p>
                                <MiniLink>{card.action}</MiniLink>
                            </div>
                        </Link>
                    ))}
                </section>

                <section
                    data-festive-section="festive-edit"
                    className="bg-[#f4dcd5] px-8 py-9"
                >
                    <div className="grid gap-5 lg:grid-cols-6">
                        <article className="relative min-h-[390px] overflow-hidden bg-[#691e29] p-8 text-[#fff3df]">
                            <Image
                                src={`${assetRoot}/maroon-arch.png`}
                                alt=""
                                fill
                                className="object-cover opacity-70"
                            />
                            <div className="relative flex h-full min-h-[326px] flex-col justify-between">
                                <div>
                                    <p className="text-[8px] uppercase tracking-[0.3em]">
                                        Curation
                                    </p>
                                    <h2 className="mt-10 font-serif text-[38px] leading-[0.96]">
                                        The
                                        <br />
                                        Festive Edit
                                    </h2>
                                    <p className="mt-6 text-[10px] leading-4 text-white/75">
                                        A curated selection from conscious
                                        brands, across fashion, home, beauty and
                                        more.
                                    </p>
                                </div>
                                <MiniLink>View all</MiniLink>
                            </div>
                        </article>
                        {editItems.map((item, index) => (
                            <article key={item.name} className="min-w-0">
                                <ImagePlaceholder
                                    label={`Product ${index + 1}`}
                                    hideLabel
                                    className="aspect-[0.72] w-full bg-[#dfc6b5]"
                                />
                                <p className="mt-3 text-[8px] font-bold uppercase tracking-[0.13em]">
                                    {item.brand}
                                </p>
                                <h3 className="mt-1 truncate text-[10px] text-[#604e43]">
                                    {item.name}
                                </h3>
                                <p className="mt-1 text-[10px] font-semibold">
                                    {item.price}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section
                    data-festive-section="brand-story"
                    className="grid min-h-[390px] lg:grid-cols-3"
                >
                    <ImagePlaceholder
                        label="Story campaign"
                        hideLabel
                        className="min-h-[390px] bg-[#c48d79]"
                    />
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
                    <ImagePlaceholder
                        label="Artisan campaign"
                        hideLabel
                        className="min-h-[390px] bg-[#6e645d] grayscale"
                    />
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
