"use client";

import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Papa from "papaparse";
import { Download, Upload, Send, X } from "lucide-react";
import { sendBulkEmail } from "@/actions/sendBulkEmail";

// Temporarily remove validation to debug the "Please upload a file" issue
// const formSchema = z.object({
//   file: z
//     .custom<FileList>((val) => val instanceof FileList, "Please upload a file")
//     .refine((files) => files.length > 0, "Please upload a file")
//     .refine(
//       (files) =>
//         files[0]?.type === "text/csv" || files[0]?.type === "application/vnd.ms-excel",
//       "Please upload a valid CSV or Excel file"
//     ),
// });

// type FormData = z.infer<typeof formSchema>;
type FormData = { file: FileList }; // Temporary type without validation

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
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    // Temporarily disable resolver to skip validation
    // resolver: zodResolver(formSchema),
  });

  const expectedHeaders = ["Email", "FirstName", "Discount(%)", "expiryDate", "BrandName", "additionalMessage", "ButtonText"];

  const normalizeHeader = (header: string) => {
    const headerMap: { [key: string]: string } = {
      email: "email",
      firstname: "firstName",
      "discount(%)": "discount",
      discountpercentage: "discount",
      expirydate: "expiryDate",
      brandname: "brandName",
      additionalmessage: "additionalMessage",
      buttontext: "ctaText",
    };
    return headerMap[header.toLowerCase()] || header.toLowerCase();
  };

  const handleFileChange = (file: File | undefined) => {
    console.log("Step 1: handleFileChange called", { file });
    if (file) {
      console.log("Step 2: File exists, parsing with Papa.parse", { fileName: file.name, fileType: file.type });
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => normalizeHeader(header),
        complete: (result) => {
          console.log("Step 3: Papa.parse complete", { result });
          const parsedHeaders = result.meta.fields || [];
          console.log("Step 4: Parsed headers", { parsedHeaders });
          const missingHeaders = expectedHeaders
            .slice(0, 5) // Check only required headers (first 5)
            .filter((header) => !parsedHeaders.includes(normalizeHeader(header)));

          if (missingHeaders.length > 0) {
            console.log("Step 5: Missing headers found", { missingHeaders });
            toast.error(`Missing required columns in CSV: ${missingHeaders.join(", ")}`);
            return;
          }

          const parsedData = result.data as Recipient[];
          console.log("Step 6: Parsed data", { parsedData });
          const validData = parsedData.filter(
            (row) =>
              row.email &&
              z.string().email().safeParse(row.email).success &&
              row.firstName &&
              row.discount &&
              row.expiryDate &&
              row.brandName
          );
          console.log("Step 7: Valid data after filtering", { validData });

          if (validData.length === 0) {
            console.log("Step 8: No valid data found");
            toast.error("No valid data found in the CSV file.");
            return;
          }

          setRecipients(validData);
          setShowPreview(true);
          console.log("Step 9: Updated recipients and showPreview", { recipients: validData, showPreview: true });
          if (validData.length !== parsedData.length) {
            console.log("Step 10: Some rows skipped", { parsedDataLength: parsedData.length, validDataLength: validData.length });
            toast.warning("Some rows were skipped due to invalid or missing data.");
          }
        },
        error: (error) => {
          console.log("Step 11: Papa.parse error", { error });
          toast.error("Failed to parse the file.");
        },
      });
    } else {
      console.log("Step 12: No file provided to handleFileChange");
    }
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
    const csvContent = "Email,FirstName,Discount(%),expiryDate,BrandName\njohn@example.com,John,20,2025-12-31,Your Company\njane@example.com,Jane,15,2025-12-31,Your Company";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email_template.csv";
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

    const formData = new FormData();
    formData.append("recipients", JSON.stringify(recipients));
    console.log("Step 21: FormData created", { formData: JSON.stringify(recipients) });

    const result = await sendBulkEmail(formData);
    console.log("Step 22: sendBulkEmail result", { result });
    setProgress(100);
    console.log("Step 23: Set progress to 100");

    if (result.success) {
      console.log("Step 24: Email sending successful", { message: result.message });
      toast.success(result.message);
      setRecipients([]);
      setShowPreview(false);
      setConfirmSend(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      console.log("Step 25: Reset state after success", { recipients: [], showPreview: false, confirmSend: false });
    } else {
      console.log("Step 26: Email sending failed", { message: result.message });
      toast.error(result.message);
    }
    setIsLoading(false);
    console.log("Step 27: Set loading to false", { isLoading: false });
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gray-50 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Send Bulk Emails</h2>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          CSV Template
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              console.log("Step 28: File input onChange triggered", { files: e.target.files });
              handleFileChange(e.target.files?.[0]);
            }}
            ref={fileInputRef}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-2">
            Drag and drop a CSV file here, or click to select
          </p>
          {errors.file && (
            <p className="text-red-500 text-sm mt-2">{errors.file.message}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Required columns: Email, FirstName, Discount(%), expiryDate, BrandName;
          </p>
        </div>

        {recipients.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Recipient Preview ({recipients.length} recipients)
              </h3>
              <button
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FirstName</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount(%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">expiryDate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BrandName</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recipients.map((recipient, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{recipient.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{recipient.firstName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{recipient.discount}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{recipient.expiryDate}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{recipient.brandName}</td>
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
              {progress === 100 ? "Finalizing..." : `Processing ${progress}%`}
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
              Confirm Bulk Email Send
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              You are about to send emails to {recipients.length} recipients. Are you sure?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmSend(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm font-medium"
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