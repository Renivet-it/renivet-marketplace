"use client";

import { UserPasswordUpdateForm } from "@/components/globals/forms";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export function SecurityPage({ className, ...props }: GenericProps) {
    const { data: user } = trpc.general.users.currentUser.useQuery();
    if (!user) return null;

    return (
        <div className={cn("space-y-5", className)} {...props}>
            <Card className="w-full rounded-none">
                <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                    <CardDescription>
                        Update your password and security settings
                    </CardDescription>
                </CardHeader>

                <UserPasswordUpdateForm />
            </Card>
        </div>
    );
}
