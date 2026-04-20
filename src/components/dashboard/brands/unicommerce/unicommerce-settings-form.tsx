"use client";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button-dash";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const unicommerceIntegrationSchema = z
    .object({
        tenant: z.string().trim().min(1, "Tenant is required"),
        facilityId: z.string().trim().min(1, "Facility code is required"),
        username: z.string().trim().min(1, "Username is required"),
        password: z.string().optional(),
        isActive: z.boolean().default(true),
        updatedSinceMinutes: z.coerce
            .number()
            .int()
            .positive("Sync window must be at least 1 minute")
            .max(1440, "Sync window cannot exceed 1440 minutes")
            .default(60),
    });

type UnicommerceIntegrationForm = z.infer<typeof unicommerceIntegrationSchema>;

interface UnicommerceSettingsFormProps {
    brandId: string;
    showSectionArea?: boolean;
    forcedMainTab?: "modules" | "api-explorer" | "logs";
    forcedModuleTab?: ModuleTabKey;
    hideSectionMenus?: boolean;
}

type ModuleTabKey =
    | "authentication"
    | "inventory"
    | "orders"
    | "returns"
    | "catalog";

type JsonRecord = Record<string, unknown>;

type UnicommerceApiPreset = {
    method: "GET" | "POST";
    path: string;
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
};

const moduleApiPresets: Record<Exclude<ModuleTabKey, "authentication">, UnicommerceApiPreset> =
    {
        inventory: {
            method: "POST",
            path: "/services/rest/v1/inventory/inventorySnapshot/get",
            body: { updatedSinceInMinutes: 60 },
        },
        orders: {
            method: "POST",
            path: "/services/rest/v1/oms/saleOrder/search",
            body: { saleOrderCode: "", updatedSinceInMinutes: 60 },
        },
        returns: {
            method: "POST",
            path: "/services/rest/v1/returns/search",
            body: { updatedSinceInMinutes: 60 },
        },
        catalog: {
            method: "POST",
            path: "/services/rest/v1/catalog/product/search",
            body: { updatedSinceInMinutes: 60 },
        },
    };

const isJsonRecord = (value: unknown): value is JsonRecord =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const toTableRows = (value: unknown): JsonRecord[] => {
    if (Array.isArray(value)) {
        return value.filter(isJsonRecord).slice(0, 100);
    }

    if (!isJsonRecord(value)) {
        return [];
    }

    const preferredKeys = [
        "inventorySnapshots",
        "saleOrders",
        "returns",
        "products",
        "items",
        "results",
        "data",
    ];

    for (const key of preferredKeys) {
        const candidate = value[key];
        if (Array.isArray(candidate)) {
            const rows = candidate.filter(isJsonRecord).slice(0, 100);
            if (rows.length > 0) return rows;
        }
    }

    for (const nestedValue of Object.values(value)) {
        if (Array.isArray(nestedValue)) {
            const rows = nestedValue.filter(isJsonRecord).slice(0, 100);
            if (rows.length > 0) return rows;
        }
    }

    return [value];
};

const getTableColumns = (rows: JsonRecord[]) => {
    const columns = new Set<string>();
    for (const row of rows) {
        for (const key of Object.keys(row)) {
            columns.add(key);
            if (columns.size >= 10) break;
        }
        if (columns.size >= 10) break;
    }
    return Array.from(columns);
};

const formatCellValue = (value: unknown) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    return JSON.stringify(value);
};

const extractTenantFromBaseUrl = (baseUrl?: string | null) => {
    if (!baseUrl) return "";
    try {
        const parsed = new URL(baseUrl);
        return parsed.hostname.replace(".unicommerce.com", "");
    } catch {
        return "";
    }
};

