import { InviteAcceptButton } from "@/components/globals/buttons";
import { GeneralShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { Spinner } from "@/components/ui/spinner";
import { brandInviteQueries } from "@/lib/db/queries";
import { brandCache, userCache } from "@/lib/redis/methods";
import { CachedUser, InviteWithBrand } from "@/lib/validations";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
    params: Promise<{ code: string }>;
}

export default function Page({ params }: PageProps) {
    return (
        <GeneralShell
            classNames={{
                mainWrapper: "flex-1 items-center min-h-screen",
                innerWrapper: "flex items-center justify-center",
            }}
        >
            <Suspense fallback={<Spinner />}>
                <InviteCodeFetch params={params} />
            </Suspense>
        </GeneralShell>
    );
}

async function InviteCodeFetch({ params }: PageProps) {
    const { userId } = await auth();
    if (!userId) return <UnauthorizedCard />;

    const existingUser = await userCache.get(userId);
    if (!existingUser) return <UnauthorizedCard />;

    const { code } = await params;

    const data = await brandInviteQueries.getBrandInvite(code);
    if (!data) return <InvalidInviteCard />;
    if (
        (data.maxUses !== 0 && data.uses >= data.maxUses) ||
        (data.expiresAt && new Date(data.expiresAt) < new Date())
    ) {
        await Promise.all([
            brandInviteQueries.deleteBrandInvite(data.brand.id, data.id),
            brandCache.remove(data.brand.id),
            userCache.remove(userId),
        ]);
        return <InvalidInviteCard />;
    }

    const existingBrand = await brandCache.get(data.brand.id);
    if (!existingBrand) return <InvalidInviteCard />;

    const bannedMember = existingBrand.bannedMembers.find(
        (member) => member.memberId === userId
    );
    if (bannedMember)
        return (
            <BannedMemberCard
                reason={bannedMember.reason ?? "No reason provided"}
            />
        );

    const isUserAlreadyMember = existingBrand.members.some(
        (member) => member.id === userId
    );
    if (isUserAlreadyMember)
        redirect(`/dashboard/brands/${data.brand.id}/invites`);

    return <ValidInviteCard user={existingUser} invite={data} />;
}

function BannedMemberCard({ reason }: { reason: string }) {
    return (
        <EmptyPlaceholder>
            <EmptyPlaceholderIcon>
                <Icons.Hammer className="size-10" />
            </EmptyPlaceholderIcon>

            <EmptyPlaceholderContent>
                <EmptyPlaceholderTitle>You were Banned</EmptyPlaceholderTitle>
                <EmptyPlaceholderDescription>
                    You have been banned from this brand for the following
                    reason: <strong>{reason}</strong>. Please contact the brand
                    administrator.
                </EmptyPlaceholderDescription>
            </EmptyPlaceholderContent>

            <Button asChild>
                <Link href="/">Go Back</Link>
            </Button>
        </EmptyPlaceholder>
    );
}

function UnauthorizedCard() {
    return (
        <EmptyPlaceholder>
            <EmptyPlaceholderIcon>
                <Icons.AlertTriangle className="size-10" />
            </EmptyPlaceholderIcon>

            <EmptyPlaceholderContent>
                <EmptyPlaceholderTitle>
                    Unauthorized Access
                </EmptyPlaceholderTitle>
                <EmptyPlaceholderDescription>
                    You need to be logged in to join a brand as a member. Please
                    login to continue.
                </EmptyPlaceholderDescription>
            </EmptyPlaceholderContent>

            <Button asChild>
                <Link href="/auth/signin">Login</Link>
            </Button>
        </EmptyPlaceholder>
    );
}

function InvalidInviteCard() {
    return (
        <EmptyPlaceholder>
            <EmptyPlaceholderIcon>
                <Icons.AlertTriangle className="size-10" />
            </EmptyPlaceholderIcon>

            <EmptyPlaceholderContent>
                <EmptyPlaceholderTitle>Invalid Invite</EmptyPlaceholderTitle>
                <EmptyPlaceholderDescription>
                    The invite link is invalid or expired. Please contact the
                    brand administrator.
                </EmptyPlaceholderDescription>
            </EmptyPlaceholderContent>

            <Button asChild>
                <Link href="/">Go Back</Link>
            </Button>
        </EmptyPlaceholder>
    );
}

function ValidInviteCard({
    user,
    invite,
}: {
    user: CachedUser;
    invite: InviteWithBrand;
}) {
    return (
        <EmptyPlaceholder>
            <EmptyPlaceholderIcon>
                <Icons.CircleCheck className="size-10" />
            </EmptyPlaceholderIcon>

            <EmptyPlaceholderContent>
                <EmptyPlaceholderTitle>
                    Invite from {invite.brand.name}
                </EmptyPlaceholderTitle>
                <EmptyPlaceholderDescription>
                    You have been invited to join {invite.brand.name} as a
                    member
                </EmptyPlaceholderDescription>
            </EmptyPlaceholderContent>

            <InviteAcceptButton user={user} invite={invite} />
        </EmptyPlaceholder>
    );
}
