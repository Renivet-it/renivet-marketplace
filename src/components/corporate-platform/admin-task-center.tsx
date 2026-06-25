"use client";

import {
    AdminPanel,
    EmptyQueue,
    StatusBadge,
} from "@/components/corporate-platform/admin-design";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function AdminTaskCenter({ initialTasks }: { initialTasks: any[] }) {
    const utils = trpc.useUtils();
    const [search, setSearch] = useState("");
    const [draft, setDraft] = useState({
        taskType: "review_rfq",
        entityType: "rfq",
        entityId: "",
        dueDate: "",
        priority: "medium" as "low" | "medium" | "high" | "critical",
        notes: "",
    });

    const createTask = trpc.general.corporatePlatform.createTask.useMutation({
        onSuccess: async () => {
            toast.success("Task created");
            await utils.general.corporatePlatform.listAdminTasks.invalidate();
        },
        onError: (error) => handleClientError(error),
    });

    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return initialTasks;
        return initialTasks.filter((task) =>
            [task.taskType, task.entityType, task.status, task.priority, task.notes]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [initialTasks, search]);

    return (
        <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
                <AdminPanel
                    title="Operational Task Queue"
                    description="Search and scan active work across requests for quotation, finance, quality control, dispatch, and escalations."
                    actions={
                        <div className="w-full md:w-72">
                            <Input
                                placeholder="Search task type, entity, priority, or notes"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    }
                >
                    {filteredTasks.length ? (
                        <div className="space-y-4">
                            {filteredTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
                                >
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge tone={task.status === "open" ? "blue" : "slate"}>
                                            {toLabel(task.status)}
                                        </StatusBadge>
                                        <StatusBadge
                                            tone={
                                                task.priority === "critical" || task.priority === "high"
                                                    ? "amber"
                                                    : "slate"
                                            }
                                        >
                                            {toLabel(task.priority)}
                                        </StatusBadge>
                                        <StatusBadge tone="slate">
                                            {toLabel(task.entityType)}
                                        </StatusBadge>
                                    </div>
                                    <div className="mt-3 text-lg font-semibold text-slate-900">
                                        {toLabel(task.taskType)}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">
                                        Entity reference {task.entityId}
                                        {task.dueDate ? ` • Due ${task.dueDate}` : " • No due date"}
                                    </div>
                                    {task.notes ? (
                                        <div className="mt-3 text-sm leading-6 text-slate-600">
                                            {task.notes}
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyQueue
                            title="No tasks matched"
                            description="Try a broader search or create a new operational task from the control panel."
                        />
                    )}
                </AdminPanel>

                <div className="space-y-6">
                    <AdminPanel
                        title="Create Operational Task"
                        description="Create due-date driven tasks for quotation review, finance handoffs, quality control, dispatch, or escalation follow-up."
                    >
                        <div className="grid gap-3">
                            <LabelledInput
                                label="Task type"
                                placeholder="Task type"
                                value={draft.taskType}
                                onChange={(value) =>
                                    setDraft((current) => ({ ...current, taskType: value }))
                                }
                            />
                            <LabelledInput
                                label="Entity type"
                                placeholder="Entity type"
                                value={draft.entityType}
                                onChange={(value) =>
                                    setDraft((current) => ({ ...current, entityType: value }))
                                }
                            />
                            <LabelledInput
                                label="Entity reference"
                                placeholder="Entity reference"
                                value={draft.entityId}
                                onChange={(value) =>
                                    setDraft((current) => ({ ...current, entityId: value }))
                                }
                            />
                            <LabelledInput
                                label="Due date"
                                placeholder="Due date"
                                type="date"
                                value={draft.dueDate}
                                onChange={(value) =>
                                    setDraft((current) => ({ ...current, dueDate: value }))
                                }
                            />
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-slate-700">
                                    Operational notes
                                </span>
                                <textarea
                                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Explain the required action, owner context, or escalation need"
                                    value={draft.notes}
                                    onChange={(e) =>
                                        setDraft((current) => ({
                                            ...current,
                                            notes: e.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <Button
                                className="w-full"
                                onClick={() =>
                                    createTask.mutate({
                                        taskType: draft.taskType,
                                        entityType: draft.entityType,
                                        entityId: draft.entityId,
                                        dueDate: draft.dueDate || null,
                                        priority: draft.priority,
                                        notes: draft.notes || null,
                                    })
                                }
                            >
                                Create Operational Task
                            </Button>
                        </div>
                    </AdminPanel>

                    <AdminPanel
                        title="Workflow Emphasis"
                        description="High-value operational lanes the task system should continue to cover."
                    >
                        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                            <FocusTile label="Quotation Review" />
                            <FocusTile label="Purchase Order Validation" />
                            <FocusTile label="Quality Control Review" />
                            <FocusTile label="Dispatch Readiness" />
                            <FocusTile label="Refund Follow-Up" />
                            <FocusTile label="Escalation Response" />
                        </div>
                    </AdminPanel>
                </div>
            </div>
        </div>
    );
}

function LabelledInput({
    label,
    value,
    onChange,
    placeholder,
    type,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
}) {
    return (
        <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <Input
                placeholder={placeholder}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}

function FocusTile({ label }: { label: string }) {
    return (
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center font-medium text-slate-700">
            {label}
        </div>
    );
}

function toLabel(value: string | null | undefined) {
    return (value ?? "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());
}
