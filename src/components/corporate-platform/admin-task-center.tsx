"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

export function AdminTaskCenter({ initialTasks }: { initialTasks: any[] }) {
    const utils = trpc.useUtils();
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

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Create Operational Task</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Input
                        placeholder="Task type"
                        value={draft.taskType}
                        onChange={(e) =>
                            setDraft((current) => ({ ...current, taskType: e.target.value }))
                        }
                    />
                    <Input
                        placeholder="Entity type"
                        value={draft.entityType}
                        onChange={(e) =>
                            setDraft((current) => ({ ...current, entityType: e.target.value }))
                        }
                    />
                    <Input
                        placeholder="Entity ID"
                        value={draft.entityId}
                        onChange={(e) =>
                            setDraft((current) => ({ ...current, entityId: e.target.value }))
                        }
                    />
                    <Input
                        type="date"
                        value={draft.dueDate}
                        onChange={(e) =>
                            setDraft((current) => ({ ...current, dueDate: e.target.value }))
                        }
                    />
                </div>
                <textarea
                    className="mt-3 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Notes"
                    value={draft.notes}
                    onChange={(e) =>
                        setDraft((current) => ({ ...current, notes: e.target.value }))
                    }
                />
                <Button
                    className="mt-3"
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
                    Create Task
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {initialTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {task.status}
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-900">
                            {task.taskType}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                            {task.entityType} • {task.priority}
                        </div>
                        {task.notes ? (
                            <div className="mt-3 text-sm text-slate-600">{task.notes}</div>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

