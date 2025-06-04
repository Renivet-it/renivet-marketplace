import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";
import { Suspense } from "react";
import { MarketingEmailForm } from "@/components/globals/email-template/bulk-email-send";

interface PageProps {
  searchParams: Promise<object>;
}

export const metadata: Metadata = {
  title: "Bulk Email Campaigns",
  description: "Upload an Excel or CSV file to send personalized bulk emails",
};

export default function BulkEmailPage({ searchParams }: PageProps) {
  return (
    <DashShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col items-start gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Bulk Email Campaigns(100/day)
          </h1>
          <p className="text-sm text-gray-500">
            Upload an Excel or CSV file to send personalized bulk emails
          </p>
        </div>
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <MarketingEmailForm />
        </Suspense>
      </div>
    </DashShell>
  );
}