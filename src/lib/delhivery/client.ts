import axios from "axios";

// Use .trim() to prevent issues with whitespace in environment variables.
const BASE_URL = (process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com" ).trim();
const TOKEN = process.env.DELHIVERY_TOKEN;

if (!TOKEN) {
  throw new Error("DELHIVERY_TOKEN not found in environment. Please check your .env file.");
}

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

// REMOVED: This is not needed and was the likely source of the bug.
// export const authQuery = { token: TOKEN };
