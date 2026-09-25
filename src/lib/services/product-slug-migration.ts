import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import {
    brands,
    products,
    productSlugHistory,
    productSlugMigrationBatches,
    productSlugMigrationRuns,
} from "@/lib/db/schema";
import { generateProductSlug, generateProductSlugCandidate } from "@/lib/utils";
import { and, asc, eq } from "drizzle-orm";

export const SLUG_MIGRATION_BATCH_SIZE = 50;
export const SLUG_MIGRATION_PREVIEW_TTL_MS = 30 * 60 * 1000;
const LEGACY_SLUG_PATTERN = /-(\d{13})-([a-z0-9]{5})$/;

export type SlugMigrationEntry = {
    productId: string;
    oldSlug: string;
    proposedSlug: string;
    baseSlug: string;
    updatedAt: string;
    createdAt: string;
    conflictKey: string | null;
    requiresManualReview: boolean;
};

export type SlugMigrationManifest = {
    generatedAt: string;
    eligibleScope: "fully_public_legacy_slugs";
    entries: SlugMigrationEntry[];
};

export type SlugMigrationCounts = {
    legacy: number;
    eligible: number;
    nonPublic: number;
    conflicts: number;
    unicodeSensitive: number;
    proposed: number;
};

const isLegacyProductSlug = (slug: string) => LEGACY_SLUG_PATTERN.test(slug);

const isUnicodeSensitive = (value: string) => /[^\x00-\x7F]/.test(value);

const stableManifestJson = (manifest: SlugMigrationManifest) =>
    JSON.stringify({
        ...manifest,
        entries: [...manifest.entries].sort((a, b) =>
            a.productId.localeCompare(b.productId)
        ),
    });

export const hashSlugMigrationManifest = (manifest: SlugMigrationManifest) =>
    createHash("sha256").update(stableManifestJson(manifest)).digest("hex");

type CandidateProduct = {
    id: string;
    title: string;
    slug: string;
    brandName: string;
    createdAt: Date;
    updatedAt: Date;
    isPublic: boolean;
};

export function buildSlugMigrationManifest(
    rows: CandidateProduct[],
    generatedAt = new Date()
): { manifest: SlugMigrationManifest; counts: SlugMigrationCounts } {
    const legacyRows = rows.filter((row) => isLegacyProductSlug(row.slug));
    const eligibleRows = legacyRows
        .filter((row) => row.isPublic)
        .sort(
            (a, b) =>
                a.createdAt.getTime() - b.createdAt.getTime() ||
                a.id.localeCompare(b.id)
        );
    const reserved = new Set(rows.map((row) => row.slug));
    const baseGroups = new Map<string, CandidateProduct[]>();

    for (const row of eligibleRows) {
        const base = generateProductSlug(row.title, row.brandName);
        const group = baseGroups.get(base) ?? [];
        group.push(row);
        baseGroups.set(base, group);
    }

    const entries: SlugMigrationEntry[] = [];
    for (const row of eligibleRows) {
        const baseSlug = generateProductSlug(row.title, row.brandName);
        const group = baseGroups.get(baseSlug) ?? [];
        const conflictKey = group.length > 1 ? baseSlug : null;
        let suffix = 1;
        let proposedSlug = generateProductSlugCandidate(baseSlug, suffix);
        while (reserved.has(proposedSlug) && proposedSlug !== row.slug) {
            suffix += 1;
            proposedSlug = generateProductSlugCandidate(baseSlug, suffix);
        }
        reserved.add(proposedSlug);
        entries.push({
            productId: row.id,
            oldSlug: row.slug,
            proposedSlug,
            baseSlug,
            updatedAt: row.updatedAt.toISOString(),
            createdAt: row.createdAt.toISOString(),
            conflictKey,
            requiresManualReview: Boolean(conflictKey),
        });
    }

    const unicodeSensitive = eligibleRows.filter(
        (row) =>
            isUnicodeSensitive(row.title) || isUnicodeSensitive(row.brandName)
    ).length;
    const conflicts = new Set(
        entries
            .filter((entry) => entry.conflictKey)
            .map((entry) => entry.conflictKey)
    ).size;

    return {
        manifest: {
            generatedAt: generatedAt.toISOString(),
            eligibleScope: "fully_public_legacy_slugs",
            entries,
        },
        counts: {
            legacy: legacyRows.length,
            eligible: eligibleRows.length,
            nonPublic: legacyRows.length - eligibleRows.length,
            conflicts,
            unicodeSensitive,
            proposed: entries.length,
        },
    };
}

