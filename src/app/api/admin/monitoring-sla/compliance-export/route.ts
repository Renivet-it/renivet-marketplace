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
