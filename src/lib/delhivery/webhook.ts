import type { NextApiRequest, NextApiResponse } from "next";

export const handleDelhiveryWebhook = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const payload = req.body;

    // Typical fields include: waybill, status, remarks, timestamp
    console.log("Delhivery webhook:", payload);

    // TODO: Integrate with your DB to update order status:
    // await prisma.order.update({ where: { awb: payload.waybill }, data: { status: payload.status } });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Delhivery webhook error:", err);
    res.status(500).json({ success: false, message: "Webhook failed" });
  }
};
