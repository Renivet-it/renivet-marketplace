import { DashShell } from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-dash";

export default function Page() {
    return (
        <DashShell>
            <div className="flex w-full justify-center">
                <EmptyPlaceholder>
                    <EmptyPlaceholderIcon>
                        <Icons.AlertTriangle className="size-10" />
                    </EmptyPlaceholderIcon>

                    <EmptyPlaceholderContent>
                        <EmptyPlaceholderTitle>
                            Coming Soon
                        </EmptyPlaceholderTitle>
                        <EmptyPlaceholderDescription>
                            We&apos;re working on this feature. Check back
                            later.
                        </EmptyPlaceholderDescription>
                    </EmptyPlaceholderContent>
                </EmptyPlaceholder>
            </div>
            {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
            </div>

            <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}
        </DashShell>
    );
}
