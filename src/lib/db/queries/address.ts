import { eq } from "drizzle-orm";
import { db } from "..";
import { addresses } from "../schema";
import { brandConfidentialQueries } from "./brand-confidential";
import { orderQueries } from "./order";

class AddressQueries {
    async getAddressById(addressId: string) {
        return await db.query.addresses.findFirst({
            where: eq(addresses.id, addressId),
        });
    }
    async getBrandAddressFromOrderID(orderId: string) {
        const shipmentDetailsOfOrder =
            await orderQueries.orderShipmentDetailsByOrderId(orderId);
        if (!shipmentDetailsOfOrder) return null;
        const brandDetails =
            await brandConfidentialQueries.getBrandConfidential(
                shipmentDetailsOfOrder.brandId
            );
        return brandDetails;
    }
    async getBrandConfidentials(brandId: string) {
    const brandDetails = await brandConfidentialQueries.getBrandConfidential(brandId);
    if (!brandDetails) {
      throw new Error("Brand not found");
    }
    return brandDetails;
  }
}

export const addressQueries = new AddressQueries();
