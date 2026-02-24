"use client";

import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { SignInButton, useAuth } from "@clerk/nextjs";

export function FloatingLoginButton() {
    const { isSignedIn, isLoaded } = useAuth();

    if (!isLoaded || isSignedIn) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 duration-700 animate-in fade-in slide-in-from-bottom-8">
            <SignInButton
                mode="modal"
                signUpFallbackRedirectUrl="/"
                forceRedirectUrl="/"
            >
                <button
                    className={cn(
                        "group relative flex items-center gap-3 overflow-hidden rounded-full bg-primary px-2 py-2 pr-6 text-primary-foreground",
                        "shadow-[0_10px_40px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_50px_rgba(0,0,0,0.4)]"
                    )}
                >
                    {/* Shine effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />

                    <div className="relative flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                        <Icons.User2 className="size-5" />
                    </div>

                    <div className="relative flex flex-col items-start gap-1 leading-none">
                        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary-foreground/80">
                            Join Renivet
                        </span>
                        <span className="text-sm font-bold tracking-wide">
                            Login / Signup
                        </span>
                    </div>
                </button>
            </SignInButton>
        </div>
    );
}
