"use client";

import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function CorporateOrderSettings({ initialData }: { initialData: any }) {
    const [draft, setDraft] = useState(
        JSON.stringify(
            {
                productTypes: initialData.productTypes,
                gsmOptions: initialData.gsmOptions,
                fabricCompositions: initialData.fabricCompositions,
                colorOptions: initialData.colorOptions,
                printMethods: initialData.printMethods,
                logoLocations: initialData.logoLocations,
                extraChargeRules: initialData.extraChargeRules,
                pricingSlabs: initialData.pricingSlabs,
                settings: initialData.settings,
            },
            null,
            2
        )
    );

    const mutation = trpc.general.corporateOrders.upsertConfig.useMutation({
        onSuccess: () => toast.success("Corporate order settings updated"),
        onError: (error) => handleClientError(error),
    });

    const parsedDraft = useMemo(() => {
        try {
            return JSON.parse(draft);
        } catch {
            return null;
        }
    }, [draft]);

    return (
        <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">
                    Corporate Order Settings
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    This editor manages corporate product options, pricing slabs,
                    extra charges, and order-level defaults in one payload.
                </p>
            </div>
            <textarea
                className="min-h-[640px] w-full rounded-lg border border-input bg-slate-950 p-4 font-mono text-xs text-slate-100"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                    {parsedDraft
                        ? "JSON is valid and ready to save."
                        : "Fix JSON syntax before saving."}
                </p>
                <Button
                    disabled={!parsedDraft || mutation.isPending}
                    onClick={() => mutation.mutate(parsedDraft)}
                >
                    {mutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </div>
    );
}
