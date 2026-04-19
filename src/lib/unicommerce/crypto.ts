import { env } from "@/../env";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const buildKey = () =>
    createHash("sha256")
        .update(env.JWT_SECRET_KEY)
        .digest();

export const encryptSecret = (plainText: string) => {
    const key = buildKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptSecret = (encryptedPayload: string) => {
    const [ivHex, tagHex, dataHex] = encryptedPayload.split(":");
    if (!ivHex || !tagHex || !dataHex) {
        throw new Error("Invalid encrypted secret payload");
    }

    const key = buildKey();
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encryptedData = Buffer.from(dataHex, "hex");

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
};