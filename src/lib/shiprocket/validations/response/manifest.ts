import { z } from "zod";

const manifestResponseSchema = z.object({
    manifest_url: z.string(),
});

export const generateManifestResponseSchema = manifestResponseSchema;
export const printManifestResponseSchema = manifestResponseSchema;

export type GenerateManifestResponse = z.infer<
    typeof generateManifestResponseSchema
>;
export type PrintManifestResponse = z.infer<typeof printManifestResponseSchema>;
