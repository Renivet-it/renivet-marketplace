"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { CorporateOrderConfigSnapshot } from "@/lib/validations/corporate-order";
import { handleClientError } from "@/lib/utils";
import { ReactNode, useMemo, useState } from "react";
import { toast } from "sonner";

type ConfigResponse = {
    productTypes: Array<{
        id: string;
        name: string;
        description?: string | null;
        isActive: boolean;
        sortOrder: number;
    }>;
    gsmOptions: Array<{
        id: string;
        label: string;
        gsmValue: number;
        isActive: boolean;
        sortOrder: number;
    }>;
    fabricCompositions: Array<{
        id: string;
        name: string;
        description?: string | null;
        isActive: boolean;
        sortOrder: number;
    }>;
    colorOptions: Array<{
        id: string;
        name: string;
        hexCode?: string | null;
        isCustom: boolean;
        isActive: boolean;
        sortOrder: number;
    }>;
    printMethods: Array<{
        id: string;
        name: string;
        priceModifierPaise: number;
        isActive: boolean;
        sortOrder: number;
    }>;
    logoLocations: Array<{
        id: string;
        name: string;
        placementGroup: string;
        isActive: boolean;
        sortOrder: number;
    }>;
    extraChargeRules: Array<{
        id: string;
        code: string;
        name: string;
        chargeType: "flat" | "per_unit" | "per_location";
        amountPaise: number;
        isDefaultSelected: boolean;
        isActive: boolean;
        sortOrder: number;
    }>;
    pricingSlabs: Array<{
        id: string;
        productTypeId: string;
        gsmOptionId: string;
        minQuantity: number;
        maxQuantity?: number | null;
        unitPricePaise: number;
        isActive: boolean;
        sortOrder: number;
    }>;
    settings: {
        gstRateBps: number;
        advancePercentBps: number;
        expectedTimelineText: string;
        isActive: boolean;
    };
};

const createId = () => crypto.randomUUID();

const toText = (value?: string | null) => value ?? "";
const fromText = (value: string) => (value.trim() ? value : null);
const paiseToRupees = (value: number) => (value / 100).toString();
const rupeesToPaise = (value: string) =>
    Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) : 0;
const bpsToPercent = (value: number) => (value / 100).toString();
const percentToBps = (value: string) =>
    Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) : 0;

function createInitialDraft(initialData: ConfigResponse): CorporateOrderConfigSnapshot {
    return {
        productTypes: initialData.productTypes.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description ?? null,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
        })),
        gsmOptions: initialData.gsmOptions.map((item) => ({
            id: item.id,
            label: item.label,
            gsmValue: item.gsmValue,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
        })),
        fabricCompositions: initialData.fabricCompositions.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description ?? null,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
        })),
        colorOptions: initialData.colorOptions.map((item) => ({
            id: item.id,
            name: item.name,
            hexCode: item.hexCode ?? null,
            isCustom: item.isCustom,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
        })),
        printMethods: initialData.printMethods.map((item) => ({
            id: item.id,
            name: item.name,
            priceModifierPaise: item.priceModifierPaise,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
        })),
        logoLocations: initialData.logoLocations.map((item) => ({
            id: item.id,
            name: item.name,
            placementGroup: item.placementGroup,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
        })),
        extraChargeRules: initialData.extraChargeRules.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            chargeType: item.chargeType,
            amountPaise: item.amountPaise,
            isDefaultSelected: item.isDefaultSelected,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
        })),
        pricingSlabs: initialData.pricingSlabs.map((item) => ({
            id: item.id,
            productTypeId: item.productTypeId,
            gsmOptionId: item.gsmOptionId,
            minQuantity: item.minQuantity,
            maxQuantity: item.maxQuantity ?? null,
            unitPricePaise: item.unitPricePaise,
            isActive: item.isActive,
            sortOrder: item.sortOrder,
        })),
        settings: {
            gstRateBps: initialData.settings.gstRateBps,
            advancePercentBps: initialData.settings.advancePercentBps,
            expectedTimelineText: initialData.settings.expectedTimelineText,
            isActive: initialData.settings.isActive,
        },
    };
}

