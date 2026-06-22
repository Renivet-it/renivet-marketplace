import { CorporateOrderSummaryTemplate } from "@/components/pdf/corporate-order-summary-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { renderToStream } from "@react-pdf/renderer";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await userCache.get(userId);
    const { id } = await params;
    const confirmation = await corporateOrderService.getOrderById(id);
    const settings = await corporateOrderService.listConfig();

    const permissions = user ? getUserPermissions(user.roles).sitePermissions : 0;
    const canViewAdmin = hasPermission(permissions, [
        BitFieldSitePermission.VIEW_ORDERS,
    ]);

    if (!canViewAdmin && confirmation.userId !== userId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const stream = await renderToStream(
        <CorporateOrderSummaryTemplate
            order={confirmation}
            settings={settings.settings}
        />
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(
            Buffer.isBuffer(chunk)
                ? chunk
                : typeof chunk === "string"
                  ? Buffer.from(chunk)
                  : Buffer.from(chunk)
        );
    }

    return new NextResponse(Buffer.concat(chunks), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${confirmation.publicOrderId}.pdf"`,
        },
    });
}
