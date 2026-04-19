import axios from "axios";

export type UnicommerceInventorySnapshot = {
    itemSku: string;
    inventory: number;
    openSale?: number;
    openPurchase?: number;
    putawayPending?: number;
    inventoryBlocked?: number;
};

export type UnicommerceConnection = {
    tenant?: string | null;
    facilityId?: string | null;
    baseUrl?: string | null;
    username: string;
    password: string;
    initialAccessToken?: string | null;
    initialRefreshToken?: string | null;
    accessTokenExpiresAt?: Date | string | null;
    onTokenUpdate?: (token: {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresAt: Date;
        expiresIn: number;
    }) => Promise<void> | void;
};

type UnicommerceTokenResponse = {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
};

type UnicommerceDebugStep =
    | "oauth_password_grant"
    | "oauth_refresh_grant"
    | "inventory_snapshot"
    | "api_request";

type UnicommerceDebugEntry = {
    step: UnicommerceDebugStep;
    at: string;
    request: {
        method: "GET" | "POST";
        url: string;
        params?: Record<string, unknown>;
        headers?: Record<string, string>;
        body?: unknown;
    };
    response?: {
        status?: number;
        data?: unknown;
    };
    error?: {
        status?: number;
        message?: string;
        data?: unknown;
    };
};

type UnicommerceApiIssue = {
    message?: string;
    description?: string;
};

type UnicommerceInventoryApiSnapshot = {
    itemTypeSKU?: string;
    inventory?: number;
    openSale?: number;
    openPurchase?: number;
    putawayPending?: number;
    inventoryBlocked?: number;
};

type UnicommerceInventoryApiResponse = {
    successful?: boolean;
    message?: string;
    errors?: UnicommerceApiIssue[];
    inventorySnapshots?: UnicommerceInventoryApiSnapshot[];
};

export class UnicommerceClient {
    private baseOrigin: string;
    private facilityCode: string;
    private connection: UnicommerceConnection;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private accessTokenExpiresAt: number | null = null;
    private debugTrail: UnicommerceDebugEntry[] = [];

    constructor(connection: UnicommerceConnection) {
        this.connection = connection;
        const { origin, facilityCode } = this.getConnectionDetails();
        this.baseOrigin = origin;
        this.facilityCode = facilityCode;
        this.accessToken = connection.initialAccessToken ?? null;
        this.refreshToken = connection.initialRefreshToken ?? null;
        this.accessTokenExpiresAt = connection.accessTokenExpiresAt
            ? new Date(connection.accessTokenExpiresAt).getTime()
            : null;
    }

    private getConnectionDetails() {
        const facilityCode = (this.connection.facilityId ?? "").trim();
        if (!facilityCode) {
            throw new Error(
                "Unicommerce facility code is required for REST API calls."
            );
        }

        const inputBaseUrl = this.connection.baseUrl?.trim();
        if (inputBaseUrl) {
            try {
                const parsed = new URL(inputBaseUrl);
                return { origin: parsed.origin, facilityCode };
            } catch {
                throw new Error("Invalid Unicommerce base URL.");
            }
        }

        const tenant = this.connection.tenant?.trim();
        if (!tenant) {
            throw new Error(
                "Unicommerce endpoint config missing. Provide `baseUrl` or `tenant`."
            );
        }

        return {
            origin: `https://${tenant}.unicommerce.com`,
            facilityCode,
        };
    }

    private get OAuthEndpoint() {
        return `${this.baseOrigin}/oauth/token`;
    }

    private get inventorySnapshotEndpoint() {
        return `${this.baseOrigin}/services/rest/v1/inventory/inventorySnapshot/get`;
    }

    private maskSecret(value?: string | null) {
        if (!value) return "";
        if (value.length <= 6) return "***";
        return `${value.slice(0, 3)}***${value.slice(-3)}`;
    }

    private pushDebug(entry: UnicommerceDebugEntry) {
        this.debugTrail.push(entry);
        console.log("[Unicommerce Debug]", entry);
    }

    getDebugTrail() {
        return [...this.debugTrail];
    }

    private async loginWithPassword() {
        const requestParams = {
            grant_type: "password",
            client_id: "my-trusted-client",
            username: this.connection.username,
            password: "***",
        };
        const response = await axios.get<UnicommerceTokenResponse>(
            this.OAuthEndpoint,
            {
                params: {
                    grant_type: "password",
                    client_id: "my-trusted-client",
                    username: this.connection.username,
                    password: this.connection.password,
                },
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            }
        );

        this.pushDebug({
            step: "oauth_password_grant",
            at: new Date().toISOString(),
            request: {
                method: "GET",
                url: this.OAuthEndpoint,
                params: requestParams,
                headers: { "Content-Type": "application/json" },
            },
            response: {
                status: response.status,
                data: {
                    token_type: response.data.token_type,
                    expires_in: response.data.expires_in,
                    access_token: this.maskSecret(response.data.access_token),
                    refresh_token: this.maskSecret(response.data.refresh_token),
                },
            },
        });

        await this.setTokenState(response.data);
        return response.data.access_token;
    }