async function loadCandidateProducts() {
    const rows = await db
        .select({
            id: products.id,
            title: products.title,
            slug: products.slug,
            brandName: brands.name,
            brandIsActive: brands.isActive,
            isAvailable: products.isAvailable,
            isActive: products.isActive,
            isPublished: products.isPublished,
            isDeleted: products.isDeleted,
            verificationStatus: products.verificationStatus,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
        })
        .from(products)
        .innerJoin(brands, eq(products.brandId, brands.id))
        .orderBy(asc(products.createdAt), asc(products.id));

    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        brandName: row.brandName,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        isPublic:
            row.isAvailable &&
            row.isActive &&
            row.isPublished &&
            !row.isDeleted &&
            row.verificationStatus === "approved" &&
            row.brandIsActive,
    }));
}

export async function previewProductSlugMigration(actorId: string) {
    const generatedAt = new Date();
    const { manifest, counts } = buildSlugMigrationManifest(
        await loadCandidateProducts(),
        generatedAt
    );
    const manifestHash = hashSlugMigrationManifest(manifest);
    const expiresAt = new Date(
        generatedAt.getTime() + SLUG_MIGRATION_PREVIEW_TTL_MS
    );
    const [run] = await db
        .insert(productSlugMigrationRuns)
        .values({
            manifestHash,
            actorId,
            status: counts.conflicts ? "needs_review" : "preview_ready",
            expiresAt,
            manifest,
            counts,
        })
        .returning({ id: productSlugMigrationRuns.id });

    return { runId: run.id, manifestHash, expiresAt, manifest, counts };
}

export async function getSlugMigrationRun(runId: string) {
    const [run] = await db
        .select()
        .from(productSlugMigrationRuns)
        .where(eq(productSlugMigrationRuns.id, runId))
        .limit(1);
    return run ?? null;
}

