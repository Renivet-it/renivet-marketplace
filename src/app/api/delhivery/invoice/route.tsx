import fs from "fs";
import path from "path";
import { InvoiceTemplate } from "@/components/pdf/invoice-template";
import { db } from "@/lib/db";
import { hsnMaster } from "@/lib/db/schema";
import { renderToStream } from "@react-pdf/renderer";
import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { order } = await req.json();
        const items = Array.isArray(order.items) ? order.items : [];
        const hsnCodes = items
            .map(
                (item: any) =>
                    item.variant?.hsCode ?? item.product?.hsCode ?? item.hsCode
            )
            .filter(
                (code: unknown): code is string =>
                    typeof code === "string" && Boolean(code.trim())
            );
        const hsnRows = hsnCodes.length
            ? await db.query.hsnMaster.findMany({
                  where: inArray(hsnMaster.hsnCode, hsnCodes),
                  columns: { hsnCode: true, gstRateBps: true },
              })
            : [];
        const gstRateByHsn = new Map(
            hsnRows.map((row) => [row.hsnCode, row.gstRateBps])
        );
        order.items = items.map((item: any) => {
            const hsnCode =
                item.variant?.hsCode ??
                item.product?.hsCode ??
                item.hsCode ??
                "";
            return { ...item, gstRateBps: gstRateByHsn.get(hsnCode) ?? 0 };
        });

        // Read logo file
        const logoPath = path.join(
            process.cwd(),
            "public",
            "images",
            "renivet-logo.png"
        );
        let logoBase64 = "";
        try {
            const logoBuffer = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
        } catch (e) {
            console.error("Failed to read logo:", e);
        }

        // Generate PDF Stream
        const stream = await renderToStream(
            <InvoiceTemplate order={order} logoBase64={logoBase64} />
        );

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const pdfBuffer = Buffer.concat(chunks);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="invoice_${order.id}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Invoice Error:", error);
        return NextResponse.json(
            { message: "Failed to generate invoice", error: String(error) },
            { status: 500 }
        );
    }
}
