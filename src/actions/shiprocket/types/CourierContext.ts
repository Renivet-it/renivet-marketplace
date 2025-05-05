import { AWB } from "@/lib/shiprocket/validations/request";
import {
    GetCourierServiceabilityParams,
    getCouriersParams,
    PostShipmentPickupBody,
} from "@/lib/shiprocket/validations/request/couriers";

export interface ApiResponse<T> {
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
export interface GetCourierForDeliveryLocation {
    air_max_weight: string;
    assured_amount: number;
    base_courier_id: number | null;
    base_weight: string;
    blocked: number;
    call_before_delivery: string;
    charge_weight: number;
    city: string;
    cod: number;
    cod_charges: number;
    cod_multiplier: number;
    cost: string;
    courier_company_id: number;
    courier_name: string;
    courier_type: string;
    coverage_charges: number;
    cutoff_time: string;
    delivery_boy_contact: string;
    delivery_performance: number;
    description: string;
    edd: string;
    edd_fallback: Record<string, string>;
    entry_tax: number;
    estimated_delivery_days: string;
    etd: string;
    etd_hours: number;
    freight_charge: number;
    id: number;
    is_custom_rate: number;
    is_hyperlocal: boolean;
    is_international: number;
    is_rto_address_available: boolean;
    is_surface: boolean;
    local_region: number;
    metro: number;
    min_weight: number;
    mode: number;
    new_edd: number;
    odablock: boolean;
    other_charges: number;
    others: string; // JSON string — optionally you can parse it and type it too
    parsedOthers?: CourierOtherOptions | string;
    pickup_availability: string;
    pickup_performance: number;
    pickup_priority: string;
    pickup_supress_hours: number;
    pod_available: string;
    postcode: string;
    qc_courier: number;
    rank: string;
    rate: number;
    rating: number;
    realtime_tracking: string;
    region: number;
    rto_charges: number;
    rto_performance: number;
    seconds_left_for_pickup: number;
    secure_shipment_disabled: boolean;
    ship_type: number;
    state: string;
    suppress_date: string;
    suppress_text: string;
    suppression_dates: {
        action_on: string;
        blocked_fm: string;
        blocked_lm: string;
    };
    surface_max_weight: string;
    tracking_performance: number;
    volumetric_max_weight: number | null;
    weight_cases: number;
    zone: string;
}

export interface CourierOtherOptions {
    allow_postcode_auto_sync: number;
    cancel_real_time: boolean;
    courier_available_for_payment_change: number;
    fbs_amazon_Standard?: number;
    international_enabled: number;
    is_cancel_courier?: number;
    is_cancellation_courier?: number;
    is_custom_courier?: number;
    is_edd_courier: number;
    is_eway_bill_courier?: number;
    is_notify_cancel_courier: number;
    is_warehouse_courier?: number;
    is_webhook_courier: number;
    qr_pickrr_enable?: number;
    min_breadth?: number;
    min_length?: number;
    wec?: number;
}

export interface CourierListResponse {
    company_auto_shipment_insurance_setting: boolean;
    covid_zones: {
        delivery_zone: string | null;
        pickup_zone: string | null;
    };
    currency: string;
    data: {
        available_courier_companies: GetCourierForDeliveryLocation[];
    };
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
    getCouriers: (
        params?: getCouriersParams
    ) => Promise<ApiResponse<GetCouriersResponse>>;
    getCouriersForDeliveryLocation: (
        params: GetCourierServiceabilityParams
    ) => Promise<ApiResponse<CourierListResponse>>;
    generateAWB: (orderId: AWB) => Promise<any>;
    requestShipment: (shipmentData: PostShipmentPickupBody) => Promise<any>;
}
