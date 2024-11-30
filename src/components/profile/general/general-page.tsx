"use client";

import {
    UserEmailUpdateForm,
    UserGeneralUpdateForm,
    UserPhoneUpdateForm,
} from "@/components/globals/forms";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export function GeneralPage({ className, ...props }: GenericProps) {
    const { data: user } = trpc.general.users.currentUser.useQuery();
    if (!user) return null;

    return (
        <div className={cn("space-y-5", className)} {...props}>
            <Card className="w-full rounded-none">
                <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>
                        Update your personal details and preferences
                    </CardDescription>
                </CardHeader>

                <UserGeneralUpdateForm user={user} />
            </Card>

            <Card className="w-full rounded-none">
                <CardContent className="space-y-6 pt-6">
                    <UserEmailUpdateForm user={user} />
                    <UserPhoneUpdateForm user={user} />
                </CardContent>
            </Card>
        </div>
    );
}
