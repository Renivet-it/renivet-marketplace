import {
    CreateBrandPageSection,
    UpdateBrandPageSection,
} from "@/lib/validations";
import { eq } from "drizzle-orm";
import { db } from "..";
import { brandPageSections } from "../schema";

class BrandPageSection {
    async getBrandPageSection(id: string) {
        const data = await db.query.brandPageSections.findFirst({
            where: eq(brandPageSections.id, id),
        });

        return data;
    }

    async createBrandPageSection(values: CreateBrandPageSection) {
        const data = await db
            .insert(brandPageSections)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandPageSection(id: string, values: UpdateBrandPageSection) {
        const data = await db
            .update(brandPageSections)
            .set(values)
            .where(eq(brandPageSections.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBrandPageSection(id: string) {
        const data = await db
            .delete(brandPageSections)
            .where(eq(brandPageSections.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const brandPageSection = new BrandPageSection();
