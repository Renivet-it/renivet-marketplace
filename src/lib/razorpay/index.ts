import { env } from "@/../env";
import RazorPay from "razorpay";

export const razorpay = new RazorPay({
    key_id: env.RAZOR_PAY_KEY_ID,
    key_secret: env.RAZOR_PAY_SECRET_KEY,
});
