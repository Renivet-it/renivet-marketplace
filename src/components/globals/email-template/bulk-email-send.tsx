"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
    CheckCircle,
    Download,
    FileText,
    FileUp,
    History,
    Mail,
    RefreshCcw,
    Trash2,
    Upload,
    Users,
} from "lucide-react";
import {
    clearEmailMessageLogs,
    getEmailMessageLogs,
    retrySelectedEmailMessageLogs,
    sendBulkEmail,
    type EmailMessageLog,
} from "@/actions/sendBulkEmail";
import { useUploadThing } from "@/lib/uploadthing";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

type Recipient = {
    email: string;
    firstName: string;
    discount: string;
    expiryDate: string;
    brandName: string;
};

type ImportRow = Record<string, unknown>;

interface MarketingEmailFormProps {
    availableTabs?: Array<"send" | "logs">;
    defaultTab?: "send" | "logs";
    compact?: boolean;
}

const TEMPLATE_ROWS = [
    {
        Email: "john@example.com",
        FirstName: "John",
        "Discount(%)": "20",
        expiryDate: "2026-12-31",
        BrandName: "BrandX",
    },
    {
        Email: "jane@example.com",
        FirstName: "Jane",
        "Discount(%)": "15",
        expiryDate: "2026-12-31",
        BrandName: "BrandY",
    },
];

