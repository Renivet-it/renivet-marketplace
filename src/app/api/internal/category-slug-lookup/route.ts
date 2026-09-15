import { db } from "@/lib/db";
import { categories, productTypes, subCategories } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const token = process.env.CATEGORY_SLUG_LOOKUP_TOKEN;
    if (
        !token ||
        request.headers.get("x-renivet-internal-lookup-token") !== token
    )
        return NextResponse.json({ reason: "unauthorized" }, { status: 401 });

    const id = new URL(request.url).searchParams.get("productTypeId");
    if (!id || !z.string().uuid().safeParse(id).success)
        return NextResponse.json({ reason: "invalid_uuid" }, { status: 400 });

    try {
        const rows = await db.transaction(async (tx) => {
            await tx.execute(sql`set local statement_timeout = 200`);
            return tx
                .select({
                    productTypeId: productTypes.id,
                    categoryId: categories.id,
                    categorySlug: categories.slug,
                    subCategoryId: subCategories.id,
                    subCategoryCategoryId: subCategories.categoryId,
                })
                .from(productTypes)
                .innerJoin(
                    categories,
                    eq(productTypes.categoryId, categories.id)
                )
                .innerJoin(
                    subCategories,
                    eq(productTypes.subCategoryId, subCategories.id)
                )
                .where(eq(productTypes.id, id))
                .limit(1);
        });
        const row = rows[0];
        if (!row)
            return NextResponse.json(
                { reason: "unknown_product_type" },
                { status: 404 }
            );
        if (row.categoryId !== row.subCategoryCategoryId)
            return NextResponse.json(
                { reason: "inconsistent_hierarchy" },
                { status: 409 }
            );
        return NextResponse.json(
            {
                productTypeId: row.productTypeId,
                categoryId: row.categoryId,
                categorySlug: row.categorySlug,
                subCategoryId: row.subCategoryId,
            },
            { headers: { "cache-control": "no-store" } }
        );
    } catch {
        return NextResponse.json({ reason: "lookup_error" }, { status: 503 });
    }
}
