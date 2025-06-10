import { z } from "zod";

const baseReasonMasterSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    parentId: z.string().nullable(),
    level: z.number(),
    isActive: z.boolean(),
    shortOrder: z.number(),
    reasonType: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Step 2: Declare the type interface first
export type ReasonNode = z.infer<typeof baseReasonMasterSchema> & {
    children?: ReasonNode[];
};

// Step 3: Explicitly annotate NodeSchema
export const NodeSchema: z.ZodType<ReasonNode> = z.lazy(() =>
    baseReasonMasterSchema.extend({
        children: z.array(NodeSchema).optional(),
    })
);

export const TreeSchema = z.array(NodeSchema);
export type BaseReasonType = z.infer<typeof baseReasonMasterSchema>;
