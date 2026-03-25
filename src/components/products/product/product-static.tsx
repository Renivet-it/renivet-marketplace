"use client";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
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
    Sparkles,
    Users,
    type LucideIcon,
} from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
    product: ProductWithBrand;
}

type JourneyCard = {
    id: string;
    title: string;
    icon: LucideIcon;
    headline: string;
    details: string[];
    isComplete: boolean;
};

type StoryCardData = {
    id: string;
    title: string;
    icon: LucideIcon;
    content: string;
};

type PriceSlice = {
    label: string;
    percent: number;
    explicit: boolean;
};

const PRICE_COLORS = ["#7DA7D7", "#96BBE3", "#B4CEE9", "#D1E2F3", "#86A6C8"];
const FALLBACK_PERCENTS = [40, 30, 20, 10];

const ACRONYM_FIXES: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\bgots\b/gi, replacement: "GOTS" },
    { pattern: /\boeko[-\s]?tex\b/gi, replacement: "OEKO-TEX" },
    { pattern: /\bngo\b/gi, replacement: "NGO" },
    { pattern: /\bindia\b/gi, replacement: "India" },
    { pattern: /\brenivet\b/gi, replacement: "Renivet" },
];

const cleanInline = (value: string | null | undefined) =>
    (value ?? "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\s+([,.;!?])/g, "$1")
        .trim();

const cleanMultiline = (value: string | null | undefined) =>
    (value ?? "")
        .replace(/\u00a0/g, " ")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

const titleCase = (value: string) =>
    value.replace(
        /\b([A-Za-z])([A-Za-z']*)\b/g,
        (_, first: string, rest: string) =>
            `${first.toUpperCase()}${rest.toLowerCase()}`
    );

const lettersOnly = (value: string) => value.replace(/[^A-Za-z]/g, "");

const isMostlyUppercase = (value: string) => {
    const letters = lettersOnly(value);
    if (!letters.length) return false;
    const uppercaseCount = letters
        .split("")
        .filter((char) => char === char.toUpperCase()).length;
    return uppercaseCount / letters.length >= 0.72;
};

const isMostlyLowercase = (value: string) => {
    const letters = lettersOnly(value);
    if (!letters.length) return false;
    const lowercaseCount = letters
        .split("")
        .filter((char) => char === char.toLowerCase()).length;
    return lowercaseCount / letters.length >= 0.92;
};

const applyAcronymFixes = (value: string) =>
    ACRONYM_FIXES.reduce(
        (text, fix) => text.replace(fix.pattern, fix.replacement),
        value
    );

const normalizeHeading = (value: string | null | undefined) => {
    const cleaned = cleanInline(value);
    if (!cleaned) return "";

    const normalizedBase =
        isMostlyUppercase(cleaned) || isMostlyLowercase(cleaned)
            ? titleCase(cleaned.toLowerCase())
            : cleaned;

    return applyAcronymFixes(normalizedBase).replace(/\s*,\s*/g, ", ");
};

const normalizeParagraph = (value: string | null | undefined) => {
    const cleaned = cleanInline(value);
    if (!cleaned) return "";

    const normalizedBase = isMostlyUppercase(cleaned)
        ? cleaned.toLowerCase().replace(/(^\w|[.!?]\s+\w)/g, (token) =>
              token.toUpperCase()
          )
        : cleaned;

    return applyAcronymFixes(normalizedBase);
};

const splitList = (
    value: string | null | undefined,
    options?: { allowComma?: boolean }
) => {
    const cleaned = cleanMultiline(value);
    if (!cleaned) return [];

    let pieces = cleaned
        .replace(/\u2022/g, "\n")
        .split(/\n|[;|]+/g)
        .map((piece) => cleanInline(piece))
        .filter(Boolean);

    if (options?.allowComma && pieces.length <= 1) {
        const commaSplit = cleaned
            .split(",")
            .map((piece) => cleanInline(piece))
            .filter(Boolean);

        if (commaSplit.length > 1 && commaSplit.every((entry) => entry.length <= 45)) {
            pieces = commaSplit;
        }
    }

    return pieces;
};

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const getBooleanLabel = (
    value: boolean | null | undefined,
    labels: { trueLabel: string; falseLabel: string; unknownLabel: string }
) => {
    if (value === true) return labels.trueLabel;
    if (value === false) return labels.falseLabel;
    return labels.unknownLabel;
};

const trimToWord = (value: string, maxChars: number) => {
    if (value.length <= maxChars) return value;
    const shortened = value.slice(0, maxChars).trimEnd();
    const boundary = shortened.lastIndexOf(" ");
    return `${(boundary > 0 ? shortened.slice(0, boundary) : shortened).trim()}...`;
};

const parsePriceBreakdown = (value: string | null | undefined): PriceSlice[] => {
    const entries = splitList(value, { allowComma: true }).slice(0, 6);
    if (!entries.length) return [];

    const raw = entries.map((entry, index) => {
        const percentMatch = entry.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
        const explicitPercent = percentMatch
            ? Math.min(100, Number(percentMatch[1]))
            : null;

        const label = normalizeHeading(
            entry
                .replace(/(\d{1,3}(?:\.\d+)?)\s*%/g, "")
                .replace(/\s*[:-]\s*$/, "")
                .replace(/^\W+/, "")
        );

        return {
            label: label || `Cost component ${index + 1}`,
            explicitPercent,
        };
    });

    const explicitTotal = raw.reduce(
        (sum, row) => sum + (row.explicitPercent ?? 0),
        0
    );
    const missingCount = raw.filter((row) => row.explicitPercent === null).length;

    let resolved = raw.map((row, index) => {
        if (row.explicitPercent !== null) {
            return {
                label: row.label,
                percent: row.explicitPercent,
                explicit: true,
            };
        }

        if (explicitTotal > 0 && explicitTotal < 100 && missingCount > 0) {
            return {
                label: row.label,
                percent: (100 - explicitTotal) / missingCount,
                explicit: false,
            };
        }

        if (explicitTotal <= 0) {
            return {
                label: row.label,
                percent:
                    FALLBACK_PERCENTS[index] ??
                    100 / Math.max(raw.length, 1),
                explicit: false,
            };
        }

        return {
            label: row.label,
            percent: 0,
            explicit: false,
        };
    });

    const total = resolved.reduce((sum, row) => sum + row.percent, 0);

    if (total > 100 && total > 0) {
        const scale = 100 / total;
        resolved = resolved.map((row) => ({
            ...row,
            percent: row.percent * scale,
        }));
    } else if (total <= 0) {
        const equal = 100 / Math.max(resolved.length, 1);
        resolved = resolved.map((row) => ({
            ...row,
            percent: equal,
        }));
    }

    return resolved.map((row) => ({
        ...row,
        percent: Math.max(1, Number(row.percent.toFixed(1))),
    }));
};

const buildDonutBackground = (slices: PriceSlice[]) => {
    if (!slices.length) {
        return `conic-gradient(${PRICE_COLORS[0]} 0% 100%)`;
    }

    const total = slices.reduce((sum, slice) => sum + slice.percent, 0);
    if (total <= 0) {
        return `conic-gradient(${PRICE_COLORS[0]} 0% 100%)`;
    }

    let current = 0;
    const segments = slices
        .map((slice, index) => {
            const width = (slice.percent / total) * 100;
            const start = current;
            const end = Number((current + width).toFixed(2));
            current = end;
            return `${PRICE_COLORS[index % PRICE_COLORS.length]} ${start}% ${end}%`;
        })
        .join(", ");

    return `conic-gradient(${segments})`;
};

const DecodeXSkeleton = () => (
    <section className="mt-6 w-full overflow-hidden rounded-[26px] border border-[#d5dfeb] bg-[#fcfbf6] p-5">
        <div className="h-4 w-48 animate-pulse rounded bg-[#d8e3ef]" />
        <div className="mt-4 h-10 w-64 animate-pulse rounded bg-[#dde7f2]" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-[#e7eef6]" />
        <div className="mt-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
            {[1, 2, 3].map((key) => (
                <div
                    key={key}
                    className="h-16 animate-pulse rounded-xl bg-[#eaf1fa]"
                />
            ))}
        </div>
        <div className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
            {[1, 2, 3, 4].map((key) => (
                <div
                    key={key}
                    className="h-40 animate-pulse rounded-2xl bg-[#edf3fa]"
                />
            ))}
        </div>
    </section>
);

const DecodeXEmptyState = ({ product }: { product: ProductWithBrand }) => (
    <section className="mt-6 w-full overflow-hidden rounded-[26px] border border-[#d5dfeb] bg-[#fcfbf6]">
        <div className="border-b border-[#dde6f1] bg-[radial-gradient(circle_at_top_right,_#edf3fb_0%,_#f4f7fb_50%,_#fcfbf6_100%)] px-5 py-6 sm:px-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="h-px w-6 bg-[#8aa8c8]" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6e88a8]">
                        DecodeX - Behind the Product
                    </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#c9d8e8] bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6881a0]">
                    <BadgeCheck className="size-3 text-[#82a4c7]" />
                    Profile in progress
                </div>
            </div>
            <h3 className="mt-4 font-playfair text-[2rem] leading-[1.05] text-[#1e2f46]">
                What you&apos;re <span className="italic text-[#7d9fc4]">really</span>{" "}
                buying
            </h3>
            <p className="mt-3 max-w-[68ch] text-sm leading-relaxed text-[#5f748c]">
                We are preparing DecodeX details for {product.brand.name}{" "}
                {product.subcategory.name.toLowerCase()}. This section will update
                automatically once the mapping is published.
            </p>
        </div>
    </section>
);

export const ProductCard = ({ product }: ProductCardProps) => {
    const { data: decodeX, isLoading } =
        trpc.general.decodex.getPublicByScope.useQuery({
            brandId: product.brandId,
            subcategoryId: product.subcategoryId,
        });

    if (isLoading) {
        return <DecodeXSkeleton />;
    }

    if (!decodeX) {
        return <DecodeXEmptyState product={product} />;
    }

    const certifications = splitList(decodeX.certifications, {
        allowComma: true,
    }).map(normalizeHeading);

    const locations = unique(
        [
            normalizeHeading(decodeX.rawMaterialSupplierLocation),
            normalizeHeading(decodeX.manufacturingLocation),
            normalizeHeading(decodeX.packingDispatchLocation),
        ].filter(Boolean)
    );

    const journeyCards: JourneyCard[] = [
            {
                id: "raw",
                title: "Raw Material",
                icon: Leaf,
                headline:
                    normalizeHeading(decodeX.mainMaterial) ||
                    "Material details are being added",
                details: [
                    decodeX.rawMaterialSupplierName
                        ? `Supplier: ${normalizeHeading(
                              decodeX.rawMaterialSupplierName
                          )}`
                        : "Supplier details are pending",
                    decodeX.rawMaterialSupplierLocation
                        ? `Origin: ${normalizeHeading(
                              decodeX.rawMaterialSupplierLocation
                          )}`
                        : "Origin not published yet",
                    "Traceable sourcing intent",
                ],
                isComplete: Boolean(
                    decodeX.mainMaterial || decodeX.rawMaterialSupplierName
                ),
            },
            {
                id: "manufacturing",
                title: "Manufacturing",
                icon: Factory,
                headline:
                    normalizeHeading(decodeX.manufacturerName) ||
                    "Manufacturing partner pending",
                details: [
                    decodeX.manufacturingLocation
                        ? `Facility: ${normalizeHeading(
                              decodeX.manufacturingLocation
                          )}`
                        : "Facility location not shared",
                    "Small-batch production setup",
                    "Skilled maker network",
                ],
                isComplete: Boolean(
                    decodeX.manufacturerName || decodeX.manufacturingLocation
                ),
            },
            {
                id: "packaging",
                title: "Packaging",
                icon: PackageCheck,
                headline:
                    normalizeHeading(decodeX.packingDispatchSource) ||
                    "Dispatch details pending",
                details: [
                    decodeX.packingDispatchLocation
                        ? `Dispatch: ${normalizeHeading(
                              decodeX.packingDispatchLocation
                          )}`
                        : "Dispatch location not shared",
                    `Virgin plastic: ${getBooleanLabel(
                        decodeX.virginPlasticUsed,
                        {
                            trueLabel: "Used",
                            falseLabel: "Not used",
                            unknownLabel: "Not specified",
                        }
                    )}`,
                    `Supplier declaration: ${getBooleanLabel(
                        decodeX.supplierDeclarationAvailable,
                        {
                            trueLabel: "Available",
                            falseLabel: "Not available",
                            unknownLabel: "Not specified",
                        }
                    )}`,
                ],
                isComplete: Boolean(
                    decodeX.packingDispatchSource || decodeX.packingDispatchLocation
                ),
            },
            {
                id: "certification",
                title: "Certification",
                icon: ShieldCheck,
                headline: certifications.length
                    ? certifications.join(", ")
                    : "Certification details pending",
                details: [
                    `Shareable proofs: ${getBooleanLabel(
                        decodeX.certificationShareable,
                        {
                            trueLabel: "Yes",
                            falseLabel: "No",
                            unknownLabel: "Not specified",
                        }
                    )}`,
                    certifications.length
                        ? `${certifications.length} certification item(s) listed`
                        : "No certification has been listed yet",
                    "Renivet profile verification",
                ],
                isComplete: certifications.length > 0,
            },
        ];

    const completedStageCount = journeyCards.filter((item) => item.isComplete).length;
    const priceSlices = parsePriceBreakdown(decodeX.storyPriceBreakdown);
    const priceSlicesForVisual =
        priceSlices.length > 0
            ? priceSlices
            : [{ label: "Breakdown shared soon", percent: 100, explicit: false }];
    const donutBackground = buildDonutBackground(priceSlicesForVisual);

    const storyCards: StoryCardData[] = [
            {
                id: "human",
                title: "The Human",
                icon: Users,
                content:
                    normalizeParagraph(decodeX.storyHuman) ||
                    "Human-impact details are being prepared for this product profile.",
            },
            {
                id: "truth",
                title: "The Truth",
                icon: ShieldCheck,
                content:
                    normalizeParagraph(decodeX.storyTruth) ||
                    "Source and material claims will appear here once published by the brand.",
            },
            {
                id: "impact",
                title: "The Impact",
                icon: Leaf,
                content:
                    normalizeParagraph(decodeX.storyImpact) ||
                    "Impact notes will be updated when the next data review is complete.",
            },
        ];

    const whyText =
        normalizeParagraph(decodeX.storyWhy) ||
        "This product is designed for mindful buying with transparent sourcing and production choices.";

    const safetyBanner =
        decodeX.virginPlasticUsed === false
            ? "No virgin plastic has been reported for this packaging flow."
            : decodeX.supplierDeclarationAvailable
              ? "Supplier declaration has been provided for this DecodeX profile."
              : "Journey insights are based on currently available supplier inputs.";

    return (
        <section className="mt-6 w-full overflow-hidden rounded-[26px] border border-[#d4deea] bg-[#fcfbf6] text-[#1d2f47] shadow-[0_1px_0_rgba(125,157,194,0.18)]">
            <header className="relative overflow-hidden border-b border-[#dce5ef] bg-[radial-gradient(circle_at_top_right,_#eaf1fa_0%,_#f3f7fc_42%,_#fbfaf6_100%)] px-5 py-6 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-px w-6 bg-[#89aacd]" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f89a9]">
                            DecodeX - Behind the Product
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#cadaea] bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6782a3]">
                        <BadgeCheck className="size-3.5 text-[#7f9fc2]" />
                        Renivet Verified
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    <h3 className="font-playfair text-[2.15rem] leading-[1.02] text-[#1e2f46] sm:text-[2.35rem]">
                        What you&apos;re{" "}
                        <span className="italic text-[#7f9fc3]">really</span> buying
                    </h3>
                    <p className="max-w-[68ch] text-sm leading-relaxed text-[#60768f]">
                        Full transparency into the people, places, and principles
                        behind this product so every purchase is a conscious one.
                    </p>
                </div>
            </header>

            <div className="grid border-b border-[#dbe4ef] bg-[#eaf1fa] [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                <StatTile
                    icon={Sparkles}
                    value={`${completedStageCount}/4`}
                    label="Mapped journey stages"
                    withBorder
                />
                <StatTile
                    icon={PackageCheck}
                    value={getBooleanLabel(decodeX.virginPlasticUsed, {
                        trueLabel: "Yes",
                        falseLabel: "0%",
                        unknownLabel: "N/A",
                    })}
                    label="Virgin plastic in packaging"
                    withBorder
                />
                <StatTile
                    icon={ShieldCheck}
                    value={`${Math.max(certifications.length, 1)}`}
                    label={
                        certifications.length
                            ? `Certifications - ${certifications.join(" + ")}`
                            : "Certifications listed"
                    }
                />
            </div>

            <div className="space-y-6 bg-[#f2f6fb] px-5 py-6 sm:px-6">
                <SectionHeading title="A Mapped Journey" />

                <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
                    {journeyCards.map((card, index) => (
                        <article
                            key={card.id}
                            className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#d9e3ef] bg-white p-4 transition-colors duration-200 hover:bg-[#fbfdff]"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="flex size-9 items-center justify-center rounded-full border border-[#c9d7e7] bg-[#eff4fa] text-[#6f8fb4]">
                                    <card.icon className="size-4" />
                                </span>
                                <span className="text-xs font-semibold tracking-[0.08em] text-[#b4c3d3]">
                                    {(index + 1).toString().padStart(2, "0")}
                                </span>
                            </div>

                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#89a1bb]">
                                {card.title}
                            </p>

                            <p className="mt-2 text-lg leading-tight text-[#223650] [overflow-wrap:anywhere]">
                                {card.headline}
                            </p>

                            <ul className="mt-3 space-y-1.5">
                                {card.details.map((detail) => (
                                    <li
                                        key={`${card.id}-${detail}`}
                                        className="flex items-start gap-2 text-sm leading-relaxed text-[#5a6f87]"
                                    >
                                        <CircleDot className="mt-0.5 size-3 shrink-0 text-[#95aac2]" />
                                        <span className="[overflow-wrap:anywhere]">
                                            {detail}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <span className="pointer-events-none absolute -bottom-3 right-2 text-[3.1rem] leading-none text-[#eff4f9]">
                                {(index + 1).toString().padStart(2, "0")}
                            </span>
                        </article>
                    ))}
                </div>

                <div className="rounded-2xl border border-[#d7e0ec] bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#324965]">
                        <MapPin className="size-4 text-[#7395bc]" />
                        Supply chain footprint
                    </div>

                    {locations.length > 0 ? (
                        <div className="mt-3 space-y-1.5">
                            {locations.map((location) => (
                                <p
                                    key={location}
                                    className="flex items-start gap-2 text-sm leading-relaxed text-[#4f647d]"
                                >
                                    <span className="mt-2 inline-flex size-2 rounded-full bg-[#87a9cb]" />
                                    <span className="[overflow-wrap:anywhere]">
                                        {location}
                                    </span>
                                </p>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-[#60758d]">
                            Location milestones will appear once suppliers publish
                            complete journey points.
                        </p>
                    )}
                </div>

                <div className="rounded-2xl border border-[#d3deea] bg-[#e9f1fb] px-4 py-3">
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-[#506783]">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#6f90b5]" />
                        <span className="[overflow-wrap:anywhere]">{safetyBanner}</span>
                    </p>
                </div>
            </div>

            <div className="border-t border-[#dce5ef] bg-[#fcfbf6] px-5 py-6 sm:px-6">
                <SectionHeading title="Story Behind the Product" />

                <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
                    {storyCards.map((story, index) => (
                        <article
                            key={story.id}
                            className="flex min-w-0 flex-col rounded-2xl border border-[#d9e3ef] bg-white p-4"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="flex size-9 items-center justify-center rounded-xl border border-[#cad8e8] bg-[#eff4fa] text-[#708fb2]">
                                    <story.icon className="size-4" />
                                </span>
                                <span className="text-[10px] font-semibold tracking-widest text-[#bbc8d6]">
                                    {(index + 1).toString().padStart(2, "0")}
                                </span>
                            </div>

                            <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#86a0ba]">
                                {story.title}
                            </p>

                            <ExpandableCopy
                                text={story.content}
                                limit={280}
                                className="mt-3 text-[15px] leading-relaxed text-[#4c617a]"
                            />
                        </article>
                    ))}
                </div>
            </div>

            <div className="space-y-4 border-t border-[#dce5ef] bg-[#fcfbf6] px-5 py-6 sm:px-6">
                <article className="rounded-2xl border border-[#d8e2ef] bg-white p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#89a2bd]">
                        Why choose this
                    </p>
                    <ExpandableCopy
                        text={`"${whyText}"`}
                        limit={340}
                        className="mt-3 font-playfair text-[2rem] italic leading-[1.2] text-[#2d4564] sm:text-[2.15rem]"
                        buttonClassName="mt-3"
                    />
                </article>

                <article className="overflow-hidden rounded-2xl border border-[#d8e2ef] bg-white">
                    <div className="grid gap-0 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
                        <div className="bg-[linear-gradient(150deg,#84acda_0%,#8db4de_36%,#9ec2e7_100%)] p-5 text-white">
                            <p className="font-playfair text-[2.2rem] leading-[1.05]">
                                What&apos;s
                                <br />
                                in the
                                <br />
                                price
                            </p>
                            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-white/90">
                                What customers usually do not see
                            </p>
                        </div>

                        <div className="p-5">
                            {priceSlices.length > 0 ? (
                                <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
                                    <div className="flex items-center justify-center">
                                        <div
                                            className="relative size-[112px] rounded-full"
                                            style={{ background: donutBackground }}
                                        >
                                            <div className="absolute inset-[18px] flex items-center justify-center rounded-full bg-white text-[10px] font-medium uppercase tracking-[0.12em] text-[#748eab]">
                                                Price Mix
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {priceSlices.map((slice, index) => (
                                            <div key={`${slice.label}-${index}`} className="space-y-1">
                                                <div className="flex items-start gap-2 text-sm text-[#4f647e]">
                                                    <span
                                                        className="mt-1 inline-flex size-2.5 shrink-0 rounded-sm"
                                                        style={{
                                                            backgroundColor:
                                                                PRICE_COLORS[
                                                                    index %
                                                                        PRICE_COLORS.length
                                                                ],
                                                        }}
                                                    />
                                                    <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                                                        {slice.label}
                                                    </span>
                                                    <span className="shrink-0 font-semibold text-[#587393]">
                                                        {Math.round(slice.percent)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-[#e8eef6]">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${Math.min(
                                                                100,
                                                                Math.max(
                                                                    2,
                                                                    slice.percent
                                                                )
                                                            )}%`,
                                                            backgroundColor:
                                                                PRICE_COLORS[
                                                                    index %
                                                                        PRICE_COLORS.length
                                                                ],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-[#cfdae7] bg-[#f7f9fc] p-4 text-sm leading-relaxed text-[#60758f]">
                                    Price split details are not published yet. This
                                    area will populate as soon as the brand adds a
                                    breakdown.
                                </div>
                            )}

                            {decodeX.storyPriceBreakdown && priceSlices.length <= 1 && (
                                <ExpandableCopy
                                    text={normalizeParagraph(decodeX.storyPriceBreakdown)}
                                    limit={210}
                                    className="mt-4 text-sm leading-relaxed text-[#57708d]"
                                />
                            )}
                        </div>
                    </div>
                </article>
            </div>
        </section>
    );
};

function SectionHeading({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7f98b3]">
                {title}
            </p>
            <div className="h-px flex-1 bg-[#d8e3ef]" />
        </div>
    );
}

function StatTile({
    icon: Icon,
    value,
    label,
    withBorder,
}: {
    icon: LucideIcon;
    value: string;
    label: string;
    withBorder?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex min-w-0 items-start gap-3 p-4",
                withBorder &&
                    "border-b border-[#d2dcea] sm:border-b-0 sm:border-r"
            )}
        >
            <Icon className="mt-0.5 size-4 shrink-0 text-[#6d86a7]" />
            <div className="min-w-0">
                <p className="text-2xl leading-none text-[#23364f]">{value}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#5e748d] [overflow-wrap:anywhere]">
                    {label}
                </p>
            </div>
        </div>
    );
}

function ExpandableCopy({
    text,
    limit,
    className,
    buttonClassName,
}: {
    text: string;
    limit: number;
    className?: string;
    buttonClassName?: string;
}) {
    const [expanded, setExpanded] = useState(false);

    if (!text) return null;

    const showButton = text.length > limit;
    const visibleText = showButton && !expanded ? trimToWord(text, limit) : text;

    return (
        <>
            <p className={cn("break-words [overflow-wrap:anywhere]", className)}>
                {visibleText}
            </p>
            {showButton && (
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className={cn(
                        "text-xs font-semibold uppercase tracking-[0.18em] text-[#6c88a8] transition-colors hover:text-[#4e6886]",
                        buttonClassName
                    )}
                >
                    {expanded ? "Show less" : "Read more"}
                </button>
            )}
        </>
    );
}
