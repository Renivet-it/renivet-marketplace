import { shiprocket } from "@/lib/shiprocket";
import { CourierContextType, CourierOtherOptions, GetCourierForDeliveryLocation } from "../types/CourierContext";
import { getCouriersParams, PostShipmentPickupBody } from "@/lib/shiprocket/validations/request/couriers";
import { AWB } from "@/lib/shiprocket/validations/request/awb";

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
    async generateAWB(awbBody: AWB) {
        const sr = await clientPromise;
        return sr.generateAWB(awbBody);
    },
    async requestShipment(shipmentData) {
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