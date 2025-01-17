"use server";

import { productQueries } from "@/lib/db/queries";
import { Product } from "@/lib/validations";

export async function searchProductBySku(input: {
    sku: string;
    brandId?: string;
    isDeleted?: boolean;
    isAvailable?: boolean;
    isPublished?: boolean;
    isActive?: boolean;
    verificationStatus?: Product["verificationStatus"];
}) {
    const data = await productQueries.getProductBySku(input);
    if (!data) throw new Error("Product not found");
    return data;
}
