import { getCouriersParams } from "@/lib/shiprocket/validations/request/couriers";

interface ApiResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

export interface Courier {
    is_own_key_courier: number;
    ownkey_courier_id: number;
    id: number;
    min_weight: number;
    base_courier_id: number;
    name: string;
    use_sr_postcodes: number;
    type: number;
    status: number;
    courier_type: number;
    master_company: string;
    service_type: number;
    mode: number;
    realtime_tracking: string;
    delivery_boy_contact: string;
    pod_available: string;
    call_before_delivery: string;
    activated_date: string;
    newest_date: string | null;
    shipment_count: string;
    is_hyperlocal: number;
}

export interface GetCouriersResponse {
    total_courier_count: number;
    serviceable_pincodes_count: string;
    pickup_pincodes_count: string;
    total_rto_count: number;
    total_oda_count: number;
    courier_data: Courier[];
}
interface AWBResponse {
    awbCode: string;
    courierName: string;
}
interface ShipmentResponse {
    shipmentId: string;
    status: string;
}

export interface CourierContextType {
    getCouriers: (params?: getCouriersParams) => Promise<ApiResponse<GetCouriersResponse>>;
    generateAWB: (orderId: any) => Promise<any>;
    requestShipment: (
        shipmentData: any
    ) => Promise<any>;
}
