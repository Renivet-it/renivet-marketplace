"use client";

import { trpc } from "@/lib/trpc/client";
import { Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const DIGEST_TYPES = [
    { value: "new_arrivals", label: "New arrivals digest" },
    { value: "blog_digest", label: "Blog digest" },
] as const;

type DigestType = (typeof DIGEST_TYPES)[number]["value"];
type AudienceType = "subscribers" | "manual";

function parseEmails(value: string) {
    const seen = new Set<string>();

    return value
        .split(/[\n,\s;]+/)
        .map((entry) => entry.trim().toLowerCase())
        .filter((email) => {
            if (!email) return false;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
            if (seen.has(email)) return false;
            seen.add(email);
            return true;
        });
}

async function readEmailsFromFile(file: File) {
    const text = await file.text();
    return parseEmails(text);
}

export function DigestCampaignManager() {
    const utils = trpc.useUtils();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
    const [type, setType] = useState<DigestType>("new_arrivals");
    const [intro, setIntro] = useState("");
    const [scheduledAt, setScheduledAt] = useState("");
    const [defaultLimit, setDefaultLimit] = useState("6");
    const [audienceType, setAudienceType] = useState<AudienceType>("subscribers");
    const [manualRecipients, setManualRecipients] = useState("");

    const manualRecipientList = useMemo(
        () => parseEmails(manualRecipients),
        [manualRecipients]
    );

    const { data, isLoading } = trpc.general.marketing.getCampaigns.useQuery({
        limit: 20,
        page: 1,
    });

    const createCampaign = trpc.general.marketing.createCampaign.useMutation();
    const sendCampaign = trpc.general.marketing.sendCampaign.useMutation();

    async function refreshCampaigns() {
        await utils.general.marketing.getCampaigns.invalidate();
    }

    function resetForm() {
        setName("");
        setSubject("");
        setIntro("");
        setScheduledAt("");
        setAudienceType("subscribers");
        setManualRecipients("");
        setDefaultLimit("6");
        setType("new_arrivals");
    }

    function buildPayload(status: "draft" | "scheduled") {
        return {
            name: name || `${type}-${new Date().toISOString().slice(0, 10)}`,
            type,
            subject:
                subject ||
                (type === "new_arrivals"
                    ? "Fresh arrivals are now live on Renivet"
                    : "New reads from Renivet"),
            status,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            contentHtml: intro,
            metadata: {
                intro,
                defaultLimit: Number(defaultLimit || 6),
                audienceType,
                manualRecipients:
                    audienceType === "manual" ? manualRecipientList : [],
            },
        } as const;
    }

    function validate(action: "draft" | "schedule" | "send") {
        if (audienceType === "manual" && manualRecipientList.length === 0) {
            toast.error("Add at least one valid email for the manual audience.");
            return false;
        }

        if (action === "schedule" && !scheduledAt) {
            toast.error("Choose a schedule date and time first.");
            return false;
        }

        return true;
    }

    async function handleSaveDraft() {
        if (!validate("draft")) return;

        try {
            await createCampaign.mutateAsync(buildPayload("draft"));
            toast.success("Campaign draft saved.");
            resetForm();
            await refreshCampaigns();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to save campaign"
            );
        }
    }

    async function handleSchedule() {
        if (!validate("schedule")) return;

        try {
            await createCampaign.mutateAsync(buildPayload("scheduled"));
            toast.success("Campaign scheduled.");
            resetForm();
            await refreshCampaigns();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to schedule campaign"
            );
        }
    }

    async function handleSendNow() {
        if (!validate("send")) return;

        try {
            const campaign = await createCampaign.mutateAsync(buildPayload("draft"));
            const result = await sendCampaign.mutateAsync({ id: campaign.id });
            toast.success(result.message);
            resetForm();
            await refreshCampaigns();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to send campaign"
            );
        }
    }

    async function handleImportRecipients(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const emails = await readEmailsFromFile(file);
            if (emails.length === 0) {
                toast.error("No valid email addresses were found in that file.");
                return;
            }

            const merged = parseEmails(
                [manualRecipients, emails.join("\n")].filter(Boolean).join("\n")
            );
            setManualRecipients(merged.join("\n"));
            toast.success(`Imported ${emails.length} recipient${emails.length === 1 ? "" : "s"}.`);
        } catch {
            toast.error("Could not read that file. Use a plain CSV or TXT email list.");
        } finally {
            event.target.value = "";
        }
    }

    const isBusy = createCampaign.isPending || sendCampaign.isPending;

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#eef2ff)] p-6">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Digest campaign builder
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Build digest campaigns for active subscribers or a one-time
                        manual email list, then send now or schedule through cron.
                    </p>
                </div>

                <div className="space-y-5 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Campaign type
                            </label>
                            <select
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value as DigestType)
                                }
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                            >
                                {DIGEST_TYPES.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Default item count
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={12}
                                value={defaultLimit}
                                onChange={(event) => setDefaultLimit(event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">
                            Campaign name
                        </label>
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="July digest campaign"
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">
                            Email subject
                        </label>
                        <input
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder="Fresh arrivals are now live on Renivet"
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">
                            Intro copy
                        </label>
                        <textarea
                            value={intro}
                            onChange={(event) => setIntro(event.target.value)}
                            rows={4}
                            placeholder="Add the short intro that appears above the digest items."
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                Audience
                            </label>
                            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setAudienceType("subscribers")}
                                    className={`rounded-2xl border p-4 text-left ${
                                        audienceType === "subscribers"
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <p className="text-sm font-semibold">
                                        Active newsletter subscribers
                                    </p>
                                    <p className="mt-1 text-xs opacity-80">
                                        Uses your active subscriber base and applies
                                        unsubscribe plus frequency-cap rules.
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAudienceType("manual")}
                                    className={`rounded-2xl border p-4 text-left ${
                                        audienceType === "manual"
                                            ? "border-slate-900 bg-slate-900 text-white"
                                            : "border-slate-200 bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <p className="text-sm font-semibold">
                                        Manual email list
                                    </p>
                                    <p className="mt-1 text-xs opacity-80">
                                        Send this digest once to a pasted or imported
                                        recipient list.
                                    </p>
                                </button>
                            </div>
                        </div>

                        {audienceType === "manual" ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Manual recipients
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Paste emails, separate by line or comma, or
                                            import a CSV/TXT file.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                            {manualRecipientList.length} recipients
                                        </span>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv,.txt"
                                            onChange={handleImportRecipients}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                        >
                                            <Upload className="size-4" />
                                            Import list
                                        </button>
                                    </div>
                                </div>

                                <textarea
                                    value={manualRecipients}
                                    onChange={(event) =>
                                        setManualRecipients(event.target.value)
                                    }
                                    rows={7}
                                    placeholder="name1@example.com&#10;name2@example.com, name3@example.com"
                                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                                />
                            </div>
                        ) : null}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">
                            Schedule at
                        </label>
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(event) => setScheduledAt(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Leave empty if you want to send immediately.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={isBusy}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
                        >
                            {createCampaign.isPending && !sendCampaign.isPending
                                ? "Saving..."
                                : "Save draft"}
                        </button>
                        <button
                            type="button"
                            onClick={handleSchedule}
                            disabled={isBusy}
                            className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60"
                        >
                            {createCampaign.isPending && !sendCampaign.isPending
                                ? "Scheduling..."
                                : "Schedule campaign"}
                        </button>
                        <button
                            type="button"
                            onClick={handleSendNow}
                            disabled={isBusy}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {sendCampaign.isPending ? "Sending..." : "Send now"}
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            Recent digest campaigns
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Review draft, scheduled, and completed digest sends.
                        </p>
                    </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                {[
                                    "Name",
                                    "Type",
                                    "Audience",
                                    "Status",
                                    "Scheduled",
                                    "Action",
                                ].map((header) => (
                                    <th
                                        key={header}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        Loading campaigns...
                                    </td>
                                </tr>
                            ) : (data?.data ?? []).length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        No campaigns yet.
                                    </td>
                                </tr>
                            ) : (
                                (data?.data ?? [])
                                    .filter(
                                        (campaign) =>
                                            campaign.type === "new_arrivals" ||
                                            campaign.type === "blog_digest"
                                    )
                                    .map((campaign) => {
                                        const campaignAudience =
                                            campaign.metadata?.audienceType === "manual"
                                                ? "Manual list"
                                                : "Subscribers";

                                        return (
                                            <tr key={campaign.id}>
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    {campaign.name}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {campaign.type}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {campaignAudience}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                                        {campaign.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {campaign.scheduledAt
                                                        ? new Date(
                                                              campaign.scheduledAt
                                                          ).toLocaleString()
                                                        : "Not scheduled"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            sendCampaign.mutate(
                                                                { id: campaign.id },
                                                                {
                                                                    onSuccess: async (
                                                                        result
                                                                    ) => {
                                                                        toast.success(
                                                                            result.message
                                                                        );
                                                                        await refreshCampaigns();
                                                                    },
                                                                    onError: (error) =>
                                                                        toast.error(
                                                                            error.message
                                                                        ),
                                                                }
                                                            )
                                                        }
                                                        disabled={sendCampaign.isPending}
                                                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                                    >
                                                        Send now
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