export async function applyProductSlugMigrationBatch(input: {
    runId: string;
    manifestHash: string;
    batchNumber: number;
    approvedConflictKeys: string[];
    actorId: string;
}) {
    const run = await getSlugMigrationRun(input.runId);
    if (!run) throw new Error("Slug migration preview was not found.");
    if (run.actorId !== input.actorId)
        throw new Error("Only the preview owner can apply it.");
    if (run.manifestHash !== input.manifestHash)
        throw new Error("Slug migration preview hash mismatch.");
    if (run.expiresAt.getTime() < Date.now())
        throw new Error(
            "Slug migration preview expired. Generate a new preview."
        );

    const manifest = run.manifest as SlugMigrationManifest;
    const start = input.batchNumber * SLUG_MIGRATION_BATCH_SIZE;
    const batchEntries = manifest.entries.slice(
        start,
        start + SLUG_MIGRATION_BATCH_SIZE
    );
    if (!batchEntries.length && manifest.entries.length) {
        throw new Error("Slug migration batch is outside the preview manifest.");
    }
    const approved = new Set(input.approvedConflictKeys);
    const [batch] = await db
        .insert(productSlugMigrationBatches)
        .values({
            runId: input.runId,
            batchNumber: String(input.batchNumber),
            status: "running",
            counts: { total: batchEntries.length },
            startedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning({ id: productSlugMigrationBatches.id });
    let batchId = batch?.id;
    if (!batchId) {
        const [existingBatch] = await db
            .select({ id: productSlugMigrationBatches.id, status: productSlugMigrationBatches.status })
            .from(productSlugMigrationBatches)
            .where(
                and(
                    eq(productSlugMigrationBatches.runId, input.runId),
                    eq(productSlugMigrationBatches.batchNumber, String(input.batchNumber))
                )
            )
            .limit(1);
        if (existingBatch?.status !== "needs_review" && existingBatch?.status !== "failed")
            return {
                batchNumber: input.batchNumber,
                status: "already_processed",
                applied: 0,
                skipped: 0,
                conflicts: 0,
            };
        batchId = existingBatch.id;
        await db
            .update(productSlugMigrationBatches)
            .set({ status: "running", error: null, startedAt: new Date(), completedAt: null })
            .where(eq(productSlugMigrationBatches.id, batchId));
    }

    let applied = 0;
    let skipped = 0;
    let conflicts = 0;
    try {
        for (const entry of batchEntries) {
            if (
                entry.requiresManualReview &&
                !approved.has(entry.conflictKey ?? "")
            ) {
                conflicts += 1;
                continue;
            }
            try {
                const result = await db.transaction(async (tx) => {
                    const updated = await tx
                        .update(products)
                        .set({
                            slug: entry.proposedSlug,
                            updatedAt: new Date(),
                        })
                        .where(
                            and(
                                eq(products.id, entry.productId),
                                eq(products.slug, entry.oldSlug),
                                eq(products.updatedAt, new Date(entry.updatedAt)),
                                eq(products.isAvailable, true),
                                eq(products.isActive, true),
                                eq(products.isPublished, true),
                                eq(products.isDeleted, false),
                                eq(products.verificationStatus, "approved")
                            )
                        )
                        .returning({ id: products.id });
                    if (!updated.length) return "skipped" as const;
                    await tx.insert(productSlugHistory).values({
                        productId: entry.productId,
                        oldSlug: entry.oldSlug,
                        newSlug: entry.proposedSlug,
                        runId: input.runId,
                        batchId,
                        actorId: input.actorId,
                    });
                    return "applied" as const;
                });
                if (result === "applied") applied += 1;
                else skipped += 1;
            } catch {
                conflicts += 1;
            }
        }

        const status = conflicts ? "needs_review" : "completed";
        await db
            .update(productSlugMigrationBatches)
            .set({
                status,
                counts: {
                    total: batchEntries.length,
                    applied,
                    skipped,
                    conflicts,
                },
                completedAt: new Date(),
            })
            .where(eq(productSlugMigrationBatches.id, batchId));
        await db
            .update(productSlugMigrationRuns)
            .set({
                status:
                    conflicts || start + batchEntries.length < manifest.entries.length
                        ? conflicts
                            ? "needs_review"
                            : "applying"
                        : "completed",
                counts: {
                    ...(run.counts as Record<string, number>),
                    lastBatchApplied: applied,
                    lastBatchSkipped: skipped,
                    lastBatchConflicts: conflicts,
                },
                updatedAt: new Date(),
            })
            .where(eq(productSlugMigrationRuns.id, input.runId));
        return {
            batchNumber: input.batchNumber,
            status,
            applied,
            skipped,
            conflicts,
        };
    } catch (error) {
        await db
            .update(productSlugMigrationBatches)
            .set({
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
                completedAt: new Date(),
            })
            .where(eq(productSlugMigrationBatches.id, batchId));
        throw error;
    }
}

export async function getHistoricalProductSlug(slug: string) {
    const [history] = await db
        .select({
            productId: productSlugHistory.productId,
            newSlug: productSlugHistory.newSlug,
        })
        .from(productSlugHistory)
        .where(eq(productSlugHistory.oldSlug, slug))
        .limit(1);
    return history ?? null;
}

export async function resolveHistoricalAnalyticsProductId(slug: string) {
    const history = await getHistoricalProductSlug(slug);
    return history?.productId ?? null;
}
