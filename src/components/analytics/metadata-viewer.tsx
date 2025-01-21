import { cn, convertValueToLabel } from "@/lib/utils";

interface MetadataViewerProps {
    data: unknown;
    parentKey?: string;
    depth?: number;
}

export function MetadataViewer({
    data,
    parentKey,
    depth = 0,
}: MetadataViewerProps) {
    if (data === null || data === undefined) return null;

    // Handle primitive types
    if (typeof data !== "object") {
        return (
            <div className="flex items-center gap-2">
                {parentKey && (
                    <span className="font-medium">
                        {convertValueToLabel(parentKey)}:
                    </span>
                )}
                <span>{String(data)}</span>
            </div>
        );
    }

    // Handle arrays
    if (Array.isArray(data)) {
        return (
            <div>
                {parentKey && (
                    <span className="font-medium">
                        {convertValueToLabel(parentKey)}:
                    </span>
                )}
                <div className="space-y-4 pl-4">
                    {data.map((item, index) => (
                        <MetadataViewer
                            key={index}
                            data={item}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Handle objects
    return (
        <div className={cn(depth > 0 && "pl-4")}>
            {parentKey && depth === 0 && (
                <span className="font-medium">
                    {convertValueToLabel(parentKey)}:
                </span>
            )}
            {Object.entries(data).map(([key, value]) => (
                <MetadataViewer
                    key={key}
                    data={value}
                    parentKey={key}
                    depth={depth + 1}
                />
            ))}
        </div>
    );
}
