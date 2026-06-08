"use client";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel } from "@/lib/utils";
import { BrandConfidentialWithBrand } from "@/lib/validations";
import {
    ColumnDef,
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo, useState } from "react";

export type TableBrandVerifications = BrandConfidentialWithBrand & {
    brandName: string;
    brandEmail: string;
};

/**
 * Helper function to detect pending verification steps
 */
function getPendingVerificationSteps(
    data: BrandConfidentialWithBrand
): string[] {
    const steps: string[] = [];

    if (!data.gstin || data.gstin.trim() === "") steps.push("GST Registration");
    if (!data.pan || data.pan.trim() === "") steps.push("PAN");
    if (!data.bankName || data.bankName.trim() === "")
        steps.push("Bank Details");
    if (!data.bankAccountHolderName || data.bankAccountHolderName.trim() === "")
        steps.push("Bank Account Holder Name");
    if (!data.bankAccountNumber || data.bankAccountNumber.trim() === "")
        steps.push("Bank Account Number");
    if (!data.bankIfscCode || data.bankIfscCode.trim() === "")
        steps.push("Bank IFSC Code");
    if (!data.bankAccountVerificationDocument)
        steps.push("Bank Document Verification");
    if (
        !data.authorizedSignatoryName ||
        data.authorizedSignatoryName.trim() === ""
    )
        steps.push("Signatory Name");
    if (
        !data.authorizedSignatoryEmail ||
        data.authorizedSignatoryEmail.trim() === ""
    )
        steps.push("Signatory Email");
    if (
        !data.authorizedSignatoryPhone ||
        data.authorizedSignatoryPhone.trim() === ""
    )
        steps.push("Signatory Phone");
    if (!data.addressLine1 || data.addressLine1.trim() === "")
        steps.push("Office Address");
    if (!data.city || data.city.trim() === "") steps.push("Office City");
    if (!data.state || data.state.trim() === "") steps.push("Office State");
    if (!data.postalCode || data.postalCode.trim() === "")
        steps.push("Postal Code");

    return steps;
}

const columns: ColumnDef<TableBrandVerifications>[] = [
    {
        accessorKey: "id",
        header: "ID",
        enableHiding: false,
    },
    {
        accessorKey: "brandName",
        header: "Brand",
        enableHiding: false,
    },
    {
        accessorKey: "brandEmail",
        header: "Email",
        enableHiding: false,
    },
    {
        accessorKey: "verificationStatus",
        header: "Status",
        cell: ({ row }) => {
            const data = row.original;

            return (
                <Badge
                    variant={
                        data.verificationStatus === "pending"
                            ? "default"
                            : data.verificationStatus === "approved"
                              ? "secondary"
                              : "destructive"
                    }
                >
                    {convertValueToLabel(data.verificationStatus)}
                </Badge>
            );
        },
    },
    {
        id: "pendingSteps",
        header: "Required Steps",
        cell: ({ row }) => {
            const data = row.original;
            const pendingSteps = getPendingVerificationSteps(data);

            if (pendingSteps.length === 0) {
                return (
                    <span className="text-sm text-muted-foreground">
                        Verification complete, ready for admin approval
                    </span>
                );
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {pendingSteps.slice(0, 2).map((step, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                            {step}
                        </Badge>
                    ))}
                    {pendingSteps.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                            +{pendingSteps.length - 2} more required fields
                        </Badge>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const data = row.original;
            return format(new Date(data.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original;

            return (
                <Button variant="ghost" className="size-8 p-0" asChild>
                    <Link
                        href={`/dashboard/general/brands/verifications/${data.id}`}
                    >
                        <Icons.Eye className="size-4" />
                        <span className="sr-only">View</span>
                    </Link>
                </Button>
            );
        },
    },
];

interface PageProps {
    initialData: {
        data: BrandConfidentialWithBrand[];
        count: number;
    };
}

export function BrandVerificationsTable({ initialData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
    const [status, setStatus] = useQueryState(
        "status",
        parseAsStringLiteral([
            "pending",
            "approved",
            "rejected",
        ] as const).withDefault("pending")
    );

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const { data: queryData } =
        trpc.general.brands.verifications.getVerifications.useQuery(
            { page, limit, search, status },
            { initialData }
        );
    const dataRaw = queryData?.data ?? [];
    const count = queryData?.count ?? 0;

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                brandName: x.brand.name,
                brandEmail: x.brand.email,
            })),
        [dataRaw]
    );

    const pages = useMemo(() => Math.ceil(count / limit), [count, limit]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
                    <Input
                        placeholder="Search by id..."
                        value={
                            (table
                                .getColumn("id")
                                ?.getFilterValue() as string) ?? search
                        }
                        onChange={(event) => {
                            table
                                .getColumn("id")
                                ?.setFilterValue(event.target.value);
                            setSearch(event.target.value);
                        }}
                    />

                    <Select
                        value={
                            (table
                                .getColumn("verificationStatus")
                                ?.getFilterValue() as string) ?? status
                        }
                        onValueChange={(value) => {
                            table
                                .getColumn("verificationStatus")
                                ?.setFilterValue(value);
                            setStatus(
                                value as TableBrandVerifications["verificationStatus"]
                            );
                        }}
                    >
                        <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Search by status" />
                        </SelectTrigger>
                        <SelectContent>
                            {["pending", "approved", "rejected"].map((x) => (
                                <SelectItem key={x} value={x}>
                                    {convertValueToLabel(x)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DataTableViewOptions table={table} />
            </div>

            <DataTable
                table={table}
                columns={columns}
                count={count}
                pages={pages}
            />
        </div>
    );
}
