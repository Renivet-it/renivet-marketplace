"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { toast } from "sonner";

const DIGEST_TYPES = [
    { value: "new_arrivals", label: "New arrivals digest" },
    { value: "blog_digest", label: "Blog digest" },
] as const;

export function DigestCampaignManager() {
    const utils = trpc.useUtils();
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [type, setType] = useState<(typeof DIGEST_TYPES)[number]["value"]>(
        "new_arrivals"
    );
    const [intro, setIntro] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [defaultLimit, setDefaultLimit] = useState("6");

    const { data, isLoading } = trpc.general.marketing.getCampaigns.useQuery({
        limit: 20,
        page: 1,
    });

    const createCampaign = trpc.general.marketing.createCampaign.useMutation({
        onSuccess: async () => {
            toast.success("Campaign saved.");
            setName("");
            setSubject("");
            setIntro("");
            setScheduledAt("");
            await utils.general.marketing.getCampaigns.invalidate();
        },
        onError: (error) => toast.error(error.message),
    });

    const sendCampaign = trpc.general.marketing.sendCampaign.useMutation({
        onSuccess: async (result) => {
            toast.success(result.message);
            await utils.general.marketing.getCampaigns.invalidate();
        },
        onError: (error) => toast.error(error.message),
    });

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                    Scheduled digests
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Create admin-driven `new_arrivals` and `blog_digest` campaigns
                    that run through the shared marketing guardrails.
                </p>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Campaign type
                        </label>
                        <select
                            value={type}
                            onChange={(event) =>
                                setType(
                                    event.target.value as (typeof DIGEST_TYPES)[number]["value"]
                                )
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        >
                            {DIGEST_TYPES.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Campaign name
                        </label>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="July new arrivals"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Email subject
                        </label>
                        <input
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder="Fresh conscious finds just landed"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Intro copy
                        </label>
                        <textarea
                            value={intro}
                            onChange={(event) => setIntro(event.target.value)}
                            rows={4}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Schedule at
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(event) => setScheduledAt(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Default items
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={12}
                                value={defaultLimit}
                                onChange={(event) => setDefaultLimit(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                createCampaign.mutate({
                                    name:
                                        name ||
                                        `${type}-${new Date().toISOString().slice(0, 10)}`,
                                    type,
                                    subject:
                                        subject ||
                                        (type === "new_arrivals"
                                            ? "Fresh arrivals are now live on Renivet"
                                            : "New reads from Renivet"),
                                    status: scheduledAt ? "scheduled" : "draft",
                                    scheduledAt: scheduledAt
                                        ? new Date(scheduledAt)
                                        : null,
                                    contentHtml: intro,
                                    metadata: {
                                        intro,
                                        defaultLimit: Number(defaultLimit || 6),
                                    },
                                })
                            }
                            disabled={createCampaign.isPending}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-300"
                        >
                            {createCampaign.isPending ? "Saving..." : "Save campaign"}
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Recent campaigns
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Draft, scheduled, and completed lifecycle campaigns.
                        </p>
                    </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {["Name", "Type", "Status", "Scheduled", "Action"].map(
                                    (header) => (
                                        <th
                                            key={header}
                                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                                        >
                                            {header}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-gray-500"
                                    >
                                        Loading campaigns...
                                    </td>
                                </tr>
                            ) : (data?.data ?? []).length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-gray-500"
                                    >
                                        No campaigns yet.
                                    </td>
                                </tr>
                            ) : (
                                (data?.data ?? []).map((campaign) => (
                                    <tr key={campaign.id}>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {campaign.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {campaign.type}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {campaign.scheduledAt
                                                ? new Date(
                                                      campaign.scheduledAt
                                                  ).toLocaleString()
                                                : "Not scheduled"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {(campaign.type === "new_arrivals" ||
                                                campaign.type === "blog_digest") && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        sendCampaign.mutate({
                                                            id: campaign.id,
                                                        })
                                                    }
                                                    disabled={sendCampaign.isPending}
                                                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    Send now
                                                </button>
                                            )}
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
