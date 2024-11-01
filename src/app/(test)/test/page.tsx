"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

export default function Page() {
    const { data } = trpc.users.currentUser.useQuery();

    const { mutate } = trpc.users.addRole.useMutation({
        onSuccess: () => {
            toast.success("Role added");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return data ? (
        <Button
            onClick={() =>
                mutate({
                    userId: data.id,
                    roleId: "ab7023db-2fb2-4200-94b4-1a0e7d8f6eec",
                })
            }
        >
            Add Role
        </Button>
    ) : (
        "Loading..."
    );
}
