"use client";

import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { toast } from "sonner";

export function SeedCatalogButton() {
    const utils = trpc.useUtils();
    const mutation = trpc.general.corporatePlatform.seedCatalog.useMutation({
        onSuccess: async (data) => {
            toast.success(`Seeded ${data.inserted} corporate catalog items`);
            await utils.general.corporatePlatform.listCatalog.invalidate();
        },
        onError: (error) => handleClientError(error),
    });

    return (
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Seeding..." : "Seed Catalog From Products"}
        </Button>
    );
}
