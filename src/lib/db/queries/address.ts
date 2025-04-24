import { eq } from "drizzle-orm";
import { db } from "..";
import { addresses } from "../schema";

class AddressQueries {
    async getAddressById(addressId: string) {
        return await db.query.addresses.findFirst({
            where: eq(addresses.id, addressId),
        });
    }
}

export const addressQueries = new AddressQueries();