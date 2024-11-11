"use client";

import { Button } from "@/components/ui/button-dash";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import { Switch } from "@/components/ui/switch";
import { sitePermissions } from "@/config/permissions";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel, handleClientError } from "@/lib/utils";
import { CachedRole, CreateRole, createRoleSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    role?: CachedRole;
}

export function RoleManageForm({ role }: PageProps) {
    const router = useRouter();

    const form = useForm<CreateRole>({
        resolver: zodResolver(createRoleSchema),
        defaultValues: {
            name: role?.name ?? "",
            sitePermissions: role?.sitePermissions ?? "0",
            brandPermissions: role?.brandPermissions ?? "0",
        },
    });

    const totalSitePermissions = useMemo(
        () => sitePermissions.reduce((acc, curr) => acc | curr.bit, 0),
        []
    );

    const { refetch } = trpc.roles.getRoles.useQuery();

    const { mutate: createRole, isPending: isRoleCreating } =
        trpc.roles.createRole.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating role...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Role created", { id: toastId });
                router.push("/dashboard/general/roles");
                refetch();
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateRole, isPending: isRoleUpdating } =
        trpc.roles.updateRole.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating role...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Role updated", { id: toastId });
                router.push("/dashboard/general/roles");
                refetch();
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) =>
                    role
                        ? updateRole({ id: role.id, data: values })
                        : createRole(values)
                )}
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter the role name"
                                    disabled={isRoleCreating || isRoleUpdating}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="sitePermissions"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between gap-2">
                                <FormLabel>Site Permissions</FormLabel>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    disabled={isRoleCreating || isRoleUpdating}
                                    onClick={() => {
                                        field.onChange(
                                            +field.value ===
                                                totalSitePermissions
                                                ? 0
                                                : totalSitePermissions
                                        );
                                    }}
                                >
                                    {+field.value === totalSitePermissions
                                        ? "Deselect All"
                                        : "Select All"}
                                </Button>
                            </div>

                            <FormControl>
                                <div className="space-y-2">
                                    {sitePermissions.map((permission) => (
                                        <div
                                            key={permission.bit}
                                            className="flex items-center justify-between gap-5 rounded-md bg-muted p-5"
                                        >
                                            <div className="space-y-1">
                                                <p>
                                                    {convertValueToLabel(
                                                        permission.name
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {permission.description}
                                                </p>
                                            </div>

                                            <Switch
                                                checked={
                                                    (+field.value &
                                                        permission.bit) ===
                                                    permission.bit
                                                }
                                                disabled={
                                                    (+field.value > 1 &&
                                                        permission.bit === 1) ||
                                                    (+form.watch(
                                                        "brandPermissions"
                                                    ) > 0 &&
                                                        permission.bit === 1) ||
                                                    isRoleCreating ||
                                                    isRoleUpdating
                                                }
                                                onCheckedChange={(checked) => {
                                                    let value = checked
                                                        ? +field.value |
                                                          permission.bit
                                                        : +field.value ^
                                                          permission.bit;

                                                    if (checked && !(value & 1))
                                                        value |= 1;

                                                    field.onChange(
                                                        value.toString()
                                                    );
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* <FormField
                    control={form.control}
                    name="brandPermissions"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between gap-2">
                                <FormLabel>Brand Permissions</FormLabel>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    disabled={isRoleCreating}
                                    onClick={() => {
                                        field.onChange(
                                            +field.value ===
                                                totalBrandPermissions
                                                ? 0
                                                : totalBrandPermissions
                                        );
                                    }}
                                >
                                    {+field.value === totalBrandPermissions
                                        ? "Deselect All"
                                        : "Select All"}
                                </Button>
                            </div>

                            <FormControl>
                                <div className="space-y-2">
                                    {brandPermissions.map((permission) => (
                                        <div
                                            key={permission.bit}
                                            className="flex items-center justify-between gap-5 rounded-md bg-muted p-6"
                                        >
                                            <div className="space-y-1">
                                                <p>
                                                    {convertValueToLabel(
                                                        permission.name
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {permission.description}
                                                </p>
                                            </div>

                                            <Switch
                                                checked={
                                                    (+field.value &
                                                        permission.bit) ===
                                                    permission.bit
                                                }
                                                disabled={isRoleCreating}
                                                onCheckedChange={(checked) => {
                                                    const value = checked
                                                        ? +field.value |
                                                          permission.bit
                                                        : +field.value ^
                                                          permission.bit;

                                                    if (checked)
                                                        form.setValue(
                                                            "sitePermissions",
                                                            (
                                                                +form.watch(
                                                                    "sitePermissions"
                                                                ) | 1
                                                            ).toString()
                                                        );

                                                    field.onChange(
                                                        value.toString()
                                                    );
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                /> */}

                <Button
                    type="submit"
                    disabled={
                        isRoleCreating ||
                        isRoleUpdating ||
                        !form.formState.isDirty
                    }
                    className="w-full"
                >
                    {role ? "Update Role" : "Create Role"}
                </Button>
            </form>
        </Form>
    );
}
