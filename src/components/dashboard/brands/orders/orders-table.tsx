"use client";

import { Badge } from "@/components/ui/badge";
import {
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import { useState } from "react";
import { OrderSingle } from "../../general/orders/order-single";

export type TableOrder = OrderWithItemAndBrand;

interface PageProps {
    initialData: {
        data: OrderWithItemAndBrand[];
        count: number;
    };
    brandId: string;
}

export function BrandOrdersTable({ initialData, brandId }: PageProps) {
    const [orders] = useState(initialData.data);

    return (
        <div className="rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Customer ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Created At
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td className="whitespace-nowrap px-6 py-4">
                                <OrderSingle order={order} />
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                {order.userId}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                {formatPriceTag(
                                    +convertPaiseToRupees(order.totalAmount),
                                    true
                                )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <Badge>
                                    {convertValueToLabel(order.status)}
                                </Badge>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                {format(
                                    new Date(order.createdAt),
                                    "MMM dd, yyyy"
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