function SectionShell({
    title,
    description,
    action,
    children,
}: {
    title: string;
    description: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {description}
                    </p>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-slate-500">
            No {label} yet. Use the add button to create one.
        </div>
    );
}

export function CorporateOrderSettings({
    initialData,
}: {
    initialData: ConfigResponse;
}) {
    const [draft, setDraft] = useState<CorporateOrderConfigSnapshot>(() =>
        createInitialDraft(initialData)
    );

    const mutation = trpc.general.corporateOrders.upsertConfig.useMutation({
        onSuccess: (data) => {
            toast.success("Corporate order settings updated");
            setDraft(createInitialDraft(data as ConfigResponse));
        },
        onError: (error) => handleClientError(error),
    });

    const productTypeOptions = useMemo(
        () =>
            draft.productTypes.map((item) => ({
                value: item.id ?? "",
                label: item.name || "Untitled product type",
            })),
        [draft.productTypes]
    );

    const gsmOptions = useMemo(
        () =>
            draft.gsmOptions.map((item) => ({
                value: item.id ?? "",
                label: item.label || `${item.gsmValue} GSM`,
            })),
        [draft.gsmOptions]
    );

    const updateCollection = <
        K extends keyof Omit<CorporateOrderConfigSnapshot, "settings">,
    >(
        key: K,
        updater: (
            current: CorporateOrderConfigSnapshot[K]
        ) => CorporateOrderConfigSnapshot[K]
    ) => {
        setDraft((current) => ({
            ...current,
            [key]: updater(current[key]),
        }));
    };

    const updateSettings = <
        K extends keyof CorporateOrderConfigSnapshot["settings"],
    >(
        key: K,
        value: CorporateOrderConfigSnapshot["settings"][K]
    ) => {
        setDraft((current) => ({
            ...current,
            settings: {
                ...current.settings,
                [key]: value,
            },
        }));
    };

    const saveSettings = () => mutation.mutate(draft);

    return (
        <div className="space-y-6 rounded-xl border bg-[#f8fafc] p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">
                        Corporate Order Settings
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm text-slate-500">
                        Manage corporate products, pricing slabs, extra charges,
                        and order defaults with editable forms instead of raw
                        JSON.
                    </p>
                </div>

                <Button onClick={saveSettings} disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save All Changes"}
                </Button>
            </div>

            <Tabs defaultValue="defaults" className="space-y-4">
                <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                    <TabsTrigger value="defaults" className="rounded-md border bg-white px-4 py-2 data-[state=active]:border-primary">
                        Defaults
                    </TabsTrigger>
                    <TabsTrigger value="catalog" className="rounded-md border bg-white px-4 py-2 data-[state=active]:border-primary">
                        Product Catalog
                    </TabsTrigger>
                    <TabsTrigger value="charges" className="rounded-md border bg-white px-4 py-2 data-[state=active]:border-primary">
                        Branding & Charges
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="rounded-md border bg-white px-4 py-2 data-[state=active]:border-primary">
                        Pricing Slabs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="defaults" className="space-y-4">
                    <SectionShell
                        title="Order Defaults"
                        description="Set GST, advance payment percentage, and the expected timeline shown to customers."
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>GST Rate (%)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={bpsToPercent(draft.settings.gstRateBps)}
                                    onChange={(e) =>
                                        updateSettings(
                                            "gstRateBps",
                                            percentToBps(e.target.value)
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Advance Payment (%)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={bpsToPercent(
                                        draft.settings.advancePercentBps
                                    )}
                                    onChange={(e) =>
                                        updateSettings(
                                            "advancePercentBps",
                                            percentToBps(e.target.value)
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Expected Timeline Text</Label>
                                <Textarea
                                    minRows={4}
                                    value={draft.settings.expectedTimelineText}
                                    onChange={(e) =>
                                        updateSettings(
                                            "expectedTimelineText",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 md:col-span-2">
                                <div>
                                    <p className="font-medium text-slate-900">
                                        Settings Active
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Turn this off if you need to pause the
                                        corporate ordering configuration.
                                    </p>
                                </div>
                                <Switch
                                    checked={draft.settings.isActive}
                                    onCheckedChange={(checked) =>
                                        updateSettings("isActive", checked)
                                    }
                                />
                            </div>
                        </div>
                    </SectionShell>
                </TabsContent>

                <TabsContent value="catalog" className="space-y-4">
                    <SectionShell
                        title="Product Types"
                        description="Create and maintain the product types customers can order."
                        action={
                            <Button
                                variant="outline"
                                onClick={() =>
                                    updateCollection("productTypes", (items) => [
                                        ...items,
                                        {
                                            id: createId(),
                                            name: "",
                                            description: null,
                                            isActive: true,
                                            sortOrder: items.length + 1,
                                        },
                                    ])
                                }
                            >
                                <Icons.Plus />
                                Add Product Type
                            </Button>
                        }
                    >
                        {draft.productTypes.length === 0 ? (
                            <EmptyState label="product types" />
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {draft.productTypes.map((item, index) => (
                                    <div key={item.id} className="rounded-lg border bg-white p-4">
                                        <div className="grid gap-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Product Type {index + 1}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        updateCollection(
                                                            "productTypes",
                                                            (items) =>
                                                                items.filter(
                                                                    (_, itemIndex) =>
                                                                        itemIndex !==
                                                                        index
                                                                )
                                                        )
                                                    }
                                                >
                                                    <Icons.Trash2 />
                                                </Button>
                                            </div>
                                            <Input
                                                placeholder="Name"
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "productTypes",
                                                        (items) =>
                                                            items.map(
                                                                (row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              name: e
                                                                                  .target
                                                                                  .value,
                                                                          }
                                                                        : row
                                                            )
                                                    )
                                                }
                                            />
                                            <Textarea
                                                minRows={3}
                                                placeholder="Description"
                                                value={toText(item.description)}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "productTypes",
                                                        (items) =>
                                                            items.map(
                                                                (row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              description:
                                                                                  fromText(
                                                                                      e
                                                                                          .target
                                                                                          .value
                                                                                  ),
                                                                          }
                                                                        : row
                                                            )
                                                    )
                                                }
                                            />
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Sort order"
                                                    value={item.sortOrder}
                                                    onChange={(e) =>
                                                        updateCollection(
                                                            "productTypes",
                                                            (items) =>
                                                                items.map(
                                                                    (row, itemIndex) =>
                                                                        itemIndex ===
                                                                        index
                                                                            ? {
                                                                                  ...row,
                                                                                  sortOrder:
                                                                                      Number(
                                                                                          e
                                                                                              .target
                                                                                              .value
                                                                                      ) ||
                                                                                      0,
                                                                              }
                                                                            : row
                                                                )
                                                        )
                                                    }
                                                />
                                                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                                    <span className="text-sm text-slate-600">
                                                        Active
                                                    </span>
                                                    <Switch
                                                        checked={item.isActive}
                                                        onCheckedChange={(checked) =>
                                                            updateCollection(
                                                                "productTypes",
                                                                (items) =>
                                                                    items.map(
                                                                        (
                                                                            row,
                                                                            itemIndex
                                                                        ) =>
                                                                            itemIndex ===
                                                                            index
                                                                                ? {
                                                                                      ...row,
                                                                                      isActive:
                                                                                          checked,
                                                                                  }
                                                                                : row
                                                                    )
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionShell>

                    <SectionShell
                        title="GSM Options"
                        description="Configure cloth weights available for quotation."
                        action={
                            <Button
                                variant="outline"
                                onClick={() =>
                                    updateCollection("gsmOptions", (items) => [
                                        ...items,
                                        {
                                            id: createId(),
                                            label: "",
                                            gsmValue: 180,
                                            isActive: true,
                                            sortOrder: items.length + 1,
                                        },
                                    ])
                                }
                            >
                                <Icons.Plus />
                                Add GSM Option
                            </Button>
                        }
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Label</TableHead>
                                    <TableHead>GSM</TableHead>
                                    <TableHead>Sort Order</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {draft.gsmOptions.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input
                                                value={item.label}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "gsmOptions",
                                                        (items) =>
                                                            items.map(
                                                                (row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              label: e
                                                                                  .target
                                                                                  .value,
                                                                          }
                                                                        : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.gsmValue}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "gsmOptions",
                                                        (items) =>
                                                            items.map(
                                                                (row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              gsmValue:
                                                                                  Number(
                                                                                      e
                                                                                          .target
                                                                                          .value
                                                                                  ) ||
                                                                                  0,
                                                                          }
                                                                        : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.sortOrder}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "gsmOptions",
                                                        (items) =>
                                                            items.map(
                                                                (row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              sortOrder:
                                                                                  Number(
                                                                                      e
                                                                                          .target
                                                                                          .value
                                                                                  ) ||
                                                                                  0,
                                                                          }
                                                                        : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={item.isActive}
                                                onCheckedChange={(checked) =>
                                                    updateCollection(
                                                        "gsmOptions",
                                                        (items) =>
                                                            items.map(
                                                                (row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              isActive:
                                                                                  checked,
                                                                          }
                                                                        : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    updateCollection(
                                                        "gsmOptions",
                                                        (items) =>
                                                            items.filter(
                                                                (_, itemIndex) =>
                                                                    itemIndex !==
                                                                    index
                                                            )
                                                    )
                                                }
                                            >
                                                <Icons.Trash2 />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </SectionShell>

                    <SectionShell
                        title="Fabric Compositions"
                        description="List the fabric compositions users can pick from."
                        action={
                            <Button
                                variant="outline"
                                onClick={() =>
                                    updateCollection(
                                        "fabricCompositions",
                                        (items) => [
                                            ...items,
                                            {
                                                id: createId(),
                                                name: "",
                                                description: null,
                                                isActive: true,
                                                sortOrder: items.length + 1,
                                            },
                                        ]
                                    )
                                }
                            >
                                <Icons.Plus />
                                Add Fabric
                            </Button>
                        }
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Sort Order</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {draft.fabricCompositions.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "fabricCompositions",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          name: e.target.value,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={toText(item.description)}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "fabricCompositions",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          description: fromText(
                                                                              e.target.value
                                                                          ),
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.sortOrder}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "fabricCompositions",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          sortOrder:
                                                                              Number(
                                                                                  e.target.value
                                                                              ) || 0,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={item.isActive}
                                                onCheckedChange={(checked) =>
                                                    updateCollection(
                                                        "fabricCompositions",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          isActive: checked,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    updateCollection(
                                                        "fabricCompositions",
                                                        (items) =>
                                                            items.filter(
                                                                (_, itemIndex) =>
                                                                    itemIndex !==
                                                                    index
                                                            )
                                                    )
                                                }
                                            >
                                                <Icons.Trash2 />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </SectionShell>

                    <SectionShell
                        title="Color Options"
                        description="Set standard colors and mark which one is reserved for custom requests."
                        action={
                            <Button
                                variant="outline"
                                onClick={() =>
                                    updateCollection("colorOptions", (items) => [
                                        ...items,
                                        {
                                            id: createId(),
                                            name: "",
                                            hexCode: null,
                                            isCustom: false,
                                            isActive: true,
                                            sortOrder: items.length + 1,
                                        },
                                    ])
                                }
                            >
                                <Icons.Plus />
                                Add Color
                            </Button>
                        }
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Hex Code</TableHead>
                                    <TableHead>Custom</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead>Sort Order</TableHead>
                                    <TableHead className="w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {draft.colorOptions.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "colorOptions",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          name: e.target.value,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                placeholder="#FFFFFF"
                                                value={toText(item.hexCode)}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "colorOptions",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          hexCode: fromText(
                                                                              e.target.value
                                                                          ),
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={item.isCustom}
                                                onCheckedChange={(checked) =>
                                                    updateCollection(
                                                        "colorOptions",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          isCustom: checked,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={item.isActive}
                                                onCheckedChange={(checked) =>
                                                    updateCollection(
                                                        "colorOptions",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          isActive: checked,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.sortOrder}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "colorOptions",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          sortOrder:
                                                                              Number(
                                                                                  e.target.value
                                                                              ) || 0,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    updateCollection(
                                                        "colorOptions",
                                                        (items) =>
                                                            items.filter(
                                                                (_, itemIndex) =>
                                                                    itemIndex !==
                                                                    index
                                                            )
                                                    )
                                                }
                                            >
                                                <Icons.Trash2 />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </SectionShell>
                </TabsContent>

                <TabsContent value="charges" className="space-y-4">
                    <SectionShell
                        title="Print Methods"
                        description="Add the print methods and their per-unit price modifiers."
                        action={
                            <Button
                                variant="outline"
                                onClick={() =>
                                    updateCollection("printMethods", (items) => [
                                        ...items,
                                        {
                                            id: createId(),
                                            name: "",
                                            priceModifierPaise: 0,
                                            isActive: true,
                                            sortOrder: items.length + 1,
                                        },
                                    ])
                                }
                            >
                                <Icons.Plus />
                                Add Print Method
                            </Button>
                        }
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Charge (Rs.)</TableHead>
                                    <TableHead>Sort Order</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {draft.printMethods.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "printMethods",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          name: e.target.value,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={paiseToRupees(
                                                    item.priceModifierPaise
                                                )}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "printMethods",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          priceModifierPaise:
                                                                              rupeesToPaise(
                                                                                  e.target.value
                                                                              ),
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.sortOrder}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "printMethods",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          sortOrder:
                                                                              Number(
                                                                                  e.target.value
                                                                              ) || 0,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={item.isActive}
                                                onCheckedChange={(checked) =>
                                                    updateCollection(
                                                        "printMethods",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          isActive: checked,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    updateCollection(
                                                        "printMethods",
                                                        (items) =>
                                                            items.filter(
                                                                (_, itemIndex) =>
                                                                    itemIndex !==
                                                                    index
                                                            )
                                                    )
                                                }
                                            >
                                                <Icons.Trash2 />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </SectionShell>

                    <SectionShell
                        title="Logo Locations"
                        description="Set the allowed artwork placements for logos or branding."
                        action={
                            <Button
                                variant="outline"
                                onClick={() =>
                                    updateCollection("logoLocations", (items) => [
                                        ...items,
                                        {
                                            id: createId(),
                                            name: "",
                                            placementGroup: "",
                                            isActive: true,
                                            sortOrder: items.length + 1,
                                        },
                                    ])
                                }
                            >
                                <Icons.Plus />
                                Add Logo Location
                            </Button>
                        }
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Placement Group</TableHead>
                                    <TableHead>Sort Order</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {draft.logoLocations.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "logoLocations",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          name: e.target.value,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={item.placementGroup}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "logoLocations",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          placementGroup:
                                                                              e.target.value,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.sortOrder}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "logoLocations",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          sortOrder:
                                                                              Number(
                                                                                  e.target.value
                                                                              ) || 0,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={item.isActive}
                                                onCheckedChange={(checked) =>
                                                    updateCollection(
                                                        "logoLocations",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          isActive: checked,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    updateCollection(
                                                        "logoLocations",
                                                        (items) =>
                                                            items.filter(
                                                                (_, itemIndex) =>
                                                                    itemIndex !==
                                                                    index
                                                            )
                                                    )
                                                }
                                            >
                                                <Icons.Trash2 />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </SectionShell>

                    <SectionShell
                        title="Extra Charge Rules"
                        description="Configure optional add-ons like packaging, rush delivery, or extra logo placements."
                        action={
                            <Button
                                variant="outline"
                                onClick={() =>
                                    updateCollection("extraChargeRules", (items) => [
                                        ...items,
                                        {
                                            id: createId(),
                                            code: "",
                                            name: "",
                                            chargeType: "flat",
                                            amountPaise: 0,
                                            isDefaultSelected: false,
                                            isActive: true,
                                            sortOrder: items.length + 1,
                                        },
                                    ])
                                }
                            >
                                <Icons.Plus />
                                Add Charge Rule
                            </Button>
                        }
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Charge Type</TableHead>
                                    <TableHead>Amount (Rs.)</TableHead>
                                    <TableHead>Default</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead>Sort Order</TableHead>
                                    <TableHead className="w-[80px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {draft.extraChargeRules.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Input
                                                value={item.code}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "extraChargeRules",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          code: e.target.value,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "extraChargeRules",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          name: e.target.value,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={item.chargeType}
                                                onValueChange={(value) =>
                                                    updateCollection(
                                                        "extraChargeRules",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          chargeType:
                                                                              value as
                                                                                  "flat" | "per_unit" | "per_location",
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="flat">
                                                        Flat
                                                    </SelectItem>
                                                    <SelectItem value="per_unit">
                                                        Per unit
                                                    </SelectItem>
                                                    <SelectItem value="per_location">
                                                        Per location
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={paiseToRupees(item.amountPaise)}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "extraChargeRules",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          amountPaise:
                                                                              rupeesToPaise(
                                                                                  e.target.value
                                                                              ),
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={item.isDefaultSelected}
                                                onCheckedChange={(checked) =>
                                                    updateCollection(
                                                        "extraChargeRules",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          isDefaultSelected:
                                                                              checked,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={item.isActive}
                                                onCheckedChange={(checked) =>
                                                    updateCollection(
                                                        "extraChargeRules",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          isActive: checked,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.sortOrder}
                                                onChange={(e) =>
                                                    updateCollection(
                                                        "extraChargeRules",
                                                        (items) =>
                                                            items.map((row, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...row,
                                                                          sortOrder:
                                                                              Number(
                                                                                  e.target.value
                                                                              ) || 0,
                                                                      }
                                                                    : row
                                                            )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    updateCollection(
                                                        "extraChargeRules",
                                                        (items) =>
                                                            items.filter(
                                                                (_, itemIndex) =>
                                                                    itemIndex !==
                                                                    index
                                                            )
                                                    )
                                                }
                                            >
                                                <Icons.Trash2 />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </SectionShell>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                    <SectionShell
                        title="Pricing Slabs"
                        description="Map product types and GSM options to quantity ranges and unit prices."
                        action={
                            <Button
                                variant="outline"
                                onClick={() =>
                                    updateCollection("pricingSlabs", (items) => [
                                        ...items,
                                        {
                                            id: createId(),
                                            productTypeId:
                                                productTypeOptions[0]?.value ?? "",
                                            gsmOptionId: gsmOptions[0]?.value ?? "",
                                            minQuantity: 1,
                                            maxQuantity: null,
                                            unitPricePaise: 0,
                                            isActive: true,
                                            sortOrder: items.length + 1,
                                        },
                                    ])
                                }
                                disabled={
                                    productTypeOptions.length === 0 ||
                                    gsmOptions.length === 0
                                }
                            >
                                <Icons.Plus />
                                Add Pricing Slab
                            </Button>
                        }
                    >
                        {productTypeOptions.length === 0 || gsmOptions.length === 0 ? (
                            <EmptyState label="pricing slabs because product types and GSM options are required first" />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Type</TableHead>
                                        <TableHead>GSM</TableHead>
                                        <TableHead>Min Qty</TableHead>
                                        <TableHead>Max Qty</TableHead>
                                        <TableHead>Unit Price (Rs.)</TableHead>
                                        <TableHead>Sort Order</TableHead>
                                        <TableHead>Active</TableHead>
                                        <TableHead className="w-[80px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {draft.pricingSlabs.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Select
                                                    value={item.productTypeId}
                                                    onValueChange={(value) =>
                                                        updateCollection(
                                                            "pricingSlabs",
                                                            (items) =>
                                                                items.map((row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              productTypeId:
                                                                                  value,
                                                                          }
                                                                        : row
                                                                )
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select product type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {productTypeOptions.map((option) => (
                                                            <SelectItem
                                                                key={option.value}
                                                                value={option.value}
                                                            >
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={item.gsmOptionId}
                                                    onValueChange={(value) =>
                                                        updateCollection(
                                                            "pricingSlabs",
                                                            (items) =>
                                                                items.map((row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              gsmOptionId:
                                                                                  value,
                                                                          }
                                                                        : row
                                                                )
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select GSM" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {gsmOptions.map((option) => (
                                                            <SelectItem
                                                                key={option.value}
                                                                value={option.value}
                                                            >
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.minQuantity}
                                                    onChange={(e) =>
                                                        updateCollection(
                                                            "pricingSlabs",
                                                            (items) =>
                                                                items.map((row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              minQuantity:
                                                                                  Number(
                                                                                      e.target.value
                                                                                  ) ||
                                                                                  1,
                                                                          }
                                                                        : row
                                                                )
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Leave blank for open ended"
                                                    value={item.maxQuantity ?? ""}
                                                    onChange={(e) =>
                                                        updateCollection(
                                                            "pricingSlabs",
                                                            (items) =>
                                                                items.map((row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              maxQuantity:
                                                                                  e.target
                                                                                      .value ===
                                                                                  ""
                                                                                      ? null
                                                                                      : Number(
                                                                                            e
                                                                                                .target
                                                                                                .value
                                                                                        ) ||
                                                                                        null,
                                                                          }
                                                                        : row
                                                                )
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={paiseToRupees(
                                                        item.unitPricePaise
                                                    )}
                                                    onChange={(e) =>
                                                        updateCollection(
                                                            "pricingSlabs",
                                                            (items) =>
                                                                items.map((row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              unitPricePaise:
                                                                                  rupeesToPaise(
                                                                                      e.target
                                                                                          .value
                                                                                  ),
                                                                          }
                                                                        : row
                                                                )
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={item.sortOrder}
                                                    onChange={(e) =>
                                                        updateCollection(
                                                            "pricingSlabs",
                                                            (items) =>
                                                                items.map((row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              sortOrder:
                                                                                  Number(
                                                                                      e.target.value
                                                                                  ) || 0,
                                                                          }
                                                                        : row
                                                                )
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={item.isActive}
                                                    onCheckedChange={(checked) =>
                                                        updateCollection(
                                                            "pricingSlabs",
                                                            (items) =>
                                                                items.map((row, itemIndex) =>
                                                                    itemIndex ===
                                                                    index
                                                                        ? {
                                                                              ...row,
                                                                              isActive:
                                                                                  checked,
                                                                          }
                                                                        : row
                                                                )
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        updateCollection(
                                                            "pricingSlabs",
                                                            (items) =>
                                                                items.filter(
                                                                    (_, itemIndex) =>
                                                                        itemIndex !==
                                                                        index
                                                                )
                                                        )
                                                    }
                                                >
                                                    <Icons.Trash2 />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </SectionShell>
                </TabsContent>
            </Tabs>

            <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                    Changes are staged locally until you click save. Delete
                    actions now persist as real removals, not just hidden JSON
                    edits.
                </p>
                <Button onClick={saveSettings} disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </div>
    );
}
