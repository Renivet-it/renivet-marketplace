import {
    getOperationalCsvData,
    getOperationalDefaultDates,
    parseOperationalDate,
    parseOperationalPartnerType,
    parseOperationalReportType,
} from "@/lib/reports/operational";

function escapeCsvValue(value: string | number | boolean | null | undefined) {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);

    if (
        stringValue.includes(",") ||
        stringValue.includes("\"") ||
        stringValue.includes("\n")
    ) {
        return `"${stringValue.replace(/"/g, "\"\"")}"`;
    }

    return stringValue;
}

function toCsv({
    headers,
    rows,
}: {
    headers: string[];
    rows: Record<string, string | number | boolean | null>[];
}) {
    const headerLine = headers.join(",");
    const dataLines = rows.map((row) =>
        headers.map((header) => escapeCsvValue(row[header])).join(",")
    );
    return [headerLine, ...dataLines].join("\n");
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const defaults = getOperationalDefaultDates();

    const report = parseOperationalReportType(url.searchParams.get("report") ?? undefined);
    const partnerType = parseOperationalPartnerType(
        url.searchParams.get("partnerType") ?? undefined
    );
    const storeId = url.searchParams.get("storeId") || undefined;
    const startDate = parseOperationalDate(
        url.searchParams.get("startDate") ?? undefined,
        defaults.startDate
    );
    const endDate = parseOperationalDate(
        url.searchParams.get("endDate") ?? undefined,
        defaults.endDate
    );

    const csvData = await getOperationalCsvData({
        report,
        partnerType,
        storeId,
        startDate,
        endDate,
    });

    const csv = toCsv({
        headers: csvData.headers,
        rows: csvData.rows,
    });

    return new Response(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=\"${csvData.filename}\"`,
            "Cache-Control": "no-store",
        },
    });
}
