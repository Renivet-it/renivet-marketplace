import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";
import { Suspense } from "react";
import { MarketingWhatsAppForm } from "@/components/globals/whatsapp-template/bulk-whatsapp-send";

interface PageProps {
  searchParams: Promise<object>;
}

export const metadata: Metadata = {
  title: "Bulk WhatsApp Campaigns",
  description: "Upload a CSV file to send personalized bulk WhatsApp messages",
};

export default function BulkWhatsAppPage({ searchParams }: PageProps) {
  return (
    <DashShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col items-start gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Bulk WhatsApp Campaigns
          </h1>
          <p className="text-sm text-gray-500">
            Upload a CSV file to send personalized bulk WhatsApp messages
          </p>
        </div>
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <MarketingWhatsAppForm />
        </Suspense>
      </div>
    </DashShell>
  );
}