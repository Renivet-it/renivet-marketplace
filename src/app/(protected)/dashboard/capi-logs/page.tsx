"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination-dash";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { format } from "date-fns";
import { Copy, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CapiLogsPage() {
    const [page, setPage] = useState(1);
    const limit = 50;

    const { data, isLoading } = trpc.general.capiLogs.getLogs.useQuery({
        page,
        limit,
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="flex h-full flex-col space-y-4 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        CAPI Event Logs
                    </h2>
                    <p className="text-muted-foreground">
                        View raw Facebook Conversions API events and responses.
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Event ID</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Skeleton className="h-5 w-32" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-40" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-20" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-64" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="ml-auto h-8 w-16" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : data?.logs.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-24 text-center"
                                >
                                    No CAPI logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-medium">
                                        {log.eventName}
                                    </TableCell>
                                    <TableCell>
                                        {log.createdAt
                                            ? format(
                                                  new Date(log.createdAt),
                                                  "MMM d, yyyy HH:mm:ss"
                                              )
                                            : "N/A"}
                                    </TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {log.eventId}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-2 h-6 w-6"
                                            onClick={() =>
                                                copyToClipboard(log.eventId)
                                            }
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <LogDetailsDialog log={log} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Advanced Pagination Controls */}
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

function LogDetailsDialog({ log }: { log: any }) {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Inspect
                </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>CAPI Request Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 rounded-md border p-4">
                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h4 className="text-sm font-semibold">
                                    Response
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        copyToClipboard(
                                            JSON.stringify(
                                                log.response,
                                                null,
                                                2
                                            )
                                        )
                                    }
                                >
                                    Copy
                                </Button>
                            </div>
                            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                                {JSON.stringify(log.response, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h4 className="text-sm font-semibold">
                                    User Data
                                </h4>
                            </div>
                            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                                {JSON.stringify(log.userData, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h4 className="text-sm font-semibold">
                                    Custom Data
                                </h4>
                            </div>
                            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
                                {JSON.stringify(log.customData, null, 2)}
                            </pre>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
