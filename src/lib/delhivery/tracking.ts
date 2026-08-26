import { delhiveryClient } from "./client";

export const trackShipment = async (awb: string) => {
    const res = await delhiveryClient.get("/tracking/json/", { params: { awb } });
  return res.data;
};

export const trackMultiple = async (awbs: string[]) => {
    const res = await delhiveryClient.get("/tracking/json/", {
        params: { awb: awbs.join(",") },
    });
  return res.data;
};
