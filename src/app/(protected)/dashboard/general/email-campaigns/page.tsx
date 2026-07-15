import { DashShell } from "@/components/globals/layouts";
import { EmailCampaignWorkspace } from "@/components/dashboard/general/marketing";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Bulk Email Campaigns",
  description: "Upload an Excel or CSV file to send personalized bulk emails",
};

export default function BulkEmailPage() {
  return (
    <DashShell className="max-w-[100rem]">
      <div className="mx-auto w-full max-w-none space-y-6 px-4">
        <div className="flex flex-col items-start gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Bulk Email Campaigns(100/day)
          </h1>
          <p className="text-sm text-gray-500">
            Upload an Excel or CSV file to send personalized bulk emails
          </p>
        </div>
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <EmailCampaignWorkspace />
        </Suspense>
      </div>
    </DashShell>
  );
}