export function UnicommerceSettingsForm({
    brandId,
    showSectionArea = false,
    forcedMainTab,
    forcedModuleTab,
    hideSectionMenus = false,
}: UnicommerceSettingsFormProps) {
    const [lastDebugPayload, setLastDebugPayload] = useState<unknown>(null);
    const [apiMethod, setApiMethod] = useState<"GET" | "POST">("POST");
    const [apiPath, setApiPath] = useState(
        "/services/rest/v1/inventory/inventorySnapshot/get"
    );
    const [apiQueryJson, setApiQueryJson] = useState("{}");
    const [apiBodyJson, setApiBodyJson] = useState(
        "{\n  \"updatedSinceInMinutes\": 60\n}"
    );
    const [apiResponsePayload, setApiResponsePayload] = useState<unknown>(null);
    const [mainTab, setMainTab] = useState<"modules" | "api-explorer" | "logs">(
        forcedMainTab ?? "modules"
    );
    const [moduleTab, setModuleTab] = useState<ModuleTabKey>(
        forcedModuleTab ?? "authentication"
    );
    const [moduleResponsePayloads, setModuleResponsePayloads] = useState<
        Partial<Record<Exclude<ModuleTabKey, "authentication">, unknown>>
    >({});
    const [loadingModuleTab, setLoadingModuleTab] = useState<
        Exclude<ModuleTabKey, "authentication"> | null
    >(null);

    const unicommerceForm = useForm<UnicommerceIntegrationForm>({
        resolver: zodResolver(unicommerceIntegrationSchema),
        defaultValues: {
            tenant: "",
            facilityId: "",
            username: "",
            password: "",
            isActive: true,
            updatedSinceMinutes: 60,
        },
    });

    const unicommerceIntegrationQuery =
        trpc.brands.brands.getUnicommerceIntegration.useQuery({
            brandId,
        });

    useEffect(() => {
        const integration = unicommerceIntegrationQuery.data;
        if (!integration) return;

        unicommerceForm.reset({
            tenant:
                integration.tenant ??
                extractTenantFromBaseUrl(integration.baseUrl),
            facilityId: integration.facilityId ?? "",
            username: integration.username ?? "",
            password: "",
            isActive: integration.isActive ?? true,
            updatedSinceMinutes: 60,
        });
    }, [unicommerceIntegrationQuery.data, unicommerceForm]);

    useEffect(() => {
        if (forcedMainTab) setMainTab(forcedMainTab);
    }, [forcedMainTab]);

    useEffect(() => {
        if (forcedModuleTab) setModuleTab(forcedModuleTab);
    }, [forcedModuleTab]);

    const {
        mutate: saveUnicommerceIntegration,
        isPending: isUnicommerceSavePending,
    } = trpc.brands.brands.upsertUnicommerceIntegration.useMutation({
        onMutate: () => {
            const toastId = toast.loading("Saving Unicommerce settings...");
            return { toastId };
        },
        onSuccess: async (_, __, ctx) => {
            await unicommerceIntegrationQuery.refetch();
            unicommerceForm.setValue("password", "");
            unicommerceForm.reset(unicommerceForm.getValues(), {
                keepValues: true,
            });
            toast.success("Unicommerce settings saved", { id: ctx?.toastId });
        },
        onError: (err, _, ctx) => handleClientError(err, ctx?.toastId),
    });

    const {
        mutate: authenticateUnicommerce,
        isPending: isUnicommerceAuthPending,
    } = trpc.brands.brands.authenticateUnicommerceIntegration.useMutation({
        onMutate: () => {
            const toastId = toast.loading(
                "Authenticating with Unicommerce..."
            );
            return { toastId };
        },
        onSuccess: async (data, _, ctx) => {
            setLastDebugPayload(data);
            await unicommerceIntegrationQuery.refetch();

            if (data.success) {
                toast.success(
                    data.accessTokenExpiresAt
                        ? `Authentication successful. Token valid until ${new Date(data.accessTokenExpiresAt).toLocaleString()}.`
                        : "Authentication successful.",
                    { id: ctx?.toastId }
                );
                return;
            }

            toast.error(
                data.errorMessage || "Authentication failed",
                { id: ctx?.toastId }
            );
        },
        onError: (err, _, ctx) => {
            setLastDebugPayload({ error: err });
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: testUnicommerce, isPending: isUnicommerceTestPending } =
        trpc.brands.brands.testUnicommerceIntegration.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Testing Unicommerce connection...");
                return { toastId };
            },
            onSuccess: (data, _, ctx) => {
                setLastDebugPayload(data);
                console.group("Unicommerce Test Connection Debug");
                console.log("Result:", data);
                if (data?.debugTrail) {
                    console.log("Request/Response trail:", data.debugTrail);
                }
                console.groupEnd();

                if (data.success) {
                    toast.success(
                        `Connection successful. ${data.fetchedSnapshots} inventory records fetched.`,
                        { id: ctx?.toastId }
                    );
                    return;
                }

                toast.error(
                    data.errorMessage || "Test connection failed",
                    { id: ctx?.toastId }
                );
            },
            onError: (err, _, ctx) => {
                setLastDebugPayload({ error: err });
                console.error("Unicommerce Test Connection Error", err);
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: runUnicommerceSync, isPending: isUnicommerceSyncPending } =
        trpc.brands.brands.triggerUnicommerceSync.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Running inventory sync...");
                return { toastId };
            },
            onSuccess: async (data, _, ctx) => {
                await unicommerceIntegrationQuery.refetch();
                toast.success(
                    `Sync done. ${data.updatedProducts} products and ${data.updatedVariants} variants updated.`,
                    { id: ctx?.toastId }
                );
            },
            onError: (err, _, ctx) => handleClientError(err, ctx?.toastId),
        });

    const {
        mutate: runUnicommerceApiRequest,
        mutateAsync: runUnicommerceApiRequestAsync,
        isPending: isUnicommerceApiPending,
    } = trpc.brands.brands.runUnicommerceApiRequest.useMutation({
        onMutate: () => {
            const toastId = toast.loading("Running Unicommerce API request...");
            return { toastId };
        },
        onSuccess: (data, _, ctx) => {
            setLastDebugPayload(data);
            setApiResponsePayload(data);
            if (data.success) {
                toast.success(`API request successful (HTTP ${data.status})`, {
                    id: ctx?.toastId,
                });
                return;
            }

            toast.error(data.errorMessage || "API request failed", {
                id: ctx?.toastId,
            });
        },
        onError: (err, _, ctx) => {
            setApiResponsePayload({ error: err });
            return handleClientError(err, ctx?.toastId);
        },
    });

    const isUnicommercePending =
        isUnicommerceSavePending ||
        isUnicommerceAuthPending ||
        isUnicommerceTestPending ||
        isUnicommerceSyncPending ||
        isUnicommerceApiPending ||
        unicommerceIntegrationQuery.isFetching;

    const tokenExpiry = unicommerceIntegrationQuery.data?.accessTokenExpiresAt
        ? new Date(unicommerceIntegrationQuery.data.accessTokenExpiresAt)
        : null;
    const isTokenValid = tokenExpiry ? tokenExpiry.getTime() > Date.now() : false;

    const parseJsonValue = (
        value: string,
        label: string
    ): { ok: true; value?: Record<string, unknown> } | { ok: false } => {
        const trimmed = value.trim();
        if (!trimmed) return { ok: true, value: undefined };

        try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
                toast.error(`${label} must be a JSON object`);
                return { ok: false };
            }
            return { ok: true, value: parsed as Record<string, unknown> };
        } catch {
            toast.error(`${label} is invalid JSON`);
            return { ok: false };
        }
    };

    const handleRunApiRequest = () => {
        const parsedQuery = parseJsonValue(apiQueryJson, "Query JSON");
        if (!parsedQuery.ok) return;

        const parsedBody = parseJsonValue(apiBodyJson, "Body JSON");
        if (!parsedBody.ok) return;

        const normalizedQuery: Record<
            string,
            string | number | boolean | null
        > = {};
        if (parsedQuery.value) {
            for (const [key, value] of Object.entries(parsedQuery.value)) {
                if (
                    typeof value === "string" ||
                    typeof value === "number" ||
                    typeof value === "boolean" ||
                    value === null
                ) {
                    normalizedQuery[key] = value;
                }
            }
        }

        runUnicommerceApiRequest({
            brandId,
            method: apiMethod,
            path: apiPath.trim(),
            query: Object.keys(normalizedQuery).length ? normalizedQuery : undefined,
            body: apiMethod === "POST" ? parsedBody.value ?? {} : undefined,
            includeFacilityHeader: true,
        });
    };

    const openApiPreset = (preset: {
        method: "GET" | "POST";
        path: string;
        query?: Record<string, unknown>;
        body?: Record<string, unknown>;
    }) => {
        setApiMethod(preset.method);
        setApiPath(preset.path);
        setApiQueryJson(JSON.stringify(preset.query ?? {}, null, 2));
        setApiBodyJson(JSON.stringify(preset.body ?? {}, null, 2));
        setMainTab("api-explorer");
    };

    const handleFetchModuleTable = async (
        tab: Exclude<ModuleTabKey, "authentication">
    ) => {
        const preset = moduleApiPresets[tab];
        setLoadingModuleTab(tab);
        try {
            const response = await runUnicommerceApiRequestAsync({
                brandId,
                method: preset.method,
                path: preset.path,
                query: preset.query as
                    | Record<string, string | number | boolean | null>
                    | undefined,
                body:
                    preset.body &&
                    "updatedSinceInMinutes" in preset.body
                        ? {
                              ...preset.body,
                              updatedSinceInMinutes: unicommerceForm.getValues(
                                  "updatedSinceMinutes"
                              ),
                          }
                        : preset.body,
                includeFacilityHeader: true,
            });

            setModuleResponsePayloads((prev) => ({
                ...prev,
                [tab]: response?.data ?? null,
            }));
        } finally {
            setLoadingModuleTab(null);
        }
    };

    const authenticationRows: JsonRecord[] = [
        {
            status: unicommerceIntegrationQuery.data?.isActive ? "Active" : "Disabled",
            tokenStatus: isTokenValid ? "Valid" : "Invalid / Missing",
            tokenExpiresAt: tokenExpiry ? tokenExpiry.toLocaleString() : "Not available",
            lastSyncStatus: unicommerceIntegrationQuery.data?.lastSyncStatus ?? "idle",
            lastSyncAt: unicommerceIntegrationQuery.data?.lastSyncAt
                ? new Date(unicommerceIntegrationQuery.data.lastSyncAt).toLocaleString()
                : "Never",
        },
    ];

    const handleUnicommerceSubmit = (values: UnicommerceIntegrationForm) => {
        const trimmedPassword = values.password?.trim() ?? "";

        saveUnicommerceIntegration({
            brandId,
            tenant: values.tenant.trim(),
            facilityId: values.facilityId.trim(),
            username: values.username.trim(),
            password: trimmedPassword.length > 0 ? trimmedPassword : undefined,
            isActive: values.isActive,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Unicommerce Inventory Integration</CardTitle>
                <CardDescription>
                    Configure brand-wise Unicommerce credentials to fetch
                    inventory products using Unicommerce OAuth defaults.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm md:grid-cols-4">
                    <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">
                            {unicommerceIntegrationQuery.data?.isActive
                                ? "Active"
                                : unicommerceIntegrationQuery.data
                                  ? "Disabled"
                                  : "Not configured"}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">
                            Last Sync Result
                        </p>
                        <p className="font-medium capitalize">
                            {unicommerceIntegrationQuery.data?.lastSyncStatus ??
                                "idle"}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Last Sync Time</p>
                        <p className="font-medium">
                            {unicommerceIntegrationQuery.data?.lastSyncAt
                                ? new Date(
                                      unicommerceIntegrationQuery.data.lastSyncAt
                                  ).toLocaleString()
                                : "Never"}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Auth Token</p>
                        <p className="font-medium">
                            {!tokenExpiry
                                ? "Not generated"
                                : isTokenValid
                                  ? `Valid until ${tokenExpiry.toLocaleString()}`
                                  : `Expired at ${tokenExpiry.toLocaleString()}`}
                        </p>
                    </div>
                </div>

                {unicommerceIntegrationQuery.data?.lastError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        Last error: {unicommerceIntegrationQuery.data.lastError}
                    </p>
                ) : null}

                {lastDebugPayload ? (
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                        <p className="mb-2 text-sm font-semibold text-blue-900">
                            Last API Debug (Request/Response)
                        </p>
                        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs text-blue-900">
                            {JSON.stringify(lastDebugPayload, null, 2)}
                        </pre>
                    </div>
                ) : null}

                <Separator />

                <Form {...unicommerceForm}>
                    <form
                        className="space-y-4"
                        onSubmit={unicommerceForm.handleSubmit(
                            handleUnicommerceSubmit
                        )}
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={unicommerceForm.control}
                                name="tenant"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tenant</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="your-tenant (without .unicommerce.com)"
                                                disabled={isUnicommercePending}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            We auto-use{" "}
                                            <code>
                                                https://{"{tenant}"}
                                                .unicommerce.com
                                            </code>
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={unicommerceForm.control}
                                name="facilityId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Facility Code
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="facility-code"
                                                disabled={isUnicommercePending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={unicommerceForm.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Uniware login username"
                                                disabled={isUnicommercePending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={unicommerceForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Password{" "}
                                            {unicommerceIntegrationQuery.data
                                                ? "(leave blank to keep current)"
                                                : ""}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="password"
                                                placeholder={
                                                    unicommerceIntegrationQuery.data
                                                        ? "Leave blank to keep existing password"
                                                        : "Uniware login password"
                                                }
                                                disabled={isUnicommercePending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={unicommerceForm.control}
                                name="updatedSinceMinutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Sync Window (minutes)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                min={1}
                                                max={1440}
                                                disabled={isUnicommercePending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={unicommerceForm.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={
                                                    field.onChange
                                                }
                                                disabled={isUnicommercePending}
                                            />
                                        </FormControl>
                                        <div>
                                            <FormLabel>
                                                Integration active
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                                When disabled, scheduled sync
                                                will skip this brand.
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    isUnicommercePending ||
                                    !unicommerceIntegrationQuery.data
                                }
                                onClick={() =>
                                    authenticateUnicommerce({
                                        brandId,
                                    })
                                }
                            >
                                {isUnicommerceAuthPending ? (
                                    <Spinner className="animate-spin" />
                                ) : null}
                                Authenticate & Store Token
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    isUnicommercePending ||
                                    !unicommerceIntegrationQuery.data
                                }
                                onClick={() =>
                                    testUnicommerce({
                                        brandId,
                                        updatedSinceMinutes:
                                            unicommerceForm.getValues(
                                                "updatedSinceMinutes"
                                            ),
                                    })
                                }
                            >
                                {isUnicommerceTestPending ? (
                                    <Spinner className="animate-spin" />
                                ) : null}
                                Test Connection
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    isUnicommercePending ||
                                    !unicommerceIntegrationQuery.data?.isActive
                                }
                                onClick={() =>
                                    runUnicommerceSync({
                                        brandId,
                                        updatedSinceMinutes:
                                            unicommerceForm.getValues(
                                                "updatedSinceMinutes"
                                            ),
                                    })
                                }
                            >
                                {isUnicommerceSyncPending ? (
                                    <Spinner className="animate-spin" />
                                ) : null}
                                Run Inventory Sync
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isUnicommercePending ||
                                    !unicommerceForm.formState.isDirty
                                }
                            >
                                {isUnicommerceSavePending ? (
                                    <Spinner className="animate-spin" />
                                ) : null}
                                Save Unicommerce Settings
                            </Button>
                        </div>
                    </form>
                </Form>

                {showSectionArea ? <Separator /> : null}

                {showSectionArea ? (
                    <Tabs
                        value={mainTab}
                        onValueChange={(value) =>
                            setMainTab(value as "modules" | "api-explorer" | "logs")
                        }
                        className="w-full"
                    >
                        <div
                            className={cn(
                                "grid gap-4",
                                hideSectionMenus
                                    ? "grid-cols-1"
                                    : "md:grid-cols-[220px_minmax(0,1fr)]"
                            )}
                        >
                            {!hideSectionMenus ? (
                                <TabsList className="grid h-fit w-full grid-cols-1 gap-2 rounded-md border p-2">
                                    <TabsTrigger value="modules">Submenus</TabsTrigger>
                                    <TabsTrigger value="api-explorer">
                                        API Explorer
                                    </TabsTrigger>
                                    <TabsTrigger value="logs">Response Logs</TabsTrigger>
                                </TabsList>
                            ) : null}

                            <div className="min-w-0">
                            <TabsContent value="modules" className="mt-0 space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Dedicated module submenus for every major Unicommerce
                                    workflow in your brand dashboard.
                                </p>

                                <Tabs
                                    value={moduleTab}
                                    onValueChange={(value) =>
                                        setModuleTab(value as ModuleTabKey)
                                    }
                                    className="w-full"
                                >
                                    <div
                                        className={cn(
                                            "grid gap-3",
                                            hideSectionMenus
                                                ? "grid-cols-1"
                                                : "md:grid-cols-[220px_minmax(0,1fr)]"
                                        )}
                                    >
                                        {!hideSectionMenus ? (
                                            <TabsList className="grid h-fit w-full grid-cols-1 gap-2 rounded-md border p-2">
                                                <TabsTrigger value="authentication">
                                                    Authentication
                                                </TabsTrigger>
                                                <TabsTrigger value="inventory">
                                                    Inventory
                                                </TabsTrigger>
                                                <TabsTrigger value="orders">
                                                    Orders
                                                </TabsTrigger>
                                                <TabsTrigger value="returns">
                                                    Returns
                                                </TabsTrigger>
                                                <TabsTrigger value="catalog">
                                                    Catalog
                                                </TabsTrigger>
                                            </TabsList>
                                        ) : null}

                                        <div className="min-w-0 space-y-3 rounded-md border p-4">
                                            <TabsContent value="authentication" className="mt-0 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-lg font-semibold">
                                                        Authentication
                                                    </p>
                                                    <Badge
                                                        variant={
                                                            isTokenValid ? "secondary" : "outline"
                                                        }
                                                    >
                                                        {isTokenValid
                                                            ? "Integrated"
                                                            : "Needs Auth"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Authenticate with Unicommerce and view the
                                                    latest integration status in table format.
                                                </p>
                                                <div className="overflow-hidden rounded-md border">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                {getTableColumns(authenticationRows).map(
                                                                    (column) => (
                                                                        <TableHead key={column}>
                                                                            {column}
                                                                        </TableHead>
                                                                    )
                                                                )}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {authenticationRows.map((row, rowIndex) => (
                                                                <TableRow key={`auth-row-${rowIndex}`}>
                                                                    {getTableColumns(authenticationRows).map(
                                                                        (column) => (
                                                                            <TableCell key={column}>
                                                                                {formatCellValue(row[column])}
                                                                            </TableCell>
                                                                        )
                                                                    )}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        disabled={
                                                            isUnicommercePending ||
                                                            !unicommerceIntegrationQuery.data
                                                        }
                                                        onClick={() =>
                                                            authenticateUnicommerce({ brandId })
                                                        }
                                                    >
                                                        {isUnicommerceAuthPending ? (
                                                            <Spinner className="animate-spin" />
                                                        ) : null}
                                                        Authenticate & Store Token
                                                    </Button>
                                                </div>
                                            </TabsContent>

                                            {(
                                                ["inventory", "orders", "returns", "catalog"] as const
                                            ).map((tabKey) => {
                                                const moduleRows = toTableRows(
                                                    moduleResponsePayloads[tabKey]
                                                );
                                                const moduleColumns = getTableColumns(moduleRows);

                                                return (
                                                    <TabsContent
                                                        key={tabKey}
                                                        value={tabKey}
                                                        className="mt-0 space-y-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-lg font-semibold capitalize">
                                                                {tabKey}
                                                            </p>
                                                            <Badge variant="outline">
                                                                Dedicated Submenu
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Fetch {tabKey} data and view it in
                                                            table format.
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={
                                                                    isUnicommercePending ||
                                                                    loadingModuleTab === tabKey
                                                                }
                                                                onClick={() =>
                                                                    handleFetchModuleTable(tabKey)
                                                                }
                                                            >
                                                                {loadingModuleTab === tabKey ? (
                                                                    <Spinner className="animate-spin" />
                                                                ) : null}
                                                                Fetch {tabKey} Data
                                                            </Button>
                                                            {tabKey === "inventory" ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    disabled={
                                                                        isUnicommercePending ||
                                                                        !unicommerceIntegrationQuery.data
                                                                            ?.isActive
                                                                    }
                                                                    onClick={() =>
                                                                        runUnicommerceSync({
                                                                            brandId,
                                                                            updatedSinceMinutes:
                                                                                unicommerceForm.getValues(
                                                                                    "updatedSinceMinutes"
                                                                                ),
                                                                        })
                                                                    }
                                                                >
                                                                    Run Inventory Sync
                                                                </Button>
                                                            ) : null}
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={isUnicommercePending}
                                                                onClick={() =>
                                                                    openApiPreset({
                                                                        ...moduleApiPresets[tabKey],
                                                                        body: {
                                                                            ...moduleApiPresets[tabKey].body,
                                                                            updatedSinceInMinutes:
                                                                                unicommerceForm.getValues(
                                                                                    "updatedSinceMinutes"
                                                                                ),
                                                                        },
                                                                    })
                                                                }
                                                            >
                                                                Open API Preset
                                                            </Button>
                                                        </div>
                                                        <div className="overflow-x-auto rounded-md border">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        {moduleColumns.length > 0 ? (
                                                                            moduleColumns.map(
                                                                                (column) => (
                                                                                    <TableHead key={column}>
                                                                                        {column}
                                                                                    </TableHead>
                                                                                )
                                                                            )
                                                                        ) : (
                                                                            <TableHead>Data</TableHead>
                                                                        )}
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {moduleRows.length > 0 ? (
                                                                        moduleRows.map((row, rowIndex) => (
                                                                            <TableRow
                                                                                key={`${tabKey}-${rowIndex}`}
                                                                            >
                                                                                {moduleColumns.map(
                                                                                    (column) => (
                                                                                        <TableCell
                                                                                            key={column}
                                                                                            className="max-w-[280px] truncate align-top"
                                                                                            title={formatCellValue(
                                                                                                row[column]
                                                                                            )}
                                                                                        >
                                                                                            {formatCellValue(
                                                                                                row[column]
                                                                                            )}
                                                                                        </TableCell>
                                                                                    )
                                                                                )}
                                                                            </TableRow>
                                                                        ))
                                                                    ) : (
                                                                        <TableRow>
                                                                            <TableCell className="text-muted-foreground">
                                                                                No data fetched yet.
                                                                                Click &quot;Fetch{" "}
                                                                                {tabKey} Data&quot;.
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </TabsContent>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Tabs>
                            </TabsContent>

                            <TabsContent value="api-explorer" className="mt-0 space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Use this to call any Unicommerce endpoint now. This
                                    helps us integrate new features quickly without waiting for a
                                    full UI module build.
                                </p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-medium">Method</p>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={
                                                    apiMethod === "GET"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                disabled={isUnicommercePending}
                                                onClick={() => setApiMethod("GET")}
                                            >
                                                GET
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={
                                                    apiMethod === "POST"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                disabled={isUnicommercePending}
                                                onClick={() => setApiMethod("POST")}
                                            >
                                                POST
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-medium">Path</p>
                                        <Input
                                            value={apiPath}
                                            onChange={(e) => setApiPath(e.target.value)}
                                            placeholder="/services/rest/v1/..."
                                            disabled={isUnicommercePending}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-medium">Query JSON</p>
                                        <Textarea
                                            value={apiQueryJson}
                                            onChange={(e) =>
                                                setApiQueryJson(e.target.value)
                                            }
                                            rows={6}
                                            className="font-mono text-xs"
                                            disabled={isUnicommercePending}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-medium">Body JSON</p>
                                        <Textarea
                                            value={apiBodyJson}
                                            onChange={(e) =>
                                                setApiBodyJson(e.target.value)
                                            }
                                            rows={6}
                                            className="font-mono text-xs"
                                            disabled={
                                                isUnicommercePending || apiMethod !== "POST"
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            isUnicommercePending ||
                                            !unicommerceIntegrationQuery.data ||
                                            apiPath.trim().length === 0
                                        }
                                        onClick={handleRunApiRequest}
                                    >
                                        {isUnicommerceApiPending ? (
                                            <Spinner className="animate-spin" />
                                        ) : null}
                                        Run API Request
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="logs" className="mt-0">
                                <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                                    <p className="mb-2 text-sm font-semibold text-blue-900">
                                        Latest API / Auth Response
                                    </p>
                                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs text-blue-900">
                                        {JSON.stringify(
                                            apiResponsePayload ?? lastDebugPayload,
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>
                            </TabsContent>
                            </div>
                        </div>
                    </Tabs>
                ) : null}
            </CardContent>
        </Card>
    );
}
