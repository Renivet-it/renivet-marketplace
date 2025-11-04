"use client";

import React, { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  Download,
  Mail,
  Upload,
  CheckCircle,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import { sendBulkEmail } from "@/actions/sendBulkEmail";
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

export function MarketingEmailForm() {
  const [step, setStep] = useState(1);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [emailContent, setEmailContent] = useState("");
  const [subject, setSubject] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("contentUploader");
  const quillRef = useRef<any>(null);

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

    if (result.success) {
      toast.success("Emails sent successfully!");
      setSentCount(recipients.length);
      setRecipients([]);
      setEmailContent("");
      setSubject("");
      setStep(4); // move to success screen
    } else {
      toast.error(result.message || "Failed to send emails.");
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
    <div className="max-w-4xl mx-auto py-12 px-6">
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
    </div>
  );
}
