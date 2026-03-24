"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { format } from "date-fns";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import { DecodeXAction } from "./decodex-action";

export type TableDecodeXRow = {
    id: string;
    brandId: string;
    subcategoryId: string;
    brand: {
        id: string;
        name: string;
    };
    subcategory: {
        id: string;
        name: string;
    };
    mainMaterial: string | null;
    certifications: string | null;
    virginPlasticUsed: boolean | null;
    certificationShareable: boolean | null;
    storyWhy: string | null;
    updatedAt: Date;
};

function BoolBadge({ value }: { value: boolean | null }) {
    if (value === true) {
        return <Badge variant="secondary">Yes</Badge>;
    }

    if (value === false) {
        return <Badge variant="outline">No</Badge>;
    }

    return <span className="text-xs text-muted-foreground">Not set</span>;
}

const columns: ColumnDef<TableDecodeXRow>[] = [
    {
        accessorKey: "brand.name",
        header: "Brand",
    },
    {
        accessorKey: "subcategory.name",
        header: "Sub-category",
    },
    {
        accessorKey: "mainMaterial",
        header: "Main Material",
        cell: ({ row }) => row.original.mainMaterial ?? "-",
    },
    {
        accessorKey: "certifications",
        header: "Certifications",
        cell: ({ row }) => row.original.certifications ?? "-",
    },
    {
        id: "plastic",
        header: "Virgin Plastic",
        cell: ({ row }) => <BoolBadge value={row.original.virginPlasticUsed} />,
    },
    {
        id: "shareable",
        header: "Cert Shareable",
        cell: ({ row }) => <BoolBadge value={row.original.certificationShareable} />,
    },
    {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => format(new Date(row.original.updatedAt), "MMM dd, yyyy"),
    },
    {
        id: "actions",
        cell: ({ row }) => <DecodeXAction row={row.original} />,
    },
];

export function DecodeXTable() {
    const [search, setSearch] = useQueryState(
        "search",
        parseAsString.withDefault("").withOptions({ shallow: false })
    );

    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1).withOptions({ shallow: false })
    );

    const [limit] = useQueryState(
        "limit",
        parseAsInteger.withDefault(10).withOptions({ shallow: false })
    );

    const { data, isLoading } = trpc.general.decodex.getAll.useQuery({
        page,
        limit,
        search: search?.trim().length ? search : undefined,
    });

    const rows = (data?.data ?? []) as TableDecodeXRow[];
    const count = data?.count ?? 0;
    const pages = Math.max(1, Math.ceil(count / limit));

    const from = useMemo(
        () => (count === 0 ? 0 : (page - 1) * limit + 1),
        [count, page, limit]
    );

    const to = useMemo(() => Math.min(page * limit, count), [count, page, limit]);

    const table = useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Search by brand, sub-category, material..."
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                />
                <DataTableViewOptions table={table} />
            </div>

            {isLoading ? (
                <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                    Loading DecodeX profiles...
                </div>
            ) : (
                <>
                    <DataTable
                        table={table}
                        columns={columns}
                        count={count}
                        pages={pages}
                        showResults={false}
                    />

                    <p className="text-sm text-muted-foreground">
                        Showing <strong>{from}</strong>-<strong>{to}</strong> of <strong>{count}</strong> results
                    </p>
                </>
            )}
        </div>
    );
}
