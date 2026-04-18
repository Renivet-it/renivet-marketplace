"use client";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button-dash";
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
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const unicommerceIntegrationSchema = z
    .object({
        baseUrl: z.string().trim().optional(),
        tenant: z.string().trim().optional(),
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
    })
    .superRefine((values, ctx) => {
        const hasBaseUrl = Boolean(values.baseUrl?.trim());
        const hasTenant = Boolean(values.tenant?.trim());

        if (!hasBaseUrl && !hasTenant) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Provide either Base URL or Tenant",
                path: ["baseUrl"],
            });
        }
    });

type UnicommerceIntegrationForm = z.infer<typeof unicommerceIntegrationSchema>;

interface UnicommerceSettingsFormProps {
    brandId: string;
}

export function UnicommerceSettingsForm({
    brandId,
}: UnicommerceSettingsFormProps) {
    const unicommerceForm = useForm<UnicommerceIntegrationForm>({
        resolver: zodResolver(unicommerceIntegrationSchema),
        defaultValues: {
            baseUrl: "",
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
            baseUrl: integration.baseUrl ?? "",
            tenant: integration.tenant ?? "",
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

    const { mutate: testUnicommerce, isPending: isUnicommerceTestPending } =
        trpc.brands.brands.testUnicommerceIntegration.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Testing Unicommerce connection...");
                return { toastId };
            },
            onSuccess: (data, _, ctx) => {
                toast.success(
                    `Connection successful. ${data.fetchedSnapshots} inventory records fetched.`,
                    { id: ctx?.toastId }
                );
            },
            onError: (err, _, ctx) => handleClientError(err, ctx?.toastId),
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

    const isUnicommercePending =
        isUnicommerceSavePending ||
        isUnicommerceTestPending ||
        isUnicommerceSyncPending ||
        unicommerceIntegrationQuery.isFetching;

    const handleUnicommerceSubmit = (values: UnicommerceIntegrationForm) => {
        const trimmedPassword = values.password?.trim() ?? "";

        saveUnicommerceIntegration({
            brandId,
            baseUrl: values.baseUrl?.trim() || undefined,
            tenant: values.tenant?.trim() || undefined,
            facilityId: values.facilityId?.trim() || undefined,
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
                    inventory products into Renivet using OAuth authentication.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm md:grid-cols-3">
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
                </div>

                {unicommerceIntegrationQuery.data?.lastError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        Last error: {unicommerceIntegrationQuery.data.lastError}
                    </p>
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
                                name="baseUrl"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>
                                            Base URL (optional)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="https://tenant.unicommerce.com"
                                                disabled={isUnicommercePending}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Use your Unicommerce domain, or set
                                            Tenant below to auto-build it.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={unicommerceForm.control}
                                name="tenant"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tenant (optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="your-tenant (without .unicommerce.com)"
                                                disabled={isUnicommercePending}
                                            />
                                        </FormControl>
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
            </CardContent>
        </Card>
    );
}
