import { CachedBrand } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { MoveRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BrandShopHeroProps {
    brand: CachedBrand;
}

export function BrandShopHero({ brand }: BrandShopHeroProps) {
    const hasCover = !!brand.coverUrl;

    return (
        <section className="overflow-hidden rounded-[30px] border border-[#ddd7cd] bg-[#f6f1e8] shadow-[0_30px_80px_rgba(79,62,44,0.1)]">
            <div className="relative">
                <div
                    className={cn(
                        "relative min-h-[320px] overflow-hidden px-6 py-8 md:min-h-[420px] md:px-10 md:py-10",
                        hasCover
                            ? "bg-[radial-gradient(circle_at_top_left,_rgba(252,247,239,0.98),_rgba(224,205,177,0.68)_40%,_rgba(122,99,73,0.92)_100%)]"
                            : "bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(239,232,223,0.82)_32%,rgba(218,208,194,0.72)_62%,rgba(196,182,164,0.78)_100%)]"
                    )}
                >
                    {hasCover ? (
                        <>
                            <Image
                                src={brand.coverUrl}
                                alt={brand.name}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(31,24,17,0.12),rgba(52,40,28,0.52)_44%,rgba(64,49,35,0.82)_100%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(252,242,224,0.48),transparent_35%)]" />
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.9),transparent_26%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.46),transparent_22%)]" />
                            <div className="absolute left-[8%] top-[16%] h-32 w-32 rounded-full border border-white/40 bg-white/14 backdrop-blur-2xl md:h-44 md:w-44" />
                            <div className="absolute bottom-[12%] left-[34%] h-24 w-24 rounded-full border border-white/35 bg-white/12 backdrop-blur-xl md:h-36 md:w-36" />
                            <div className="absolute right-[10%] top-[22%] h-40 w-40 rounded-full border border-white/30 bg-white/10 backdrop-blur-2xl md:h-52 md:w-52" />
                            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03)_35%,rgba(101,76,48,0.18)_100%)]" />
                            <div className="absolute inset-x-[6%] top-[14%] h-[1px] bg-white/45" />
                            <div className="absolute inset-x-[12%] bottom-[18%] h-[1px] bg-white/28" />
                        </>
                    )}

                    <div className="relative z-10 grid gap-8 md:grid-cols-[minmax(0,1.15fr)_280px] md:items-end">
                        <div
                            className={cn(
                                "space-y-6",
                                hasCover ? "text-white" : "text-[#4a3424]"
                            )}
                        >
                            <div
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] backdrop-blur",
                                    hasCover
                                        ? "border border-white/25 bg-white/10 text-white/85"
                                        : "border border-white/55 bg-white/28 text-[#6e5640] shadow-[0_10px_30px_rgba(255,255,255,0.18)]"
                                )}
                            >
                                <Sparkles className="size-3.5" />
                                Brand Shop
                            </div>

                            <div className="space-y-4">
                                <h1 className="max-w-3xl font-serif text-4xl leading-tight tracking-[-0.03em] md:text-6xl">
                                    {brand.name}
                                </h1>
                                <p
                                    className={cn(
                                        "max-w-2xl text-sm leading-7 md:text-base",
                                        hasCover
                                            ? "text-white/78"
                                            : "text-[#6b5644]"
                                    )}
                                >
                                    {brand.bio?.trim().length
                                        ? brand.bio
                                        : `${brand.name} brings a considered point of view to the Renivet storefront with a curated catalog shaped for conscious, design-led shopping.`}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="#brand-shop-catalog"
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5",
                                        hasCover
                                            ? "bg-white text-[#3b2414]"
                                            : "border border-white/70 bg-white/70 text-[#4d3625] shadow-[0_18px_38px_rgba(146,123,97,0.18)] backdrop-blur-xl"
                                    )}
                                >
                                    Explore Collection
                                    <MoveRight className="size-4" />
                                </Link>
                                <Link
                                    href={`/brands/${brand.id}`}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold backdrop-blur transition-colors",
                                        hasCover
                                            ? "border border-white/25 bg-white/10 text-white hover:bg-white/15"
                                            : "border border-white/70 bg-white/22 text-[#5f4735] shadow-[0_18px_36px_rgba(167,146,120,0.14)] hover:bg-white/35"
                                    )}
                                >
                                    View Brand Profile
                                </Link>
                            </div>
                        </div>

                        <div className="relative flex items-end justify-start md:justify-end">
                            <div
                                className={cn(
                                    "w-full max-w-[280px] rounded-[28px] p-5 backdrop-blur-md",
                                    hasCover
                                        ? "border border-white/20 bg-[rgba(255,255,255,0.08)] text-white"
                                        : "border border-white/60 bg-[rgba(255,255,255,0.18)] text-[#4c3727] shadow-[0_24px_50px_rgba(154,131,106,0.18)]"
                                )}
                            >
                                <div className="mb-5 flex items-center gap-4">
                                    <div
                                        className={cn(
                                            "relative size-16 overflow-hidden rounded-2xl bg-white/95 shadow-[0_14px_34px_rgba(0,0,0,0.15)]",
                                            hasCover
                                                ? "border border-white/30"
                                                : "border border-white/70"
                                        )}
                                    >
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
                                        <p
                                            className={cn(
                                                "text-[10px] font-semibold uppercase tracking-[0.22em]",
                                                hasCover
                                                    ? "text-white/65"
                                                    : "text-[#7b6654]"
                                            )}
                                        >
                                            Curated on Renivet
                                        </p>
                                        <p className="text-lg font-semibold">
                                            @{brand.slug}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={cn(
                                        "grid gap-3 text-sm",
                                        hasCover
                                            ? "text-white/78"
                                            : "text-[#614d3d]"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-3",
                                            hasCover
                                                ? "border border-white/12 bg-[rgba(58,44,30,0.18)]"
                                                : "border border-white/55 bg-white/18"
                                        )}
                                    >
                                        Discover the full catalog with shop-style filtering, refined browsing, and a premium brand-first presentation.
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div
                                            className={cn(
                                                "rounded-2xl px-4 py-3",
                                                hasCover
                                                    ? "border border-white/12 bg-[rgba(58,44,30,0.18)]"
                                                    : "border border-white/55 bg-white/18"
                                            )}
                                        >
                                            <p
                                                className={cn(
                                                    "text-[10px] uppercase tracking-[0.18em]",
                                                    hasCover
                                                        ? "text-white/55"
                                                        : "text-[#826e5d]"
                                                )}
                                            >
                                                Experience
                                            </p>
                                            <p
                                                className={cn(
                                                    "mt-1 font-medium",
                                                    hasCover
                                                        ? "text-white"
                                                        : "text-[#4d3828]"
                                                )}
                                            >
                                                Luxury storefront
                                            </p>
                                        </div>
                                        <div
                                            className={cn(
                                                "rounded-2xl px-4 py-3",
                                                hasCover
                                                    ? "border border-white/12 bg-[rgba(58,44,30,0.18)]"
                                                    : "border border-white/55 bg-white/18"
                                            )}
                                        >
                                            <p
                                                className={cn(
                                                    "text-[10px] uppercase tracking-[0.18em]",
                                                    hasCover
                                                        ? "text-white/55"
                                                        : "text-[#826e5d]"
                                                )}
                                            >
                                                Browse
                                            </p>
                                            <p
                                                className={cn(
                                                    "mt-1 font-medium",
                                                    hasCover
                                                        ? "text-white"
                                                        : "text-[#4d3828]"
                                                )}
                                            >
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
