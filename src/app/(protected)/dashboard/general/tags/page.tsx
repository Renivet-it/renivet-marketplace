import { DashShell } from "@/components/globals/layouts";
import { TagManageModal } from "@/components/globals/modals";

export default function Page() {
    return (
        <DashShell>
            <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                    <div className="text-2xl font-semibold">Tags</div>
                    <p className="text-sm text-muted-foreground">
                        Manage tags for your blog posts
                    </p>
                </div>

                <TagManageModal />
            </div>
        </DashShell>
    );
}
