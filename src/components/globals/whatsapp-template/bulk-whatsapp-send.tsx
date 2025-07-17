"use client";

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Papa from "papaparse";
import { Download, Upload, Send, X } from "lucide-react";
import { sendSingleWhatsAppMessage } from "@/actions/whatsapp/send-marketing-notification";
import * as XLSX from "xlsx";

type Recipient = {
  full_name: string;
  phone_number: string;
};

export function MarketingWhatsAppForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [fileError, setFileError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit } = useForm();

  const expectedHeaders = ["full_name", "phone_number"];

  const normalizeHeader = (header: string) => {
    const headerMap: { [key: string]: string } = {
      full_name: "full_name",
      "full name": "full_name",
      phonenumber: "phone_number",
      "phone number": "phone_number",
      phone: "phone_number",
    };
    return headerMap[header.trim().toLowerCase()] || header.trim().toLowerCase();
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const transformPhoneNumber = (phone: string) => {
    phone = phone.replace(/[^+\d]/g, "");
    if (!phone.startsWith("+") && /^\d{10}$/.test(phone)) {
      return `+91${phone}`;
    }
    return phone;
  };

  const handleFileChange = (file: File | undefined) => {
    console.log("Step 1: handleFileChange called", { file });
    setFileError("");
    if (!file) {
      console.log("Step 2: No file provided");
      setFileError("Please upload a file");
      return;
    }

    const allowedTypes = ["text/csv", "application/vnd.ms-excel", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      console.log("Step 2: Invalid file type", { fileType: file.type });
      setFileError("Please upload a valid CSV file");
      return;
    }

    console.log("Step 3: File exists, parsing with Papa.parse", { fileName: file.name, fileType: file.type });
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      transformHeader: (header: string) => normalizeHeader(header),
      transform: (value: string) => value.trim().replace(/^"|"$/g, ""),
      complete: (result) => {
        console.log("Step 4: Papa.parse complete", { result });
        const parsedHeaders = result.meta.fields || [];
        console.log("Step 5: Parsed headers", { parsedHeaders });
        const missingHeaders = expectedHeaders.filter(
          (header) => !parsedHeaders.includes(header)
        );

        if (missingHeaders.length > 0) {
          console.log("Step 6: Missing headers found", { missingHeaders });
          toast.error(`Missing required columns in CSV: ${missingHeaders.join(", ")}`);
          return;
        }

        const parsedData = result.data as Recipient[];
        console.log("Step 7: Parsed data", { parsedData });
        const invalidRows: string[] = [];
        const validData = parsedData
          .map((row, index) => {
            const transformedRow = {
              full_name: row.full_name?.trim().replace(/^"|"$/g, "") || "",
              phone_number: transformPhoneNumber(row.phone_number || ""),
            };

            const errors: string[] = [];
            if (!transformedRow.full_name) errors.push("Missing full_name");
            if (!transformedRow.phone_number || !validatePhoneNumber(transformedRow.phone_number)) {
              errors.push(`Invalid phone_number: ${transformedRow.phone_number}`);
            }

            if (errors.length > 0) {
              invalidRows.push(`Row ${index + 2}: ${errors.join(", ")}`);
              return null;
            }
            return transformedRow;
          })
          .filter((row): row is Recipient => row !== null);

        console.log("Step 8: Valid data after filtering", { validData, invalidRows });

        if (validData.length === 0) {
          console.log("Step 9: No valid data found", { invalidRows });
          toast.error(`No valid data found in the CSV file. Errors: ${invalidRows.join("; ")}`);
          return;
        }

        setRecipients(validData);
        setShowPreview(true);
        console.log("Step 10: Updated recipients and showPreview", { recipients: validData, showPreview: true });
        if (validData.length !== parsedData.length) {
          console.log("Step 11: Some rows skipped", { parsedDataLength: parsedData.length, validDataLength: validData.length, invalidRows });
          toast.warning(`Some rows were skipped due to invalid data: ${invalidRows.join("; ")}`);
        }
      },
      error: (error) => {
        console.log("Step 12: Papa.parse error", { error });
        toast.error("Failed to parse the file.");
        setFileError("Failed to parse the file");
      },
    });
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log("Step 13: onDrop triggered", { files: event.dataTransfer.files });
    const file = event.dataTransfer.files?.[0];
    handleFileChange(file);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log("Step 14: onDragOver triggered");
  }, []);

  const triggerFileInput = () => {
    console.log("Step 15: triggerFileInput called");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const downloadTemplate = () => {
    console.log("Step 16: downloadTemplate called");
    const csvContent = "full_name,phone_number\nJohn Doe,9876543210\nJane Smith,8765432109";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whatsapp_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    console.log("Step 17: Template downloaded");
  };

  const onSubmit = async () => {
    console.log("Step 18: onSubmit called", { recipients });
    if (recipients.length === 0) {
      console.log("Step 19: No recipients found");
      toast.error("Please upload a valid CSV file with recipient data.");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    console.log("Step 20: Set loading and progress", { isLoading: true, progress: 0 });

    let successCount = 0;
    const errors: string[] = [];
    const logEntries: Array<{ phone_number: string; full_name: string; status: string }> = [];
    const totalRecipients = recipients.length;

    for (let i = 0; i < totalRecipients; i++) {
      const recipient = recipients[i];
      console.log(`Step 21.${i + 1}: Processing recipient ${i + 1}/${totalRecipients}`, { recipient });

      const result = await sendSingleWhatsAppMessage(recipient);
      console.log(`Step 22.${i + 1}: sendSingleWhatsAppMessage result`, { result });

      logEntries.push({
        phone_number: recipient.phone_number,
        full_name: recipient.full_name,
        status: result.status,
      });

      if (result.success) {
        successCount++;
      } else if (result.error) {
        errors.push(result.error);
      }

      const currentProgress = ((i + 1) / totalRecipients) * 100;
      setProgress(currentProgress);
      console.log(`Step 23.${i + 1}: Updated progress`, { progress: currentProgress });
    }

    if (logEntries.length > 0) {
      console.log("Step 24: Generating Excel file", { logEntries });
      const worksheetData = logEntries.map((entry) => ({
        "Phone Number": entry.phone_number,
        "Full Name": entry.full_name,
        Status: entry.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Message Log");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whatsapp_message_log_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      console.log("Step 25: Excel file downloaded");
    } else {
      console.log("Step 24: No log entries to generate Excel file");
      toast.warning("No log entries available to generate Excel file.");
    }

    if (successCount > 0) {
      console.log("Step 26: WhatsApp sending successful", { successCount });
      toast.success(`Successfully sent ${successCount} WhatsApp messages`);
    } else {
      console.log("Step 28: WhatsApp sending failed", { errors });
      toast.error(errors.join("; ") || "Failed to send WhatsApp messages");
    }

    setRecipients([]);
    setShowPreview(false);
    setConfirmSend(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    console.log("Step 27: Reset state", { recipients: [], showPreview: false, confirmSend: false });

    setIsLoading(false);
    setProgress(100);
    console.log("Step 29: Set loading to false", { isLoading: false, progress: 100 });
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gray-50 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Send WhatsApp messages</h2>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          CSV Template
        </button>
      </div>

      <form onSubmit={handleSubmit(() => setConfirmSend(true))} className="space-y-6">
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={triggerFileInput}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
          <label className="block text-sm font-medium text-gray-700 mt-2">
            Upload CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            {...register("file")}
            onChange={(e) => {
              console.log("Step 30: File input onChange triggered", { files: e.target.files });
              handleFileChange(e.target.files?.[0]);
            }}
            ref={fileInputRef}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-2">
            Drag and drop a CSV file here, or click to select
          </p>
          {fileError && (
            <p className="text-red-500 text-sm mt-2">{fileError}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Required columns: full_name, phone_number
          </p>
        </div>

        {recipients.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Recipient Preview ({recipients.length} recipients)
              </h3>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-indigo-600 hover:underline text-sm font-medium"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
            {showPreview && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recipients.map((recipient, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{recipient.full_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{recipient.phone_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              {progress === 100 ? "Finalizing..." : `Processing ${progress.toFixed(0)}%`}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium"
        >
          <Send className="w-4 h-4" />
          {isLoading ? "Preparing..." : "Review and Send"}
        </button>
      </form>

      {confirmSend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Bulk WhatsApp Send
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              You are about to send WhatsApp messages to {recipients.length} recipients. Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmSend(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-semibold"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-semibold"
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