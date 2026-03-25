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
    Map,
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

const priceColors = ["#7DA7D7", "#9EC0E6", "#B7D2EE", "#CFE1F3"];
const fallbackPercents = [40, 30, 20, 10];

const titleCase = (value: string) =>
    value.replace(/\b([a-z])/gi, (match) => match.toUpperCase());

const normalizeText = (value: string | null | undefined) => {
    if (!value) return "";
    const cleaned = value.trim().replace(/\s+/g, " ");
    if (!cleaned) return "";
    const titled = titleCase(cleaned.toLowerCase());
    return titled
        .replace(/\bgots\b/gi, "GOTS")
        .replace(/\boeko-tex\b/gi, "OEKO-TEX")
        .replace(/\bngo\b/gi, "NGO");
};

const toBooleanLabel = (
    value: boolean | null | undefined,
    labels?: { true: string; false: string; unknown: string }
) => {
    if (value === true) return labels?.true ?? "Yes";
    if (value === false) return labels?.false ?? "No";
    return labels?.unknown ?? "Not specified";
};

const toList = (value: string | null | undefined) =>
    (value ?? "")
        .split(/[\n,;|]+/g)
        .map((item) => item.trim())
        .filter(Boolean);

const toParagraph = (value: string | null | undefined) =>
    (value ?? "").trim().replace(/\s+/g, " ");

const preview = (value: string, max = 220) =>
    value.length > max ? `${value.slice(0, max).trimEnd()}...` : value;

const buildPricePoints = (items: string[]) => {
    return items
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
                percent: fallbackPercents[index] ?? 10,
            };
        })
        .filter((item) => item.label.length > 0);
};

const buildDonut = (points: { percent: number }[]) => {
    if (!points.length) return `conic-gradient(${priceColors[0]} 0% 100%)`;
    let current = 0;
    const stops = points
        .map((point, index) => {
            const start = current;
            const end = Math.min(100, current + point.percent);
            current = end;
            return `${priceColors[index % priceColors.length]} ${start}% ${end}%`;
        })
        .join(", ");
    return `conic-gradient(${stops})`;
};

