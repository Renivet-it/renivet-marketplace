import {
    Footer,
    GeneralShell,
    NavbarHome,
    NavbarMob,
} from "@/components/globals/layouts";
import { Icons } from "@/components/icons";
import { SoonButtons } from "@/components/soon";
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
                                We&apos;re planting the seeds of a greener
                                future. 🌲
                            </p>

                            <p>
                                Our sustainable marketplace is under
                                construction, but we&apos;re working hard to
                                bring you a shopping experience that&apos;s kind
                                to the planet. 🌍
                            </p>

                            <p>
                                Stay tuned for a harvest of eco-friendly
                                products and ethical brands. 🌿
                            </p>

                            <p>
                                <strong>Join Our Community</strong>
                            </p>

                            <p>
                                Be the first to know when we launch and get
                                sustainable living tips. Sign up now!
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
