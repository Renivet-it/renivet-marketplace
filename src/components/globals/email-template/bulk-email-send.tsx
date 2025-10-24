"use client";

import React, { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import Papa from "papaparse";
import { Send, Upload, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { sendBulkEmail } from "@/actions/sendBulkEmail";
import { useUploadThing } from "@/lib/uploadthing";

// 🧩 Import Quill dynamically (SSR safe)
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
  const [emailContent, setEmailContent] = useState("");
  const [subject, setSubject] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit } = useForm();

  // ✅ UploadThing setup
  const { startUpload } = useUploadThing("contentUploader");
  const quillRef = useRef<any>(null);

  // 🧩 CSV Template Download
  const downloadTemplate = () => {
    try {
      const csvContent = [
        ["Email", "FirstName", "Discount(%)", "expiryDate", "BrandName"],
        ["john@example.com", "John", "20", "2025-12-31", "Your Company"],
        ["jane@example.com", "Jane", "15", "2025-12-31", "Your Company"],
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
    } catch (error) {
      console.error("Template download error:", error);
      toast.error("Failed to download CSV template.");
    }
  };

  // 🧩 Handle CSV upload
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

        if (normalizedData.length === 0) {
          toast.error("No valid data found in CSV.");
          return;
        }

        setRecipients(normalizedData);
        toast.success(`Loaded ${normalizedData.length} recipients`);
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        toast.error("Failed to parse CSV file.");
      },
    });
  };

  // ✅ Custom image upload handler for Quill
  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        toast.info("Uploading image...");
        const uploaded = await startUpload([file]);
        if (!uploaded || uploaded.length === 0) {
          toast.error("Image upload failed.");
          return;
        }

        const imageUrl = uploaded[0].url;
        const quill = quillRef.current?.getEditor();
        const range = quill?.getSelection(true);
        if (range) {
          quill.insertEmbed(range.index, "image", imageUrl);
          toast.success("Image uploaded successfully!");
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image.");
      }
    };
  }, [startUpload]);

  // 🧩 Send Emails
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
    <div className="max-w-5xl mx-auto p-8 bg-gray-50 rounded-xl shadow-lg space-y-6">
      {/* --- Header --- */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Send Bulk Emails
        </h2>

        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download CSV Template
        </button>
      </div>

      {/* --- Upload CSV --- */}
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
          <p className="text-xs text-gray-400 mt-2">
            Required columns: Email, FirstName, Discount(%), expiryDate, BrandName
          </p>
        </div>

        {/* --- Preview --- */}
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        First Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Discount
                      </th>
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

        {/* --- Email Editor with UploadThing --- */}
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
          </div>
        )}

        {/* --- Progress Bar --- */}
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

        {/* --- Submit Button --- */}
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

      {/* --- Confirmation Modal --- */}
      {confirmSend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Bulk Email Send
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              You are about to send &quot;{subject}&quot; to {recipients.length} recipients.
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
