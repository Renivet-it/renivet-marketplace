"use client";

import { cn } from "@/lib/utils";
import { Icons } from "../icons";

export function Expectations({ className, ...props }: GenericProps) {
    return (
        <section
            className={cn(
                "flex justify-center px-4 py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-5xl space-y-5 md:space-y-10 xl:max-w-[100rem]">
                <div className="flex flex-col items-center gap-2 text-balance text-center">
                    <h2 className="text-2xl font-semibold uppercase md:text-3xl">
                        What to Expect
                    </h2>
                    <p className="text-sm text-muted-foreground md:text-base">
                        We team up with forward-thinking brands to bring you an
                        unparalleled journey of each product, from inception to
                        your wardrobe. Our unique approach ensures that
                        you&apos;re not just buying a product, but also
                        investing in its journey, values, and impact on our
                        planet.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <ExpectationCard
                        icon="Leaf"
                        title="Trace Every Material"
                        description="Know the story behind every piece you wear."
                    />
                    <ExpectationCard
                        icon="Heart"
                        title="Your Purchase Matters"
                        description="So go beyond the tag"
                    />
                    <ExpectationCard
                        icon="Footprints"
                        title="Celebrate Values"
                        description="Wear what you value"
                    />
                </div>
            </div>
        </section>
    );
}

function ExpectationCard({
    icon,
    title,
    description,
}: {
    icon: keyof typeof Icons;
    title: string;
    description: string;
}) {
    const Icon = Icons[icon];

    return (
        <div className="flex flex-col items-center space-y-4 bg-muted p-6 py-10 text-center">
            <div className="text-primary">
                {/* @ts-expect-error */}
                <Icon className="size-8" />
            </div>

            <div className="space-y-2">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
