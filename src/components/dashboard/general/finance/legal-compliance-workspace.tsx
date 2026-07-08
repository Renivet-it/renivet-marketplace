"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { useMemo, useState } from "react";

type LegalRole = "gro" | "dpo" | "nodal_officer" | "compliance_officer";

const roleLabels: Record<LegalRole, string> = {
    gro: "Grievance Redressal Officer",
    dpo: "Data Protection Officer",
    nodal_officer: "Nodal Officer",
    compliance_officer: "Compliance Officer",
};

export function LegalComplianceWorkspace() {
    const [role, setRole] = useState<LegalRole>("gro");
    const [name, setName] = useState("");
    const [designation, setDesignation] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [effectiveFrom, setEffectiveFrom] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [notes, setNotes] = useState("");

    const utils = trpc.useUtils();
    const contactsQuery = trpc.general.financeCompliance.listLegalContacts.useQuery();
    const saveContact = trpc.general.financeCompliance.upsertLegalContact.useMutation({
        onSuccess: async () => {
            await utils.general.financeCompliance.listLegalContacts.invalidate();
            setName("");
            setDesignation("");
            setEmail("");
            setPhone("");
            setAddress("");
            setNotes("");
        },
    });

    const groupedHistory = useMemo(() => {
        const rows = contactsQuery.data ?? [];
        return rows.filter((item) => item.role === role);
    }, [contactsQuery.data, role]);

    const activeForRole = groupedHistory.find((item) => item.isActive) ?? null;

    return (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-md border bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                    Settings
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                    Legal & Compliance Contacts
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Saving a new active record preserves succession history and triggers audit coverage.
                </p>

                <div className="mt-5 grid gap-4">
                    <select
                        value={role}
                        onChange={(event) => setRole(event.target.value as LegalRole)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900"
                    >
                        {Object.entries(roleLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <Input
                        placeholder="Name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <Input
                        placeholder="Designation"
                        value={designation}
                        onChange={(event) => setDesignation(event.target.value)}
                    />
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <Input
                        placeholder="Phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                    />
                    <Input
                        placeholder="Address"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                    />
                    <Input
                        type="date"
                        value={effectiveFrom}
                        onChange={(event) => setEffectiveFrom(event.target.value)}
                    />
                    <Textarea
                        minRows={3}
                        placeholder="Change notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                    />
                    <Button
                        onClick={() =>
                            saveContact.mutate({
                                role,
                                name,
                                designation: designation || undefined,
                                email,
                                phone: phone || undefined,
                                address: address || undefined,
                                notes: notes || undefined,
                                effectiveFrom,
                                isActive: true,
                            })
                        }
                        disabled={saveContact.isPending}
                    >
                        Save Active Contact
                    </Button>
                </div>
            </section>

            <section className="rounded-md border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            History
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                            {roleLabels[role]}
                        </h2>
                    </div>
                    {activeForRole ? (
                        <Badge variant="secondary">Active record present</Badge>
                    ) : (
                        <Badge variant="outline">No active record</Badge>
                    )}
                </div>

                <div className="mt-5 space-y-3">
                    {groupedHistory.length ? (
                        groupedHistory.map((item) => (
                            <article
                                key={item.id}
                                className="rounded-md border border-slate-200 p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        <p className="text-sm text-slate-600">
                                            {item.designation || roleLabels[item.role as LegalRole]}
                                        </p>
                                    </div>
                                    <Badge variant={item.isActive ? "secondary" : "outline"}>
                                        {item.isActive ? "Active" : "Historical"}
                                    </Badge>
                                </div>
                                <div className="mt-3 space-y-1 text-sm text-slate-600">
                                    <p>{item.email}</p>
                                    {item.phone ? <p>{item.phone}</p> : null}
                                    {item.address ? <p>{item.address}</p> : null}
                                    <p>
                                        Effective from{" "}
                                        {new Date(item.effectiveFrom).toLocaleDateString()}
                                    </p>
                                    {item.notes ? <p>Notes: {item.notes}</p> : null}
                                </div>
                            </article>
                        ))
                    ) : (
                        <p className="text-sm text-slate-500">
                            No records yet for this legal role.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
