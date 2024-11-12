import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { SoonButtons } from "@/components/soon";
import { BackgroundLines } from "@/components/ui/background-lines";
import { Button } from "@/components/ui/button-general";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
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
                    <div className="relative z-40 w-full max-w-lg space-y-5 overflow-hidden rounded-xl border border-foreground/10 bg-card p-6 backdrop-blur-md backdrop-saturate-150 md:p-10">
                        <Image
                            src="https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnIa23JCMNOTfvUJtRrZ9XiwSk2monHj76zesu"
                            alt="Renivet Marketplace"
                            width={1000}
                            height={1000}
                            className="absolute left-0 top-0 -z-10 size-full object-cover"
                        />

                        <Link
                            className="text-2xl font-semibold md:text-4xl"
                            href="/"
                        >
                            Renivet Marketplace
                        </Link>

                        <Button
                            className="absolute -top-2 right-2 size-6 rounded-full"
                            size="icon"
                            variant="ghost"
                            asChild
                        >
                            <Link href="/">
                                <Icons.X className="size-4" />
                                <span className="sr-only">Go Back</span>
                            </Link>
                        </Button>

                        <div className="space-y-5 text-sm">
                            <p>
                                Hi, we are <strong>Renivet</strong>, a
                                marketplace for all your clothing needs. We are
                                currently working on our website, and we will be
                                back soon. Till then, feel free to join our
                                waitlist, or if you are a seller, you can join
                                our seller program.
                            </p>

                            <p>
                                We are excited to see you soon! Thanks for your
                                patience.
                            </p>

                            <p className="text-end">
                                From the team
                                <br />@<strong>Renivet</strong>
                            </p>
                        </div>

                        <SoonButtons />
                    </div>
                </GeneralShell>
            </main>
            <Footer />
            <NavbarMob />
        </div>
    );
}
