import { env } from "@/../env";
import { errors, jwtVerify, SignJWT } from "jose";
import { generateId } from "../utils";

export class JWT {
    async sign(subject: string) {
        const jwt = await new SignJWT()
            .setProtectedHeader({ alg: "HS256" })
            .setJti(generateId())
            .setIssuedAt()
            .setSubject(subject)
            .sign(new TextEncoder().encode(env.JWT_SECRET_KEY));

        return jwt;
    }

    async verify(token: string) {
        try {
            const payload = await jwtVerify(
                token,
                new TextEncoder().encode(env.JWT_SECRET_KEY),
                {
                    algorithms: ["HS256"],
                }
            );

            if (!payload.payload.sub) {
                return {
                    data: null,
                    error: {
                        code: "INVALID",
                        message: "Invalid token",
                    },
                };
            }

            return {
                data: { token, subject: payload.payload.sub },
                error: null,
            };
        } catch (err) {
            if (err instanceof errors.JOSEError) {
                return {
                    data: null,
                    error: {
                        code: "INVALID",
                        message: err.message,
                    },
                };
            }

            return {
                data: null,
                error: {
                    code: "INVALID",
                    message: "Invalid token",
                },
            };
        }
    }
}

export const jwt = new JWT();
