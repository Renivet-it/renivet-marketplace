import { GetCourierServiceabilityParams } from "../validations/request/couriers";

export function parseCourierParams(
    params: URLSearchParams
): GetCourierServiceabilityParams {
    return {
        pickup_postcode: parseInt(params.get("pickup_postcode")! || ""),
        delivery_postcode: parseInt(params.get("delivery_postcode")! || ""),
        order_id: params.get("order_id")
            ? parseInt(params.get("order_id")!)
            : undefined,
        cod: parseInt(params.get("cod")!) || undefined,
        weight: parseInt(params.get("weight")!) || undefined,
        length: params.get("length")
            ? parseInt(params.get("length")!)
            : undefined,
        breadth: params.get("breadth")
            ? parseInt(params.get("breadth")!)
            : undefined,
        height: params.get("height")
            ? parseInt(params.get("height")!)
            : undefined,
        declared_value: params.get("declared_value")
            ? parseInt(params.get("declared_value")!)
            : undefined,
        mode: params.get("mode") as "Air" | "Surface" | undefined,
        is_return: parseInt(params.get("is_return")!) || undefined,
        couriers_type: parseInt(params.get("couriers_type")!) || undefined,
        only_local: parseInt(params.get("only_local")!) || undefined,
        qc_check: parseInt(params.get("qc_check")!) || undefined,
    };
}
