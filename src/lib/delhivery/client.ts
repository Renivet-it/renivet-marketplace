import axios from "axios";

const BASE_URL =
  process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com";
const TOKEN = process.env.DELHIVERY_TOKEN;

if (!TOKEN) {
  throw new Error("DELHIVERY_TOKEN not found in environment");
}

export const delhiveryClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Token ${TOKEN}`,
  },
  timeout: 15000,
});

export const authQuery = { token: TOKEN };
