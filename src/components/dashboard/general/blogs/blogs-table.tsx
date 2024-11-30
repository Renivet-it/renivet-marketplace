"use client";

import { Badge } from "@/components/ui/badge";
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
import { BlogWithAuthorAndTagCount } from "@/lib/validations";
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
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { BlogAction } from "./blog-action";

export type TableBlog = BlogWithAuthorAndTagCount & {
    authorName: string;
    status: string;
};

const columns: ColumnDef<TableBlog>[] = [
    {
        accessorKey: "title",
        header: "Title",
        enableHiding: false,
    },
    {
        accessorKey: "authorName",
        header: "Author",
        enableHiding: false,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const blog = row.original;

            return (
                <Badge
                    variant={
                        blog.status === "published" ? "default" : "destructive"
                    }
                >
                    {convertValueToLabel(blog.status)}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const blog = row.original;
            return format(new Date(blog.createdAt), "MMM dd, yyyy");
        },
    },
    {
        accessorKey: "publishedAt",
        header: "Published At",
        cell: ({ row }) => {
            const blog = row.original;
            return blog.publishedAt
                ? format(new Date(blog.publishedAt), "MMM dd, yyyy")
                : "N/A";
        },
    },
    {
        accessorKey: "tags",
        header: "Tags",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const blog = row.original;
            return <BlogAction blog={blog} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: BlogWithAuthorAndTagCount[];
        count: number;
    };
}

export function BlogsTable({ initialData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
    const [isPublished, setIsPublished] = useQueryState(
        "isPublished",
        parseAsBoolean.withDefault(true)
    );

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const {
        data: { data: dataRaw, count },
    } = trpc.general.blogs.getBlogs.useQuery(
        { page, limit, search, isPublished },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                authorName: `${x.author.firstName} ${x.author.lastName}`,
                status: x.isPublished ? "published" : "draft",
            })),
        [dataRaw]
    );

    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

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
                        placeholder="Search by title..."
                        value={
                            (table
                                .getColumn("title")
                                ?.getFilterValue() as string) ?? search
                        }
                        onChange={(event) => {
                            table
                                .getColumn("title")
                                ?.setFilterValue(event.target.value);
                            setSearch(event.target.value);
                        }}
                    />

                    <Select
                        value={
                            (table
                                .getColumn("status")
                                ?.getFilterValue() as string) ??
                            (isPublished === undefined || isPublished === true
                                ? "published"
                                : "draft")
                        }
                        onValueChange={(value) => {
                            table.getColumn("status")?.setFilterValue(value);
                            setIsPublished(value === "published");
                        }}
                    >
                        <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Search by status" />
                        </SelectTrigger>
                        <SelectContent>
                            {["published", "draft"].map((x) => (
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
