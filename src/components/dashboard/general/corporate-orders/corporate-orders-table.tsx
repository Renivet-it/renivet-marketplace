"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel, formatINR } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export function CorporateOrdersTable({ initialData }: { initialData: any }) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const { data, isFetching, refetch } =
        trpc.general.corporateOrders.listOrders.useQuery(
            {
                page: 1,
                limit: 50,
                search: search || undefined,
                status: (status || undefined) as any,
            },
            {
                initialData,
            }
        );

    return (
        <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
                <Input
                    placeholder="Search by order ID, company, contact, or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="">All statuses</option>
                    <option value="payment_pending">Payment Pending</option>
                    <option value="inquiry_received">Inquiry Received</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="in_production">In Production</option>
                    <option value="quality_check">Quality Check</option>
                    <option value="ready_for_dispatch">Ready for Dispatch</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                </select>
                <Button onClick={() => refetch()} disabled={isFetching}>
                    {isFetching ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3">Order ID</th>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Quantity</th>
                            <th className="px-4 py-3">Total Value</th>
                            <th className="px-4 py-3">Advance Paid</th>
                            <th className="px-4 py-3">Balance Due</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data?.length ? (
                            data.data.map((order: any) => (
                                <tr
                                    key={order.id}
                                    className="border-t border-slate-100"
                                >
                                    <td className="px-4 py-3 font-semibold text-slate-900">
                                        {order.publicOrderId}
                                    </td>
                                    <td className="px-4 py-3">{order.companyName}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {order.contactPersonName}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {order.emailAddress}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{order.quantity}</td>
                                    <td className="px-4 py-3">
                                        {formatINR(order.totalPaise)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatINR(order.advancePaidPaise)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatINR(order.balanceDuePaise)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {convertValueToLabel(order.status)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(order.createdAt).toLocaleDateString(
                                            "en-IN"
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/dashboard/general/corporate-orders/${order.id}`}
                                            className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                                        >
                                            View details
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    className="px-4 py-8 text-slate-500"
                                    colSpan={10}
                                >
                                    No corporate orders found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
