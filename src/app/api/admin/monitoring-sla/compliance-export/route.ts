import { BitFieldSitePermission } from "@/config/permissions";
import { monitoringSlaQueries } from "@/lib/db/queries";
import { userCache } from "@/lib/redis/methods";
import { complianceExportSchema } from "@/lib/validations";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await userCache.get(userId);
    const permissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    const allowed = hasPermission(permissions, [
        BitFieldSitePermission.ADMINISTRATOR,
        BitFieldSitePermission.MANAGE_MONITORING,
    ], "any");

    if (!allowed) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const input = complianceExportSchema.parse(body);
    const run = await monitoringSlaQueries.generateComplianceExport(
        input.exportMonth,
        input.exportType,
        userId
    );

    return NextResponse.json({
        ok: true,
        data: {
            id: run.id,
            exportMonth: run.exportMonth,
            exportType: run.exportType,
            rowCount: Number(run.rowCount),
            status: run.status,
        },
    });
}

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await userCache.get(userId);
    const permissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    const allowed = hasPermission(permissions, [
        BitFieldSitePermission.ADMINISTRATOR,
        BitFieldSitePermission.MANAGE_MONITORING,
    ], "any");

    if (!allowed) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const exportMonth =
        req.nextUrl.searchParams.get("exportMonth") ??
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const exportType = req.nextUrl.searchParams.get("exportType") ?? "alerts";
    const built = await monitoringSlaQueries.buildComplianceExport(exportMonth, exportType);

    return new NextResponse(built.csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${exportMonth}-${exportType}.csv"`,
        },
    });
}
