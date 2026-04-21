import { UnicommerceSettingsForm } from "@/components/dashboard/brands/unicommerce";
import { brandCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ bId: string; section: string }>;
}

type SectionConfig = {
    title: string;
    description: string;
    forcedMainTab: "modules" | "api-explorer" | "logs";
    forcedModuleTab?: "authentication" | "inventory" | "orders" | "returns" | "catalog";
};

const sectionConfigMap: Record<string, SectionConfig> = {
    authentication: {
        title: "Unicommerce Authentication",
        description: "Authenticate and monitor Unicommerce token state.",
        forcedMainTab: "modules",
        forcedModuleTab: "authentication",
    },
    inventory: {
        title: "Unicommerce Inventory",
        description: "Fetch and review inventory data from Unicommerce.",
        forcedMainTab: "modules",
        forcedModuleTab: "inventory",
    },
    orders: {
        title: "Unicommerce Orders",
        description: "Fetch and review order data from Unicommerce.",
        forcedMainTab: "modules",
        forcedModuleTab: "orders",
    },
    returns: {
        title: "Unicommerce Returns",
        description: "Fetch and review return data from Unicommerce.",
        forcedMainTab: "modules",
        forcedModuleTab: "returns",
    },
    catalog: {
        title: "Unicommerce Catalog",
        description: "Fetch and review catalog data from Unicommerce.",
        forcedMainTab: "modules",
        forcedModuleTab: "catalog",
    },
    "api-explorer": {
        title: "Unicommerce API Explorer",
        description: "Run custom Unicommerce API requests.",
        forcedMainTab: "api-explorer",
    },
    logs: {
        title: "Unicommerce Response Logs",
        description: "View latest Unicommerce API and authentication responses.",
        forcedMainTab: "logs",
    },
};

export const metadata: Metadata = {
    title: "Unicommerce Sections",
    description: "Dedicated Unicommerce section pages",
};

export default function Page(props: PageProps) {
    return (
        <Suspense fallback={<UnicommerceSectionLoadingSkeleton />}>
            <UnicommerceSectionFetch {...props} />
        </Suspense>
    );
}

async function UnicommerceSectionFetch({ params }: PageProps) {
    const { bId, section } = await params;
    const existingBrand = await brandCache.get(bId);
    const sectionConfig = sectionConfigMap[section];

    if (!existingBrand || !sectionConfig) notFound();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {sectionConfig.title}
                </h1>
                <p className="mt-2 text-muted-foreground">
                    {sectionConfig.description}
                </p>
            </div>

            <UnicommerceSettingsForm
                brandId={existingBrand.id}
                showSectionArea
                forcedMainTab={sectionConfig.forcedMainTab}
                forcedModuleTab={sectionConfig.forcedModuleTab}
                hideSectionMenus
            />
        </div>
    );
}

function UnicommerceSectionLoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="space-y-2">
                <div className="h-8 w-80 rounded bg-muted" />
                <div className="h-4 w-96 rounded bg-muted" />
            </div>
            <div className="space-y-4 rounded-lg border p-6">
                <div className="h-6 w-64 rounded bg-muted" />
                <div className="h-64 rounded bg-muted" />
            </div>
        </div>
    );
}
