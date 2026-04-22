"use client";

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Papa from "papaparse";
import { Download, Upload, Send, X, CheckCircle2, MessageSquare } from "lucide-react";
import {
  sendSingleWhatsAppMessage,
  type CampaignTemplateKey,
} from "@/actions/whatsapp/send-marketing-notification";
import * as XLSX from "xlsx";

type Recipient = { full_name: string; phone_number: string };

const TEMPLATES = [
  {
    key: "campaign_launch" as CampaignTemplateKey,
    badge: "Message 1",
    emoji: "✨",
    name: "Campaign Launch",
    tagline: "Flat 20% OFF first order",
    description:
      "Introduce Renivet to new customers with a compelling first-order discount.",
    preview:
      "Trying a new brand can feel risky. So we made the first step easier.\n\nDiscover thoughtful fashion & lifestyle brands from across India on Renivet.\n\n✨ Flat 20% OFF your first order (on orders above ₹3000)",
    button: "Explore",
    accent: "#6366f1",
    bg: "from-indigo-50 to-violet-50",
    border: "border-indigo-500",
    badgeCls: "bg-indigo-100 text-indigo-700",
    check: "text-indigo-500",
  },
  {
    key: "campaign_reminder" as CampaignTemplateKey,
    badge: "Message 2",
    emoji: "🎉",
    name: "Reminder",
    tagline: "₹1000 OFF first order",
    description:
      "Re-engage prospects who haven't converted yet with a stronger offer.",
    preview:
      "Ever wanted to try new homegrown brands, but ended up going back to the same ones?\n\nRenivet brings together responsible fashion and lifestyle brands in one place.\n\n🎉 ₹1000 OFF your first order on orders above ₹3000.",
    button: "Shop Now",
    accent: "#10b981",
    bg: "from-emerald-50 to-teal-50",
    border: "border-emerald-500",
    badgeCls: "bg-emerald-100 text-emerald-700",
    check: "text-emerald-500",
  },
  {
    key: "campaign_last_call" as CampaignTemplateKey,
    badge: "Message 3",
    emoji: "⏰",
    name: "Last Call",
    tagline: "₹1000 offer still live",
    description:
      "Final urgency push for customers who've seen the offer but haven't acted.",
    preview:
      "Your ₹1000 Renivet welcome offer is still live.\n\nIf you've been meaning to explore new fashion & lifestyle brands, this is the perfect time.\n\nUse the offer on your first order above ₹3000.",
    button: "Explore",
    accent: "#f59e0b",
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-500",
    badgeCls: "bg-amber-100 text-amber-700",
    check: "text-amber-500",
  },
];

export function MarketingWhatsAppForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [fileError, setFileError] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<CampaignTemplateKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit } = useForm();

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

  const onSubmit = async () => {
    if (!selectedTemplate)
      return toast.error("Please select a campaign template first.");
    if (!recipients.length)
      return toast.error("Please upload a valid CSV file.");

    setIsLoading(true);
    setProgress(0);

    let successCount = 0;
    const errors: string[] = [];
    const log: { phone_number: string; full_name: string; status: string }[] =
      [];

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      const result = await sendSingleWhatsAppMessage({
        ...r,
        templateKey: selectedTemplate,
      });
      log.push({ phone_number: r.phone_number, full_name: r.full_name, status: result.status });
      if (result.success) successCount++;
      else if (result.error) errors.push(result.error);
      setProgress(((i + 1) / recipients.length) * 100);
    }

    if (log.length) {
      const ws = XLSX.utils.json_to_sheet(
        log.map((e) => ({
          "Phone Number": e.phone_number,
          "Full Name": e.full_name,
          Status: e.status,
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
    }

    successCount > 0
      ? toast.success(`Successfully sent ${successCount} WhatsApp messages`)
      : toast.error(errors.join("; ") || "Failed to send messages");

    setRecipients([]);
    setShowPreview(false);
    setConfirmSend(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(false);
    setProgress(100);
  };

  const activeTpl = TEMPLATES.find((t) => t.key === selectedTemplate);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors text-sm font-semibold"
          >
            <Send className="w-4 h-4" />
            {isLoading ? "Sending..." : "Review & Send Campaign"}
          </button>
        </form>
      </div>

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