"use client";

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
import { TableUser } from "./users-table";

interface PageProps {
    user: TableUser;
}

export function UserRoleManageForm({ user }: PageProps) {
    const router = useRouter();
    const { data: rolesRaw, isPending: isRolesFetching } =
        trpc.roles.getRoles.useQuery();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch } = trpc.users.getUsers.useQuery({ page, limit, search });

    const form = useForm<UpdateUserRoles>({
        resolver: zodResolver(updateUserRolesSchema),
        defaultValues: {
            userId: user.id,
            roleIds: user.roles.map((role) => role.id),
        },
    });

    const roles = useMemo(
        () =>
            rolesRaw?.map((role) => ({
                label: role.name,
                value: role.id,
            })) ?? [],
        [rolesRaw]
    );

    const { mutate: updateRoles, isPending: isUpdating } =
        trpc.users.updateRoles.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating roles...");
                return { toastId };
            },
            onSuccess: (_, data, { toastId }) => {
                toast.success("Roles updated successfully", { id: toastId });
                refetch();
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
                onSubmit={form.handleSubmit((data) => updateRoles(data))}
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
                                        isUpdating ||
                                        isRolesFetching
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
                    disabled={isUpdating || !form.formState.isDirty}
                >
                    Save Changes
                </Button>
            </form>
        </Form>
    );
}
