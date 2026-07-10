import { CachedBrand } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { Globe, MoveRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BrandShopHeroProps {
    brand: CachedBrand;
}

export function BrandShopHero({ brand }: BrandShopHeroProps) {
    const websiteUrl =
        brand.website && /^https?:\/\//i.test(brand.website)
            ? brand.website
            : brand.website
              ? `https://${brand.website}`
              : null;

    return (
        <section className="overflow-hidden rounded-[30px] border border-[#d8c8b0] bg-[#f8f1e7] shadow-[0_30px_80px_rgba(88,57,26,0.12)]">
            <div className="relative">
                <div
                    className={cn(
                        "relative min-h-[320px] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,241,217,0.95),_rgba(202,165,117,0.55)_42%,_rgba(43,27,14,0.92)_100%)] px-6 py-8 md:min-h-[420px] md:px-10 md:py-10",
                        !brand.coverUrl &&
                            "bg-[radial-gradient(circle_at_top_left,_rgba(255,244,229,0.98),_rgba(217,183,140,0.82)_38%,_rgba(73,46,20,0.96)_100%)]"
                    )}
                >
                    {brand.coverUrl && (
                        <>
                            <Image
                                src={brand.coverUrl}
                                alt={brand.name}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(25,16,10,0.2),rgba(25,16,10,0.68)_44%,rgba(25,16,10,0.92)_100%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,241,214,0.52),transparent_35%)]" />
                        </>
                    )}

                    <div className="relative z-10 grid gap-8 md:grid-cols-[minmax(0,1.15fr)_280px] md:items-end">
                        <div className="space-y-6 text-white">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 backdrop-blur">
                                <Sparkles className="size-3.5" />
                                Brand Shop
                            </div>

                            <div className="space-y-4">
                                <h1 className="max-w-3xl font-serif text-4xl leading-tight tracking-[-0.03em] md:text-6xl">
                                    {brand.name}
                                </h1>
                                <p className="max-w-2xl text-sm leading-7 text-white/78 md:text-base">
                                    {brand.bio?.trim().length
                                        ? brand.bio
                                        : `${brand.name} brings a considered point of view to the Renivet storefront with a curated catalog shaped for conscious, design-led shopping.`}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="#brand-shop-catalog"
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#3b2414] transition-transform duration-200 hover:-translate-y-0.5"
                                >
                                    Explore Collection
                                    <MoveRight className="size-4" />
                                </Link>
                                <Link
                                    href={`/brands/${brand.id}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15"
                                >
                                    View Brand Profile
                                </Link>
                                {websiteUrl && (
                                    <Link
                                        href={websiteUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/88 transition-colors hover:bg-white/10"
                                    >
                                        <Globe className="size-4" />
                                        Visit Website
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="relative flex items-end justify-start md:justify-end">
                            <div className="w-full max-w-[280px] rounded-[28px] border border-white/18 bg-white/10 p-5 text-white backdrop-blur-md">
                                <div className="mb-5 flex items-center gap-4">
                                    <div className="relative size-16 overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-[0_14px_34px_rgba(0,0,0,0.15)]">
                                        {brand.logoUrl ? (
                                            <Image
                                                src={brand.logoUrl}
                                                alt={brand.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center bg-[#f3eadf] text-xl font-semibold text-[#422818]">
                                                {brand.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
                                            Curated on Renivet
                                        </p>
                                        <p className="text-lg font-semibold">
                                            @{brand.slug}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 text-sm text-white/78">
                                    <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                                        Discover the full catalog with shop-style filtering, refined browsing, and a premium brand-first presentation.
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">
                                                Experience
                                            </p>
                                            <p className="mt-1 font-medium text-white">
                                                Luxury storefront
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">
                                                Browse
                                            </p>
                                            <p className="mt-1 font-medium text-white">
                                                Brand-only catalog
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
