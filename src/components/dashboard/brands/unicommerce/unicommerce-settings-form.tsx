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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
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
}

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
    const [mainTab, setMainTab] = useState("modules");
    const [moduleTab, setModuleTab] = useState("authentication");

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

                <Separator />

                <Tabs
                    value={mainTab}
                    onValueChange={setMainTab}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="modules">Submenus</TabsTrigger>
                        <TabsTrigger value="api-explorer">API Explorer</TabsTrigger>
                        <TabsTrigger value="logs">Response Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="modules" className="mt-4 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Dedicated module submenus for every major Unicommerce
                            workflow in your brand dashboard.
                        </p>

                        <Tabs
                            value={moduleTab}
                            onValueChange={setModuleTab}
                            className="w-full"
                        >
                            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 md:grid-cols-5">
                                <TabsTrigger value="authentication">
                                    Authentication
                                </TabsTrigger>
                                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                                <TabsTrigger value="orders">Orders</TabsTrigger>
                                <TabsTrigger value="returns">Returns</TabsTrigger>
                                <TabsTrigger value="catalog">Catalog</TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="authentication"
                                className="mt-4 rounded-md border p-4"
                            >
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-lg font-semibold">
                                        Authentication
                                    </p>
                                    <Badge
                                        variant={isTokenValid ? "secondary" : "outline"}
                                    >
                                        {isTokenValid ? "Integrated" : "Needs Auth"}
                                    </Badge>
                                </div>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Authenticate with Unicommerce and store token in
                                    your integration record.
                                </p>
                                <div className="grid gap-3 text-sm md:grid-cols-3">
                                    <div className="rounded-md border p-3">
                                        <p className="text-muted-foreground">
                                            Token Status
                                        </p>
                                        <p className="font-medium">
                                            {isTokenValid ? "Valid" : "Invalid / Missing"}
                                        </p>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="text-muted-foreground">
                                            Expires At
                                        </p>
                                        <p className="font-medium">
                                            {tokenExpiry
                                                ? tokenExpiry.toLocaleString()
                                                : "Not available"}
                                        </p>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="text-muted-foreground">
                                            Refresh Token
                                        </p>
                                        <p className="font-medium">
                                            {unicommerceIntegrationQuery.data
                                                ?.accessTokenExpiresAt
                                                ? "Available"
                                                : "Unknown"}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            isUnicommercePending ||
                                            !unicommerceIntegrationQuery.data
                                        }
                                        onClick={() => authenticateUnicommerce({ brandId })}
                                    >
                                        {isUnicommerceAuthPending ? (
                                            <Spinner className="animate-spin" />
                                        ) : null}
                                        Authenticate & Store Token
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="inventory"
                                className="mt-4 rounded-md border p-4"
                            >
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-lg font-semibold">Inventory</p>
                                    <Badge variant="secondary">Integrated</Badge>
                                </div>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Inventory sync and snapshot workflows.
                                </p>
                                <div className="flex flex-wrap gap-2">
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
                                        Run Inventory Sync
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isUnicommercePending}
                                        onClick={() =>
                                            openApiPreset({
                                                method: "POST",
                                                path: "/services/rest/v1/inventory/inventorySnapshot/get",
                                                body: {
                                                    updatedSinceInMinutes:
                                                        unicommerceForm.getValues(
                                                            "updatedSinceMinutes"
                                                        ),
                                                },
                                            })
                                        }
                                    >
                                        Open Inventory API Preset
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent
                                value="orders"
                                className="mt-4 rounded-md border p-4"
                            >
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-lg font-semibold">Orders</p>
                                    <Badge variant="outline">Dedicated Submenu</Badge>
                                </div>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Order operations with ready-to-edit endpoint preset.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isUnicommercePending}
                                    onClick={() =>
                                        openApiPreset({
                                            method: "POST",
                                            path: "/services/rest/v1/oms/saleOrder/search",
                                            body: {
                                                saleOrderCode: "",
                                                updatedSinceInMinutes: 60,
                                            },
                                        })
                                    }
                                >
                                    Open Orders API Preset
                                </Button>
                            </TabsContent>

                            <TabsContent
                                value="returns"
                                className="mt-4 rounded-md border p-4"
                            >
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-lg font-semibold">Returns</p>
                                    <Badge variant="outline">Dedicated Submenu</Badge>
                                </div>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Reverse logistics and return-related API operations.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isUnicommercePending}
                                    onClick={() =>
                                        openApiPreset({
                                            method: "POST",
                                            path: "/services/rest/v1/returns/search",
                                            body: {
                                                updatedSinceInMinutes: 60,
                                            },
                                        })
                                    }
                                >
                                    Open Returns API Preset
                                </Button>
                            </TabsContent>

                            <TabsContent
                                value="catalog"
                                className="mt-4 rounded-md border p-4"
                            >
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="text-lg font-semibold">Catalog</p>
                                    <Badge variant="outline">Dedicated Submenu</Badge>
                                </div>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Product and catalog APIs for sync or audit actions.
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isUnicommercePending}
                                    onClick={() =>
                                        openApiPreset({
                                            method: "POST",
                                            path: "/services/rest/v1/catalog/product/search",
                                            body: {
                                                updatedSinceInMinutes: 60,
                                            },
                                        })
                                    }
                                >
                                    Open Catalog API Preset
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    <TabsContent value="api-explorer" className="mt-4 space-y-3">
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

                    <TabsContent value="logs" className="mt-4">
                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                            <p className="mb-2 text-sm font-semibold text-blue-900">
                                Latest API / Auth Response
                            </p>
                            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs text-blue-900">
                                {JSON.stringify(apiResponsePayload ?? lastDebugPayload, null, 2)}
                            </pre>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
