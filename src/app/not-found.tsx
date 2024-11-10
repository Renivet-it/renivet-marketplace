import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen flex-col">
            <NavbarHome />
            <main className="flex flex-1 flex-col">
                <GeneralShell
                    classNames={{
                        mainWrapper: "flex-1 items-center",
                        innerWrapper: "flex items-center justify-center",
                    }}
                >
                    <EmptyPlaceholder>
                        <EmptyPlaceholderIcon>
                            <Icons.AlertTriangle className="size-10" />
                        </EmptyPlaceholderIcon>

                        <EmptyPlaceholderContent>
                            <EmptyPlaceholderTitle>
                                Page Not Found
                            </EmptyPlaceholderTitle>

                            <EmptyPlaceholderDescription>
                                The page you are looking for might have been
                                removed, had its name changed, or is temporarily
                                unavailable.
                            </EmptyPlaceholderDescription>
                        </EmptyPlaceholderContent>

                        <Button asChild>
                            <Link href="/">Go to Home</Link>
                        </Button>
                    </EmptyPlaceholder>
                </GeneralShell>
            </main>
            <Footer />
            <NavbarMob />
        </div>
    );
}