export function MarketingEmailForm({
    availableTabs = ["send", "logs"],
    defaultTab = "send",
    compact = false,
}: MarketingEmailFormProps) {
    const initialTab =
        availableTabs.includes(defaultTab) ? defaultTab : availableTabs[0] ?? "send";
    const [activeTab, setActiveTab] = useState<"send" | "logs">(initialTab);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [emailLogs, setEmailLogs] = useState<EmailMessageLog[]>([]);
    const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
    const [logPage, setLogPage] = useState(1);
    const [emailContent, setEmailContent] = useState("");
    const [subject, setSubject] = useState(
        "Trying a new brand shouldn't feel risky - here's INR 1000 OFF"
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [confirmSend, setConfirmSend] = useState(false);
    const [sentCount, setSentCount] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const quillRef = useRef<any>(null);
    const { startUpload } = useUploadThing("contentUploader");
    const logsPerPage = 10;

    const showSendTab = availableTabs.includes("send");
    const showLogsTab = availableTabs.includes("logs");

    const refreshLogs = useCallback(async () => {
        const logs = await getEmailMessageLogs();
        setEmailLogs(logs);
        setLogPage(1);
    }, []);

    useEffect(() => {
        if (showLogsTab) {
            refreshLogs();
        }
    }, [refreshLogs, showLogsTab]);

    useEffect(() => {
        if (!availableTabs.includes(activeTab)) {
            setActiveTab(availableTabs[0] ?? "send");
        }
    }, [activeTab, availableTabs]);

    const paginatedEmailLogs = useMemo(
        () => emailLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage),
        [emailLogs, logPage]
    );
    const exportLogs = (logs: EmailMessageLog[]) => {
        if (!logs.length) return toast.error("No logs to export.");

        const ws = XLSX.utils.json_to_sheet(
            logs.map((log) => ({
                "Sent At": new Date(log.sentAt).toLocaleString(),
                Email: log.email,
                "First Name": log.firstName ?? "",
                Subject: log.subject,
                Status: log.status,
                Success: log.success ? "Yes" : "No",
                Attempts: log.attempts,
                "Message ID": log.messageId ?? "",
                Error: log.error ?? "",
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Email Logs");
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const url = URL.createObjectURL(
            new Blob([buf], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            })
        );
        Object.assign(document.createElement("a"), {
            href: url,
            download: `email_log_${new Date().toISOString().split("T")[0]}.xlsx`,
        }).click();
        URL.revokeObjectURL(url);
    };

    const downloadTemplate = (format: "csv" | "xlsx") => {
        if (format === "csv") {
            const csvContent = [
                Object.keys(TEMPLATE_ROWS[0]),
                ...TEMPLATE_ROWS.map((row) => Object.values(row)),
            ]
                .map((row) => row.join(","))
                .join("\n");
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "email_template.csv";
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            const ws = XLSX.utils.json_to_sheet(TEMPLATE_ROWS);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");
            const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const url = URL.createObjectURL(
                new Blob([buf], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                })
            );
            Object.assign(document.createElement("a"), {
                href: url,
                download: "email_template.xlsx",
            }).click();
            URL.revokeObjectURL(url);
        }

        toast.success(`Template downloaded as ${format.toUpperCase()}.`);
    };

    const applyImportedRows = (rows: ImportRow[]) => {
        const normalized = rows
            .map((row) => ({
                email: String(row.email ?? row.Email ?? "").trim(),
                firstName: String(row.firstname ?? row.FirstName ?? "").trim(),
                discount: String(
                    row["discount(%)"] ?? row["Discount(%)"] ?? row.discount ?? ""
                ).trim(),
                expiryDate: String(row.expirydate ?? row.expiryDate ?? "").trim(),
                brandName: String(row.brandname ?? row.BrandName ?? "").trim(),
            }))
            .filter((row) => row.email.length > 0);

        if (!normalized.length) {
            toast.error("No valid recipient rows found in the uploaded file.");
            return;
        }

        setRecipients(normalized);
        toast.success(`${normalized.length} recipients loaded successfully.`);
    };

    const handleFileChange = (file?: File) => {
        if (!file) return;

        if (file.name.toLowerCase().endsWith(".csv")) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (result) => applyImportedRows(result.data as ImportRow[]),
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result;
            if (!data) {
                toast.error("Unable to read the selected spreadsheet.");
                return;
            }

            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
            applyImportedRows(rows as ImportRow[]);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImageUpload = useCallback(() => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            toast.info("Uploading image...");
            const uploaded = await startUpload([file]);
            if (!uploaded?.length) return toast.error("Image upload failed.");

            const imageUrl = uploaded[0].url;
            const quill = quillRef.current?.getEditor();
            const range = quill?.getSelection(true);
            quill?.insertEmbed(range.index, "image", imageUrl);
            toast.success("Image uploaded.");
        };
    }, [startUpload]);

    const toggleLogSelection = (id: string) => {
        setSelectedLogIds((current) =>
            current.includes(id)
                ? current.filter((selectedId) => selectedId !== id)
                : [...current, id]
        );
    };

    const toggleAllLogs = () => {
        const pageIds = paginatedEmailLogs.map((log) => log.id);

        setSelectedLogIds((current) =>
            pageIds.every((id) => current.includes(id))
                ? current.filter((id) => !pageIds.includes(id))
                : Array.from(new Set([...current, ...pageIds]))
        );
    };

    const retryLogs = async (logsToRetry: EmailMessageLog[]) => {
        if (!logsToRetry.length) return toast.error("Select at least one log to retry.");

        setIsRetrying(true);
        const results = await retrySelectedEmailMessageLogs(
            logsToRetry.map((log) => log.id)
        );
        await refreshLogs();
        setSelectedLogIds([]);
        setIsRetrying(false);
        toast.success(
            `Retry complete: ${results.filter((result) => result.success).length}/${logsToRetry.length} sent.`
        );
    };

    const onSubmit = async () => {
        if (isLoading) return;

        if (!recipients.length) {
            toast.error("Import your recipient list first.");
            setConfirmSend(false);
            return;
        }

        if (!subject.trim() || !emailContent.trim()) {
            toast.error("Please write your email subject and content.");
            setConfirmSend(false);
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("recipients", JSON.stringify(recipients));
            formData.append("subject", subject);
            formData.append("emailContent", emailContent);

            const result = await sendBulkEmail(formData);
            await refreshLogs();

            if (result.success) {
                setSentCount(recipients.length);
                setRecipients([]);
                setEmailContent("");
                setSubject("");
                toast.success("Campaign sent successfully.");
            } else {
                toast.error(result.message || "Failed to send emails.");
                setActiveTab("logs");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred while sending emails.");
        } finally {
            setIsLoading(false);
            setConfirmSend(false);
        }
    };

    return (
        <div className={`mx-auto w-full max-w-none ${compact ? "p-0" : "px-6 py-12"}`}>
            {showSendTab && showLogsTab ? (
                <div className="mb-8 flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setActiveTab("send")}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                            activeTab === "send"
                                ? "bg-slate-900 text-white"
                                : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        <Mail className="size-4" />
                        Manual Campaign
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("logs")}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                            activeTab === "logs"
                                ? "bg-slate-900 text-white"
                                : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        <History className="size-4" />
                        Logs
                    </button>
                </div>
            ) : null}

            {activeTab === "send" ? (
                <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2">
                                <FileUp className="size-4 text-slate-700" />
                                <p className="text-sm font-semibold text-slate-900">
                                    Official imports
                                </p>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">
                                Supports `.csv`, `.xlsx`, and `.xls` recipient lists.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Download className="size-4 text-slate-700" />
                                <p className="text-sm font-semibold text-slate-900">
                                    Template export
                                </p>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => downloadTemplate("csv")}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-gray-50"
                                >
                                    CSV Template
                                </button>
                                <button
                                    type="button"
                                    onClick={() => downloadTemplate("xlsx")}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-gray-50"
                                >
                                    Excel Template
                                </button>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2">
                                <FileText className="size-4 text-slate-700" />
                                <p className="text-sm font-semibold text-slate-900">
                                    Required columns
                                </p>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">
                                Email, FirstName, Discount(%), expiryDate, BrandName
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Import Audience
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Upload your recipient file and verify the imported list
                                        before sending.
                                    </p>
                                </div>
                                <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                                    {recipients.length} loaded
                                </div>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-slate-400 hover:bg-slate-100/70"
                            >
                                <Upload className="mx-auto size-10 text-slate-400" />
                                <p className="mt-4 text-base font-semibold text-slate-900">
                                    Upload recipient spreadsheet
                                </p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Click to import CSV or Excel files
                                </p>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                                    className="hidden"
                                />
                            </div>

                            {recipients.length > 0 ? (
                                <div className="mt-6 space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase text-slate-400">
                                                Recipients
                                            </p>
                                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                                {recipients.length}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase text-slate-400">
                                                Import status
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-emerald-700">
                                                Ready for review
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase text-slate-400">
                                                Source
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                                Manual upload
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {["Email", "Name", "Discount", "Expiry", "Brand"].map(
                                                        (header) => (
                                                            <th
                                                                key={header}
                                                                className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500"
                                                            >
                                                                {header}
                                                            </th>
                                                        )
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {recipients.slice(0, 6).map((recipient) => (
                                                    <tr key={`${recipient.email}-${recipient.brandName}`}>
                                                        <td className="px-4 py-3 text-slate-700">
                                                            {recipient.email}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700">
                                                            {recipient.firstName || "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700">
                                                            {recipient.discount || "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700">
                                                            {recipient.expiryDate || "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-700">
                                                            {recipient.brandName || "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : null}
                        </section>

                        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Compose Campaign
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Build your promotional email content before confirming the
                                    send.
                                </p>
                            </div>

                            <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800">
                                Default template is available if you want to start from a standard
                                Renivet promotional layout and then customize it.
                            </div>

                            <input
                                type="text"
                                placeholder="Enter email subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                            />

                            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={emailContent}
                                    onChange={setEmailContent}
                                    className="bg-white"
                                    modules={{
                                        toolbar: {
                                            container: [
                                                [{ header: [1, 2, false] }],
                                                ["bold", "italic", "underline", "strike"],
                                                [{ list: "ordered" }, { list: "bullet" }],
                                                ["link", "image"],
                                                ["clean"],
                                            ],
                                            handlers: { image: handleImageUpload },
                                        },
                                    }}
                                />
                            </div>

                            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <div className="flex items-center gap-2">
                                    <Users className="size-4 text-slate-600" />
                                    <p className="text-sm font-semibold text-slate-900">
                                        Send summary
                                    </p>
                                </div>
                                <p className="mt-2 text-sm text-slate-600">
                                    {recipients.length} recipients prepared for this campaign.
                                </p>
                            </div>

                            <div className="mt-6 flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setConfirmSend(true)}
                                    disabled={
                                        isLoading ||
                                        recipients.length === 0 ||
                                        !subject.trim() ||
                                        !emailContent.trim()
                                    }
                                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-gray-300"
                                >
                                    {isLoading ? "Sending..." : "Review & Send Campaign"}
                                </button>
                            </div>
                        </section>
                    </div>

                    {sentCount !== null ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                            <CheckCircle className="mx-auto size-12 text-emerald-600" />
                            <h3 className="mt-3 text-xl font-semibold text-emerald-900">
                                Campaign sent successfully
                            </h3>
                            <p className="mt-2 text-sm text-emerald-700">
                                Your message was sent to {sentCount} recipients.
                            </p>
                        </div>
                    ) : null}

                    {confirmSend ? (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Confirm campaign send
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Send &quot;{subject}&quot; to {recipients.length} recipients?
                                </p>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmSend(false)}
                                        className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onSubmit}
                                        disabled={isLoading}
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        Confirm Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {activeTab === "logs" ? (
                <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-gray-800">
                                Email Send Logs
                            </h2>
                            <p className="text-sm text-gray-500">
                                Saved in the database with retry support for single or selected rows.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    retryLogs(
                                        emailLogs.filter((log) => selectedLogIds.includes(log.id))
                                    )
                                }
                                disabled={isLoading || isRetrying || selectedLogIds.length === 0}
                                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-gray-300"
                            >
                                <RefreshCcw className="size-4" />
                                Retry Selected
                            </button>
                            <button
                                type="button"
                                onClick={() => retryLogs(emailLogs.filter((log) => !log.success))}
                                disabled={
                                    isLoading ||
                                    isRetrying ||
                                    emailLogs.filter((log) => !log.success).length === 0
                                }
                                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:text-gray-400"
                            >
                                <RefreshCcw className="size-4" />
                                Retry Failed
                            </button>
                            <button
                                type="button"
                                onClick={() => exportLogs(emailLogs)}
                                disabled={emailLogs.length === 0}
                                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:text-gray-400"
                            >
                                <Download className="size-4" />
                                Export
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    await clearEmailMessageLogs();
                                    await refreshLogs();
                                    setSelectedLogIds([]);
                                    toast.success("Email logs cleared.");
                                }}
                                disabled={emailLogs.length === 0 || isLoading || isRetrying}
                                className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:text-gray-400"
                            >
                                <Trash2 className="size-4" />
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase text-gray-400">Total</p>
                            <p className="mt-1 text-2xl font-bold text-gray-800">
                                {emailLogs.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-4">
                            <p className="text-xs font-semibold uppercase text-emerald-500">Sent</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-700">
                                {emailLogs.filter((log) => log.success).length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-4">
                            <p className="text-xs font-semibold uppercase text-red-500">Failed</p>
                            <p className="mt-1 text-2xl font-bold text-red-700">
                                {emailLogs.filter((log) => !log.success).length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase text-slate-500">Selected</p>
                            <p className="mt-1 text-2xl font-bold text-slate-800">
                                {selectedLogIds.length}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="min-w-[1200px] divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="w-12 px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={
                                                paginatedEmailLogs.length > 0 &&
                                                paginatedEmailLogs.every((log) =>
                                                    selectedLogIds.includes(log.id)
                                                )
                                            }
                                            onChange={toggleAllLogs}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Recipient
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Subject
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Attempts
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Sent At
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {paginatedEmailLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-12 text-center text-sm text-gray-500"
                                        >
                                            No email logs yet.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmailLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLogIds.includes(log.id)}
                                                    onChange={() => toggleLogSelection(log.id)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">
                                                    {log.firstName || "Recipient"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {log.email}
                                                </div>
                                            </td>
                                            <td className="max-w-sm truncate px-4 py-3 text-gray-600">
                                                {log.subject}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                        log.success
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {log.attempts}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {new Date(log.sentAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => retryLogs([log])}
                                                    disabled={isLoading || isRetrying}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:text-gray-400"
                                                >
                                                    <RefreshCcw className="size-3.5" />
                                                    Retry
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