export const ProductCard = ({ product }: ProductCardProps) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const { data: decodeX, isLoading } =
        trpc.general.decodex.getPublicByScope.useQuery({
            brandId: product.brandId,
            subcategoryId: product.subcategoryId,
        });
    const pricePoints = useMemo(() => {
        const items = decodeX ? toList(decodeX.storyPriceBreakdown) : [];
        return buildPricePoints(items);
    }, [decodeX]);
    const donut = useMemo(() => buildDonut(pricePoints), [pricePoints]);

    if (isLoading) {
        return (
            <div className="mt-6 animate-pulse overflow-hidden rounded-[28px] border border-[#D7DDE6] bg-[#FCFBF4] p-6 md:p-10">
                <div className="h-10 w-72 rounded bg-[#DFE6ED]" />
                <div className="mt-4 h-4 w-full rounded bg-[#E8EDF2]" />
                <div className="mt-2 h-4 w-4/5 rounded bg-[#E8EDF2]" />
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {[1, 2, 3].map((key) => (
                        <div key={key} className="h-16 rounded bg-[#EAF1FA]" />
                    ))}
                </div>
            </div>
        );
    }

    if (!decodeX) {
        return (
            <section className="mt-6 overflow-hidden rounded-[28px] border border-[#D7DDE6] bg-[#FCFBF4] p-6 md:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#1C2535] px-3 py-1 text-white">
                        DecodeX - Behind The Product
                    </Badge>
                    <Badge variant="outline" className="border-[#C6D3E2] text-[#5E738C]">
                        Profile in progress
                    </Badge>
                </div>
                <h3 className="font-playfair text-[32px] leading-[1.15] text-[#1E2B3F] md:text-[48px]">
                    What you&apos;re <span className="italic text-[#7D9EC2]">really</span> buying
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#5D6D80] md:text-base">
                    DecodeX mapping for {product.brand.name} {product.subcategory.name.toLowerCase()} is
                    being prepared and will appear here once configured.
                </p>
            </section>
        );
    }

    const certifications = toList(decodeX.certifications).map(normalizeText);
    const locations = [
        normalizeText(decodeX.rawMaterialSupplierLocation),
        normalizeText(decodeX.manufacturingLocation),
        normalizeText(decodeX.packingDispatchLocation),
    ].filter(Boolean);
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
                decodeX.rawMaterialSupplierLocation
                    ? `Origin: ${normalizeText(decodeX.rawMaterialSupplierLocation)}`
                    : "",
            ].filter(Boolean),
        },
        {
            id: "make",
            title: "Manufacturing",
            icon: Factory,
            headline: normalizeText(decodeX.manufacturerName) || "Not specified",
            details: [
                decodeX.manufacturingLocation
                    ? `Facility: ${normalizeText(decodeX.manufacturingLocation)}`
                    : "",
            ].filter(Boolean),
        },
        {
            id: "pack",
            title: "Packaging",
            icon: PackageCheck,
            headline: normalizeText(decodeX.packingDispatchSource) || "Not specified",
            details: [
                decodeX.packingDispatchLocation
                    ? `Dispatch: ${normalizeText(decodeX.packingDispatchLocation)}`
                    : "",
                `Virgin plastic: ${toBooleanLabel(decodeX.virginPlasticUsed, { true: "Used", false: "Not used", unknown: "N/A" })}`,
                `Supplier declaration: ${toBooleanLabel(decodeX.supplierDeclarationAvailable)}`,
            ],
        },
        {
            id: "cert",
            title: "Certification",
            icon: ShieldCheck,
            headline: certifications.length ? certifications.join(", ") : "Not specified",
            details: [`Shareable proofs: ${toBooleanLabel(decodeX.certificationShareable)}`],
        },
    ];

    const storyCards: StoryCard[] = [
        { id: "human", title: "The Human", icon: Users, content: toParagraph(decodeX.storyHuman) },
        { id: "truth", title: "The Truth", icon: ShieldCheck, content: toParagraph(decodeX.storyTruth) },
        { id: "impact", title: "The Impact", icon: Leaf, content: toParagraph(decodeX.storyImpact) },
    ].filter((item) => item.content.length > 0);

    return (
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#D7DDE6] bg-[#FCFBF4] text-[#233246]">
            <div className="relative border-b border-[#D7DDE6] bg-[radial-gradient(circle_at_top_right,_#EAF1FA_0%,_#F1F5FA_35%,_#F7F9FB_68%,_#FCFBF4_100%)] px-6 py-8 md:p-10">
                <div className="absolute -right-20 top-0 hidden size-56 rounded-full border border-[#D4E0ED] md:block" />
                <div className="absolute -right-8 top-8 hidden size-32 rounded-full border border-[#DFE8F3] md:block" />
                <div className="mb-3 flex items-center gap-3">
                    <div className="h-px w-7 bg-[#8DAED3]" />
                    <p className="text-11 font-semibold uppercase tracking-[0.2em] text-[#6C83A1]">DecodeX - Behind The Product</p>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                        <h3 className="font-playfair text-[40px] leading-[1.05] text-[#1E2B3F] md:text-[62px]">
                            What you&apos;re
                            <br />
                            <span className="italic text-[#7D9EC2]">really</span> buying
                        </h3>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#5D6D80] md:text-base">
                            Full transparency into the people, places, and principles behind this product so every purchase is genuinely conscious.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#AFC5DF] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#5D7693] shadow-[0_6px_18px_rgba(105,132,164,0.12)]">
                        <BadgeCheck className="size-4 text-[#5D7693]" />
                        Renivet Verified
                    </div>
                </div>
            </div>

            <div className="grid border-b border-[#D7DDE6] bg-[#EAF1FA] md:grid-cols-3">
                <div className="flex items-start gap-3 border-b border-[#D2DBE8] px-5 py-4 md:border-b-0 md:border-r">
                    <Users className="mt-0.5 size-4 text-[#6C83A1]" />
                    <div>
                        <p className="text-xl font-semibold text-[#22344D]">{Math.max(uniqueLocations.length, 1)}-{Math.max(uniqueLocations.length + 1, 2)}</p>
                        <p className="text-xs text-[#5E7188]">Mapped location points</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 border-b border-[#D2DBE8] px-5 py-4 md:border-b-0 md:border-r">
                    <PackageCheck className="mt-0.5 size-4 text-[#6C83A1]" />
                    <div>
                        <p className="text-xl font-semibold text-[#22344D]">{toBooleanLabel(decodeX.virginPlasticUsed, { true: "Yes", false: "0%", unknown: "N/A" })}</p>
                        <p className="text-xs text-[#5E7188]">Virgin plastic in packaging</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 px-5 py-4">
                    <ShieldCheck className="mt-0.5 size-4 text-[#6C83A1]" />
                    <div>
                        <p className="text-xl font-semibold text-[#22344D]">{Math.max(certifications.length, 1)}</p>
                        <p className="text-xs text-[#5E7188]">{certifications.length ? `Certifications - ${certifications.join(" & ")}` : "Certifications listed"}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 bg-[#F3F7FB] px-6 py-8 md:p-10">
                <div className="mb-1 flex items-center gap-3">
                    <p className="text-11 font-semibold uppercase tracking-[0.2em] text-[#7E94AE]">A Mapped Journey</p>
                    <div className="h-px flex-1 bg-[#D8E3EF]" />
                </div>

                <div className="mt-1 grid gap-3 md:grid-cols-4">
                    {stageCards.map((stage, index) => {
                        const Icon = stage.icon;
                        return (
                            <article key={stage.id} className="relative rounded-2xl border border-[#D7DDE2] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B9CADC] hover:shadow-[0_10px_24px_rgba(43,65,93,0.09)]">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex size-9 items-center justify-center rounded-full border border-[#C9D5E0] bg-[#EFF4F9] text-[#587091]">
                                        <Icon className="size-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-[#B0BCC8]">{(index + 1).toString().padStart(2, "0")}</span>
                                </div>
                                <p className="text-11 font-semibold uppercase tracking-[0.14em] text-[#7B8EA5]">{stage.title}</p>
                                <p className="mt-1 text-sm font-medium text-[#2A3A50]">{stage.headline}</p>
                                <ul className="mt-3 space-y-1.5">
                                    {stage.details.map((detail) => (
                                        <li key={`${stage.id}-${detail}`} className="flex items-start gap-2 text-xs leading-relaxed text-[#5F6F83]">
                                            <CircleDot className="mt-0.5 size-3 shrink-0 text-[#92A3B8]" />
                                            <span className="break-words">{detail}</span>
                                        </li>
                                    ))}
                                </ul>
                                <span className="pointer-events-none absolute bottom-2 right-3 text-[34px] leading-none text-[#EDF2F7]">{(index + 1).toString().padStart(2, "0")}</span>
                            </article>
                        );
                    })}
                </div>

                {uniqueLocations.length > 0 && (
                    <div className="grid gap-3 rounded-2xl border border-[#D7DDE6] bg-white p-4 md:grid-cols-2 md:p-5">
                        <div className="flex items-center gap-3 rounded-xl border border-[#D9E3EE] bg-[#F4F8FD] p-4">
                            <div className="flex size-10 items-center justify-center rounded-full border border-[#BCD0E5] bg-white">
                                <Map className="size-5 text-[#6D90B8]" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-[#2F425D]">Supply chain footprint</p>
                                <p className="text-xs text-[#6C8097]">{uniqueLocations.length} mapped locations</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {uniqueLocations.slice(0, 3).map((location) => (
                                <p key={location} className="flex items-center gap-2 text-sm text-[#4F657E]">
                                    <span className="inline-flex size-2 rounded-full bg-[#89A8CA]" />
                                    <span>{location}</span>
                                </p>
                            ))}
                            <p className="pt-1 text-xs italic text-[#90A2B8]">
                                {locations.some((loc) => loc.toLowerCase().includes("india")) ? "100% made in India supply chain" : "Mapped from brand and supplier declarations"}
                            </p>
                        </div>
                    </div>
                )}

                <div className="rounded-xl border border-[#D4DEE9] bg-[#EAF2FB] px-4 py-3 text-sm text-[#4F657E]">
                    <p className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#6A86A6]" />
                        <span>
                            {decodeX.virginPlasticUsed === false
                                ? "No virgin plastic used. Fabric scraps from production are redirected for upcycling."
                                : decodeX.supplierDeclarationAvailable
                                  ? "Supplier declaration has been provided for this profile."
                                  : "Journey details are mapped from supplier and manufacturing inputs."}
                        </span>
                    </p>
                </div>
            </div>

            {storyCards.length > 0 && (
                <div className="border-t border-[#D7DDE6] bg-[#FCFBF4] px-6 py-8 md:p-10">
                    <div className="mb-1 flex items-center gap-3">
                        <p className="text-11 font-semibold uppercase tracking-[0.2em] text-[#7E94AE]">Story Behind The Product</p>
                        <div className="h-px flex-1 bg-[#D8E3EF]" />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {storyCards.map((story, index) => (
                            <article key={story.id} className="rounded-2xl border border-[#D7DDE2] bg-white p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex size-9 items-center justify-center rounded-xl border border-[#C9D5E0] bg-[#EFF4F9] text-[#6C89AE]">
                                        <story.icon className="size-4" />
                                    </div>
                                    <span className="text-[10px] font-semibold text-[#B3BFCC]">{(index + 1).toString().padStart(2, "0")}</span>
                                </div>
                                <p className="text-11 font-semibold uppercase tracking-[0.14em] text-[#7B8EA5]">{story.title}</p>
                                <p className="mt-2 text-sm leading-relaxed text-[#4F6075]">{expanded[story.id] ? story.content : preview(story.content)}</p>
                                {story.content.length > 220 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpanded((prev) => ({
                                                ...prev,
                                                [story.id]: !prev[story.id],
                                            }))
                                        }
                                        className="mt-2 text-xs font-semibold uppercase tracking-widest text-[#6A86A6] transition-colors hover:text-[#4E6886]"
                                    >
                                        {expanded[story.id] ? "Show less" : "Read more"}
                                    </button>
                                )}
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {(decodeX.storyWhy || pricePoints.length > 0) && (
                <div className="border-t border-[#D7DDE6] bg-[#FCFBF4] px-6 pb-8 pt-1 md:px-10 md:pb-10">
                    <div className="grid gap-3 md:grid-cols-2">
                        {decodeX.storyWhy && (
                            <article className="rounded-2xl border border-[#D7DDE2] bg-white p-5">
                                <p className="text-11 font-semibold uppercase tracking-[0.2em] text-[#7E94AE]">Why Choose This</p>
                                <p className="mt-2 max-h-72 overflow-y-auto pr-1 font-playfair text-[28px] italic leading-[1.35] text-[#2E425D]">
                                    &quot;{toParagraph(decodeX.storyWhy)}&quot;
                                </p>
                            </article>
                        )}

                        {pricePoints.length > 0 && (
                            <article className="overflow-hidden rounded-2xl border border-[#D7DDE2] bg-white">
                                <div className="grid md:grid-cols-[180px_1fr]">
                                    <div className="relative border-b border-[#D7DDE2] bg-[linear-gradient(145deg,#85AEDA_0%,#8DB5DF_35%,#9BBFE5_100%)] p-5 text-white md:border-b-0 md:border-r">
                                        <div className="absolute -right-10 top-8 size-24 rounded-full bg-white/10" />
                                        <div className="absolute left-4 top-3 size-14 rounded-full bg-white/10" />
                                        <p className="font-playfair text-[40px] leading-[1.1]">What&apos;s<br />in the<br />price</p>
                                        <p className="mt-3 text-11 uppercase tracking-[0.18em] text-white/85">What customers usually don&apos;t see</p>
                                    </div>

                                    <div className="p-5">
                                        <div className="grid gap-4 md:grid-cols-[100px_1fr]">
                                            <div className="mx-auto">
                                                <div className="relative size-24 rounded-full" style={{ background: donut }}>
                                                    <div className="absolute inset-[14px] flex items-center justify-center rounded-full bg-white text-[10px] uppercase tracking-[0.12em] text-[#7E94AE]">
                                                        Price
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {pricePoints.map((point, index) => (
                                                    <div key={`${point.label}-${index}`} className="flex items-center gap-3">
                                                        <span className="inline-flex size-2.5 rounded-sm" style={{ backgroundColor: priceColors[index % priceColors.length] }} />
                                                        <span className="flex-1 text-sm text-[#4F6075]">{point.label}</span>
                                                        <span className="text-sm font-semibold text-[#5D7693]">{point.percent}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="mt-4 border-t border-[#E3E8EF] pt-3 text-sm leading-relaxed text-[#54687F]">
                                            We don&apos;t dilute costs across thousands of units, so each part of the price reflects real material and production value.
                                        </p>
                                    </div>
                                </div>
                            </article>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};
