import { redis } from "..";

class ShipRocketCache {
    async getShipRocketToken() {
        return await redis.get("shiprocket:token");
    }

    async setShipRocketToken(token: string) {
        return await redis.set(
            "shiprocket:token",
            token,
            "EX",
            60 * 60 * 24 * 8
        );
    }
}

export const shipRocketCache = new ShipRocketCache();
