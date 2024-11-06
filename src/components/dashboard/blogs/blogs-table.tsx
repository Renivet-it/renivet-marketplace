"use client";

import { Badge } from "@/components/ui/badge";
import {
    DataTableViewOptions,
    Pagination,
} from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel } from "@/lib/utils";
import { BlogWithAuthorAndTag } from "@/lib/validations";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { BlogAction } from "./blog-action";

export type TableBlog = BlogWithAuthorAndTag & {
    authorName: string;
    status: string;
    tagCount: number;
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
        accessorKey: "tagCount",
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
    initialBlogs: (BlogWithAuthorAndTag & {
        blogCount: number;
    })[];
}

export function BlogsTable({ initialBlogs }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const { data: blogsRaw } = trpc.blogs.getBlogs.useQuery(
        { page, limit },
        { initialData: initialBlogs }
    );

    const blogs = useMemo(
        () =>
            blogsRaw?.map((blog) => ({
                ...blog,
                authorName: `${blog.author.firstName} ${blog.author.lastName}`,
                status: blog.isPublished ? "published" : "draft",
                tagCount: blog.tags.length,
            })) ?? [],
        [blogsRaw]
    );

    const pages = useMemo(
        () => Math.ceil(blogsRaw?.[0]?.blogCount / limit) ?? 1,
        [blogsRaw, limit]
    );

    const table = useReactTable({
        data: blogs,
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
                                ?.getFilterValue() as string) ?? ""
                        }
                        onChange={(event) =>
                            table
                                .getColumn("title")
                                ?.setFilterValue(event.target.value)
                        }
                    />

                    <Select
                        value={
                            (table
                                .getColumn("status")
                                ?.getFilterValue() as string) ?? ""
                        }
                        onValueChange={(value) =>
                            table.getColumn("status")?.setFilterValue(value)
                        }
                    >
                        <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Search by status" />
                        </SelectTrigger>
                        <SelectContent>
                            {["draft", "published"].map((x) => (
                                <SelectItem key={x} value={x}>
                                    {convertValueToLabel(x)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DataTableViewOptions table={table} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="max-w-60"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    Showing {table.getRowModel().rows?.length ?? 0} of{" "}
                    {blogsRaw?.[0]?.blogCount ?? 0} blogs
                </p>

                <Pagination total={pages} />
            </div>
        </div>
    );
}
