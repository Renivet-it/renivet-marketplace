import { BRAND_SUSTAINABILITY_CERTIFICATES } from "@/config/brand-program";
import { mediaCache } from "@/lib/redis/methods";
import {
    BrandConfidential,
    BrandMediaItem,
    brandConfidentialWithBrandSchema,
    CreateBrandConfidential,
    UpdateBrandConfidential,
    UpdateBrandConfidentialByAdmin,
} from "@/lib/validations";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { brandConfidentials, brands } from "../schema";

const hydrateSustainabilityCertificates = (
    certificates:
        | Array<{ key: string; documentId: string | null }>
        | null
        | undefined,
    mediaMap: Map<string, BrandMediaItem>
) =>
    BRAND_SUSTAINABILITY_CERTIFICATES.map((certificate) => {
        const existing = certificates?.find(
            (item) => item.key === certificate.key
        );

        return {
            key: certificate.key,
            label: certificate.label,
            verificationUrl: certificate.verificationUrl,
            documentId: existing?.documentId ?? null,
            document:
                existing?.documentId && mediaMap.has(existing.documentId)
                    ? mediaMap.get(existing.documentId)
                    : null,
        };
    });

class BrandConfidentialQuery {
    async getCount(status?: "pending" | "approved" | "rejected") {
        const data = await db.$count(
            brandConfidentials,
            status
                ? eq(brandConfidentials.verificationStatus, status)
                : undefined
        );

        return +data || 0;
    }

    async getBrandConfidentials({
        limit,
        page,
        search,
        status,
    }: {
        limit: number;
        page: number;
        search?: string;
        status?: BrandConfidential["verificationStatus"];
    }) {
        const data = await db.query.brandConfidentials.findMany({
            with: {
                brand: true,
            },
            where: and(
                !!search?.length
                    ? ilike(brandConfidentials.id, `%${search}%`)
                    : undefined,
                !!status
                    ? eq(brandConfidentials.verificationStatus, status)
                    : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(brandConfidentials.createdAt)],
            extras: {
                count: db
                    .$count(
                        brandConfidentials,
                        and(
                            !!search?.length
                                ? ilike(brandConfidentials.id, `%${search}%`)
                                : undefined,
                            !!status
                                ? eq(
                                      brandConfidentials.verificationStatus,
                                      status
                                  )
                                : undefined
                        )
                    )
                    .as("conf_count"),
            },
        });

        const mediaIds = new Set<string>();
        for (const item of data) {
            if (item.bankAccountVerificationDocument)
                mediaIds.add(item.bankAccountVerificationDocument);
            if (item.udyamRegistrationCertificate)
                mediaIds.add(item.udyamRegistrationCertificate);
            if (item.iecCertificate) mediaIds.add(item.iecCertificate);
            for (const certificate of item.sustainabilityCertificates ?? []) {
                if (certificate.documentId) mediaIds.add(certificate.documentId);
            }
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = data.map((item) => ({
            ...item,
            bankAccountVerificationDocument:
                item.bankAccountVerificationDocument
                    ? mediaMap.get(item.bankAccountVerificationDocument)
                    : null,
            udyamRegistrationCertificate: item.udyamRegistrationCertificate
                ? mediaMap.get(item.udyamRegistrationCertificate)
                : null,
            iecCertificate: item.iecCertificate
                ? mediaMap.get(item.iecCertificate)
                : null,
            sustainabilityCertificates: hydrateSustainabilityCertificates(
                item.sustainabilityCertificates,
                mediaMap
            ),
        }));

        const parsed: any[] = [];
        for (const item of enhancedData) {
            const result = brandConfidentialWithBrandSchema.safeParse(item);
            if (result.success) {
                parsed.push(result.data);
            } else {
                // eslint-disable-next-line no-console
                console.error("⚠️ brandConfidentialWithBrandSchema validation failed for brand in list:", item.id, result.error.format());
                parsed.push(item);
            }
        }

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBrandConfidential(bId: string) {
        const data = await db.query.brandConfidentials.findFirst({
            with: {
                brand: true,
            },
            where: eq(brandConfidentials.id, bId),
        });
        if (!data) return null;

        const mediaIds = new Set<string>();
        if (data.bankAccountVerificationDocument)
            mediaIds.add(data.bankAccountVerificationDocument);
        if (data.udyamRegistrationCertificate)
            mediaIds.add(data.udyamRegistrationCertificate);
        if (data.iecCertificate) mediaIds.add(data.iecCertificate);
        for (const certificate of data.sustainabilityCertificates ?? []) {
            if (certificate.documentId) mediaIds.add(certificate.documentId);
        }

        const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
        const mediaMap = new Map(
            mediaItems.data.map((item) => [item.id, item])
        );

        const enhancedData = {
            ...data,
            bankAccountVerificationDocument:
                data.bankAccountVerificationDocument
                    ? mediaMap.get(data.bankAccountVerificationDocument)
                    : null,
            udyamRegistrationCertificate: data.udyamRegistrationCertificate
                ? mediaMap.get(data.udyamRegistrationCertificate)
                : null,
            iecCertificate: data.iecCertificate
                ? mediaMap.get(data.iecCertificate)
                : null,
            sustainabilityCertificates: hydrateSustainabilityCertificates(
                data.sustainabilityCertificates,
                mediaMap
            ),
        };

        const result = brandConfidentialWithBrandSchema.safeParse(enhancedData);
        if (!result.success) {
            // eslint-disable-next-line no-console
            console.error("⚠️ brandConfidentialWithBrandSchema validation failed for brand:", bId, result.error.format());
            return enhancedData as any;
        }
        return result.data;
    }

    async createBrandConfidential(values: CreateBrandConfidential) {
        const data = await db
            .insert(brandConfidentials)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandConfidential(id: string, values: UpdateBrandConfidential) {
        const data = await db
            .update(brandConfidentials)
            .set(values)
            .where(eq(brandConfidentials.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandConfidentialByAdmin(
        id: string,
        values: UpdateBrandConfidentialByAdmin
    ) {
        const data = await db
            .update(brandConfidentials)
            .set(values)
            .where(eq(brandConfidentials.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async upsertBrandConfidentialByAdmin(
        id: string,
        values: UpdateBrandConfidentialByAdmin
    ) {
        const data = await db
            .insert(brandConfidentials)
            .values({
                id,
                ...values,
                bankAccountVerificationDocument:
                    values.bankAccountVerificationDocument,
            })
            .onConflictDoUpdate({
                target: brandConfidentials.id,
                set: values,
            })
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBrandConfidentialStatus(
        id: string,
        values: {
            status: BrandConfidential["verificationStatus"];
            rejectedReason?: string;
        }
    ) {
        const data = await db.transaction(async (tx) => {
            const [x] = await Promise.all([
                tx
                    .update(brandConfidentials)
                    .set({
                        verificationStatus: values.status,
                        updatedAt: new Date(),
                    })
                    .where(eq(brandConfidentials.id, id))
                    .returning()
                    .then((res) => res[0]),
                tx
                    .update(brands)
                    .set({
                        confidentialVerificationStatus: values.status,
                        confidentialVerificationRejectedReason:
                            values.rejectedReason,
                        confidentialVerificationRejectedAt:
                            values.status === "rejected" ? new Date() : null,
                        updatedAt: new Date(),
                    })
                    .where(eq(brands.id, id))
                    .returning()
                    .then((res) => res[0]),
            ]);

            return x;
        });

        return data;
    }
}

export const brandConfidentialQueries = new BrandConfidentialQuery();
