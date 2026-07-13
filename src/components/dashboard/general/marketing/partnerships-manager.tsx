"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

const PARTNERSHIP_STATUSES = [
    "planned",
    "live",
    "completed",
    "cancelled",
] as const;

export function PartnershipsManager() {
    const utils = trpc.useUtils();
    const [partnerName, setPartnerName] = useState("");
    const [campaignType, setCampaignType] = useState("");
    const [goal, setGoal] = useState("");
    const [couponCode, setCouponCode] = useState("");
    const [trackingUrl, setTrackingUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [status, setStatus] =
        useState<(typeof PARTNERSHIP_STATUSES)[number]>("planned");

    const { data, isLoading } = trpc.general.marketing.getPartnerships.useQuery({
        limit: 50,
        page: 1,
    });

    const createPartnership =
        trpc.general.marketing.createPartnership.useMutation({
            onSuccess: async () => {
                toast.success("Partnership saved.");
                setPartnerName("");
                setCampaignType("");
                setGoal("");
                setCouponCode("");
                setTrackingUrl("");
                setNotes("");
                setStatus("planned");
                await utils.general.marketing.getPartnerships.invalidate();
            },
            onError: (error) => toast.error(error.message),
        });

    const deletePartnership =
        trpc.general.marketing.deletePartnership.useMutation({
            onSuccess: async () => {
                toast.success("Partnership deleted.");
                await utils.general.marketing.getPartnerships.invalidate();
            },
            onError: (error) => toast.error(error.message),
        });

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                    Add partnership
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Track collabs with coupon codes and tracked URLs so marketing
                    reporting can tie performance back to the partnership record.
                </p>

                <div className="mt-5 space-y-4">
                    <input
                        value={partnerName}
                        onChange={(event) => setPartnerName(event.target.value)}
                        placeholder="Partner or brand name"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <input
                        value={campaignType}
                        onChange={(event) => setCampaignType(event.target.value)}
                        placeholder="Campaign type"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <input
                        value={goal}
                        onChange={(event) => setGoal(event.target.value)}
                        placeholder="Goal"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <input
                            value={couponCode}
                            onChange={(event) => setCouponCode(event.target.value)}
                            placeholder="Coupon code"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                        <input
                            value={trackingUrl}
                            onChange={(event) => setTrackingUrl(event.target.value)}
                            placeholder="Tracking URL"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(event) =>
                            setStatus(
                                event.target.value as (typeof PARTNERSHIP_STATUSES)[number]
                            )
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                        {PARTNERSHIP_STATUSES.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={4}
                        placeholder="Notes"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />

                    <button
                        type="button"
                        onClick={() =>
                            createPartnership.mutate({
                                partnerName,
                                campaignType,
                                goal,
                                couponCode: couponCode || null,
                                trackingUrl: trackingUrl || null,
                                notes: notes || null,
                                status,
                                metadata: {},
                            })
                        }
                        disabled={createPartnership.isPending}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-300"
                    >
                        {createPartnership.isPending ? "Saving..." : "Save partnership"}
                    </button>
                </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                    Partnership records
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Lightweight operational view for brand collabs and campaign
                    tracking.
                </p>

                <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {[
                                    "Partner",
                                    "Campaign",
                                    "Goal",
                                    "Coupon",
                                    "Tracking URL",
                                    "Status",
                                    "Action",
                                ].map((header) => (
                                    <th
                                        key={header}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-10 text-center text-gray-500"
                                    >
                                        Loading partnerships...
                                    </td>
                                </tr>
                            ) : (data?.data ?? []).length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-10 text-center text-gray-500"
                                    >
                                        No partnerships yet.
                                    </td>
                                </tr>
                            ) : (
                                (data?.data ?? []).map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {item.partnerName}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {item.campaignType}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {item.goal}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {item.couponCode || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {item.trackingUrl ? (
                                                <a
                                                    href={item.trackingUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-teal-700 underline"
                                                >
                                                    Open link
                                                </a>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deletePartnership.mutate({
                                                        id: item.id,
                                                    })
                                                }
                                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
