// components/sustainable-badges.tsx
import { BadgeCheck, Leaf, Palette, Sprout } from "lucide-react";

const LogoSectionBadges = () => {
    return (
        <div className="bg-[#FCFBF4] px-4 py-12">
            <div className="mx-auto max-w-6xl">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* GOTS Certified */}
                    <div className="flex flex-col items-center">
                        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-white p-4 shadow-sm">
                            <BadgeCheck className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-center font-medium">
                            GOTS Certified
                        </h3>
                        <p className="text-center text-sm text-gray-600">
                            Organic Cotton
                        </p>
                    </div>

                    {/* Sustainable */}
                    <div className="flex flex-col items-center">
                        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-white p-4 shadow-sm">
                            <Leaf className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-center font-medium">Sustainable</h3>
                    </div>

                    {/* Eco-Friendly */}
                    <div className="flex flex-col items-center">
                        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-white p-4 shadow-sm">
                            <Sprout className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-center font-medium">
                            Eco-Friendly
                        </h3>
                    </div>

                    {/* Non-Reactive Dyes */}
                    <div className="flex flex-col items-center">
                        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-white p-4 shadow-sm">
                            <Palette className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-center font-medium">
                            Non-Reactive
                        </h3>
                        <p className="text-center text-sm text-gray-600">
                            Dyes
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function Page() {
    return (
        <div>
            {/* Use the component */}
            <LogoSectionBadges />
        </div>
    );
}
