import { utApi } from "@/app/api/uploadthing/core";
import { canReadAgreement } from "@/lib/brand-agreements/access";
import {
    agreementFileSchema,
    agreementMetadataSchema,
} from "@/lib/brand-agreements/validation";
import { brandAgreementQueries } from "@/lib/db/queries";
import { brandAgreements, brands } from "@/lib/db/schema";
import { writeFinanceAuditEvent } from "@/lib/finance/audit";
import { hasPermission } from "@/lib/utils";
import { BitFieldSitePermission } from "@/config/permissions";
import {
    adminProcedure,
    createTRPCRouter,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const agreementInput = z.intersection(
    agreementMetadataSchema,
    z.object({ brandId: z.string().uuid(), file: agreementFileSchema })
);

const metadataInput = z.intersection(
    agreementMetadataSchema,
    z.object({ agreementId: z.string().uuid() })
);

function assertAdmin(sitePermissions: number) {
    if (!hasPermission(sitePermissions, [BitFieldSitePermission.ADMINISTRATOR]))
        throw new TRPCError({ code: "UNAUTHORIZED" });
}

export const brandAgreementsRouter = createTRPCRouter({
    listAdmin: adminProcedure
        .input(z.object({ brandId: z.string().uuid().optional() }))
        .query(({ input }) => brandAgreementQueries.listAll(input.brandId)),

    listMine: protectedProcedure.query(async ({ ctx }) => {
        const brandId = ctx.user.brand?.id;
        if (!brandId)
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "No brand is associated with this account",
            });
        return brandAgreementQueries.listByBrand(brandId);
    }),

    create: adminProcedure
        .input(agreementInput)
        .mutation(async ({ input, ctx }) => {
            const brand = await ctx.db.query.brands.findFirst({
                columns: { id: true },
                where: eq(brands.id, input.brandId),
            });
            if (!brand) throw new TRPCError({ code: "NOT_FOUND", message: "Brand not found" });

            let created:
                | Awaited<ReturnType<typeof brandAgreementQueries.createVersion>>
                | undefined;
            try {
                created = await brandAgreementQueries.createVersion({
                    brandId: input.brandId,
                    fileKey: input.file.key,
                    fileName: input.file.name,
                    contentType: input.file.type,
                    fileSizeBytes: input.file.size,
                    signedDate: input.signedDate,
                    effectiveDate: input.effectiveDate,
                    expiryDate: input.expiryDate,
                    status: input.status,
                    uploadedBy: ctx.user.id,
                });

                await writeFinanceAuditEvent({
                    actorId: ctx.user.id,
                    actorType: "admin",
                    actionType: "brand_agreement_uploaded",
                    entityType: "brand_agreement",
                    entityId: created.id,
                    afterValue: {
                        brandId: created.brandId,
                        version: created.version,
                        fileName: created.fileName,
                        contentType: created.contentType,
                        fileSizeBytes: created.fileSizeBytes,
                    },
                    reason: "Agreement uploaded",
                });
                return created;
            } catch (error) {
                if (created) await brandAgreementQueries.deleteById(created.id);
                await utApi.deleteFiles([input.file.key]).catch(() => undefined);
                throw error;
            }
        }),

    updateMetadata: adminProcedure
        .input(metadataInput)
        .mutation(async ({ input, ctx }) => {
            const existing = await brandAgreementQueries.getById(input.agreementId);
            if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

            const updated = await brandAgreementQueries.updateMetadata(
                input.agreementId,
                {
                    signedDate: input.signedDate,
                    effectiveDate: input.effectiveDate,
                    expiryDate: input.expiryDate,
                    status: input.status,
                }
            );
            if (!updated) throw new TRPCError({ code: "NOT_FOUND" });

            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actorType: "admin",
                actionType: "brand_agreement_metadata_updated",
                entityType: "brand_agreement",
                entityId: existing.id,
                beforeValue: {
                    signedDate: existing.signedDate,
                    effectiveDate: existing.effectiveDate,
                    expiryDate: existing.expiryDate,
                    status: existing.status,
                },
                afterValue: {
                    signedDate: updated.signedDate,
                    effectiveDate: updated.effectiveDate,
                    expiryDate: updated.expiryDate,
                    status: updated.status,
                },
                reason: "Agreement metadata updated",
            });
            return updated;
        }),

    getDownloadUrl: protectedProcedure
        .input(z.object({ agreementId: z.string().uuid() }))
        .mutation(async ({ input, ctx }) => {
            const agreement = await brandAgreementQueries.getById(input.agreementId);
            if (!agreement) throw new TRPCError({ code: "NOT_FOUND" });

            const isAdmin = hasPermission(ctx.user.sitePermissions, [
                BitFieldSitePermission.ADMINISTRATOR,
            ]);
            if (
                !canReadAgreement({
                    isAdmin,
                    userBrandId: ctx.user.brand?.id,
                    agreementBrandId: agreement.brandId,
                })
            )
                throw new TRPCError({ code: "FORBIDDEN" });

            const { url } = await utApi.getSignedURL(agreement.fileKey, {
                expiresIn: 300,
            });
            await writeFinanceAuditEvent({
                actorId: ctx.user.id,
                actorType: isAdmin ? "admin" : "brand",
                actionType: "brand_agreement_downloaded",
                entityType: "brand_agreement",
                entityId: agreement.id,
                afterValue: {
                    brandId: agreement.brandId,
                    version: agreement.version,
                    fileName: agreement.fileName,
                },
                reason: "Agreement downloaded",
            });
            return { url, expiresInSeconds: 300 };
        }),
});
