"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AutoRefresher() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Every time query params change, re-fetch server data
    router.refresh();
  }, [searchParams.toString()]);

  return null;
}
