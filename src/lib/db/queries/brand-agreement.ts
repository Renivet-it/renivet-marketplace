import { and, desc, eq } from "drizzle-orm";
import { db } from "..";
import { brandAgreements } from "../schema";
import { getNextAgreementVersion } from "@/lib/brand-agreements/validation";

const agreementColumns = {
    id: true,
    brandId: true,
    version: true,
    fileKey: true,
    fileName: true,
    contentType: true,
    fileSizeBytes: true,
    signedDate: true,
    effectiveDate: true,
    expiryDate: true,
    status: true,
    uploadedBy: true,
    createdAt: true,
    updatedAt: true,
} as const;

class BrandAgreementQuery {
    async listByBrand(brandId: string) {
        return db.query.brandAgreements.findMany({
            columns: agreementColumns,
            where: eq(brandAgreements.brandId, brandId),
            orderBy: [desc(brandAgreements.version)],
        });
    }

    async listAll(brandId?: string) {
        return db.query.brandAgreements.findMany({
            columns: agreementColumns,
            where: brandId ? eq(brandAgreements.brandId, brandId) : undefined,
            orderBy: [desc(brandAgreements.createdAt)],
        });
    }

    async getById(id: string) {
        return db.query.brandAgreements.findFirst({
            columns: {
                ...agreementColumns,
                fileKey: true,
            },
            where: eq(brandAgreements.id, id),
        });
    }

    async createVersion(input: {
        brandId: string;
        fileKey: string;
        fileName: string;
        contentType: string;
        fileSizeBytes: number;
        signedDate: string;
        effectiveDate: string;
        expiryDate?: string | null;
        status: "draft" | "active" | "expired" | "superseded";
        uploadedBy: string;
    }) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                return await db.transaction(async (tx) => {
                    const existing = await tx.query.brandAgreements.findMany({
                        columns: { version: true },
                        where: eq(brandAgreements.brandId, input.brandId),
                    });
                    const version = getNextAgreementVersion(existing);
                    await tx
                        .update(brandAgreements)
                        .set({ status: "superseded", updatedAt: new Date() })
                        .where(
                            and(
                                eq(brandAgreements.brandId, input.brandId),
                                eq(brandAgreements.status, "active")
                            )
                        );
                    const [created] = await tx
                        .insert(brandAgreements)
                        .values({ ...input, version })
                        .returning();
                    return created;
                });
            } catch (error) {
                if (
                    !(error instanceof Error) ||
                    !error.message.includes("brand_agreements_brand_version_unique") ||
                    attempt === 2
                )
                    throw error;
            }
        }
        throw new Error("Agreement version allocation failed");
    }

    async updateMetadata(
        id: string,
        input: {
            signedDate: string;
            effectiveDate: string;
            expiryDate?: string | null;
            status: "draft" | "active" | "expired" | "superseded";
        }
    ) {
        const [updated] = await db
            .update(brandAgreements)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(brandAgreements.id, id))
            .returning();
        return updated;
    }
}

export const brandAgreementQueries = new BrandAgreementQuery();