    private async renewAccessToken() {
        if (!this.refreshToken) return this.loginWithPassword();

        try {
            const requestParams = {
                grant_type: "refresh_token",
                client_id: "my-trusted-client",
                refresh_token: this.maskSecret(this.refreshToken),
            };
            const response = await axios.get<UnicommerceTokenResponse>(
                this.OAuthEndpoint,
                {
                    params: {
                        grant_type: "refresh_token",
                        client_id: "my-trusted-client",
                        refresh_token: this.refreshToken,
                    },
                    headers: {
                        "Content-Type": "application/json",
                    },
                    timeout: 30000,
                }
            );

            this.pushDebug({
                step: "oauth_refresh_grant",
                at: new Date().toISOString(),
                request: {
                    method: "GET",
                    url: this.OAuthEndpoint,
                    params: requestParams,
                    headers: { "Content-Type": "application/json" },
                },
                response: {
                    status: response.status,
                    data: {
                        token_type: response.data.token_type,
                        expires_in: response.data.expires_in,
                        access_token: this.maskSecret(
                            response.data.access_token
                        ),
                        refresh_token: this.maskSecret(
                            response.data.refresh_token
                        ),
                    },
                },
            });

            await this.setTokenState(response.data);
            return response.data.access_token;
        } catch (error: unknown) {
            const axiosError = error as {
                response?: { status?: number; data?: unknown };
                message?: string;
            };
            this.pushDebug({
                step: "oauth_refresh_grant",
                at: new Date().toISOString(),
                request: {
                    method: "GET",
                    url: this.OAuthEndpoint,
                    params: {
                        grant_type: "refresh_token",
                        client_id: "my-trusted-client",
                        refresh_token: this.maskSecret(this.refreshToken),
                    },
                    headers: { "Content-Type": "application/json" },
                },
                error: {
                    status: axiosError.response?.status,
                    data: axiosError.response?.data,
                    message: axiosError.message,
                },
            });
            return this.loginWithPassword();
        }
    }

    private async setTokenState(token: UnicommerceTokenResponse) {
        this.accessToken = token.access_token;
        this.refreshToken = token.refresh_token;
        const ttl = Math.max(0, Number(token.expires_in || 0));
        // Keep a small buffer to avoid race near expiration.
        this.accessTokenExpiresAt = Date.now() + Math.max(0, ttl - 30) * 1000;
        if (this.connection.onTokenUpdate) {
            try {
                await this.connection.onTokenUpdate({
                    accessToken: this.accessToken,
                    refreshToken: this.refreshToken,
                    accessTokenExpiresAt: new Date(this.accessTokenExpiresAt),
                    expiresIn: ttl,
                });
            } catch (error) {
                console.error("Failed to persist Unicommerce OAuth tokens", error);
            }
        }
    }

    private async getValidAccessToken() {
        if (
            this.accessToken &&
            this.accessTokenExpiresAt &&
            Date.now() < this.accessTokenExpiresAt
        ) {
            return this.accessToken;
        }

        if (this.refreshToken) {
            return this.renewAccessToken();
        }

        return this.loginWithPassword();
    }

    async authenticate() {
        await this.getValidAccessToken();
        return {
            authenticated: Boolean(this.accessToken),
            accessTokenExpiresAt: this.accessTokenExpiresAt
                ? new Date(this.accessTokenExpiresAt)
                : null,
            hasRefreshToken: Boolean(this.refreshToken),
        };
    }

    async requestApi(params: {
        method: "GET" | "POST";
        path: string;
        query?: Record<string, string | number | boolean | null | undefined>;
        body?: unknown;
        headers?: Record<string, string>;
        includeFacilityHeader?: boolean;
    }) {
        const normalizedPath = params.path.trim();
        if (!normalizedPath.startsWith("/")) {
            throw new Error("Unicommerce API path must start with `/`.");
        }

        const accessToken = await this.getValidAccessToken();
        const url = `${this.baseOrigin}${normalizedPath}`;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization: `bearer ${accessToken}`,
            ...params.headers,
        };

        if (params.includeFacilityHeader !== false) {
            headers.Facility = this.facilityCode;
        }

        const maskedHeaders = {
            ...headers,
            Authorization: `bearer ${this.maskSecret(accessToken)}`,
        };

