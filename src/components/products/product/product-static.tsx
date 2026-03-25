"use client";

import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import { ProductWithBrand } from "@/lib/validations";
import {
    BadgeCheck,
    CheckCircle2,
    CircleDot,
    Factory,
    Leaf,
    MapPin,
    PackageCheck,
    ShieldCheck,
    Users,
    type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

interface ProductCardProps {
    product: ProductWithBrand;
}

type StageCard = {
    id: string;
    title: string;
    icon: LucideIcon;
    headline: string;
    details: string[];
};

type StoryCard = {
    id: string;
    title: string;
    icon: LucideIcon;
    content: string;
};

type PricePoint = {
    label: string;
    percent: number;
};

const PRICE_COLORS = ["#7da7d7", "#9ec0e6", "#b7d2ee", "#cfe1f3"];
const FALLBACK_PERCENTS = [40, 30, 20, 10];

const titleCase = (value: string) =>
    value.replace(/\b([a-z])/gi, (match) => match.toUpperCase());

const normalizeText = (value: string | null | undefined) => {
    if (!value) return "";
    const cleaned = value.trim().replace(/\s+/g, " ");
    if (!cleaned.length) return "";

    return titleCase(cleaned.toLowerCase())
        .replace(/\bgots\b/gi, "GOTS")
        .replace(/\boeko-tex\b/gi, "OEKO-TEX")
        .replace(/\bngo\b/gi, "NGO");
};

const normalizeParagraph = (value: string | null | undefined) =>
    (value ?? "").trim().replace(/\s+/g, " ");

const splitList = (value: string | null | undefined) =>
    (value ?? "")
        .split(/[\n,;|]+/g)
        .map((item) => item.trim())
        .filter(Boolean);

const previewText = (value: string, max = 200) =>
    value.length > max ? `${value.slice(0, max).trimEnd()}...` : value;

const toBooleanLabel = (
    value: boolean | null | undefined,
    labels?: { true: string; false: string; unknown: string }
) => {
    if (value === true) return labels?.true ?? "Yes";
    if (value === false) return labels?.false ?? "No";
    return labels?.unknown ?? "Not specified";
};

const buildPricePoints = (items: string[]): PricePoint[] =>
    items
        .slice(0, 4)
        .map((item, index) => {
            const match = item.match(/^(.*?)(?:\s*[:-]\s*)?(\d{1,3})%$/);
            if (match) {
                return {
                    label: normalizeText(match[1].trim()),
                    percent: Math.min(100, Number(match[2])),
                };
            }

            return {
                label: normalizeText(item),
                percent: FALLBACK_PERCENTS[index] ?? 10,
            };
        })
        .filter((item) => item.label.length > 0);

const buildDonut = (points: PricePoint[]) => {
    if (!points.length) return `conic-gradient(${PRICE_COLORS[0]} 0% 100%)`;

    let current = 0;
    const stops = points
        .map((point, index) => {
            const start = current;
            const end = Math.min(100, current + point.percent);
            current = end;
            return `${PRICE_COLORS[index % PRICE_COLORS.length]} ${start}% ${end}%`;
        })
        .join(", ");

    return `conic-gradient(${stops})`;
};

const locationHeadline = (value: string) => {
    const firstChunk = value.split(",")[0]?.trim() || value.trim();
    return titleCase(firstChunk.toLowerCase());
};

export const ProductCard = ({ product }: ProductCardProps) => {
    const [expandedStories, setExpandedStories] = useState<
        Record<string, boolean>
    >({});
    const [isWhyExpanded, setIsWhyExpanded] = useState(false);
    const { data: decodeX, isLoading } =
        trpc.general.decodex.getPublicByScope.useQuery({
            brandId: product.brandId,
            subcategoryId: product.subcategoryId,
        });

    const pricePoints = useMemo(() => {
        const lines = decodeX ? splitList(decodeX.storyPriceBreakdown) : [];
        return buildPricePoints(lines);
    }, [decodeX]);
    const donutBackground = useMemo(() => buildDonut(pricePoints), [pricePoints]);

    if (isLoading) {
        return (
            <div className="mt-6 animate-pulse overflow-hidden rounded-3xl border border-[#d7dde6] bg-[#fcfbf4] p-6">
                <div className="h-10 w-2/3 rounded bg-[#dce5ef]" />
                <div className="mt-3 h-4 w-full rounded bg-[#e8eef4]" />
                <div className="mt-2 h-4 w-4/5 rounded bg-[#e8eef4]" />
                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                    {[1, 2, 3].map((k) => (
                        <div key={k} className="h-16 rounded bg-[#eaf1fa]" />
                    ))}
                </div>
            </div>
        );
    }

    if (!decodeX) {
        return (
            <section className="mt-6 overflow-hidden rounded-3xl border border-[#d7dde6] bg-[#fcfbf4] p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#1c2535] px-3 py-1 text-[10px] uppercase tracking-wider text-white">
                        DecodeX - Behind The Product
                    </Badge>
                    <Badge variant="outline" className="border-[#c6d3e2] text-[#5e738c]">
                        Profile in progress
                    </Badge>
                </div>
                <h3 className="font-playfair text-[34px] leading-[1.12] text-[#1e2b3f]">
                    What you&apos;re{" "}
                    <span className="italic text-[#7d9ec2]">really</span> buying
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5d6d80]">
                    DecodeX mapping for {product.brand.name}{" "}
                    {product.subcategory.name.toLowerCase()} is being prepared.
                </p>
            </section>
        );
    }

    const certifications = splitList(decodeX.certifications).map(normalizeText);
    const rawLocation = normalizeText(decodeX.rawMaterialSupplierLocation);
    const mfgLocation = normalizeText(decodeX.manufacturingLocation);
    const packLocation = normalizeText(decodeX.packingDispatchLocation);
    const locations = [rawLocation, mfgLocation, packLocation].filter(Boolean);
    const uniqueLocations = Array.from(new Set(locations));

    const stageCards: StageCard[] = [
        {
            id: "raw",
            title: "Raw Material",
            icon: Leaf,
            headline: normalizeText(decodeX.mainMaterial) || "Not specified",
            details: [
                decodeX.rawMaterialSupplierName
                    ? `Supplier: ${normalizeText(decodeX.rawMaterialSupplierName)}`
                    : "",
                rawLocation ? `Origin: ${rawLocation}` : "",
                "Certified sourcing",
            ].filter(Boolean),
        },
        {
            id: "make",
            title: "Manufacturing",
            icon: Factory,
            headline: normalizeText(decodeX.manufacturerName) || "Not specified",
            details: [
                mfgLocation ? `Facility: ${mfgLocation}` : "",
                "In-house production unit",
                "Small-batch fair wages",
            ].filter(Boolean),
        },
        {
            id: "pack",
            title: "Packaging",
            icon: PackageCheck,
            headline:
                normalizeText(decodeX.packingDispatchSource) || "Not specified",
            details: [
                packLocation ? `Dispatch: ${packLocation}` : "",
                `Virgin plastic: ${toBooleanLabel(decodeX.virginPlasticUsed, {
                    true: "Used",
                    false: "Not used",
                    unknown: "N/A",
                })}`,
                `Supplier declaration: ${toBooleanLabel(
                    decodeX.supplierDeclarationAvailable
                )}`,
            ],
        },
        {
            id: "cert",
            title: "Certification",
            icon: ShieldCheck,
            headline: certifications.length
                ? certifications.join(", ")
                : "Not specified",
            details: [
                `Shareable proofs: ${toBooleanLabel(decodeX.certificationShareable)}`,
                "Renivet verified",
            ],
        },
    ];

    const stories: StoryCard[] = [
        {
            id: "human",
            title: "The Human",
            icon: Users,
            content: normalizeParagraph(decodeX.storyHuman),
        },
        {
            id: "truth",
            title: "The Truth",
            icon: ShieldCheck,
            content: normalizeParagraph(decodeX.storyTruth),
        },
        {
            id: "impact",
            title: "The Impact",
            icon: Leaf,
            content: normalizeParagraph(decodeX.storyImpact),
        },
    ].filter((item) => item.content.length > 0);

    const highlight =
        decodeX.virginPlasticUsed === false
            ? "No virgin plastic used. Fabric scraps are redirected for upcycling."
            : decodeX.supplierDeclarationAvailable
              ? "Supplier declaration has been provided for this profile."
              : "Journey details are mapped from supplier and manufacturing inputs.";

    const locationRoles = [
        "Raw material origin",
        "Manufacturing & dispatch",
        "Packaging & certification",
    ];

    const locationInsights = uniqueLocations.slice(0, 3).map((location, index) => ({
        location,
        headline: locationHeadline(location),
        role: locationRoles[index] ?? "Supply chain milestone",
    }));

    const whyText = normalizeParagraph(decodeX.storyWhy);
    const whySentences = whyText
        ? whyText.split(/(?<=[.!?])\s+/).filter(Boolean)
        : [];
    const whyQuote = whySentences[0] ?? whyText;
    const whyBody = whySentences.slice(1).join(" ");

    return (
        <section className="mt-6 overflow-hidden rounded-3xl border border-[#d7dde6] bg-[#fcfbf4] text-[#1e2b3f]">
            <header className="relative border-b border-[#d7dde6] bg-[radial-gradient(circle_at_top_right,_#eaf1fa_0%,_#f1f5fa_35%,_#f7f9fb_65%,_#fcfbf4_100%)] p-6">
                <div className="mb-3 flex items-center gap-3">
                    <div className="h-px w-6 bg-[#8daed3]" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6c83a1]">
                        DecodeX - Behind The Product
                    </p>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-[85%]">
                        <h3 className="font-playfair text-[36px] leading-[1.06] text-[#1e2b3f]">
                            What you&apos;re{" "}
                            <span className="italic text-[#7d9ec2]">really</span>{" "}
                            buying
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#5d6d80]">
                            Full transparency into people, places, and principles
                            behind this product.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe0ef] bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5d7693]">
                        <BadgeCheck className="size-3.5 text-[#7d9ec2]" />
                        Renivet Verified
                    </div>
                </div>
            </header>

            <div className="grid border-b border-[#d7dde6] bg-[#eaf1fa] sm:grid-cols-3">
                <StatItem
                    icon={Users}
                    value={`${Math.max(uniqueLocations.length, 1)}-${Math.max(uniqueLocations.length + 1, 3)}`}
                    label="Mapped location points"
                    bordered
                />
                <StatItem
                    icon={PackageCheck}
                    value={toBooleanLabel(decodeX.virginPlasticUsed, {
                        true: "Yes",
                        false: "0%",
                        unknown: "N/A",
                    })}
                    label="Virgin plastic in packaging"
                    bordered
                />
                <StatItem
                    icon={ShieldCheck}
                    value={String(Math.max(certifications.length, 1))}
                    label={
                        certifications.length
                            ? `Certifications - ${certifications.join(" & ")}`
                            : "Certifications listed"
                    }
                />
            </div>

            <div className="space-y-6 bg-[#f3f7fb] p-6">
                <SectionTitle title="A Mapped Journey" />
                <div className="grid gap-3 sm:grid-cols-2">
                    {stageCards.map((card, index) => (
                        <article
                            key={card.id}
                            className="relative overflow-hidden rounded-2xl border border-[#dce4ee] bg-white p-4"
                        >
                            <div className="mb-2 flex items-center justify-between">
                                <div className="flex size-8 items-center justify-center rounded-full border border-[#cbd8e6] bg-[#eff4f9] text-[#6e8fb5]">
                                    <card.icon className="size-4" />
                                </div>
                                <span className="text-xs font-semibold text-[#bcc9d6]">
                                    {(index + 1).toString().padStart(2, "0")}
                                </span>
                            </div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ca0b7]">
                                {card.title}
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#2a3a50]">
                                {card.headline}
                            </p>
                            <ul className="mt-3 space-y-1.5">
                                {card.details.map((detail) => (
                                    <li
                                        key={`${card.id}-${detail}`}
                                        className="flex items-start gap-2 text-xs leading-relaxed text-[#5f6f83]"
                                    >
                                        <CircleDot className="mt-0.5 size-3 shrink-0 text-[#9eb0c4]" />
                                        <span className="break-words">{detail}</span>
                                    </li>
                                ))}
                            </ul>
                            <span className="pointer-events-none absolute -bottom-3 right-2 text-[48px] leading-none text-[#f0f4f8]">
                                {(index + 1).toString().padStart(2, "0")}
                            </span>
                        </article>
                    ))}
                </div>

                {uniqueLocations.length > 0 && (
                    <div className="grid gap-4 rounded-2xl border border-[#d7dde6] bg-[#edf3fa] p-4 sm:grid-cols-[170px_1fr] sm:items-center">
                        <div className="mx-auto">
                            <SupplyChainSketch />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-[#2f425d]">
                                <MapPin className="size-4 text-[#6f90b8]" />
                                Supply chain footprint
                            </div>
                            <div className="space-y-1.5">
                                {locationInsights.map((item) => (
                                    <p
                                        key={item.location}
                                        className="flex items-start gap-2 text-sm text-[#4f657e]"
                                    >
                                        <span className="mt-1.5 inline-flex size-2.5 shrink-0 rounded-full bg-[#86a8cd] shadow-[0_0_0_3px_rgba(134,168,205,0.15)]" />
                                        <span className="break-words">
                                            <span className="font-semibold text-[#2b4b72]">
                                                {item.headline}
                                            </span>{" "}
                                            - {item.role}
                                        </span>
                                    </p>
                                ))}
                            </div>
                            <p className="pt-1 text-sm italic text-[#7388a0]">
                                100% Made in India supply chain
                            </p>
                        </div>
                    </div>
                )}

                <div className="rounded-xl border border-[#d4dee9] bg-[#eaf2fb] px-4 py-3 text-sm text-[#4f657e]">
                    <p className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#6a86a6]" />
                        <span>{highlight}</span>
                    </p>
                </div>
            </div>

            {stories.length > 0 && (
                <div className="border-t border-[#d7dde6] bg-[#fcfbf4] p-6">
                    <SectionTitle title="Story Behind The Product" />
                    <div className="mt-4 space-y-3">
                        {stories.map((story, index) => (
                            <article
                                key={story.id}
                                className="rounded-2xl border border-[#dce4ee] bg-white p-4"
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex size-8 items-center justify-center rounded-xl border border-[#cbd8e6] bg-[#eff4f9] text-[#6c89ae]">
                                        <story.icon className="size-4" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-[#c2cfdb]">
                                        {(index + 1).toString().padStart(2, "0")}
                                    </span>
                                </div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8ca0b7]">
                                    {story.title}
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-[#4f6075]">
                                    {expandedStories[story.id]
                                        ? story.content
                                        : previewText(story.content)}
                                </p>
                                {story.content.length > 200 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpandedStories((prev) => ({
                                                ...prev,
                                                [story.id]: !prev[story.id],
                                            }))
                                        }
                                        className="mt-2 text-xs font-semibold uppercase tracking-widest text-[#6a86a6] hover:text-[#4e6886]"
                                    >
                                        {expandedStories[story.id]
                                            ? "Show less"
                                            : "Read more"}
                                    </button>
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {(decodeX.storyWhy || pricePoints.length > 0) && (
                <div className="border-t border-[#d7dde6] bg-[#fcfbf4] p-6">
                    {whyText && (
                        <article className="mb-4 rounded-2xl border border-[#dce4ee] bg-white p-5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8ca0b7]">
                                Why Choose This
                            </p>
                            <p className="mt-3 border-l-2 border-[#8cade0] pl-4 font-playfair text-[clamp(1.24rem,2.1vw,1.7rem)] italic leading-[1.28] text-[#233d63]">
                                &quot;{whyQuote}&quot;
                            </p>
                            {Boolean(whyBody) && (
                                <p className="mt-4 max-w-[68ch] text-[15px] leading-8 text-[#516983]">
                                    {isWhyExpanded
                                        ? whyBody
                                        : previewText(whyBody, 220)}
                                </p>
                            )}
                            {whyBody.length > 220 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsWhyExpanded((prev) => !prev)
                                    }
                                    className="mt-3 text-xs font-semibold uppercase tracking-widest text-[#6a86a6] hover:text-[#4e6886]"
                                >
                                    {isWhyExpanded ? "Show less" : "Read more"}
                                </button>
                            )}
                        </article>
                    )}

                    {pricePoints.length > 0 && (
                        <article className="overflow-hidden rounded-2xl border border-[#dce4ee] bg-white">
                            <div className="grid lg:grid-cols-[190px_1fr]">
                                <div className="bg-[linear-gradient(145deg,#85aeda_0%,#8db5df_35%,#9bbfe5_100%)] p-5 text-white">
                                    <p className="font-playfair text-[34px] leading-[1.06]">
                                        What&apos;s
                                        <br />
                                        in the
                                        <br />
                                        price
                                    </p>
                                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
                                        What customers usually don&apos;t see
                                    </p>
                                </div>
                                <div className="p-5">
                                    <div className="grid gap-4 sm:grid-cols-[84px_1fr]">
                                        <div className="mx-auto">
                                            <div
                                                className="relative size-[84px] rounded-full"
                                                style={{ background: donutBackground }}
                                            >
                                                <div className="absolute inset-[14px] flex items-center justify-center rounded-full bg-white text-[9px] uppercase tracking-[0.12em] text-[#7e94ae]">
                                                    Price
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {pricePoints.map((point, index) => (
                                                <div key={`${point.label}-${index}`}>
                                                    <div className="flex items-start gap-2">
                                                        <span
                                                            className="mt-1 inline-flex size-2.5 rounded-sm"
                                                            style={{
                                                                backgroundColor:
                                                                    PRICE_COLORS[
                                                                        index %
                                                                            PRICE_COLORS.length
                                                                    ],
                                                            }}
                                                        />
                                                        <span className="flex-1 break-words text-sm leading-6 text-[#4f6075]">
                                                            {point.label}
                                                        </span>
                                                        <span className="text-xs font-semibold text-[#5d7693]">
                                                            {point.percent}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="h-px bg-[#dbe4ef]" />
                                            <p className="pt-1 text-sm leading-7 text-[#5b7189]">
                                                We don&apos;t dilute costs across high
                                                volumes, so each rupee in the price tag
                                                stays honest and accounted for.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    )}
                </div>
            )}
        </section>
    );
};

function SectionTitle({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7e94ae]">
                {title}
            </p>
            <div className="h-px flex-1 bg-[#d8e3ef]" />
        </div>
    );
}

function SupplyChainSketch() {
    return (
        <svg
            viewBox="0 0 170 190"
            className="h-[150px] w-[135px]"
            aria-hidden
            focusable="false"
        >
            <path
                d="M84 6 C108 8, 130 34, 132 58 C132 74, 120 86, 119 97 C121 108, 132 118, 129 130 C120 144, 97 164, 86 184 C78 164, 58 142, 45 125 C37 113, 33 94, 35 80 C38 60, 42 33, 58 18 C66 10, 74 8, 84 6 Z"
                fill="none"
                stroke="#7CA4D1"
                strokeWidth="2.2"
            />
            <line
                x1="42"
                y1="70"
                x2="88"
                y2="114"
                stroke="#AFC6DF"
                strokeWidth="2"
                strokeDasharray="5 4"
            />
            <circle cx="40" cy="68" r="11" fill="#D9E8F7" />
            <circle cx="92" cy="118" r="12" fill="#D9E8F7" />
            <circle cx="40" cy="68" r="6.3" fill="#7CA4D1" />
            <circle cx="92" cy="118" r="7" fill="#7CA4D1" />
            <text x="27" y="63" fill="#90ABCA" fontSize="10">
                GJ
            </text>
            <text x="95" y="118" fill="#90ABCA" fontSize="10">
                HYD
            </text>
        </svg>
    );
}

function StatItem({
    icon: Icon,
    value,
    label,
    bordered,
}: {
    icon: LucideIcon;
    value: string;
    label: string;
    bordered?: boolean;
}) {
    return (
        <div
            className={`flex items-start gap-3 p-4 ${
                bordered ? "border-b border-[#d2dbe8] sm:border-b-0 sm:border-r" : ""
            }`}
        >
            <Icon className="mt-0.5 size-4 text-[#6c83a1]" />
            <div>
                <p className="text-xl font-semibold text-[#22344d]">{value}</p>
                <p className="text-xs text-[#5e7188]">{label}</p>
            </div>
        </div>
    );
}
