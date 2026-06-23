"use client";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProductQcPanelProps {
    product: ProductWithBrand;
    showEscalateToKp?: boolean;
}

const statusVariantMap = {
    pass: "secondary",
    warning: "default",
    critical: "destructive",
} as const;

const findingSeverityTabs = ["all", "critical", "warning", "info"] as const;

type FindingSeverityTab = (typeof findingSeverityTabs)[number];

export function ProductQcPanel({
    product,
    showEscalateToKp = true,
}: ProductQcPanelProps) {
    const router = useRouter();
    const reviewMutation = trpc.brands.products.updateCatalogQcReview.useMutation({
        onMutate: ({ action }) => {
            const toastId = toast.loading(
                `Updating QC status: ${convertValueToLabel(action)}...`
            );
            return { toastId };
        },
        onSuccess: (_, { action }, ctx) => {
            toast.success(`QC action saved: ${convertValueToLabel(action)}`, {
                id: ctx?.toastId,
            });
            router.refresh();
        },
        onError: (error, _, ctx) => {
            toast.error(error.message, {
                id: ctx?.toastId,
            });
        },
    });

    const findings = product.qcFindings ?? [];
    const recommendations = product.qcSuggestedFixes ?? [];
    const findingsByTab = {
        all: findings,
        critical: findings.filter((finding) => finding.severity === "critical"),
        warning: findings.filter((finding) => finding.severity === "warning"),
        info: findings.filter((finding) => finding.severity === "info"),
    } satisfies Record<FindingSeverityTab, typeof findings>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                    <CardTitle>QC Recommendations</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Post-upload catalog guidance. This does not block the listing.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariantMap[product.qcStatus]}>
                        {convertValueToLabel(product.qcStatus)}
                    </Badge>
                    <Badge variant="outline">Score {product.qcScore}/100</Badge>
                    <Badge variant="outline">
                        Owner {convertValueToLabel(product.qcOwner)}
                    </Badge>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="space-y-5 pt-6">
                <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-lg border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Last Checked
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {product.qcLastCheckedAt
                                ? new Date(product.qcLastCheckedAt).toLocaleString()
                                : "Not checked yet"}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Reviewed
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {product.qcReviewedAt
                                ? new Date(product.qcReviewedAt).toLocaleString()
                                : "Pending review"}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Escalated To
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {product.qcEscalatedTo
                                ? convertValueToLabel(product.qcEscalatedTo)
                                : "None"}
                        </p>
                    </div>
                    <div className="rounded-lg border p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Inventory Source
                        </p>
                        <p className="mt-1 text-sm font-medium">
                            {convertValueToLabel(product.inventorySource)}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                            reviewMutation.mutate({
                                productId: product.id,
                                action: "reviewed",
                            })
                        }
                    >
                        <Icons.Check className="size-4" />
                        Mark Reviewed
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                            reviewMutation.mutate({
                                productId: product.id,
                                action: "ignored",
                            })
                        }
                    >
                        <Icons.EyeOff className="size-4" />
                        Ignore For Now
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                            reviewMutation.mutate({
                                productId: product.id,
                                action: "escalate_catalog",
                            })
                        }
                    >
                        <Icons.Users className="size-4" />
                        Escalate To Catalog
                    </Button>
                    {showEscalateToKp ? (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={reviewMutation.isPending}
                            onClick={() =>
                                reviewMutation.mutate({
                                    productId: product.id,
                                    action: "escalate_kp",
                                })
                            }
                        >
                            <Icons.AlertTriangle className="size-4" />
                            Escalate To KP
                        </Button>
                    ) : null}
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Findings</h3>
                        {findings.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                No QC issues detected right now.
                            </div>
                        ) : (
                            <Tabs defaultValue="all" className="space-y-3">
                                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                                    <TabsList className="flex h-auto min-w-max flex-nowrap items-center gap-2 bg-transparent p-0">
                                        {findingSeverityTabs.map((tab) => (
                                            <TabsTrigger
                                                key={tab}
                                                value={tab}
                                                className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors data-[state=active]:border-slate-900 data-[state=active]:text-slate-950"
                                            >
                                                {convertValueToLabel(tab)}
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    {findingsByTab[tab].length}
                                                </span>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>

                                {findingSeverityTabs.map((tab) => (
                                    <TabsContent
                                        key={tab}
                                        value={tab}
                                        className="mt-0 space-y-3"
                                    >
                                        {findingsByTab[tab].length === 0 ? (
                                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                                No {tab === "all" ? "" : `${tab} `}
                                                findings in this view.
                                            </div>
                                        ) : (
                                            findingsByTab[tab].map((finding) => (
                                                <div
                                                    key={`${finding.code}-${finding.field ?? "na"}`}
                                                    className="rounded-lg border p-4"
                                                >
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                finding.severity ===
                                                                "critical"
                                                                    ? "destructive"
                                                                    : finding.severity ===
                                                                        "warning"
                                                                      ? "default"
                                                                      : "secondary"
                                                            }
                                                        >
                                                            {convertValueToLabel(
                                                                finding.severity
                                                            )}
                                                        </Badge>
                                                        <p className="text-sm font-semibold">
                                                            {finding.title}
                                                        </p>
                                                        {finding.field ? (
                                                            <Badge variant="outline">
                                                                {finding.field}
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {finding.description}
                                                    </p>
                                                    {finding.suggestion ? (
                                                        <p className="mt-2 text-sm">
                                                            <span className="font-medium">
                                                                Suggested fix:
                                                            </span>{" "}
                                                            {finding.suggestion}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ))
                                        )}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Suggested Next Actions</h3>
                        {recommendations.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                No suggested fixes available.
                            </div>
                        ) : (
                            <div className="rounded-lg border p-4">
                                <ul className="space-y-2 text-sm">
                                    {recommendations.map((recommendation) => (
                                        <li
                                            key={recommendation}
                                            className="flex items-start gap-2"
                                        >
                                            <Icons.CheckCircle className="mt-0.5 size-4 text-emerald-600" />
                                            <span>{recommendation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
