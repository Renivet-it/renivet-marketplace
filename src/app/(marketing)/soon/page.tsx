import { SoonButtons } from "@/components/soon";
import { BackgroundLines } from "@/components/ui/background-lines";
import { Spotlight } from "@/components/ui/spotlight";
import Link from "next/link";

export default function Page() {
    return (
        <BackgroundLines className="light relative flex w-full flex-col items-center justify-center px-4">
            <Spotlight
                className="-top-40 left-0 md:-top-20 md:left-60"
                fill="white"
            />

            <div className="relative z-40 w-full max-w-lg space-y-5 overflow-hidden rounded-xl border border-background/10 bg-white/10 p-6 backdrop-blur-md backdrop-saturate-150 md:p-10">
                <div className="absolute -right-14 top-8 z-10 w-56 rotate-45">
                    <div className="relative">
                        <div className="absolute -left-2 -top-2 size-2 bg-red-800" />
                        <div className="absolute -right-2 -top-2 size-2 bg-red-800" />
                        <div className="bg-red-600 py-1 text-center text-sm font-bold text-white shadow-md">
                            Coming Soon
                        </div>
                    </div>
                </div>

                <Link className="text-2xl font-semibold md:text-4xl" href="/">
                    Renivet Marketplace
                </Link>

                <div className="space-y-5 text-sm text-background/90">
                    <p>
                        Hi, we are <strong>Renivet</strong>, a marketplace for
                        all your clothing needs. We are currently working on our
                        website, and we will be back soon. Till then, feel free
                        to join our waitlist, or if you are a seller, you can
                        join our seller program.
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
        </BackgroundLines>
    );
}
