import { cn } from "@/lib/utils";
import { Icons } from "../icons";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface StatCardProps {
    title: string;
    value: string;
    description?: string;
    icon: keyof typeof Icons;
    change?: number;
}

export function StatCard({
    title,
    value,
    description,
    icon,
    change,
}: StatCardProps) {
    const Icon = Icons[icon];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || change !== undefined) && (
                    <div className="flex items-center gap-2">
                        {change !== undefined && (
                            <span
                                className={cn(
                                    "text-xs",
                                    change > 0
                                        ? "text-green-500"
                                        : change < 0
                                          ? "text-red-500"
                                          : "text-muted-foreground"
                                )}
                            >
                                {change > 0 ? "+" : ""}
                                {change}%
                            </span>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
