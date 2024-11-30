"use client";

import { TableMember } from "@/components/dashboard/brands/members";
import { TableUser } from "@/components/dashboard/general/users";
import { Button } from "@/components/ui/button-dash";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import MultipleSelector from "@/components/ui/multi-select";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { UpdateUserRoles, updateUserRolesSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type SiteUserProps = {
    type: "site";
    user: TableUser;
};

type BrandUserProps = {
    type: "brand";
    user: TableMember;
    brandId: string;
};

type PageProps = SiteUserProps | BrandUserProps;

export function UserRoleManageForm({ ...props }: PageProps) {
    const router = useRouter();
    const { data: siteRolesRaw, isPending: isSiteRolesFetching } =
        trpc.general.roles.getRoles.useQuery(undefined, {
            enabled: props.type === "site",
        });

    const { data: brandRolesRaw, isPending: isBrandRolesFetching } =
        trpc.brands.roles.getRoles.useQuery(
            {
                id: props.type === "brand" ? props.brandId : "",
            },
            { enabled: props.type === "brand" }
        );

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch: refetchSite } = trpc.general.users.getUsers.useQuery(
        {
            page,
            limit,
            search,
        },
        { enabled: props.type === "site" }
    );

    const { refetch: refetchBrand } = trpc.brands.members.getMembers.useQuery({
        brandId: props.type === "brand" ? props.brandId : "",
        limit,
        page,
        search,
    });

    const form = useForm<UpdateUserRoles>({
        resolver: zodResolver(updateUserRolesSchema),
        defaultValues: {
            userId:
                props.type === "site" ? props.user.id : props.user.member.id,
            roleIds: props.user.roles.map((role) => role.id),
        },
    });

    const roles = useMemo(
        () =>
            (props.type === "site"
                ? siteRolesRaw?.map((role) => ({
                      label: role.name,
                      value: role.id,
                  }))
                : brandRolesRaw?.map((role) => ({
                      label: role.name,
                      value: role.id,
                  }))) ?? [],
        [brandRolesRaw, props.type, siteRolesRaw]
    );

    const { mutate: updateSiteRoles, isPending: isSiteUpdating } =
        trpc.general.users.roles.updateRoles.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating roles...");
                return { toastId };
            },
            onSuccess: (_, data, { toastId }) => {
                toast.success("Roles updated successfully", { id: toastId });
                refetchSite();
                router.refresh();
                form.reset(data);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateBrandRoles, isPending: isBrandUpdating } =
        trpc.brands.members.roles.updateRoles.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating roles...");
                return { toastId };
            },
            onSuccess: (_, data, { toastId }) => {
                toast.success("Roles updated successfully", { id: toastId });
                refetchBrand();
                router.refresh();
                form.reset(data);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-2"
                onSubmit={form.handleSubmit((data) =>
                    props.type === "site"
                        ? updateSiteRoles(data)
                        : updateBrandRoles(data)
                )}
            >
                <FormField
                    control={form.control}
                    name="roleIds"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Roles</FormLabel>

                            <FormControl>
                                <MultipleSelector
                                    commandProps={{
                                        label: "Add roles",
                                    }}
                                    disabled={
                                        roles.length === 0 ||
                                        isSiteUpdating ||
                                        isBrandUpdating ||
                                        (props.type === "site" &&
                                            isSiteRolesFetching) ||
                                        (props.type === "brand" &&
                                            isBrandRolesFetching)
                                    }
                                    defaultOptions={roles}
                                    value={
                                        roles.filter((role) =>
                                            field.value.includes(role.value)
                                        ) ?? []
                                    }
                                    onChange={(options) =>
                                        field.onChange(
                                            options.map(
                                                (option) => option.value
                                            )
                                        )
                                    }
                                    placeholder="Add roles"
                                    emptyIndicator={
                                        <p className="text-center text-sm">
                                            No results found
                                        </p>
                                    }
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button
                    className="w-full"
                    type="submit"
                    size="sm"
                    disabled={
                        isSiteUpdating ||
                        isBrandUpdating ||
                        !form.formState.isDirty
                    }
                >
                    Save Changes
                </Button>
            </form>
        </Form>
    );
}
