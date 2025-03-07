import { env } from "@/../env";
import axios, { AxiosInstance } from "axios";
import { shipRocketCache } from "../redis/methods";
import { AppError, sanitizeError } from "../utils";
import {
    AWB,
    GenerateManifest,
    Invoice,
    Label,
    Order,
    Pickup,
    PickupLocation,
    PrintManifest,
} from "./validations/request";
import {
    AWBResponse,
    GenerateManifestResponse,
    InvoiceResponse,
    LabelResponse,
    OrderResponse,
    PickupLocationResponse,
    PickupResponse,
    PrintManifestResponse,
} from "./validations/response";

class ShipRocket {
    private static instance: ShipRocket;
    private axiosAuthInstance: AxiosInstance;
    private axiosInstance: AxiosInstance;

    private constructor() {
        this.axiosAuthInstance = axios.create({
            baseURL: "https://apiv2.shiprocket.in/v1/external/",
        });

        this.axiosInstance = axios.create({
            baseURL: "https://apiv2.shiprocket.in/v1/external/",
        });
    }

    public static async getInstance(): Promise<ShipRocket> {
        if (!this.instance) {
            this.instance = new ShipRocket();
            await this.instance.login();
        }
        return this.instance;
    }

    private async updateAuthToken(token: string) {
        this.axiosInstance = axios.create({
            baseURL: "https://apiv2.shiprocket.in/v1/external/",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    async login() {
        try {
            const existingToken = await shipRocketCache.getShipRocketToken();
            if (existingToken) {
                await this.updateAuthToken(existingToken);
                return {
                    status: true,
                    message: "Auth token received",
                    data: existingToken,
                };
            }

            const res = await this.axiosAuthInstance.post("/auth/login", {
                email: env.SHIPROCKET_LOGIN_EMAIL,
                password: env.SHIPROCKET_LOGIN_PASSWORD,
            });
            if (res.status !== 200)
                throw new AppError(
                    "Unable to get login token",
                    "INTERNAL_SERVER_ERROR"
                );

            await this.updateAuthToken(res.data.token);
            await shipRocketCache.setShipRocketToken(res.data.token);

            return {
                status: true,
                message: "Auth token received",
                data: res.data,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async getBalance() {
        try {
            const res = await this.axiosInstance.get<{
                data: { balance_amount: string };
            }>("/account/details/wallet-balance");
            if (res.status !== 200)
                throw new AppError(
                    "Unable to get balance",
                    "INTERNAL_SERVER_ERROR"
                );

            return {
                status: true,
                message: "Balance received",
                data: +res.data.data.balance_amount,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async createPickUpLocation(values: PickupLocation) {
        try {
            const res = await this.axiosInstance.post<PickupLocationResponse>(
                "/settings/company/addpickup",
                values
            );
            const { success, address } = res.data;
            if (!success)
                throw new AppError(
                    "Unable to create pickup location",
                    "INTERNAL_SERVER_ERROR"
                );

            return {
                status: true,
                message: "Pickup location created",
                data: address,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async requestCreateOrder(values: Order) {
        try {
            const res = await this.axiosInstance.post<OrderResponse>(
                "/orders/create/adhoc",
                values
            );
            if (res.status !== 200)
                throw new AppError(
                    "Unable to create order",
                    "INTERNAL_SERVER_ERROR"
                );

            return {
                status: true,
                message: "Order created",
                data: res.data,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async generateAWB(values: AWB) {
        try {
            const res = await this.axiosInstance.post<AWBResponse>(
                "/courier/assign/awb",
                values
            );
            if (res.status !== 200)
                throw new AppError(
                    "Unable to generate AWB",
                    "INTERNAL_SERVER_ERROR"
                );

            const { awb_assign_status, response } = res.data;
            if (!awb_assign_status)
                throw new AppError("Unable to generate AWB", "CONFLICT");

            return {
                status: true,
                message: "AWB generated",
                data: response,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async generateLabel(values: Label) {
        try {
            const res = await this.axiosInstance.post<LabelResponse>(
                "/courier/generate/label",
                values
            );
            if (res.status !== 200)
                throw new AppError(
                    "Unable to generate label",
                    "INTERNAL_SERVER_ERROR"
                );
            if (!res.data.label_created)
                throw new AppError("Unable to generate label", "CONFLICT");
            if (res.data.not_created.length > 0)
                throw new AppError(
                    "Unable to generate label",
                    "INTERNAL_SERVER_ERROR"
                );

            return {
                status: true,
                message: "Label generated",
                data: res.data.label_url,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async generateInvoice(values: Invoice) {
        try {
            const res = await this.axiosInstance.post<InvoiceResponse>(
                "/orders/print/invoice",
                values
            );
            if (res.status !== 200)
                throw new AppError(
                    "Unable to generate invoice",
                    "INTERNAL_SERVER_ERROR"
                );
            if (!res.data.is_invoice_created)
                throw new AppError("Unable to generate invoice", "CONFLICT");
            if (res.data.not_created.length > 0)
                throw new AppError(
                    "Unable to generate invoice",
                    "INTERNAL_SERVER_ERROR"
                );

            return {
                status: true,
                message: "Invoice generated",
                data: res.data.invoice_url,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async shipmentPickup(values: Pickup) {
        try {
            const res = await this.axiosInstance.post<PickupResponse>(
                "courier/generate/pickup",
                values
            );
            if (res.status !== 200)
                throw new AppError(
                    "Unable to generate pickup",
                    "INTERNAL_SERVER_ERROR"
                );

            const returnData = {
                pickup_status: res.data.pickup_status,
                pickup_scheduled_date: res.data.response.pickup_scheduled_date,
                pickup_token_number: res.data.response.pickup_token_number,
                status: res.data.response.status,
                pickup_generated_date: res.data.response.pickup_generated_date,
            };

            return {
                status: true,
                message: res.data.response.data,
                data: returnData,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async generateManifest(values: GenerateManifest) {
        try {
            const res = await this.axiosInstance.post<GenerateManifestResponse>(
                "manifests/generate",
                values
            );
            if (res.status !== 200)
                throw new AppError(
                    "Unable to generate manifest",
                    "INTERNAL_SERVER_ERROR"
                );

            return {
                status: true,
                message: "Manifest generated successfully!",
                data: res.data.manifest_url,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async printManifest(values: PrintManifest) {
        try {
            const res = await this.axiosInstance.post<PrintManifestResponse>(
                "manifests/print",
                values
            );
            if (res.status !== 200)
                throw new AppError(
                    "Unable to print manifest",
                    "INTERNAL_SERVER_ERROR"
                );

            return {
                status: true,
                message: "Manifest generated successfully!",
                data: res.data.manifest_url,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }

    async deleteOrder(values: { ids: number[] }) {
        try {
            const res = await this.axiosInstance.post("/orders/cancel", values);
            if (res.status !== 200)
                throw new AppError(
                    "Unable to delete order",
                    "INTERNAL_SERVER_ERROR"
                );

            return {
                status: true,
                message: "Order deleted successfully!",
                data: null,
            };
        } catch (err) {
            return {
                status: false,
                message: sanitizeError(err),
                data: null,
            };
        }
    }
}

export const shiprocket = async () => await ShipRocket.getInstance();
