"use client";

import React, { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import Papa from "papaparse";
import { Send, Upload, Download, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { sendBulkEmail } from "@/actions/sendBulkEmail";

// Dynamically import ReactQuill because it needs window
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";


type Recipient = {
  email: string;
  firstName: string;
  discount: string;
  expiryDate: string;
  brandName: string;
  additionalMessage?: string;
  ctaText?: string;
};

export function MarketingEmailForm() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
console.log("Recipients:", recipients);
  // 🆕 new states for email editor
  const [emailContent, setEmailContent] = useState("");
  const [subject, setSubject] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit } = useForm();

  // CSV parse logic same as before
  const handleFileChange = (file?: File) => {
    if (!file) return;

Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header) => header.trim().toLowerCase(),
  complete: (result) => {
    const normalizedData = (result.data as any[]).map((row) => ({
      email: row["email"] || "",
      firstName: row["firstname"] || "",
      discount: row["discount(%)"] || row["discount"] || "",
      expiryDate: row["expirydate"] || "",
      brandName: row["brandname"] || "",
    }));
    setRecipients(normalizedData);
  },
});
  };

  // 🆕 Send function now includes email content + subject
  const onSubmit = async () => {
    if (!recipients.length) {
      toast.error("Please upload a valid CSV first.");
      return;
    }
    if (!subject.trim() || !emailContent.trim()) {
      toast.error("Please fill in the email subject and content.");
      return;
    }

    setIsLoading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append("recipients", JSON.stringify(recipients));
    formData.append("subject", subject);
    formData.append("emailContent", emailContent);

    const result = await sendBulkEmail(formData);
    setProgress(100);

    if (result.success) {
      toast.success("Emails sent successfully!");
      setRecipients([]);
      setEmailContent("");
      setSubject("");
      setShowPreview(false);
      setConfirmSend(false);
    } else {
      toast.error(result.message || "Failed to send emails.");
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gray-50 rounded-xl shadow-lg">
      {/* Upload section */}
      <form onSubmit={handleSubmit(() => setConfirmSend(true))} className="space-y-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
          <p className="text-sm text-gray-600 mt-2">Click or drag CSV to upload</p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            {...register("file")}
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
        </div>

        {/* Preview Table */}
        {recipients.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Recipients ({recipients.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-indigo-600 hover:underline text-sm"
              >
                {showPreview ? "Hide" : "Show"}
              </button>
            </div>
            {showPreview && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">First Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recipients.map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{r.email}</td>
                        <td className="px-4 py-2">{r.firstName}</td>
                        <td className="px-4 py-2">{r.discount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 🆕 Email Editor Section */}
        {recipients.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Compose Email</h3>
            <input
              type="text"
              placeholder="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
            />
            <ReactQuill
              theme="snow"
              value={emailContent}
              onChange={setEmailContent}
              className="bg-white rounded-md"
              modules={{
                toolbar: [
                  [{ header: [1, 2, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"],
                  ["clean"],
                ],
              }}
            />
          </div>
        )}

        {/* Progress bar */}
        {isLoading && (
          <div className="relative mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        {recipients.length > 0 && (
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoading ? "Sending..." : "Review and Send"}
          </button>
        )}
      </form>

      {/* Confirm Modal */}
      {confirmSend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Bulk Email Send</h3>
            <p className="text-sm text-gray-600 mb-6">
              You are about to send "{subject}" to {recipients.length} recipients.
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
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Confirm Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
