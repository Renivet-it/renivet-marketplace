// File: app/dashboard/test-redirect/page.tsx
import { DashShell } from "@/components/globals/layouts";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Bulk Email Campaigns",
  description: "Test page to verify redirect functionality",
};

interface PageProps {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { redirectTo } = await searchParams;

  // If redirectTo query param is present, redirect to that URL
  if (redirectTo) {
    redirect(redirectTo);
  }

  return (
    <DashShell>
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
        <div className="space-y-1 text-center md:text-start">
          <h1 className="text-2xl font-bold">Test Redirect</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Test page to verify redirect functionality
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/dashboard/test-redirect?redirectTo=/dashboard"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Redirect to Dashboard
          </Link>
          <Link
            href="/dashboard/test-redirect?redirectTo=/dashboard/tests"
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Redirect to Tests
          </Link>
        </div>
      </div>
    </DashShell>
  );
}