import axios from "axios";
import { shouldRunExternalSideEffects } from "@/lib/external-side-effects";

// Use .trim() to prevent issues with whitespace in environment variables.
const BASE_URL = (process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com" ).trim();
const TOKEN = process.env.DELHIVERY_TOKEN;

console.log(`[Delhivery Client] Initialized with Base URL: "${BASE_URL}"`);

export const delhiveryClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Token ${TOKEN}`,
  },
  timeout: 15000,
  // It's still a good idea to keep this to diagnose redirect issues.
  // If the error changes to a 3xx status code, we'll know a redirect is the cause.
  maxRedirects: 0,
});

delhiveryClient.interceptors.request.use(async (config) => {
  if (!TOKEN) throw new Error("DELHIVERY_TOKEN is not configured");
  if (!(await shouldRunExternalSideEffects())) {
    throw new Error("external_side_effects_disabled");
  }
  config.headers = config.headers ?? {};
  config.headers.Authorization = `Token ${TOKEN}`;
  return config;
});

// REMOVED: This is not needed and was the likely source of the bug.
// export const authQuery = { token: TOKEN };
