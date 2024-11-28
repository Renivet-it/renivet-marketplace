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
import { brandPermissions, sitePermissions } from "@/config/permissions";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel, handleClientError } from "@/lib/utils";
import {
    CachedBrand,
    CachedRole,
    CreateRole,
    createRoleSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type SiteRoleProps = {
    type: "site";
    role?: CachedRole;
};

type BrandRoleProps = {
    type: "brand";
    role?: CachedBrand["roles"][number];
    brandId: string;
};

type PageProps = SiteRoleProps | BrandRoleProps;

export function RoleManageForm({ role, ...props }: PageProps) {
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
    const totalBrandPermissions = useMemo(
        () => brandPermissions.reduce((acc, curr) => acc | curr.bit, 0),
        []
    );

    const { refetch: siteRolesRefetch } =
        trpc.general.roles.getRoles.useQuery();
    const { refetch: brandRolesRefetch } =
        trpc.general.brands.getBrand.useQuery({
            id: props.type === "brand" ? props.brandId : "",
        });

    const { mutate: createSiteRole, isPending: isSiteRoleCreating } =
        trpc.general.roles.createRole.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating role...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Role created", { id: toastId });
                router.push("/dashboard/general/roles");
                siteRolesRefetch();
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateSiteRole, isPending: isSiteRoleUpdating } =
        trpc.general.roles.updateRole.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating role...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Role updated", { id: toastId });
                router.push("/dashboard/general/roles");
                siteRolesRefetch();
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: createBrandRole, isPending: isBrandRoleCreating } =
        trpc.brands.roles.createRole.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating role...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Role created", { id: toastId });
                router.push(
                    `/dashboard/brands/${props.type === "brand" && props.brandId}/roles`
                );
                brandRolesRefetch();
                router.refresh();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateBrandRole, isPending: isBrandRoleUpdating } =
        trpc.brands.roles.updateRole.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating role...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Role updated", { id: toastId });
                router.push(
                    `/dashboard/brands/${props.type === "brand" && props.brandId}/roles`
                );
                brandRolesRefetch();
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
                        ? props.type === "brand"
                            ? updateBrandRole({
                                  brandId: props.brandId,
                                  roleId: role.id,
                                  data: values,
                              })
                            : updateSiteRole({ id: role.id, data: values })
                        : props.type === "brand"
                          ? createBrandRole({
                                ...values,
                                brandId: props.brandId,
                            })
                          : createSiteRole(values)
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
                                    disabled={
                                        isSiteRoleCreating ||
                                        isSiteRoleUpdating ||
                                        isBrandRoleCreating ||
                                        isBrandRoleUpdating
                                    }
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                {props.type === "site" && (
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
                                        disabled={
                                            isSiteRoleCreating ||
                                            isSiteRoleUpdating ||
                                            isBrandRoleCreating ||
                                            isBrandRoleUpdating
                                        }
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
                                                            permission.bit ===
                                                                1) ||
                                                        (+form.watch(
                                                            "brandPermissions"
                                                        ) > 0 &&
                                                            permission.bit ===
                                                                1) ||
                                                        isSiteRoleCreating ||
                                                        isSiteRoleUpdating ||
                                                        isBrandRoleCreating ||
                                                        isBrandRoleUpdating
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) => {
                                                        let value = checked
                                                            ? +field.value |
                                                              permission.bit
                                                            : +field.value ^
                                                              permission.bit;

                                                        if (
                                                            checked &&
                                                            !(value & 1)
                                                        )
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
                )}

                {props.type === "brand" && (
                    <FormField
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
                                        disabled={
                                            isSiteRoleCreating ||
                                            isSiteRoleUpdating ||
                                            isBrandRoleCreating ||
                                            isBrandRoleUpdating
                                        }
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
                                                    disabled={
                                                        isSiteRoleCreating ||
                                                        isSiteRoleUpdating ||
                                                        isBrandRoleCreating ||
                                                        isBrandRoleUpdating
                                                    }
                                                    onCheckedChange={(
                                                        checked
                                                    ) => {
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
                    />
                )}

                <Button
                    type="submit"
                    disabled={
                        isSiteRoleCreating ||
                        isSiteRoleUpdating ||
                        isBrandRoleCreating ||
                        isBrandRoleUpdating ||
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
