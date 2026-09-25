"use client";

import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { useMemo, useState } from "react";

type PreviewResult = {
    runId: string;
    manifestHash: string;
    expiresAt: string | Date;
    counts: Record<string, number>;
    manifest: {
        entries: Array<{
            productId: string;
            oldSlug: string;
            proposedSlug: string;
            conflictKey: string | null;
            requiresManualReview: boolean;
        }>;
    };
};

export function ProductSlugMigrationWorkspace() {
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [approved, setApproved] = useState<string[]>([]);
    const [message, setMessage] = useState("");
    const [progress, setProgress] = useState({ completed: 0, total: 0 });
    const previewMutation =
        trpc.general.productSlugMigration.preview.useMutation();
    const applyMutation =
        trpc.general.productSlugMigration.applyBatch.useMutation();

    const conflictKeys = useMemo(
        () =>
            Array.from(
                new Set(
                    (preview?.manifest.entries ?? [])
                        .map((entry) => entry.conflictKey)
                        .filter((key): key is string => Boolean(key))
                )
            ),
        [preview]
    );

    const runPreview = async () => {
        setMessage("");
        setPreview(await previewMutation.mutateAsync());
        setApproved([]);
        setProgress({ completed: 0, total: 0 });
        setMessage("Preview ready. No product slugs have been changed.");
    };

    const applyMigration = async () => {
        if (!preview) return;
        if (conflictKeys.some((key) => !approved.includes(key))) {
            setMessage(
                "Approve every public collision group before applying the migration."
            );
            return;
        }
        if (
            !window.confirm("Apply the reviewed public product slug migration?")
        )
            return;
        const total = Math.ceil(preview.manifest.entries.length / 50);
        setProgress({ completed: 0, total });
        let applied = 0;
        let skipped = 0;
        let conflicts = 0;
        for (let batchNumber = 0; batchNumber < total; batchNumber += 1) {
            const result = await applyMutation.mutateAsync({
                runId: preview.runId,
                manifestHash: preview.manifestHash,
                batchNumber,
                approvedConflictKeys: approved,
            });
            applied += result.applied;
            skipped += result.skipped;
            conflicts += result.conflicts;
            setProgress({ completed: batchNumber + 1, total });
        }
        setMessage(
            `Migration finished: ${applied} applied, ${skipped} skipped, ${conflicts} conflicts.`
        );
    };

    return (
        <main className="min-h-screen bg-slate-50/80 p-4 sm:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <header className="rounded-md border bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        SEO maintenance
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                        Legacy Product Slug Migration
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Preview and review legacy public product URLs before
                        converting them. Old URLs are preserved with permanent
                        redirects.
                    </p>
                    <Button
                        className="mt-5"
                        disabled={previewMutation.isPending}
                        onClick={() => void runPreview()}
                    >
                        {previewMutation.isPending
                            ? "Preparing preview..."
                            : "Preview slug migration"}
                    </Button>
                </header>
                {message ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        {message}
                    </div>
                ) : null}
                {preview ? (
                    <section className="space-y-4 rounded-md border bg-white p-5 shadow-sm">
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            {Object.entries(preview.counts).map(
                                ([key, value]) => (
                                    <div
                                        key={key}
                                        className="rounded border bg-slate-50 p-3"
                                    >
                                        <p className="text-xs uppercase text-slate-500">
                                            {key}
                                        </p>
                                        <p className="mt-1 text-xl font-semibold">
                                            {value}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>
                        {conflictKeys.length ? (
                            <div className="rounded border border-amber-200 bg-amber-50 p-4">
                                <h2 className="font-semibold text-amber-950">
                                    Public collision groups require review
                                </h2>
                                <p className="mt-1 text-sm text-amber-900">
                                    Approve each group only after confirming the
                                    products are distinct and the proposed
                                    suffix order is correct.
                                </p>
                                <div className="mt-3 space-y-2">
                                    {conflictKeys.map((key) => (
                                        <label
                                            key={key}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={approved.includes(key)}
                                                onChange={(event) =>
                                                    setApproved((current) =>
                                                        event.target.checked
                                                            ? [...current, key]
                                                            : current.filter(
                                                                  (item) =>
                                                                      item !==
                                                                      key
                                                              )
                                                    )
                                                }
                                            />
                                            {key}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        {progress.total ? (
                            <div>
                                <div className="h-2 overflow-hidden rounded bg-slate-200">
                                    <div
                                        className="h-full bg-emerald-600 transition-all"
                                        style={{
                                            width: `${(progress.completed / progress.total) * 100}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-slate-600">
                                    Processed {progress.completed} of{" "}
                                    {progress.total} batches
                                </p>
                            </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-semibold">Mapping preview</h2>
                            <Button
                                disabled={
                                    applyMutation.isPending ||
                                    !preview.manifest.entries.length ||
                                    conflictKeys.some(
                                        (key) => !approved.includes(key)
                                    )
                                }
                                onClick={() => void applyMigration()}
                            >
                                {applyMutation.isPending
                                    ? "Applying..."
                                    : "Apply reviewed migration"}
                            </Button>
                        </div>
                        <div className="max-h-96 overflow-auto rounded border">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-slate-100">
                                    <tr>
                                        <th className="p-2">Old slug</th>
                                        <th className="p-2">New slug</th>
                                        <th className="p-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.manifest.entries
                                        .slice(0, 200)
                                        .map((entry) => (
                                            <tr
                                                key={entry.productId}
                                                className="border-t"
                                            >
                                                <td className="p-2">
                                                    {entry.oldSlug}
                                                </td>
                                                <td className="p-2">
                                                    {entry.proposedSlug}
                                                </td>
                                                <td className="p-2">
                                                    {entry.requiresManualReview
                                                        ? "Needs review"
                                                        : "Ready"}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                ) : null}
            </div>
        </main>
    );
}
