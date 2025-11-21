import { delhiveryClient, authQuery } from "./client";

export const trackShipment = async (awb: string) => {
  const res = await delhiveryClient.get("/tracking/json/", {
    params: { ...authQuery, awb },
  });
  return res.data;
};

export const trackMultiple = async (awbs: string[]) => {
  const res = await delhiveryClient.get("/tracking/json/", {
    params: { ...authQuery, awb: awbs.join(",") },
  });
  return res.data;
};
