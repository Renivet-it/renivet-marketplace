"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination-dash";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { Copy, Download, Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const EVENT_NAMES = [
    "ViewContent",
    "AddToCart",
    "Purchase",
    "InitiateCheckout",
] as const;

// ─── Field definitions with human-readable labels ───────────────────────────

const USER_DATA_FIELDS: { key: string; label: string }[] = [
    { key: "em", label: "Email" },
    { key: "ph", label: "Phone" },
    { key: "fn", label: "First Name" },
    { key: "ln", label: "Last Name" },
    { key: "db", label: "Date of Birth" },
    { key: "ge", label: "Gender" },
    { key: "ct", label: "City" },
    { key: "st", label: "State" },
    { key: "zp", label: "Zip Code" },
    { key: "country", label: "Country" },
    { key: "external_id", label: "External ID" },
    { key: "fb_login_id", label: "FB Login ID" },
    { key: "client_ip_address", label: "IP Address" },
    { key: "client_user_agent", label: "User Agent" },
    { key: "fbp", label: "FB Browser ID" },
    { key: "fbc", label: "FB Click ID" },
];

const CUSTOM_DATA_FIELDS: { key: string; label: string }[] = [
    { key: "content_name", label: "Content Name" },
    { key: "content_category", label: "Content Category" },
    { key: "content_ids", label: "Content IDs" },
    { key: "content_type", label: "Content Type" },
    { key: "value", label: "Value" },
    { key: "currency", label: "Currency" },
    { key: "order_id", label: "Order ID" },
    { key: "predicted_ltv", label: "Predicted LTV" },
    { key: "num_items", label: "No. of Items" },
    { key: "search_string", label: "Search String" },
    { key: "status", label: "Custom Status" },
    { key: "delivery_category", label: "Delivery Category" },
];

function cellValue(val: unknown): string {
    if (val === undefined || val === null) return "—";
    if (Array.isArray(val)) return val.join(", ");
    return String(val);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CapiLogsPage() {
    const [page, setPage] = useState(1);
    const [eventFilter, setEventFilter] = useState<string>("");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const limit = 50;

    const { data, isLoading } = trpc.general.capiLogs.getLogs.useQuery({
        page,
        limit,
        eventName: eventFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
    });

    const utils = trpc.useUtils();
    const [isExporting, setIsExporting] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const exportCSV = async () => {
        setIsExporting(true);
        try {
            const allData = await utils.general.capiLogs.getAllLogs.fetch({
                eventName: eventFilter || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
            });

            if (!allData?.logs?.length) {
                toast.error("No logs to export");
                return;
            }

            const headers = [
                "ID",
                "Event Name",
                "Event ID",
                "Status",
                "Created At",
                ...USER_DATA_FIELDS.map((f) => f.label),
                ...CUSTOM_DATA_FIELDS.map((f) => f.label),
                "FB Response",
            ];

            const rows = allData.logs.map((log) => {
                const ud = (log.userData as Record<string, unknown>) ?? {};
                const cd = (log.customData as Record<string, unknown>) ?? {};
                return [
                    log.id,
                    log.eventName,
                    log.eventId,
                    log.status,
                    log.createdAt
                        ? format(
                              new Date(log.createdAt),
                              "MMM d, yyyy HH:mm:ss"
                          )
                        : "N/A",
                    ...USER_DATA_FIELDS.map((f) => cellValue(ud[f.key])),
                    ...CUSTOM_DATA_FIELDS.map((f) => cellValue(cd[f.key])),
                    JSON.stringify(log.response ?? null),
                ];
            });

            const csvContent = [headers, ...rows]
                .map((row) =>
                    row
                        .map((c) => `"${String(c).replace(/"/g, "\"\"")}"`)
                        .join(",")
                )
                .join("\n");

            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `capi-logs-all-${Date.now()}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success(`CSV downloaded — ${allData.logs.length} total logs`);
        } catch {
            toast.error("Failed to export logs");
        } finally {
            setIsExporting(false);
        }
    };

    const totalCols =
        5 + USER_DATA_FIELDS.length + CUSTOM_DATA_FIELDS.length + 1;

    return (
        <div className="block w-full min-w-0 space-y-4 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        CAPI Event Logs
                    </h2>
                    <p className="text-muted-foreground">
                        View raw Facebook Conversions API events and responses.
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={exportCSV}
                    disabled={isExporting}
                >
                    <Download className="mr-2 size-4" />
                    {isExporting ? "Exporting..." : "Export All CSV"}
                </Button>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3">
                <Filter className="size-4 text-muted-foreground" />
                <select
                    value={eventFilter}
                    onChange={(e) => {
                        setEventFilter(e.target.value);
                        setPage(1);
                    }}
                    className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="">All Events</option>
                    {EVENT_NAMES.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                        setFromDate(e.target.value);
                        setPage(1);
                    }}
                    className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => {
                        setToDate(e.target.value);
                        setPage(1);
                    }}
                    className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />

                {(eventFilter || fromDate || toDate) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setEventFilter("");
                            setFromDate("");
                            setToDate("");
                            setPage(1);
                        }}
                        className="text-xs text-muted-foreground"
                    >
                        Clear filter
                    </Button>
                )}
            </div>

            {/* Scrollable table — must fill parent width and scroll horizontally */}
            <div
                style={{
                    display: "block",
                    width: "100%",
                    overflowX: "scroll",
                    borderRadius: "6px",
                    border: "1px solid hsl(var(--border))",
                }}
            >
                <table
                    style={{
                        width: "max-content",
                        minWidth: "100%",
                        borderCollapse: "collapse",
                    }}
                    className="text-sm"
                >
                    <thead>
                        <tr className="border-b bg-muted/50">
                            {/* ── Core ── */}
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                ID
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                Event Name
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                Event ID
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                Status
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                Created At
                            </th>

                            {/* ── User Data ── */}
                            <th
                                colSpan={USER_DATA_FIELDS.length}
                                className="whitespace-nowrap border-x px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-blue-600"
                            >
                                User Data
                            </th>

                            {/* ── Custom Data ── */}
                            <th
                                colSpan={CUSTOM_DATA_FIELDS.length}
                                className="whitespace-nowrap border-x px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-green-600"
                            >
                                Custom Data
                            </th>

                            {/* ── Response ── */}
                            <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                                FB Response
                            </th>
                        </tr>
                        <tr className="border-b">
                            {/* Core sub-headers — invisible but keeps alignment */}
                            {["", "", "", "", ""].map((_, i) => (
                                <th key={i} />
                            ))}

                            {/* userData field labels */}
                            {USER_DATA_FIELDS.map((f) => (
                                <th
                                    key={f.key}
                                    className="whitespace-nowrap border-x px-4 py-2 text-left text-xs font-medium text-blue-500"
                                >
                                    {f.label}
                                </th>
                            ))}

                            {/* customData field labels */}
                            {CUSTOM_DATA_FIELDS.map((f) => (
                                <th
                                    key={f.key}
                                    className="whitespace-nowrap border-x px-4 py-2 text-left text-xs font-medium text-green-500"
                                >
                                    {f.label}
                                </th>
                            ))}

                            {/* Response sub-header — empty */}
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <tr key={i} className="border-b">
                                    {Array.from({ length: totalCols }).map(
                                        (_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <Skeleton className="h-4 w-16" />
                                            </td>
                                        )
                                    )}
                                </tr>
                            ))
                        ) : data?.logs.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={totalCols}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No CAPI logs found.
                                </td>
                            </tr>
                        ) : (
                            data?.logs.map((log) => {
                                const ud =
                                    (log.userData as Record<string, unknown>) ??
                                    {};
                                const cd =
                                    (log.customData as Record<
                                        string,
                                        unknown
                                    >) ?? {};

                                return (
                                    <tr
                                        key={log.id}
                                        className="border-b hover:bg-muted/30"
                                    >
                                        {/* ID */}
                                        <td className="px-4 py-3">
                                            <span
                                                className="block max-w-[90px] truncate font-mono text-xs text-muted-foreground"
                                                title={log.id}
                                            >
                                                {log.id}
                                            </span>
                                        </td>

                                        {/* Event Name */}
                                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                                            {log.eventName}
                                        </td>

                                        {/* Event ID */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <span
                                                    className="max-w-[110px] truncate font-mono text-xs text-muted-foreground"
                                                    title={log.eventId}
                                                >
                                                    {log.eventId}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            log.eventId
                                                        )
                                                    }
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="whitespace-nowrap px-4 py-3">
                                            <Badge
                                                variant={
                                                    log.status === "success"
                                                        ? "default"
                                                        : "destructive"
                                                }
                                            >
                                                {log.status === "success"
                                                    ? "Success"
                                                    : "Failed"}
                                            </Badge>
                                        </td>

                                        {/* Created At */}
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            {log.createdAt
                                                ? format(
                                                      new Date(log.createdAt),
                                                      "MMM d, yyyy HH:mm:ss"
                                                  )
                                                : "N/A"}
                                        </td>

                                        {/* userData flat columns */}
                                        {USER_DATA_FIELDS.map((f) => (
                                            <td
                                                key={f.key}
                                                className="whitespace-nowrap border-x px-4 py-3 text-xs"
                                            >
                                                {cellValue(ud[f.key])}
                                            </td>
                                        ))}

                                        {/* customData flat columns */}
                                        {CUSTOM_DATA_FIELDS.map((f) => (
                                            <td
                                                key={f.key}
                                                className="whitespace-nowrap border-x px-4 py-3 text-xs"
                                            >
                                                {cellValue(cd[f.key])}
                                            </td>
                                        ))}

                                        {/* Response */}
                                        <td className="px-4 py-3">
                                            <pre className="max-h-24 w-[220px] overflow-auto rounded-md bg-muted p-2 text-xs">
                                                {JSON.stringify(
                                                    log.response,
                                                    null,
                                                    2
                                                )}
                                            </pre>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {data && (
                <div className="py-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page > 1) setPage(page - 1);
                                    }}
                                    disabled={page === 1}
                                />
                            </PaginationItem>

                            <PaginationItem>
                                <div className="mx-4 text-sm text-muted-foreground">
                                    Page {page} of {data.totalPages}
                                </div>
                            </PaginationItem>

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (page < data.totalPages)
                                            setPage(page + 1);
                                    }}
                                    disabled={page === data.totalPages}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
