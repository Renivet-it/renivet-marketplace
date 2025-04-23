import { shiprocket } from "@/lib/shiprocket";
import { CourierContextType } from "../types/CourierContext";
import { getCouriersParams } from "@/lib/shiprocket/validations/request/couriers";

const clientPromise = shiprocket();

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
    }
};
