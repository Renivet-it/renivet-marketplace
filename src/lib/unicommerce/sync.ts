import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { brandUnicommerceIntegrations } from "@/lib/db/schema";
import { productQueries } from "@/lib/db/queries";
import { UnicommerceClient } from "./client";
import { decryptSecret, encryptSecret } from "./crypto";

type SyncInput = {
    updatedSinceMinutes?: number;
    skus?: string[];
};

async function getActiveIntegration(brandId: string) {
    const integration = await db.query.brandUnicommerceIntegrations.findFirst({
        where: and(
            eq(brandUnicommerceIntegrations.brandId, brandId),
            eq(brandUnicommerceIntegrations.isActive, true)
        ),
    });

    if (!integration) {
        throw new Error("No active Unicommerce integration found for brand");
    }

    return integration;
}

export async function syncBrandUnicommerceInventory(
    brandId: string,
    params?: SyncInput
) {
    const integration = await getActiveIntegration(brandId);

    const client = new UnicommerceClient({
        tenant: integration.tenant,
        facilityId: integration.facilityId,
        baseUrl: integration.baseUrl,
        username: integration.username,
        password: decryptSecret(integration.encryptedPassword),
        initialAccessToken: integration.encryptedAccessToken
            ? decryptSecret(integration.encryptedAccessToken)
            : null,
        initialRefreshToken: integration.encryptedRefreshToken
            ? decryptSecret(integration.encryptedRefreshToken)
            : null,
        accessTokenExpiresAt: integration.accessTokenExpiresAt,
        onTokenUpdate: async (token) => {
            await db
                .update(brandUnicommerceIntegrations)
                .set({
                    encryptedAccessToken: encryptSecret(token.accessToken),
                    encryptedRefreshToken: encryptSecret(token.refreshToken),
                    accessTokenExpiresAt: token.accessTokenExpiresAt,
                    updatedAt: new Date(),
                })
                .where(eq(brandUnicommerceIntegrations.id, integration.id));
        },
    });

    try {
        const snapshots = await client.getInventorySnapshot({
            updatedSinceMinutes: params?.updatedSinceMinutes ?? 60,
            skus: params?.skus ?? [],
        });

        const result = await productQueries.syncInventoryBySku(
            snapshots.map((s) => ({ sku: s.itemSku, quantity: s.inventory })),
            brandId
        );

        await db
            .update(brandUnicommerceIntegrations)
            .set({
                lastSyncAt: new Date(),
                lastSyncStatus: "success",
                lastError: null,
                updatedAt: new Date(),
            })
            .where(eq(brandUnicommerceIntegrations.id, integration.id));

        return {
            brandId,
            totalSnapshots: snapshots.length,
            ...result,
        };
    } catch (error) {
        await db
            .update(brandUnicommerceIntegrations)
            .set({
                lastSyncAt: new Date(),
                lastSyncStatus: "failed",
                lastError:
                    error instanceof Error
                        ? error.message.slice(0, 1000)
                        : "Unknown error",
                updatedAt: new Date(),
            })
            .where(eq(brandUnicommerceIntegrations.id, integration.id));

        throw error;
    }
}

export async function syncAllActiveBrandUnicommerceInventory(params?: SyncInput) {
    const integrations = await db.query.brandUnicommerceIntegrations.findMany({
        where: eq(brandUnicommerceIntegrations.isActive, true),
    });

    const results: Array<{
        brandId: string;
        ok: boolean;
        error?: string;
        data?: {
            totalSnapshots: number;
            updatedProducts: number;
            updatedVariants: number;
            missingSkus: string[];
        };
    }> = [];

    for (const integration of integrations) {
        try {
            const data = await syncBrandUnicommerceInventory(
                integration.brandId,
                params
            );
            results.push({
                brandId: integration.brandId,
                ok: true,
                data: {
                    totalSnapshots: data.totalSnapshots,
                    updatedProducts: data.updatedProducts,
                    updatedVariants: data.updatedVariants,
                    missingSkus: data.missingSkus,
                },
            });
        } catch (error) {
            results.push({
                brandId: integration.brandId,
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    return {
        totalBrands: integrations.length,
        successCount: results.filter((r) => r.ok).length,
        failureCount: results.filter((r) => !r.ok).length,
        results,
    };
}
