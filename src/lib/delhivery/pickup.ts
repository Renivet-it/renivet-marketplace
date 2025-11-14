import { delhiveryClient } from "./client";

export interface PickupRequest {
  pickup_location: string;
  pickup_date: string; // YYYY-MM-DD
  pickup_time?: string; // Optional time slot, e.g. "10:00-13:00"
  expected_package_count: number;
}

export const schedulePickup = async (payload: PickupRequest) => {
  const res = await delhiveryClient.post(
    "/fm/request/new/",
    {
      pickup_date: payload.pickup_date,
      pickup_time: payload.pickup_time,
      pickup_location: payload.pickup_location,
      expected_package_count: payload.expected_package_count,
    },
  );

  return res.data;
};

export const reschedulePickup = async (
  pickup_id: string,
  new_date: string,
  new_slot?: string
) => {
  const res = await delhiveryClient.post(
    "/api/pickup/edit.json",
    {
      pickup_id,
      new_date,
      new_slot,
    },
  );

  return res.data;
};
