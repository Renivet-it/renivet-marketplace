import { appRouter } from "@/lib/trpc";
import { logRoutes } from "@/lib/trpc/logger";
import { NextResponse } from "next/server";

export async function GET() {
    const routes = logRoutes(appRouter);
    return NextResponse.json(routes);
}
