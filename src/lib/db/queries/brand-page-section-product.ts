import {
    CreateBrandPageSectionProduct,
    UpdateBrandPageSectionProduct,
} from "@/lib/validations";
import { eq } from "drizzle-orm";
import { db } from "..";
import { brandPageSectionProducts } from "../schema";

class BrandPageSectionProduct {
    async getBrandPageSectionProduct(id: string) {
        const data = await db.query.brandPageSectionProducts.findFirst({
            where: eq(brandPageSectionProducts.id, id),
        });

        return data;
    }

    async addBrandPageSectionProduct(values: CreateBrandPageSectionProduct) {
        const data = await db
            .insert(brandPageSectionProducts)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandPageSectionProduct(
        id: string,
        values: UpdateBrandPageSectionProduct
    ) {
        const data = await db
            .update(brandPageSectionProducts)
            .set(values)
            .where(eq(brandPageSectionProducts.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBrandPageSectionProduct(id: string) {
        const data = await db
            .delete(brandPageSectionProducts)
            .where(eq(brandPageSectionProducts.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const brandPageSectionProduct = new BrandPageSectionProduct();
