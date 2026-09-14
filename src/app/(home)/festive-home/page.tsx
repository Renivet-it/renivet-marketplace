import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "A More Conscious Festive Season",
    description:
        "Thoughtfully chosen fashion, home, and beauty for every celebration.",
    alternates: { canonical: "/festive-home" },
};

const assetRoot = "/assets/festive-home";

function ImagePlaceholder({
    label,
    className = "",
}: {
    label: string;
    className?: string;
}) {
    return (
        <div
            aria-label={`${label} image placeholder`}
            className={`flex min-h-48 items-center justify-center bg-[#ded0bd] text-center text-xs uppercase tracking-[0.2em] text-[#6b5746] ${className}`}
        >
            {label} image placeholder
        </div>
    );
}

const editItems = [
    { name: "Sunshine silk saree", price: "₹2,500" },
    { name: "Brass lotus earrings", price: "₹2,800" },
    { name: "Natural soy candle", price: "₹1,799" },
    { name: "Rose essential oil", price: "₹1,850" },
    { name: "Handwoven cushion cover", price: "₹1,250" },
];

const giftItems = [
    "Golden hour dressing",
    "Soft knits for home",
    "A quiet candlelight",
    "Under ₹2,000",
    "Host gifts",
];

function SectionHeading({
    eyebrow,
    title,
}: {
    eyebrow?: string;
    title: string;
}) {
    return (
        <div className="mb-8 flex items-end justify-between border-b border-[#d8c2a0] pb-4">
            <div>
                {eyebrow ? (
                    <p className="mb-2 text-[10px] uppercase tracking-[0.32em] text-[#94734d]">
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="font-serif text-4xl text-[#3e2b24]">{title}</h2>
            </div>
            <a
                href="/shop"
                className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#63302b] underline-offset-4 hover:underline"
            >
                View all
            </a>
        </div>
    );
}

export default function FestiveHomePage() {
    return (
        <div className="overflow-hidden bg-[#fbf3e4] text-[#3e2b24]">
            <main>
                <section className="mx-auto grid max-w-[1440px] grid-cols-[42%_58%] bg-[#eadbc7]">
                    <div className="relative flex min-h-[590px] items-center justify-center overflow-hidden bg-[#f7eddb] px-20 py-16">
                        <Image
                            src={`${assetRoot}/maroon-arch.png`}
                            alt=""
                            fill
                            className="object-cover opacity-95"
                            priority
                        />
                        <div className="relative z-10 max-w-[360px] text-center">
                            <p className="mb-5 text-[11px] uppercase tracking-[0.4em] text-[#8d6544]">
                                A seasonal edit by Renivet
                            </p>
                            <h1 className="font-serif text-6xl leading-[0.98] text-[#45352c]">
                                A more
                                <br />
                                conscious
                                <br />
                                festive season
                            </h1>
                            <p className="mx-auto mt-8 max-w-[245px] text-sm leading-6 text-[#6d5849]">
                                Thoughtfully chosen fashion, home &amp; beauty
                                for every celebration.
                            </p>
                            <a
                                href="/shop"
                                className="mt-8 inline-flex border border-[#4b382e] px-7 py-3 text-[10px] font-bold uppercase tracking-[0.22em] transition hover:bg-[#4b382e] hover:text-[#fbf3e4]"
                            >
                                Shop the edit <span className="ml-4">→</span>
                            </a>
                        </div>
                        <Image
                            src={`${assetRoot}/sandstone-arch.png`}
                            alt=""
                            width={170}
                            height={145}
                            className="absolute bottom-0 left-5 z-10 w-36"
                        />
                    </div>
                    <ImagePlaceholder
                        label="Hero campaign"
                        className="min-h-[590px] bg-[#bba48b] text-[#f8ecd9]"
                    />
                </section>

                <Image
                    src={`${assetRoot}/heritage-rail.png`}
                    alt=""
                    width={1600}
                    height={120}
                    className="h-auto w-full object-cover py-5"
                />

                <section className="mx-auto grid max-w-[1440px] grid-cols-3 gap-5 px-10 py-5">
                    {[
                        [
                            "Festive dressing",
                            "Thoughtfully chosen festive wear",
                            "Explore dressing",
                        ],
                        [
                            "Gifts with a story",
                            "Gifts that carry meaning",
                            "Explore gifts",
                        ],
                        [
                            "Home for the season",
                            "Create comfort around every ritual",
                            "Shop home",
                        ],
                    ].map(([title, copy, action], index) => (
                        <article
                            key={title}
                            className="group relative min-h-[240px] overflow-hidden bg-[#6d4038]"
                        >
                            <ImagePlaceholder
                                label={`Editorial tile ${index + 1}`}
                                className="absolute inset-0 min-h-full bg-[#694b42] text-[#eadbc7] transition duration-500 group-hover:scale-105"
                            />
                            <div className="relative flex min-h-[240px] flex-col justify-end bg-gradient-to-t from-[#301914]/80 via-transparent p-7 text-[#fff8eb]">
                                <h2 className="font-serif text-3xl">{title}</h2>
                                <p className="mt-2 text-xs text-[#f3dfc5]">
                                    {copy}
                                </p>
                                <span className="mt-5 text-[9px] font-bold uppercase tracking-[0.2em] underline underline-offset-4">
                                    {action} →
                                </span>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="mx-auto max-w-[1440px] px-10 py-20">
                    <SectionHeading
                        eyebrow="Curated for conscious celebrations"
                        title="The Festive Edit"
                    />
                    <div className="grid grid-cols-[250px_1fr] gap-7">
                        <div className="relative overflow-hidden bg-[#651f27] p-9 text-[#fff2dc]">
                            <Image
                                src={`${assetRoot}/maroon-arch.png`}
                                alt=""
                                fill
                                className="object-cover opacity-70"
                            />
                            <div className="relative flex min-h-[320px] flex-col justify-between">
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.28em]">
                                        Curated edit
                                    </p>
                                    <h3 className="mt-8 font-serif text-4xl leading-tight">
                                        The
                                        <br /> Festive Edit
                                    </h3>
                                </div>
                                <a
                                    href="/shop"
                                    className="text-[9px] font-bold uppercase tracking-[0.2em] underline underline-offset-4"
                                >
                                    View all →
                                </a>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-4">
                            {editItems.map((item, index) => (
                                <article key={item.name}>
                                    <ImagePlaceholder
                                        label={`Edit ${index + 1}`}
                                        className="aspect-[0.76] min-h-0"
                                    />
                                    <h3 className="mt-3 text-xs font-medium leading-4">
                                        {item.name}
                                    </h3>
                                    <p className="mt-2 text-xs text-[#806653]">
                                        {item.price}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid max-w-[1440px] grid-cols-3 bg-[#d8b09c]">
                    <ImagePlaceholder
                        label="Story left"
                        className="min-h-[310px] bg-[#c88b83]"
                    />
                    <div className="flex min-h-[310px] flex-col items-center justify-center bg-[#76232b] px-14 text-center text-[#fff2dc]">
                        <h2 className="font-serif text-4xl leading-tight">
                            Celebrate beautifully.
                            <br /> Choose thoughtfully.
                        </h2>
                        <p className="mt-5 max-w-[300px] text-xs leading-5 text-[#f1d4c0]">
                            At Renivet, we bring you a curated selection of
                            homegrown brands that care—for people, planet, and
                            the future.
                        </p>
                        <a
                            href="/about"
                            className="mt-7 border border-[#ead4bc] px-6 py-3 text-[9px] font-bold uppercase tracking-[0.2em]"
                        >
                            Our story →
                        </a>
                    </div>
                    <ImagePlaceholder
                        label="Story right"
                        className="min-h-[310px] bg-[#8f8173]"
                    />
                </section>

                <section className="mx-auto max-w-[1440px] px-10 py-20">
                    <SectionHeading title="Brands worth discovering" />
                    <p className="-mt-4 mb-8 text-sm text-[#806653]">
                        Independent brands. Meaningful stories. A kinder
                        tomorrow.
                    </p>
                    <div className="grid grid-cols-6 gap-3">
                        {[
                            "Rasa",
                            "Sui",
                            "Bare Necessities",
                            "The Indian Earth",
                            "Wèli",
                            "My Mithila",
                        ].map((brand) => (
                            <a
                                key={brand}
                                href="/brands"
                                className="flex h-16 items-center justify-center border border-[#e2cfb2] bg-[#fffaf1] px-3 text-center text-[10px] uppercase tracking-[0.23em] transition hover:border-[#8f5b49]"
                            >
                                {brand}
                            </a>
                        ))}
                    </div>
                </section>

                <section className="border-y border-[#e0c9a8] bg-[#f8e8d3]">
                    <div className="mx-auto max-w-[1440px] px-10 py-16">
                        <Image
                            src={`${assetRoot}/pond-peacock.png`}
                            alt=""
                            width={500}
                            height={170}
                            className="mx-auto mb-6 h-24 w-auto object-contain"
                        />
                        <SectionHeading
                            eyebrow="Gifts chosen with care"
                            title="Gift by intention"
                        />
                        <p className="-mt-4 mb-8 text-sm text-[#806653]">
                            Thoughtful curation for everyone on your list.
                        </p>
                        <div className="grid grid-cols-5 gap-5">
                            {giftItems.map((item, index) => (
                                <a href="/shop" key={item} className="group">
                                    <ImagePlaceholder
                                        label={`Gift ${index + 1}`}
                                        className="aspect-[1.15] min-h-0 transition group-hover:bg-[#d8c5aa]"
                                    />
                                    <p className="mt-3 text-xs">
                                        {item}{" "}
                                        <span className="float-right">→</span>
                                    </p>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid max-w-[1440px] grid-cols-4 border-b border-[#e1ceb1] py-8 text-center text-[10px] uppercase tracking-[0.16em] text-[#6d5849]">
                    {[
                        "Curated & verified",
                        "Pan-India delivery",
                        "Easy returns",
                        "A kinder tomorrow",
                    ].map((item) => (
                        <div
                            key={item}
                            className="border-r border-[#e1ceb1] last:border-0"
                        >
                            ✦ <span className="ml-2">{item}</span>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
