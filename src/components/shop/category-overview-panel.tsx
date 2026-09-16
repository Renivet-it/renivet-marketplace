import { buildCategoryUrl } from "@/lib/shop/category-url";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface CategoryOverviewCategory {
    id: string;
    name: string;
    slug: string;
}

interface CategoryOverviewSubcategory {
    id: string;
    name: string;
    categoryId: string;
}

interface CategoryOverviewInput {
    category: CategoryOverviewCategory;
    subCategories: CategoryOverviewSubcategory[];
}

export function buildCategoryOverview({
    category,
    subCategories,
}: CategoryOverviewInput) {
    const links = Array.from(
        subCategories
            .filter((subcategory) => subcategory.categoryId === category.id)
            .reduce((unique, subcategory) => {
                if (!unique.has(subcategory.name)) {
                    unique.set(subcategory.name, subcategory);
                }
                return unique;
            }, new Map<string, CategoryOverviewSubcategory>())
            .values()
    ).map((subcategory) => ({
        id: subcategory.id,
        label: subcategory.name,
        href: buildCategoryUrl(category.slug, {
            subCategoryId: subcategory.id,
        }),
    }));

    return {
        title: `Explore ${category.name}`,
        description: `Browse considered choices across ${category.name.toLowerCase()}, selected from conscious brands on Renivet.`,
        links,
    };
}

export function CategoryOverviewPanel({
    category,
    subCategories,
}: CategoryOverviewInput) {
    const overview = buildCategoryOverview({ category, subCategories });

    return (
        <aside className="rounded-2xl border border-[#e9dfd0] bg-[#faf6ee] p-5 shadow-[0_10px_24px_rgba(76,55,31,0.05)] md:p-6">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9a7950]">
                Curated for you
            </p>
            <h2 className="mt-2 font-serif text-2xl leading-tight text-[#26321f]">
                {overview.title}
            </h2>
            <p className="mt-3 max-w-sm text-xs leading-5 text-[#6f6559]">
                {overview.description}
            </p>
            {overview.links.length > 0 ? (
                <nav
                    aria-label={`${category.name} subcategories`}
                    className="mt-4 flex flex-wrap gap-2"
                >
                    {overview.links.slice(0, 5).map((link) => (
                        <Link
                            href={link.href}
                            key={link.id}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-[#e4d5c1] bg-[#fffaf2] px-3 py-2 text-xs text-[#33442d] transition-colors hover:border-[#b8925f] hover:bg-white"
                        >
                            <span>{link.label}</span>
                            <ArrowRight
                                className="size-3 transition-transform group-hover:translate-x-0.5"
                                aria-hidden="true"
                            />
                        </Link>
                    ))}
                </nav>
            ) : null}
            <Link
                href={buildCategoryUrl(category.slug)}
                className="mt-5 inline-flex items-center gap-2 border-b border-[#33442d] pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#33442d]"
            >
                Explore the collection
                <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
        </aside>
    );
}
