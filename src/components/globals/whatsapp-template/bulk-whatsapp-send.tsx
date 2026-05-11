"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  CheckCircle2,
  Download,
  History,
  MessageSquare,
  RefreshCcw,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  clearWhatsAppMessageLogs,
  getWhatsAppMessageLogs,
  retrySelectedWhatsAppMessageLogs,
  sendSingleWhatsAppMessage,
  type CampaignTemplateKey,
  type WhatsAppMessageLog,
} from "@/actions/whatsapp/send-marketing-notification";
import * as XLSX from "xlsx";

type Recipient = { full_name: string; phone_number: string };

const TEMPLATES = [
  {
    key: "renivet_story_1" as CampaignTemplateKey,
    badge: "Message 1",
    emoji: "Story",
    name: "Story Behind It",
    tagline: "Discover brands with care and intent",
    description:
      "A warm introduction to Renivet as a place for meaningful brand discovery.",
    preview:
      "Ever fallen in love with something because of the story behind it?\n\nWe're building Renivet - a place to discover brands that care deeply about what they create, and the people they create it for.\n\nNot just products. Stories worth being part of.\n\nCome explore:",
    button: "Explore Renivet",
    accent: "#6366f1",
    bg: "from-indigo-50 to-violet-50",
    border: "border-indigo-500",
    badgeCls: "bg-indigo-100 text-indigo-700",
    check: "text-indigo-500",
  },
  {
    key: "renivet_story_2" as CampaignTemplateKey,
    badge: "Message 2",
    emoji: "Life",
    name: "Part Of Your Life",
    tagline: "Every discovery feels personal",
    description:
      "Positions Renivet as intentional, personal, and emotionally resonant.",
    preview:
      "Some products are bought.\nSome become a part of your life.\n\nAt Renivet, every brand has a story, every piece has intention, and every discovery feels personal.\n\nYou might just find something that feels made for you.",
    button: "Find Yours",
    accent: "#10b981",
    bg: "from-emerald-50 to-teal-50",
    border: "border-emerald-500",
    badgeCls: "bg-emerald-100 text-emerald-700",
    check: "text-emerald-500",
  },
  {
    key: "renivet_story_3" as CampaignTemplateKey,
    badge: "Message 3",
    emoji: "Craft",
    name: "Less Like Scrolling",
    tagline: "The maker, craft, details, and story",
    description:
      "Frames shopping as discovery instead of endless scrolling.",
    preview:
      "We think shopping should feel less like scrolling...\nand more like discovering something you'll want to talk about.\n\nThe maker. The craft. The little details. The story.\n\nThat's Renivet.\n\nTake a look:",
    button: "Take A Look",
    accent: "#f59e0b",
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-500",
    badgeCls: "bg-amber-100 text-amber-700",
    check: "text-amber-500",
  },
  {
    key: "renivet_story_4" as CampaignTemplateKey,
    badge: "Message 4",
    emoji: "Care",
    name: "Things That Mean Something",
    tagline: "Not mass-made noise",
    description:
      "A concise thought-starter about buying products that mean something.",
    preview:
      "A tiny thought.\n\nWhat if the things you bought actually meant something?\n\nNot mass-made noise. But products crafted with care by brands building something beautiful.\n\nWelcome to Renivet.",
    button: "Explore Renivet",
    accent: "#ec4899",
    bg: "from-rose-50 to-pink-50",
    border: "border-rose-500",
    badgeCls: "bg-rose-100 text-rose-700",
    check: "text-rose-500",
  },
  {
    key: "renivet_story_5" as CampaignTemplateKey,
    badge: "Message 5",
    emoji: "Build",
    name: "Something Different",
    tagline: "People, ideas, craft, and stories",
    description:
      "A quieter message that builds curiosity around Renivet's mission.",
    preview:
      "We're quietly building something different.\n\nA place where you don't just buy products -\nyou discover people, ideas, craftsmanship, and stories you want to be part of.\n\nExplore Renivet:",
    button: "Explore Renivet",
    accent: "#0f766e",
    bg: "from-teal-50 to-cyan-50",
    border: "border-teal-500",
    badgeCls: "bg-teal-100 text-teal-700",
    check: "text-teal-500",
  },
  {
    key: "renivet_story_6" as CampaignTemplateKey,
    badge: "Message 6",
    emoji: "Find",
    name: "Stumble Upon Beauty",
    tagline: "Find something beautiful",
    description:
      "Invites customers to discover lesser-known brands they can make their own.",
    preview:
      "Maybe the best things aren't the ones everyone knows about.\n\nThey're the ones you stumble upon, fall in love with, and somehow make part of your story.\n\nThat's what Renivet is all about.\n\nCome discover something beautiful:",
    button: "Discover",
    accent: "#7c3aed",
    bg: "from-violet-50 to-fuchsia-50",
    border: "border-violet-500",
    badgeCls: "bg-violet-100 text-violet-700",
    check: "text-violet-500",
  },
  {
    key: "renivet_story_7" as CampaignTemplateKey,
    badge: "Message 7",
    emoji: "Ask",
    name: "Better Stories Than Ads",
    tagline: "Brands that genuinely care",
    description:
      "A question-led message about choosing stories over ads.",
    preview:
      "A small question.\n\nWhat if the things you bought had better stories than ads?\n\nAt Renivet, we're building a space for brands that genuinely care about the people using their products.\n\nYou might find your next favourite thing here.",
    button: "Explore",
    accent: "#2563eb",
    bg: "from-blue-50 to-sky-50",
    border: "border-blue-500",
    badgeCls: "bg-blue-100 text-blue-700",
    check: "text-blue-500",
  },
];
export function MarketingWhatsAppForm() {
  const [activeTab, setActiveTab] = useState<"send" | "logs">("send");
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [messageLogs, setMessageLogs] = useState<WhatsAppMessageLog[]>([]);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 10;
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [fileError, setFileError] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<CampaignTemplateKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit } = useForm();

  const refreshLogs = useCallback(async () => {
    const logs = await getWhatsAppMessageLogs();
    setMessageLogs(logs);
    setLogPage(1);
  }, []);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  const normalizeHeader = (h: string) => {
    const map: Record<string, string> = {
      full_name: "full_name",
      "full name": "full_name",
      phonenumber: "phone_number",
      "phone number": "phone_number",
      phone: "phone_number",
    };
    return map[h.trim().toLowerCase()] ?? h.trim().toLowerCase();
  };

  const validatePhone = (p: string) => /^\+?[1-9]\d{1,14}$/.test(p);
  const transformPhone = (p: string) => {
    p = p.replace(/[^+\d]/g, "");
    return !p.startsWith("+") && /^\d{10}$/.test(p) ? `+91${p}` : p;
  };

  const handleFileChange = (file: File | undefined) => {
    setFileError("");
    if (!file) return setFileError("Please upload a file");
    const allowed = ["text/csv", "application/vnd.ms-excel", "text/plain"];
    if (!allowed.includes(file.type))
      return setFileError("Please upload a valid CSV file");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      transformHeader: normalizeHeader,
      transform: (v) => v.trim().replace(/^"|"$/g, ""),
      complete: (result) => {
        const fields = result.meta.fields ?? [];
        const missing = ["full_name", "phone_number"].filter(
          (h) => !fields.includes(h)
        );
        if (missing.length)
          return toast.error(`Missing columns: ${missing.join(", ")}`);

        const invalidRows: string[] = [];
        const valid = (result.data as Recipient[])
          .map((row, i) => {
            const r = {
              full_name: row.full_name?.trim().replace(/^"|"$/g, "") ?? "",
              phone_number: transformPhone(row.phone_number ?? ""),
            };
            const errs: string[] = [];
            if (!r.full_name) errs.push("Missing full_name");
            if (!validatePhone(r.phone_number))
              errs.push(`Invalid phone: ${r.phone_number}`);
            if (errs.length) {
              invalidRows.push(`Row ${i + 2}: ${errs.join(", ")}`);
              return null;
            }
            return r;
          })
          .filter((r): r is Recipient => r !== null);

        if (!valid.length)
          return toast.error(
            `No valid rows. Errors: ${invalidRows.join("; ")}`
          );
        setRecipients(valid);
        setShowPreview(true);
        if (valid.length !== (result.data as Recipient[]).length)
          toast.warning(`Some rows skipped: ${invalidRows.join("; ")}`);
      },
      error: () => {
        toast.error("Failed to parse the file.");
        setFileError("Failed to parse the file");
      },
    });
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files?.[0]);
  }, []);
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const downloadTemplate = () => {
    const blob = new Blob(
      ["full_name,phone_number\nJohn Doe,9876543210\nJane Smith,8765432109"],
      { type: "text/csv" }
    );
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: "whatsapp_template.csv",
    }).click();
    URL.revokeObjectURL(url);
  };

  const exportLogs = (logs: WhatsAppMessageLog[]) => {
    if (!logs.length) {
      toast.error("No logs to export.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(
      logs.map((e) => ({
        "Sent At": new Date(e.sentAt).toLocaleString(),
        Template: e.templateName,
        "Phone Number": e.phoneNumber,
        "Full Name": e.fullName,
        Status: e.status,
        Success: e.success ? "Yes" : "No",
        Attempts: e.attempts,
        SID: e.sid ?? "",
        Error: e.error ?? "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Message Log");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const url = URL.createObjectURL(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );
    Object.assign(document.createElement("a"), {
      href: url,
      download: `whatsapp_log_${new Date().toISOString().split("T")[0]}.xlsx`,
    }).click();
    URL.revokeObjectURL(url);
  };

  const toggleLogSelection = (id: string) => {
    setSelectedLogIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const toggleAllLogs = () => {
    const pageIds = messageLogs
      .slice((logPage - 1) * logsPerPage, logPage * logsPerPage)
      .map((log) => log.id);

    setSelectedLogIds((current) =>
      pageIds.every((id) => current.includes(id))
        ? current.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...current, ...pageIds]))
    );
  };

  const retryLogs = async (logsToRetry: WhatsAppMessageLog[]) => {
    if (!logsToRetry.length) {
      toast.error("Select at least one log to retry.");
      return;
    }

    setIsRetrying(true);
    const results = await retrySelectedWhatsAppMessageLogs(
      logsToRetry.map((log) => log.id)
    );
    const successCount = results.filter((result) => result.success).length;

    await refreshLogs();
    setSelectedLogIds([]);
    setIsRetrying(false);
    toast.success(`Retry complete: ${successCount}/${logsToRetry.length} sent.`);
  };

  const onSubmit = async () => {
    if (!selectedTemplate)
      return toast.error("Please select a campaign template first.");
    if (!recipients.length)
      return toast.error("Please upload a valid CSV file.");

    setIsLoading(true);
    setProgress(0);

    let successCount = 0;
    const errors: string[] = [];
    const log: WhatsAppMessageLog[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      const result = await sendSingleWhatsAppMessage({
        ...r,
        templateKey: selectedTemplate,
      });
      if (result.log) log.push(result.log);
      if (result.success) successCount++;
      else if (result.error) errors.push(result.error);
      setProgress(((i + 1) / recipients.length) * 100);
    }

    if (log.length) {
      exportLogs(log);
      await refreshLogs();
      setActiveTab("logs");
    }

    if (successCount > 0) {
      toast.success(`Successfully sent ${successCount} WhatsApp messages`);
    } else {
      toast.error(errors.join("; ") || "Failed to send messages");
    }

    setRecipients([]);
    setShowPreview(false);
    setConfirmSend(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(false);
    setProgress(100);
  };

  const activeTpl = TEMPLATES.find((t) => t.key === selectedTemplate);
  const selectedLogs = messageLogs.filter((log) =>
    selectedLogIds.includes(log.id)
  );
  const failedLogs = messageLogs.filter((log) => !log.success);
  const isBusy = isLoading || isRetrying;
  const totalLogPages = Math.max(1, Math.ceil(messageLogs.length / logsPerPage));
  const paginatedMessageLogs = messageLogs.slice(
    (logPage - 1) * logsPerPage,
    logPage * logsPerPage
  );

  return (
    <div className="mx-auto w-full max-w-none space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("send")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "send"
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Send className="h-4 w-4" />
          Send Campaign
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "logs"
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <History className="h-4 w-4" />
          Logs
          {messageLogs.length > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === "logs"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {messageLogs.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "send" && (
        <>
      {/* ── Step 1: Template Selector ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-800">
            Step 1 — Choose Campaign Template
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => {
            const sel = selectedTemplate === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedTemplate(t.key)}
                className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 bg-gradient-to-br ${t.bg} ${
                  sel
                    ? `${t.border} shadow-md scale-[1.01]`
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.badgeCls}`}
                  >
                    {t.badge}
                  </span>
                  {sel && (
                    <CheckCircle2 className={`w-5 h-5 ${t.check}`} />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{t.emoji}</span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {t.name}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 mb-2">
                  {t.tagline}
                </p>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  {t.description}
                </p>
                {/* Mini WhatsApp preview */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-4 whitespace-pre-line">
                    {t.preview}
                  </p>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: t.accent }}
                    >
                      🔗 {t.button}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 2: CSV Upload ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-800">
              Step 2 — Upload Recipients CSV
            </h2>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            CSV Template
          </button>
        </div>

        <form
          onSubmit={handleSubmit(() => {
            if (!selectedTemplate)
              return toast.error("Please select a campaign template first.");
            setConfirmSend(true);
          })}
          className="space-y-5"
        >
          <div
            ref={dropRef}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">
              Drag & drop a CSV file here, or click to select
            </p>
            <input
              type="file"
              accept=".csv"
              {...register("file")}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              ref={fileInputRef}
              className="hidden"
            />
            {fileError && (
              <p className="text-red-500 text-sm mt-2">{fileError}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Required columns: full_name, phone_number
            </p>
          </div>

          {recipients.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  ✅ {recipients.length} recipients loaded
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="text-indigo-600 hover:underline text-sm font-medium"
                >
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </button>
              </div>
              {showPreview && (
                <div className="overflow-x-auto rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Full Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Phone Number
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {recipients.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-800">
                            {r.full_name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {r.phone_number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                {progress === 100
                  ? "Finalizing..."
                  : `Sending... ${progress.toFixed(0)}%`}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors text-sm font-semibold"
          >
            <Send className="w-4 h-4" />
            {isLoading ? "Sending..." : "Review & Send Campaign"}
          </button>
        </form>
      </div>
        </>
      )}

      {activeTab === "logs" && (
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                WhatsApp Send Logs
              </h2>
              <p className="text-sm text-gray-500">
                Saved in this browser with retry support for single or selected
                rows.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => retryLogs(selectedLogs)}
                disabled={isBusy || selectedLogs.length === 0}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry Selected
              </button>
              <button
                type="button"
                onClick={() => retryLogs(failedLogs)}
                disabled={isBusy || failedLogs.length === 0}
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-300"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry Failed
              </button>
              <button
                type="button"
                onClick={() => exportLogs(messageLogs)}
                disabled={messageLogs.length === 0}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:text-gray-400"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearWhatsAppMessageLogs();
                  await refreshLogs();
                  setSelectedLogIds([]);
                  toast.success("Logs cleared.");
                }}
                disabled={messageLogs.length === 0 || isBusy}
                className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:text-gray-400"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                {messageLogs.length}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-500">
                Sent
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {messageLogs.filter((log) => log.success).length}
              </p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-500">
                Failed
              </p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {failedLogs.length}
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase text-indigo-500">
                Selected
              </p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">
                {selectedLogIds.length}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-[1400px] divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        paginatedMessageLogs.length > 0 &&
                        paginatedMessageLogs.every((log) =>
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
                    Template
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
                {paginatedMessageLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-gray-500"
                    >
                      No WhatsApp logs yet.
                    </td>
                  </tr>
                ) : (
                  paginatedMessageLogs.map((log) => (
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
                          {log.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.phoneNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.templateName}
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
                        {log.error && (
                          <div className="mt-1 max-w-xs truncate text-xs text-red-500">
                            {log.error}
                          </div>
                        )}
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
                          disabled={isBusy}
                          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:text-gray-400"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Retry
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {messageLogs.length === 0 ? 0 : (logPage - 1) * logsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-700">
                {Math.min(logPage * logsPerPage, messageLogs.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {messageLogs.length}
              </span>{" "}
              logs
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLogPage((page) => Math.max(1, page - 1))}
                disabled={logPage === 1}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                Previous
              </button>
              <span className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                Page {logPage} / {totalLogPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setLogPage((page) => Math.min(totalLogPages, page + 1))
                }
                disabled={logPage === totalLogPages}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmSend && activeTpl && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Confirm Bulk Send
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Review the details below before sending.
            </p>
            <div
              className={`rounded-xl p-4 bg-gradient-to-br ${activeTpl.bg} border-2 ${activeTpl.border} mb-4`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{activeTpl.emoji}</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {activeTpl.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${activeTpl.badgeCls}`}
                >
                  {activeTpl.badge}
                </span>
              </div>
              <p className="text-xs text-gray-600">{activeTpl.tagline}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-700">
                You are about to send{" "}
                <span className="font-bold text-indigo-600">
                  {recipients.length} messages
                </span>{" "}
                using the{" "}
                <span className="font-semibold">{activeTpl.name}</span>{" "}
                template.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmSend(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 text-sm font-semibold transition-colors"
              >
                <Send className="w-4 h-4" />
                {isLoading ? "Sending..." : "Confirm Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingWhatsAppForm;
