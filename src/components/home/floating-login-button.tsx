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
                <div className="group relative">
                    {/* Continuous subtle pulse ring */}
                    <div className="absolute -inset-1 animate-pulse rounded-full bg-primary/30 opacity-70 blur-md transition-all duration-1000 group-hover:-inset-2 group-hover:bg-primary/40 group-hover:opacity-100 group-hover:duration-200" />

                    <button
                        className={cn(
                            "relative flex items-center gap-3.5 overflow-hidden rounded-full bg-primary p-2 pr-7 text-primary-foreground",
                            "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)]"
                        )}
                    >
                        {/* Shine effect */}
                        <div className="duration-[1200ms] absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform ease-out group-hover:translate-x-full" />

                        {/* Icon Container */}
                        <div className="relative flex size-[42px] items-center justify-center rounded-full bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-white/30">
                            <Icons.Sparkles className="size-[22px] text-white drop-shadow-md" />
                        </div>

                        {/* Text Container */}
                        <div className="relative flex flex-col items-start gap-1.5 pt-0.5 leading-[1.1]">
                            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/80">
                                Exclusive Access
                            </span>
                            <span className="font-outfit text-[15px] font-bold tracking-wide text-white drop-shadow-sm">
                                Join Renivet
                            </span>
                        </div>
                    </button>
                </div>
            </SignInButton>
        </div>
    );
}
