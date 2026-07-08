import { userCache } from "@/lib/redis/methods";
import { generateGstExport } from "@/lib/finance/gst";
import { getFinanceModuleAccess } from "@/lib/finance/access";
import { getUserPermissions } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await userCache.get(userId);
    const permissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    const access = await getFinanceModuleAccess({
        userId,
        sitePermissions: permissions,
        roles: user?.roles,
        moduleKey: "gst_reports",
    });

    if (!access.canView && !access.canManage) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const monthKey = req.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    const { csv, preview } = await generateGstExport(monthKey, userId);
    const fileMonth = monthKey.split("-")[1] + monthKey.split("-")[0];
    const validationErrorCount = preview.validationIssues.filter((issue) => issue.severity === "error").length;
    const validationWarningCount = preview.validationIssues.filter(
        (issue) => issue.severity === "warning"
    ).length;

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "X-Renivet-GST-Validation-Errors": String(preview.validationIssues.length),
            "X-Renivet-GST-Validation-Error-Count": String(validationErrorCount),
            "X-Renivet-GST-Validation-Warning-Count": String(validationWarningCount),
            "Content-Disposition": `attachment; filename="RENIVET_GST_TCS_${fileMonth}.csv"`,
        },
    });
}
