import { shiprocket } from "@/lib/shiprocket";
import { CourierContextType, CourierOtherOptions, GetCourierForDeliveryLocation } from "../types/CourierContext";
import { getCouriersParams } from "@/lib/shiprocket/validations/request/couriers";

const clientPromise = shiprocket();

function parseCourierOthers(others: string): CourierOtherOptions | string {
    try {
      return JSON.parse(others);
    } catch (e) {
      console.warn("Failed to parse 'others':", e);
      return "";
    }
  }

export const courierService: CourierContextType = {
    async getCouriers(params?: getCouriersParams) {
        const sr = await clientPromise;
        return sr.getCouriers(params);
    },
    async generateAWB(orderId: any) {
        const sr = await clientPromise;
        return sr.generateAWB(orderId);
    },
    async requestShipment(shipmentData: any) {
        const sr = await clientPromise;
        return sr.requestShipment(shipmentData);
    },

    async getCouriersForDeliveryLocation (params) {
        const sr = await clientPromise;
        const response = await sr.getCouriersForDeliveryLocation(params);
        response.data?.data.available_courier_companies?.forEach((courier: GetCourierForDeliveryLocation) => {
            courier.parsedOthers = parseCourierOthers(courier.others);
          });

        return response;
    }
};