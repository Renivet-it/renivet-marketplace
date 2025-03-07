import { cn } from "@/lib/utils";
import { LucideProps } from "lucide-react";
import { Icons } from "../icons";

export function Spinner({ className, ...props }: LucideProps) {
    return (
        <Icons.Loader2
            className={cn("size-6 animate-spin", className)}
            {...props}
        />
    );
}
