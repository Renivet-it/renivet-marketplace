"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  Download,
  Mail,
  Upload,
  CheckCircle,
  FileSpreadsheet,
  History,
  RefreshCcw,
  Trash2,
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
import * as XLSX from "xlsx";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

type Recipient = {
  email: string;
  firstName: string;
  discount: string;
  expiryDate: string;
  brandName: string;
};

export function MarketingEmailForm() {
  const [activeTab, setActiveTab] = useState<"send" | "logs">("send");
  const [step, setStep] = useState(1);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailMessageLog[]>([]);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 10;
  const [emailContent, setEmailContent] = useState("");
  const [subject, setSubject] = useState(
    "Trying a new brand shouldn't feel risky — here's ₹1000 OFF"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("contentUploader");
  const quillRef = useRef<any>(null);

  const refreshLogs = useCallback(async () => {
    const logs = await getEmailMessageLogs();
    setEmailLogs(logs);
    setLogPage(1);
  }, []);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

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

  const toggleLogSelection = (id: string) => {
    setSelectedLogIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const toggleAllLogs = () => {
    const pageIds = emailLogs
      .slice((logPage - 1) * logsPerPage, logPage * logsPerPage)
      .map((log) => log.id);

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

  const totalLogPages = Math.max(1, Math.ceil(emailLogs.length / logsPerPage));
  const paginatedEmailLogs = emailLogs.slice(
    (logPage - 1) * logsPerPage,
    logPage * logsPerPage
  );

  const downloadTemplate = () => {
    const csvContent = [
      ["Email", "FirstName", "Discount(%)", "expiryDate", "BrandName"],
      ["john@example.com", "John", "20", "2025-12-31", "BrandX"],
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
    toast.success("Template downloaded successfully!");
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (result) => {
        const data = (result.data as any[]).map((r) => ({
          email: r["email"] || "",
          firstName: r["firstname"] || "",
          discount: r["discount(%)"] || r["discount"] || "",
          expiryDate: r["expirydate"] || "",
          brandName: r["brandname"] || "",
        }));
        if (!data.length) return toast.error("No valid data found in CSV.");
        setRecipients(data);
        toast.success(`${data.length} recipients loaded!`);
      },
    });
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
      toast.success("Image uploaded!");
    };
  }, [startUpload]);

const onSubmit = async () => {
  // guard against duplicate sends
  if (isLoading) return;

  if (!recipients.length) {
    toast.error("Upload your recipient list first!");
    setConfirmSend(false); // close modal if open
    return;
  }
  if (!subject.trim() || !emailContent.trim()) {
    toast.error("Please write your email subject and content.");
    setConfirmSend(false); // close modal if open
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
      toast.success("Emails sent successfully!");
      setSentCount(recipients.length);
      setRecipients([]);
      setEmailContent("");
      setSubject("");
      setStep(4); // move to success screen
      setActiveTab("logs");
    } else {
      toast.error(result.message || "Failed to send emails.");
      setActiveTab("logs");
    }
  } catch (err) {
    console.error(err);
    toast.error("An unexpected error occurred while sending emails.");
  } finally {
    setIsLoading(false);
    setConfirmSend(false); // <<-- important: close the modal in all cases
  }
};


  return (
    <div className="mx-auto w-full max-w-none px-6 py-12">
      <div className="mb-8 flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("send")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            activeTab === "send"
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Mail className="h-4 w-4" />
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
          {emailLogs.length > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === "logs"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {emailLogs.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "send" && (
        <>
      {/* Progress Steps */}
      {step <= 3 && (
 <div className="flex items-center justify-around md:justify-between mb-8 gap-2">
    {["Upload Audience", "Compose Email", "Review & Send"].map(
      (label, index) => {
        const current = index + 1;
        const active = current === step;
        const done = step > current;

        return (
          <div
            key={label}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Step Circle */}
            <div
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 text-xs md:text-sm font-medium transition
                    ${
                      done
                        ? "bg-green-500 border-green-500 text-white"
                        : active
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-gray-300 text-gray-400"
                    }`}
            >
              {done ? "✓" : current}
            </div>

            {/* Label */}
            <p
              className={`mt-2 text-[10px] sm:text-xs md:text-sm leading-tight ${
                active ? "text-indigo-600 font-semibold" : "text-gray-600"
              }`}
            >
              {label}
            </p>
          </div>
        );
      }
    )}
  </div>
      )}

      {/* Step 1: Upload Audience */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Upload your
            Audience
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Upload a CSV file with recipient information (Email, FirstName,
            Discount, ExpiryDate, BrandName).
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
          >
            <Upload className="w-8 h-8 mx-auto text-gray-400" />
            <p className="text-gray-600 mt-2">Click or drag CSV to upload</p>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="hidden"
            />
          </div>

          <button
            onClick={downloadTemplate}
            className="mt-4 flex items-center gap-2 text-indigo-600 hover:underline text-sm"
          >
            <Download className="w-4 h-4" /> Download CSV Template
          </button>

          {recipients.length > 0 && (
            <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-md p-4 text-sm text-indigo-700">
              ✅ {recipients.length} recipients loaded successfully.
            </div>
          )}

          <div className="flex justify-end mt-8">
            <button
              disabled={!recipients.length}
              onClick={() => setStep(2)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
            >
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Compose Email */}
      {step === 2 && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" /> Compose Your Email
          </h2>

          {/* Default template notice */}
          <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-700">
            <p className="font-semibold mb-1">✨ Default Template Active</p>
            <p className="text-indigo-600 leading-relaxed">
              If you leave the editor below empty, the email will use the
              pre-built campaign template:
              <br />
              <strong>Headline:</strong> Trying a new brand should not feel risky. {" "}
              <strong>₹1000 OFF offer block</strong> →{" "}
              <strong>Explore Renivet CTA</strong> Footer line.
              <br />
              You can also write custom content in the editor to override it.
            </p>
          </div>

          <input
            type="text"
            placeholder="Enter Email Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mb-4 text-sm"
          />
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={emailContent}
            onChange={setEmailContent}
            className="bg-white rounded-md"
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

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(1)}
              className="text-gray-600 hover:underline"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!emailContent.trim() || !subject.trim()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
            >
              Next Step
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Send */}
      {step === 3 && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" /> Review & Send
          </h2>

          {/* ✅ Show Recipient Preview */}
          <div className="mb-6 bg-gray-50 border border-gray-200 p-4 rounded-md max-h-60 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="text-sm text-gray-700 font-medium">
                {recipients.length} Recipients
              </span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {recipients.slice(0, 5).map((r, i) => (
                <li key={i}>
                  {r.firstName ? `${r.firstName} - ` : ""}
                  {r.email}
                </li>
              ))}
              {recipients.length > 5 && (
                <li className="text-gray-400">...and {recipients.length - 5} more</li>
              )}
            </ul>
          </div>

          {/* ✅ Email Preview */}
          <div className="mb-6 bg-gray-50 border border-gray-200 p-4 rounded-md">
            <p className="text-sm text-gray-600 mb-2">
              📬 <b>Subject:</b> {subject}
            </p>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: emailContent }}
            />
          </div>

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={() => setStep(2)}
              className="text-gray-600 hover:underline"
            >
              ← Back
            </button>
            <button
              onClick={() => setConfirmSend(true)}
              disabled={isLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300"
            >
              {isLoading ? "Sending..." : "Confirm & Send Emails"}
            </button>
          </div>
        </div>
      )}

      {/* ✅ Step 4: Success Confirmation */}
      {step === 4 && (
        <div className="bg-white p-10 rounded-xl text-center shadow-sm border border-gray-100">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Emails Sent Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your message was successfully sent to{" "}
            <b>{sentCount}</b> recipients.
          </p>
          <button
            onClick={() => {
              setStep(1);
              setSentCount(null);
            }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Send Another Campaign
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmSend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Confirm Send</h3>
            <p className="text-sm text-gray-600 mb-6">
              Send “{subject}” to {recipients.length} recipients?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmSend(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === "logs" && (
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
                  retryLogs(emailLogs.filter((log) => selectedLogIds.includes(log.id)))
                }
                disabled={isLoading || isRetrying || selectedLogIds.length === 0}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300"
              >
                <RefreshCcw className="h-4 w-4" />
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
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-300"
              >
                <RefreshCcw className="h-4 w-4" />
                Retry Failed
              </button>
              <button
                type="button"
                onClick={() => exportLogs(emailLogs)}
                disabled={emailLogs.length === 0}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:text-gray-400"
              >
                <Download className="h-4 w-4" />
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
                <Trash2 className="h-4 w-4" />
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
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-xs font-semibold uppercase text-indigo-500">Selected</p>
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
                        paginatedEmailLogs.length > 0 &&
                        paginatedEmailLogs.every((log) =>
                          selectedLogIds.includes(log.id)
                        )
                      }
                      onChange={toggleAllLogs}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Attempts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Sent At</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {paginatedEmailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
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
                        <div className="text-xs text-gray-500">{log.email}</div>
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
                        {log.error && (
                          <div className="mt-1 max-w-xs truncate text-xs text-red-500">
                            {log.error}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.attempts}</td>
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
                {emailLogs.length === 0 ? 0 : (logPage - 1) * logsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-700">
                {Math.min(logPage * logsPerPage, emailLogs.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {emailLogs.length}
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
    </div>
  );
}