        try {
            if (params.method === "GET") {
                const response = await axios.get(url, {
                    params: params.query,
                    headers,
                    timeout: 30000,
                });

                this.pushDebug({
                    step: "api_request",
                    at: new Date().toISOString(),
                    request: {
                        method: "GET",
                        url,
                        params: params.query,
                        headers: maskedHeaders,
                    },
                    response: {
                        status: response.status,
                        data: response.data,
                    },
                });

                return {
                    status: response.status,
                    data: response.data,
                };
            }

            const response = await axios.post(url, params.body ?? {}, {
                params: params.query,
                headers,
                timeout: 30000,
            });

            this.pushDebug({
                step: "api_request",
                at: new Date().toISOString(),
                request: {
                    method: "POST",
                    url,
                    params: params.query,
                    headers: maskedHeaders,
                    body: params.body ?? {},
                },
                response: {
                    status: response.status,
                    data: response.data,
                },
            });

            return {
                status: response.status,
                data: response.data,
            };
        } catch (error: unknown) {
            const axiosError = error as {
                response?: {
                    status?: number;
                    data?: unknown;
                };
                message?: string;
            };

            this.pushDebug({
                step: "api_request",
                at: new Date().toISOString(),
                request: {
                    method: params.method,
                    url,
                    params: params.query,
                    headers: maskedHeaders,
                    body: params.method === "POST" ? params.body ?? {} : undefined,
                },
                error: {
                    status: axiosError.response?.status,
                    data: axiosError.response?.data,
                    message: axiosError.message,
                },
            });

            throw error;
        }
    }

    private normalizeSnapshots(
        snapshots: UnicommerceInventoryApiSnapshot[] | undefined
    ) {
        return (snapshots ?? [])
            .map((s) => ({
                itemSku: String(s.itemTypeSKU || "").trim(),
                inventory: Number(s.inventory ?? 0),
                openSale: Number(s.openSale ?? 0),
                openPurchase: Number(s.openPurchase ?? 0),
                putawayPending: Number(s.putawayPending ?? 0),
                inventoryBlocked: Number(s.inventoryBlocked ?? 0),
            }))
            .filter((s: UnicommerceInventorySnapshot) => s.itemSku.length > 0);
    }

    private resolveApiErrorMessage(response: UnicommerceInventoryApiResponse) {
        const message = (response.errors ?? [])
            .map((err) => err.message || err.description)
            .filter(Boolean)
            .join(", ");
        return message || response.message || "Unicommerce responded with failure";
    }

    async getInventorySnapshot(params: {
        skus?: string[];
        updatedSinceMinutes?: number;
    }): Promise<UnicommerceInventorySnapshot[]> {
        const { skus = [], updatedSinceMinutes = 60 } = params;

        const requestPayload: {
            itemTypeSKUs?: string[];
            updatedSinceInMinutes?: number;
        } = {};
        if (skus.length > 0) requestPayload.itemTypeSKUs = skus;
        if (updatedSinceMinutes > 0) {
            requestPayload.updatedSinceInMinutes = updatedSinceMinutes;
        }

        const accessToken = await this.getValidAccessToken();

        try {
            const response = await axios.post<UnicommerceInventoryApiResponse>(
                this.inventorySnapshotEndpoint,
                requestPayload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `bearer ${accessToken}`,
                        Facility: this.facilityCode,
                    },
                    timeout: 30000,
                }
            );
            const result = response.data;

            this.pushDebug({
                step: "inventory_snapshot",
                at: new Date().toISOString(),
                request: {
                    method: "POST",
                    url: this.inventorySnapshotEndpoint,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `bearer ${this.maskSecret(accessToken)}`,
                        Facility: this.facilityCode,
                    },
                    body: requestPayload,
                },
                response: {
                    status: response.status,
                    data: result,
                },
            });

            if (!result?.successful) {
                throw new Error(this.resolveApiErrorMessage(result));
            }

            return this.normalizeSnapshots(result.inventorySnapshots);
        } catch (error: unknown) {
            const axiosError = error as {
                response?: {
                    status?: number;
                    data?: {
                        message?: string;
                        error_description?: string;
                    };
                };
                message?: string;
            };

            if (
                axiosError?.response?.status === 401 ||
                axiosError?.response?.status === 403
            ) {
                const renewedToken = await this.renewAccessToken();
                const retry = await axios.post<UnicommerceInventoryApiResponse>(
                    this.inventorySnapshotEndpoint,
                    requestPayload,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `bearer ${renewedToken}`,
                            Facility: this.facilityCode,
                        },
                        timeout: 30000,
                    }
                );
                this.pushDebug({
                    step: "inventory_snapshot",
                    at: new Date().toISOString(),
                    request: {
                        method: "POST",
                        url: this.inventorySnapshotEndpoint,
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `bearer ${this.maskSecret(renewedToken)}`,
                            Facility: this.facilityCode,
                        },
                        body: requestPayload,
                    },
                    response: {
                        status: retry.status,
                        data: retry.data,
                    },
                });
                if (!retry.data?.successful) {
                    throw new Error(this.resolveApiErrorMessage(retry.data));
                }
                return this.normalizeSnapshots(retry.data.inventorySnapshots);
            }

            this.pushDebug({
                step: "inventory_snapshot",
                at: new Date().toISOString(),
                request: {
                    method: "POST",
                    url: this.inventorySnapshotEndpoint,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `bearer ${this.maskSecret(accessToken)}`,
                        Facility: this.facilityCode,
                    },
                    body: requestPayload,
                },
                error: {
                    status: axiosError?.response?.status,
                    data: axiosError?.response?.data,
                    message: axiosError?.message,
                },
            });

            const errorMessage =
                axiosError?.response?.data?.message ||
                axiosError?.response?.data?.error_description ||
                axiosError?.message ||
                "Failed to reach Unicommerce Server";
            throw new Error(errorMessage);
        }
    }
}
