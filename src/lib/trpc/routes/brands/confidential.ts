import { utApi } from "@/app/api/uploadthing/core";
import { BitFieldBrandPermission } from "@/config/permissions";
import { brandCache, userCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { getUploadThingFileKey } from "@/lib/utils";
import {
    createBrandConfidentialSchema,
    updateBrandConfidentialSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const confidentialsRouter = createTRPCRouter({
    createConfidential: protectedProcedure
        .input(createBrandConfidentialSchema)
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const existingBrandConfidential =
                await queries.brandConfidentials.getBrandConfidential(id);
            if (existingBrandConfidential)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Confidential already exists",
                });

            const [data] = await Promise.all([
                queries.brandConfidentials.createBrandConfidential(input),
                queries.brands.updateBrandConfidentialStatus({
                    id,
                    isConfidentialSentForVerification: true,
                }),
                brandCache.remove(id),
                userCache.remove(existingBrand.ownerId),
            ]);

            return data;
        }),
    updateConfidential: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateBrandConfidentialSchema,
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, values } = input;

            const existingBrandConfidential =
                await queries.brandConfidentials.getBrandConfidential(id);
            if (!existingBrandConfidential)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Confidential not found",
                });

            if (existingBrandConfidential.verificationStatus === "approved")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Confidential already verified",
                });

            const filesToBeDeleted = [];

            const existingBankAccountVerificationDocumentUrl = {
                key: getUploadThingFileKey(
                    existingBrandConfidential.bankAccountVerificationDocumentUrl
                ),
                url: existingBrandConfidential.bankAccountVerificationDocumentUrl,
            };
            const inputBankAccountVerificationDocumentUrl = {
                key: getUploadThingFileKey(
                    values.bankAccountVerificationDocumentUrl
                ),
                url: values.bankAccountVerificationDocumentUrl,
            };

            if (
                existingBankAccountVerificationDocumentUrl.key !==
                inputBankAccountVerificationDocumentUrl.key
            )
                filesToBeDeleted.push(
                    existingBankAccountVerificationDocumentUrl.key
                );

            const existingUdyamRegistrationCertificateUrl =
                existingBrandConfidential.udyamRegistrationCertificateUrl
                    ? {
                          key: getUploadThingFileKey(
                              existingBrandConfidential.udyamRegistrationCertificateUrl
                          ),
                          url: existingBrandConfidential.udyamRegistrationCertificateUrl,
                      }
                    : null;
            const inputUdyamRegistrationCertificateUrl =
                values.udyamRegistrationCertificateUrl
                    ? {
                          key: getUploadThingFileKey(
                              values.udyamRegistrationCertificateUrl
                          ),
                          url: values.udyamRegistrationCertificateUrl,
                      }
                    : null;

            if (
                existingUdyamRegistrationCertificateUrl &&
                inputUdyamRegistrationCertificateUrl &&
                existingUdyamRegistrationCertificateUrl.key !==
                    inputUdyamRegistrationCertificateUrl.key
            )
                filesToBeDeleted.push(
                    existingUdyamRegistrationCertificateUrl.key
                );

            const existingIecCertificateUrl =
                existingBrandConfidential.iecCertificateUrl
                    ? {
                          key: getUploadThingFileKey(
                              existingBrandConfidential.iecCertificateUrl
                          ),
                          url: existingBrandConfidential.iecCertificateUrl,
                      }
                    : null;
            const inputIecCertificateUrl = values.iecCertificateUrl
                ? {
                      key: getUploadThingFileKey(values.iecCertificateUrl),
                      url: values.iecCertificateUrl,
                  }
                : null;

            if (
                existingIecCertificateUrl &&
                inputIecCertificateUrl &&
                existingIecCertificateUrl.key !== inputIecCertificateUrl.key
            )
                filesToBeDeleted.push(existingIecCertificateUrl.key);

            const [data] = await Promise.all([
                queries.brandConfidentials.updateBrandConfidential(id, values),
                queries.brandConfidentials.updateBrandConfidentialStatus(id, {
                    status: "pending",
                }),
                queries.brands.updateBrandConfidentialStatus({
                    id,
                    isConfidentialSentForVerification: true,
                    confidentialVerificationStatus: "pending",
                    confidentialVerificationRejectedAt: null,
                    confidentialVerificationRejectedReason: null,
                }),
                filesToBeDeleted.length > 0 &&
                    utApi.deleteFiles(filesToBeDeleted),
                brandCache.remove(id),
                userCache.remove(existingBrandConfidential.brand.ownerId),
            ]);

            return data;
        }),
});
