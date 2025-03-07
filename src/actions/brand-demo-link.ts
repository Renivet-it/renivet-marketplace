"use server";

import { utApi } from "@/app/api/uploadthing/core";
import { URLBuilder } from "@/lib/builders";
import { db } from "@/lib/db";
import { brandsWaitlist } from "@/lib/db/schema";
import { jwt } from "@/lib/jose";
import { getAbsoluteURL, getUploadThingFileKey } from "@/lib/utils";
import { BrandWaitlist } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function generateToken(email: string) {
    return await jwt.sign(email);
}

export async function generateBrandDemoLink(email: string) {
    const token = await generateToken(email);

    const url = new URLBuilder(getAbsoluteURL())
        .setPathTemplate("/brand-demo")
        .addQueryParam("token", token)
        .build();

    return url;
}

export async function verifyBrandDemoLink(token: string) {
    return await jwt.verify(token);
}

export async function deleteBrandDemo({ id, demoUrl }: BrandWaitlist) {
    if (!demoUrl) throw new Error("No demo URL found");
    const fileKey = getUploadThingFileKey(demoUrl);

    await Promise.all([
        db
            .update(brandsWaitlist)
            .set({
                demoUrl: null,
            })
            .where(eq(brandsWaitlist.id, id)),
        utApi.deleteFiles([fileKey]),
    ]);

    return true;
}
