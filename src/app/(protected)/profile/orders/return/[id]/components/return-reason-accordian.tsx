"use client";

import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useReturnStore } from "@/lib/store/return-store";
import { returnOrderPhaseOne } from "@/lib/store/validation/return-store-validation";
import { cn } from "@/lib/utils";
import { useCallback, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { ZodError } from "zod";

interface Props extends GenericProps {
    className?: string;
    setValidator: (fn: () => boolean) => void;
}

const reasons = [
    {
        id: "1",
        title: "Wrong item delivered",
        children: [
            { id: "1-1", title: "Wrong size" },
            { id: "1-2", title: "Wrong color" },
        ],
    },
    {
        id: "2",
        title: "Product damaged",
        children: [
            { id: "2-1", title: "Packaging damaged" },
            { id: "2-2", title: "Product broken" },
        ],
    },
];

export default function ReturnReasonsAccordion({
    className,
    setValidator,
    ...props
}: Props) {
    const [openId, setOpenId] = useState<string | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [comment, setComment] = useState<string>("");

    const selectedReturnItem = useReturnStore((s) => s.selectedReturnItem);
    const setReturnItemPayload = useReturnStore((s) => s.setReturnItemPayload);

    const clickedReason = reasons.find((r) => r.id === openId);
    const otherReasons = reasons.filter((r) => r.id !== openId);

    const validate = useCallback(() => {
        try {
            const payload = {
                orderId: selectedReturnItem?.orderId ?? "",
                reasonId: openId ?? "",
                subReasonId: selectedChildId ?? "",
                comments: comment.trim(),
            };
            returnOrderPhaseOne.parse(payload);
            setReturnItemPayload(payload);
            return true;
        } catch (err) {
            if (err instanceof ZodError) {
                const errorMessages = err.errors.map((e) => e.message);
                errorMessages.forEach((msg) => toast.error(msg));
            } else {
                toast.error("Unexpected error occurred during validation");
            }
            return false;
        }
    }, [
        selectedReturnItem?.orderId,
        openId,
        selectedChildId,
        comment,
        setReturnItemPayload,
    ]);

    useLayoutEffect(() => {
        setValidator(validate);
    }, [validate, setValidator]);

    return (
        <>
            <div className="text-center">
                <h2 className="text-lg font-semibold">
                    Select a Return Reason
                </h2>
                <p className="text-sm text-muted-foreground">
                    Please select a reason for returning your item.
                </p>
            </div>
            <div className={cn("flex flex-col gap-4", className)}>
                {clickedReason && (
                    <div key={clickedReason.id}>
                        <Card
                            onClick={() => {
                                setOpenId(null);
                                setSelectedChildId(null);
                            }}
                            className="w-full cursor-pointer px-4 py-6 text-center transition-all"
                            style={{ alignContent: "center" }}
                        >
                            <div className="text-lg font-semibold">
                                {clickedReason.title}
                            </div>
                            {clickedReason.children?.length > 0 && (
                                <div className="mt-4 space-y-2 pl-4 pt-2 text-left">
                                    {clickedReason.children.map((child) => {
                                        const isSelected =
                                            selectedChildId === child.id;

                                        return (
                                            <Card
                                                key={child.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedChildId(
                                                        child.id
                                                    );
                                                }}
                                                className={cn(
                                                    "flex cursor-pointer items-center gap-2 border px-4 py-2 text-sm transition-colors",
                                                    isSelected
                                                        ? "border-green-500"
                                                        : "border-muted"
                                                )}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={(
                                                        checked
                                                    ) => {
                                                        setSelectedChildId(
                                                            checked
                                                                ? child.id
                                                                : null
                                                        );
                                                    }}
                                                />
                                                <span>{child.title}</span>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="mt-4 px-4 text-left">
                                <label className="mb-1 block text-sm font-medium">
                                    Additional Comments
                                </label>
                                <textarea
                                    onClick={(e) => e.stopPropagation()}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Add any extra details here..."
                                />
                            </div>
                        </Card>
                    </div>
                )}
                <div className="flex gap-4">
                    {otherReasons.map((reason) => (
                        <Card
                            key={reason.id}
                            onClick={() => {
                                setOpenId(reason.id);
                                setSelectedChildId(null);
                            }}
                            className="h-52 w-64 cursor-pointer text-wrap text-center transition-all hover:bg-accent"
                            style={{ alignContent: "center" }}
                        >
                            <div className="flex h-full items-center justify-center font-semibold">
                                {reason.title}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}
