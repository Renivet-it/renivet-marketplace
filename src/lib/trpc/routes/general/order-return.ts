import { AWBResponse } from "@/lib/shiprocket/validations/response";
import { OrderReturnShiprockResponse } from "@/lib/shiprocket/validations/response/order-return";
import { returnOrderPayloadValidationSchema } from "@/lib/store/validation/return-store-validation";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { getAbsoluteURL } from "@/lib/utils";
import {
    returnShipment,
    returnShipmentAddress,
    returnShipmentItem,
    returnShipmentPayment,
    returnShipmentReason,
} from "@/lib/validations/order-return";
import { TRPCError } from "@trpc/server";
import axios from "axios";
import {
    buildBrandShippingDetails,
    generateOrderItemDetails,
    generateShippingDimensions,
} from "../../helper/helpers";

export const OrderReturnRouter = createTRPCRouter({
    createReturnOrder: protectedProcedure
        .input(returnOrderPayloadValidationSchema)
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { orderId } = input;
            try {
                const orderDetails =
                    await queries.orders.getBrandUserItemsDetailsByOrderId(
                        orderId
                    );
                if (!orderDetails) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Order not found or does not shipped yet.",
                    });
                }

                const confidential = (orderDetails.brand as any).confidential;

                const brandDetails = buildBrandShippingDetails(
                    orderDetails.brand,
                    confidential
                );

                const order_items = generateOrderItemDetails(
                    orderDetails.order.item,
                    orderDetails.order.totalAmount
                );

                const { height, length, weight, width } =
                    generateShippingDimensions(orderDetails.order.item);

                const shiprocketPayload = {
                    order_id: `R_${orderDetails.orderId}`,
                    order_date: orderDetails.order.createdAt
                        .toISOString()
                        .split("T")[0],
                    pickup_customer_name: input.customerName,
                    pickup_address: input.pickupAddress,
                    pickup_city: input.pickupCity,
                    pickup_state: input.pickupState,
                    pickup_country: input.pickupCountry,
                    pickup_pincode: input.pickupPincode,
                    pickup_email: input.pickupEmail,
                    pickup_phone: input.pickupPhone,
                    ...brandDetails,
                    order_items,
                    payment_method: "prepaid",
                    sub_total: orderDetails.order.totalAmount,
                    length,
                    breadth: width,
                    height,
                    weight,
                };

                const returnResponse = await axios
                    .post(
                        getAbsoluteURL("/api/shiprocket/couriers/return-order"),
                        shiprocketPayload
                    )
                    .catch((error) => {
                        console.error("shiprocket api", error);
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Get Error from delivery partner",
                        });
                    });

                if (!returnResponse.data.status) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Failed to create return order shipment.",
                    });
                }

                const returnResponseData: OrderReturnShiprockResponse =
                    returnResponse.data.data;

                const awbPayload = {
                    is_return: 1, //for yes
                    shipment_id: returnResponseData.shipment_id,
                };

                const awbResponse = await axios
                    .post(
                        getAbsoluteURL(
                            "/api/shiprocket/couriers/generate-awb/return"
                        ),
                        awbPayload
                    )
                    .catch((error) => {
                        console.error("shiprocket api", error);
                        throw new TRPCError({
                            code: "BAD_REQUEST",
                            message: "Get Error from delivery partner",
                        });
                    });

                if (!awbResponse.data.status) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Failed to create return order shipment AWB.",
                    });
                }

                const awbResponseData: AWBResponse = awbResponse.data.data;

                const orderReturnDbData: Array<returnShipment> = [
                    {
                        deliveredOrderId: orderDetails.orderId,
                        returnOrderId: shiprocketPayload.order_id,
                        awb: Number(awbResponseData.response.data.awb_code),
                        courierCompanyName: returnResponseData.company_name,
                        rtoExchangeType: false,
                        srOrderId: returnResponseData.order_id,
                        srShipmentId: returnResponseData.shipment_id,
                        srResponse: returnResponseData,
                        status: returnResponseData.status.toLowerCase(),
                        isPayable: true,
                    },
                ];

                const orderReturnInsertedDbData =
                    await queries.orders.insertOrderReturnShipement(
                        orderReturnDbData
                    );

                if (orderReturnInsertedDbData.length === 0) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message:
                            "Order return data does not have sufficient values.",
                    });
                }

                const returnId = orderReturnInsertedDbData.at(0)!.returnOrderId;

                const orderReturnAddressDbData: Array<returnShipmentAddress> = [
                    {
                        customerName: input.customerName,
                        pickupAddress: input.pickupAddress,
                        pickupCity: input.pickupCity,
                        pickupState: input.pickupState,
                        pickupCountry: input.pickupCountry,
                        pickupPincode: input.pickupPincode,
                        pickupEmail: input.pickupEmail,
                        pickupPhone: input.pickupPhone,
                        returnId,
                    },
                ];

                // assign data to the order return address
                const orderReturnAddressInsertedDbData =
                    await queries.orders.insertOrderReturnAddress(
                        orderReturnAddressDbData
                    );

                const {
                    name: nameOfProduct,
                    sku: productSku,
                    units: noOfUnits,
                    selling_price: purchasedRate,
                } = order_items[0];

                const orderReturnItemDbData: Array<returnShipmentItem> = [
                    {
                        brandId: orderDetails.brandId,
                        orderId: orderDetails.orderId,
                        returnId,
                        productName: nameOfProduct,
                        sku: productSku,
                        sellingPrice: purchasedRate,
                        units: noOfUnits,
                    },
                ];

                // retuen item details
                const orderReturnItemInsertedDbData =
                    await queries.orders.insertOrderReturnItemDetails(
                        orderReturnItemDbData
                    );

                const orderReturnPaymentDbData: Array<returnShipmentPayment> = [
                    {
                        accountHolderName: input.accountHolderName,
                        accountNumber: input.accountNumber,
                        bankName: input.bankName,
                        branch: input.branch,
                        ifscCode: input.ifscCode,
                        brandId: orderDetails.brandId,
                        userId: orderDetails.order.userId,
                        returnId,
                    },
                ];
                // return payment details
                const orderReturnPaymentInsertedDbData =
                    await queries.orders.insertOrderReturnPaymentDetails(
                        orderReturnPaymentDbData
                    );

                const orderReturnReasonDbData: Array<returnShipmentReason> = [
                    {
                        comment: input.comments,
                        subReasonId: input.subReasonId,
                        returnId,
                    },
                ];

                // return reason details
                const orderReturnReasonInsertedDbData =
                    await queries.orders.insertOrderReturnReasonDetails(
                        orderReturnReasonDbData
                    );

                const updateOrderShipmentReturnflag =
                    await queries.orders.updateOrderShipmentReturnflagData(
                        orderDetails.orderId,
                        true
                    );

                return {
                    status: true,
                    message: "Return order generated successfully",
                    data: orderReturnInsertedDbData,
                };
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message:
                        "Something went wrong while processing the return.",
                    cause: error,
                });
            }
        }),
});
