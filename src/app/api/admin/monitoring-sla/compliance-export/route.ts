import { BitFieldSitePermission } from "@/config/permissions";
import { monitoringSlaQueries } from "@/lib/db/queries";
import { userCache } from "@/lib/redis/methods";
import { complianceExportSchema } from "@/lib/validations";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

function normalizeRows(rows: Record<string, unknown>[], headers: string[]) {
    if (!rows.length) {
        return [Object.fromEntries(headers.map((header) => [header, ""]))];
    }

    return rows.map((row) =>
        Object.fromEntries(
            headers.map((key) => {
                const value = row[key];
                if (value instanceof Date) return [key, value.toISOString()];
                if (value === null || value === undefined) return [key, ""];
                if (typeof value === "object") return [key, JSON.stringify(value)];
                return [key, value];
            })
        )
    );
}

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
    const format = req.nextUrl.searchParams.get("format") ?? "csv";
    const built = await monitoringSlaQueries.buildComplianceExport(exportMonth, exportType);

    if (format === "xlsx") {
        const workbook = XLSX.utils.book_new();

        const summary = XLSX.utils.json_to_sheet([
            {
                exportMonth,
                exportType,
                rowCount: built.rows.length,
                generatedAt: new Date().toISOString(),
                note:
                    built.rows.length === 0
                        ? "No matching records found for the selected month and export type."
                        : "Records found for the selected month and export type.",
            },
        ]);
        XLSX.utils.book_append_sheet(workbook, summary, "Summary");

        const worksheet = XLSX.utils.json_to_sheet(
            normalizeRows(built.rows, built.headers),
            { header: built.headers }
        );
        XLSX.utils.book_append_sheet(workbook, worksheet, "Compliance Export");
        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

        return new NextResponse(buffer, {
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${exportMonth}-${exportType}.xlsx"`,
            },
        });
    }

    return new NextResponse(built.csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${exportMonth}-${exportType}.csv"`,
        },
    });
}
