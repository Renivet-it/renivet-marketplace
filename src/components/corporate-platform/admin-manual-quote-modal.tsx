"use client";

import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Input } from "@/components/ui/input-dash";
import { deriveGstRateBps } from "@/lib/finance/calculations";
import { trpc } from "@/lib/trpc/client";
import { cn, formatINR, handleClientError } from "@/lib/utils";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    Check,
    CheckCircle2,
    ChevronRight,
    Coins,
    FileText,
    HelpCircle,
    Package,
    Plus,
    Receipt,
    Sparkles,
    Trash2,
    Truck,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface AdminManualQuoteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    brandOptions: Array<{ id: string; name: string; isActive: boolean }>;
    orderConfig?: {
        productTypes: Array<{
            id: string;
            name: string;
            hsnMaster?: { hsnCode: string; gstRateBps: number } | null;
        }>;
        gsmOptions: Array<{ id: string; label: string }>;
        fabricCompositions: Array<{ id: string; name: string }>;
        extraChargeRules: Array<{
            id: string;
            code: string;
            name: string;
            chargeType: "flat" | "per_unit" | "per_location";
            amountPaise: number;
        }>;
        hsnOptions: Array<{
            id: string;
            hsnCode: string;
            description: string;
            gstRateBps: number;
        }>;
    };
    onQuoteCreated?: (quoteNumber: string) => void;
}

const STEPS = [
    { id: 1, title: "Customer & Consignee", icon: Building2 },
    { id: 2, title: "Product & Specifications", icon: Package },
    { id: 3, title: "Extras, Taxes & Terms", icon: Coins },
];

export function AdminManualQuoteModal({
    open,
    onOpenChange,
    brandOptions,
    orderConfig,
    onQuoteCreated,
}: AdminManualQuoteModalProps) {
    const utils = trpc.useUtils();
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [companyName, setCompanyName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [gstNumber, setGstNumber] = useState("");

    // Delivery / Consignee Address
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryCity, setDeliveryCity] = useState("");
    const [deliveryState, setDeliveryState] = useState("");
    const [deliveryPincode, setDeliveryPincode] = useState("");
    const [deliveryCountry, setDeliveryCountry] = useState("India");

    // Product Specifications
    const [brandId, setBrandId] = useState("");
    const [productTypeId, setProductTypeId] = useState("");
    const [gsmOptionId, setGsmOptionId] = useState("");
    const [fabricCompositionId, setFabricCompositionId] = useState("");
    const [quantity, setQuantity] = useState("100");
    const [unitPrice, setUnitPrice] = useState("399");

    // HSN & GST Connection
    const [selectedHsnMode, setSelectedHsnMode] = useState<"preset" | "manual">(
        "preset"
    );
    const [selectedHsnId, setSelectedHsnId] = useState<string>("");
    const [manualHsnCode, setManualHsnCode] = useState<string>("");
    const [gstPercent, setGstPercent] = useState("18");
    const [isGstManuallyOverridden, setIsGstManuallyOverridden] =
        useState(false);

    // Optional Extras
    const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
    const [manualExtraAmount, setManualExtraAmount] = useState<string>("0");
    const [manualExtraDescription, setManualExtraDescription] =
        useState<string>("");

    // Commercial Terms
    const [advancePercent, setAdvancePercent] = useState("30");
    const [validUntil, setValidUntil] = useState("");
    const [comments, setComments] = useState("");

    // Commission & GST on Commission
    const [commissionAmount, setCommissionAmount] = useState<string>("0");
    const [commissionGstPercent, setCommissionGstPercent] =
        useState<string>("18");

    // Reset form on modal open
    useEffect(() => {
        if (open) {
            setCurrentStep(1);
        }
    }, [open]);

    // Handle product type change -> auto-suggest HSN & GST
    const handleProductTypeChange = (newProductTypeId: string) => {
        setProductTypeId(newProductTypeId);
        if (!newProductTypeId || !orderConfig) return;

        const matchedProductType = orderConfig.productTypes.find(
            (pt) => pt.id === newProductTypeId
        );
        if (matchedProductType?.hsnMaster) {
            const hsnCode = matchedProductType.hsnMaster.hsnCode;
            const matchedHsnOption = orderConfig.hsnOptions?.find(
                (h) => h.hsnCode === hsnCode
            );
            if (matchedHsnOption) {
                setSelectedHsnMode("preset");
                setSelectedHsnId(matchedHsnOption.id);
                updateDerivedGst(hsnCode, Number(unitPrice || 0));
            }
        }
    };

    // Auto-update GST when HSN changes or unit price changes (unless manually overridden)
    const updateDerivedGst = (hsnCode: string, unitPriceInr: number) => {
        if (isGstManuallyOverridden) return;
        if (!hsnCode) return;

        const rateBps = deriveGstRateBps({
            hsnCode,
            unitPricePaise: Math.round(unitPriceInr * 100),
        });
        setGstPercent(String(rateBps / 100));
    };

    const handleHsnSelectChange = (hsnOptionId: string) => {
        setSelectedHsnId(hsnOptionId);
        if (hsnOptionId === "manual") {
            setSelectedHsnMode("manual");
        } else {
            setSelectedHsnMode("preset");
            const option = orderConfig?.hsnOptions?.find(
                (h) => h.id === hsnOptionId
            );
            if (option) {
                updateDerivedGst(option.hsnCode, Number(unitPrice || 0));
            }
        }
    };

    const handleManualHsnChange = (code: string) => {
        setManualHsnCode(code);
        if (code.trim().length >= 4) {
            updateDerivedGst(code.trim(), Number(unitPrice || 0));
        }
    };

    const handleUnitPriceChange = (priceStr: string) => {
        setUnitPrice(priceStr);
        const currentHsn =
            selectedHsnMode === "preset"
                ? orderConfig?.hsnOptions?.find((h) => h.id === selectedHsnId)
                      ?.hsnCode
                : manualHsnCode;
        if (currentHsn) {
            updateDerivedGst(currentHsn, Number(priceStr || 0));
        }
    };

    // Extra charges calculation
    const qtyNum = Math.max(0, Number(quantity) || 0);
    const unitPricePaise = Math.max(
        0,
        Math.round((Number(unitPrice) || 0) * 100)
    );
    const subtotalPaise = qtyNum * unitPricePaise;

    const extrasBreakdown = useMemo(() => {
        const rules = orderConfig?.extraChargeRules || [];
        const selectedRules = rules.filter((r) =>
            selectedExtraIds.includes(r.id)
        );
        const ruleTotalPaise = selectedRules.reduce((sum, r) => {
            const cost =
                r.chargeType === "per_unit"
                    ? r.amountPaise * qtyNum
                    : r.amountPaise;
            return sum + cost;
        }, 0);
        const manualPaise = Math.max(
            0,
            Math.round((Number(manualExtraAmount) || 0) * 100)
        );
        return {
            selectedRules,
            ruleTotalPaise,
            manualPaise,
            totalCustomizationPaise: ruleTotalPaise + manualPaise,
        };
    }, [
        orderConfig?.extraChargeRules,
        selectedExtraIds,
        qtyNum,
        manualExtraAmount,
    ]);

    const gstPercentNum = Math.max(0, Number(gstPercent) || 0);
    const advancePercentNum = Math.max(
        0,
        Math.min(100, Number(advancePercent) || 0)
    );

    // Commission calculations
    const commissionAmountPaise = Math.max(
        0,
        Math.round((Number(commissionAmount) || 0) * 100)
    );
    const commissionGstPercentNum = Math.max(
        0,
        Number(commissionGstPercent) || 0
    );
    const commissionGstAmountPaise = Math.round(
        (commissionAmountPaise * commissionGstPercentNum) / 100
    );
    const commissionTotalPaise =
        commissionAmountPaise + commissionGstAmountPaise;

    const baseGstPaise = Math.round((subtotalPaise * gstPercentNum) / 100);
    const customizationGstPaise = Math.round(
        (extrasBreakdown.totalCustomizationPaise * 18) / 100
    );
    const taxPaise = baseGstPaise + customizationGstPaise;
    const taxablePaise =
        subtotalPaise + extrasBreakdown.totalCustomizationPaise;
    const totalPaise = taxablePaise + taxPaise;
    const advancePaise = Math.round((totalPaise * advancePercentNum) / 100);
    const balancePaise = totalPaise - advancePaise;

    // Active HSN Code
    const activeHsnCode =
        selectedHsnMode === "preset"
            ? orderConfig?.hsnOptions?.find((h) => h.id === selectedHsnId)
                  ?.hsnCode || ""
            : manualHsnCode.trim();

    // Validation per step
    const isStep1Valid =
        companyName.trim().length >= 2 &&
        contactPerson.trim().length >= 2 &&
        /^\S+@\S+\.\S+$/.test(email.trim()) &&
        phone.trim().length >= 8 &&
        (!deliveryPincode.trim() || /^\d{6}$/.test(deliveryPincode.trim()));

    const isStep2Valid = Boolean(brandId) && qtyNum > 0 && unitPricePaise > 0;

    const isStep3Valid =
        Number.isFinite(gstPercentNum) &&
        gstPercentNum >= 0 &&
        gstPercentNum <= 100 &&
        Number.isFinite(advancePercentNum) &&
        advancePercentNum >= 0 &&
        advancePercentNum <= 100;

    const canSubmit = isStep1Valid && isStep2Valid && isStep3Valid;

    // Mutation
    const createManualQuote =
        trpc.general.corporatePlatform.createManualQuote.useMutation({
            onSuccess: async (quote) => {
                toast.success(
                    quote.recipientRegistered
                        ? `${quote.quoteNumber} created and linked to the customer!`
                        : `${quote.quoteNumber} created; it will link when customer registers.`
                );
                await Promise.all([
                    utils.general.corporatePlatform.listAdminRfqs.invalidate(),
                    utils.general.corporatePlatform.listAdminQuotes.invalidate(),
                ]);
                onQuoteCreated?.(quote.quoteNumber);
                onOpenChange(false);
            },
            onError: (error) => handleClientError(error),
        });

    const handleSubmit = () => {
        if (!canSubmit || createManualQuote.isPending) return;

        createManualQuote.mutate({
            companyName: companyName.trim(),
            contactPerson: contactPerson.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            gstNumber: gstNumber.trim() || null,
            deliveryAddress: deliveryAddress.trim() || null,
            deliveryCity: deliveryCity.trim() || null,
            deliveryState: deliveryState.trim() || null,
            deliveryPincode: deliveryPincode.trim() || null,
            deliveryCountry: deliveryCountry.trim() || "India",
            brandId,
            productTypeId: productTypeId || null,
            hsnCode: activeHsnCode || null,
            gsmOptionId: gsmOptionId || null,
            fabricCompositionId: fabricCompositionId || null,
            extraChargeRuleIds: selectedExtraIds,
            manualExtraAmountPaise: extrasBreakdown.manualPaise,
            manualExtraDescription: manualExtraDescription.trim() || null,
            quantity: qtyNum,
            unitPricePaise,
            customizationCostPaise: extrasBreakdown.totalCustomizationPaise,
            commissionAmountPaise,
            commissionGstPercent: commissionGstPercentNum,
            gstPercent: gstPercentNum,
            advancePercent: advancePercentNum,
            validUntil: validUntil || null,
            comments: comments.trim() || null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden p-0 sm:max-w-4xl">
                {/* Header */}
                <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
                    <DialogHeader className="text-left">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                                    <FileText className="h-5 w-5 text-emerald-600" />
                                    Create Manual Corporate Quote
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs text-slate-600">
                                    Prepare and send commercial quotes with
                                    automated HSN taxes and itemized extras.
                                </DialogDescription>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                Step {currentStep} of {STEPS.length}
                            </span>
                        </div>
                    </DialogHeader>

                    {/* Stepper Navigation */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        {STEPS.map((s) => {
                            const Icon = s.icon;
                            const isActive = currentStep === s.id;
                            const isCompleted = currentStep > s.id;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        if (
                                            s.id < currentStep ||
                                            (s.id === 2 && isStep1Valid) ||
                                            (s.id === 3 &&
                                                isStep1Valid &&
                                                isStep2Valid)
                                        ) {
                                            setCurrentStep(s.id);
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-all",
                                        isActive
                                            ? "border-emerald-600 bg-white shadow-sm ring-1 ring-emerald-600"
                                            : isCompleted
                                              ? "border-slate-200 bg-emerald-50/60 text-slate-700 hover:bg-emerald-50"
                                              : "border-slate-200 bg-white/60 text-slate-400 opacity-60"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                            isActive
                                                ? "bg-emerald-600 text-white"
                                                : isCompleted
                                                  ? "bg-emerald-500 text-white"
                                                  : "bg-slate-200 text-slate-600"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="h-4 w-4 stroke-[2.5]" />
                                        ) : (
                                            s.id
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-slate-900">
                                            {s.title}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Body with Scroll */}
                <div className="max-h-[58vh] overflow-y-auto px-6 py-5">
                    {/* STEP 1: Customer & Consignee */}
                    {currentStep === 1 && (
                        <div className="space-y-5 animate-in fade-in-50">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <Building2 className="h-4 w-4 text-emerald-600" />
                                    Customer Contact Information
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Enter buyer details. Quote will be
                                    automatically linked to their corporate
                                    profile.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <LabelledInput
                                    label="Company name"
                                    required
                                    placeholder="e.g. Acme Enterprises Pvt Ltd"
                                    value={companyName}
                                    onChange={setCompanyName}
                                />
                                <LabelledInput
                                    label="Contact person"
                                    required
                                    placeholder="e.g. Rahul Sharma"
                                    value={contactPerson}
                                    onChange={setContactPerson}
                                />
                                <LabelledInput
                                    label="Customer email"
                                    required
                                    type="email"
                                    placeholder="e.g. procurement@acme.com"
                                    value={email}
                                    onChange={setEmail}
                                />
                                <LabelledInput
                                    label="Phone number"
                                    required
                                    type="tel"
                                    placeholder="e.g. +91 9876543210"
                                    value={phone}
                                    onChange={setPhone}
                                />
                                <LabelledInput
                                    label="Customer GSTIN"
                                    placeholder="Enter customer GSTIN"
                                    value={gstNumber}
                                    onChange={setGstNumber}
                                />
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-slate-600" />
                                        <h4 className="text-xs font-bold text-slate-900">
                                            Delivery / Consignee Address
                                            (Recommended)
                                        </h4>
                                    </div>
                                    <span className="text-[11px] text-slate-500">
                                        Pre-fills shipment and delivery challan
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <LabelledInput
                                        label="Street Address"
                                        placeholder="e.g. Tower B, 4th Floor, Electronic City Phase 1"
                                        value={deliveryAddress}
                                        onChange={setDeliveryAddress}
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <LabelledInput
                                            label="City"
                                            placeholder="e.g. Bengaluru"
                                            value={deliveryCity}
                                            onChange={setDeliveryCity}
                                        />
                                        <LabelledInput
                                            label="State"
                                            placeholder="e.g. Karnataka"
                                            value={deliveryState}
                                            onChange={setDeliveryState}
                                        />
                                        <LabelledInput
                                            label="6-Digit PIN Code"
                                            placeholder="e.g. 560100"
                                            maxLength={6}
                                            value={deliveryPincode}
                                            onChange={setDeliveryPincode}
                                        />
                                        <LabelledInput
                                            label="Country"
                                            placeholder="India"
                                            value={deliveryCountry}
                                            onChange={setDeliveryCountry}
                                        />
                                    </div>
                                    {deliveryPincode &&
                                    !/^\d{6}$/.test(deliveryPincode.trim()) ? (
                                        <p className="flex items-center gap-1 text-[11px] font-medium text-rose-600">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            PIN code must be exactly 6 digits.
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Product & Specifications */}
                    {currentStep === 2 && (
                        <div className="space-y-5 animate-in fade-in-50">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <Package className="h-4 w-4 text-emerald-600" />
                                    Product Selection & HSN Tax Association
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Selecting an apparel product type or HSN
                                    determines GST from its net per-piece base
                                    value, excluding customisation.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <CompactSelect
                                    label="Fulfilling Brand"
                                    required
                                    value={brandId}
                                    onChange={setBrandId}
                                    options={brandOptions.map((b) => ({
                                        value: b.id,
                                        label: `${b.name}${b.isActive ? "" : " (Inactive)"}`,
                                    }))}
                                />
                                <CompactSelect
                                    label="Product Type"
                                    value={productTypeId}
                                    onChange={handleProductTypeChange}
                                    options={(
                                        orderConfig?.productTypes ?? []
                                    ).map((pt) => ({
                                        value: pt.id,
                                        label: pt.name,
                                    }))}
                                    optional
                                />
                                <CompactSelect
                                    label="GSM Option"
                                    value={gsmOptionId}
                                    onChange={setGsmOptionId}
                                    options={(
                                        orderConfig?.gsmOptions ?? []
                                    ).map((gsm) => ({
                                        value: gsm.id,
                                        label: gsm.label,
                                    }))}
                                    optional
                                />
                                <CompactSelect
                                    label="Fabric Composition"
                                    value={fabricCompositionId}
                                    onChange={setFabricCompositionId}
                                    options={(
                                        orderConfig?.fabricCompositions ?? []
                                    ).map((fc) => ({
                                        value: fc.id,
                                        label: fc.name,
                                    }))}
                                    optional
                                />
                            </div>

                            {/* HSN Selection & Direct GST Link */}
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-emerald-700" />
                                        <h4 className="text-xs font-bold text-emerald-950">
                                            HSN Code & GST Rate Configuration
                                        </h4>
                                    </div>
                                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                        Active GST: {gstPercent}%
                                    </span>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <CompactSelect
                                        label="Select HSN from Master"
                                        value={
                                            selectedHsnMode === "manual"
                                                ? "manual"
                                                : selectedHsnId
                                        }
                                        onChange={handleHsnSelectChange}
                                        options={[
                                            ...(
                                                orderConfig?.hsnOptions ?? []
                                            ).map((h) => ({
                                                value: h.id,
                                                label: `${h.hsnCode} — ${h.description} (${h.gstRateBps / 100}%)`,
                                            })),
                                            {
                                                value: "manual",
                                                label: "✎ Enter Custom / Manual HSN Code",
                                            },
                                        ]}
                                        optional
                                    />

                                    {selectedHsnMode === "manual" ? (
                                        <LabelledInput
                                            label="Custom HSN Code"
                                            required
                                            placeholder="e.g. 61091000"
                                            value={manualHsnCode}
                                            onChange={handleManualHsnChange}
                                        />
                                    ) : (
                                        <div className="flex flex-col justify-end">
                                            <p className="text-[11px] text-slate-500">
                                                HSN Code:{" "}
                                                <span className="font-mono font-bold text-slate-800">
                                                    {activeHsnCode ||
                                                        "Auto (Apparel)"}
                                                </span>
                                                <br />
                                                Rate rules: ≤ ₹1,000 = 5% GST |
                                                &gt; ₹1,000 = 12% GST
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quantity & Unit Pricing */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <LabelledInput
                                    label="Quantity (Units)"
                                    required
                                    type="number"
                                    min={1}
                                    placeholder="100"
                                    value={quantity}
                                    onChange={setQuantity}
                                />
                                <LabelledInput
                                    label="Unit Sell Price (₹ excl. GST)"
                                    required
                                    type="number"
                                    min={1}
                                    placeholder="399"
                                    value={unitPrice}
                                    onChange={handleUnitPriceChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Extras, Taxes & Commercials */}
                    {currentStep === 3 && (
                        <div className="space-y-5 animate-in fade-in-50">
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <Sparkles className="h-4 w-4 text-emerald-600" />
                                    Optional Extras & Customizations
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Select optional extras or add manual custom
                                    charges. These will itemize on the invoice
                                    and add to taxable value.
                                </p>
                            </div>

                            {/* Predefined Extra Charge Rules */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-semibold text-slate-800">
                                    Predefined Extra Charges / Add-ons
                                </label>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {(orderConfig?.extraChargeRules ?? []).map(
                                        (rule) => {
                                            const isSelected =
                                                selectedExtraIds.includes(
                                                    rule.id
                                                );
                                            const costInr =
                                                rule.chargeType === "per_unit"
                                                    ? (rule.amountPaise *
                                                          qtyNum) /
                                                      100
                                                    : rule.amountPaise / 100;
                                            return (
                                                <div
                                                    key={rule.id}
                                                    onClick={() => {
                                                        setSelectedExtraIds(
                                                            (prev) =>
                                                                prev.includes(
                                                                    rule.id
                                                                )
                                                                    ? prev.filter(
                                                                          (
                                                                              id
                                                                          ) =>
                                                                              id !==
                                                                              rule.id
                                                                      )
                                                                    : [
                                                                          ...prev,
                                                                          rule.id,
                                                                      ]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "flex cursor-pointer select-none items-start justify-between rounded-lg border p-3 transition-all",
                                                        isSelected
                                                            ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                                                            : "border-slate-200 bg-white hover:border-slate-300"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {}}
                                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-900">
                                                                {rule.name}
                                                            </p>
                                                            <span className="text-[10px] text-slate-500">
                                                                {rule.chargeType ===
                                                                "per_unit"
                                                                    ? `₹${rule.amountPaise / 100} / unit`
                                                                    : `Flat ₹${rule.amountPaise / 100}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-800">
                                                        +
                                                        {formatINR(
                                                            costInr * 100
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            {/* Manual Custom Extra Entry */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                <h4 className="mb-2 text-xs font-bold text-slate-900">
                                    + Add Custom / Manual Extra Charge
                                </h4>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <LabelledInput
                                        label="Manual Extra Amount (₹)"
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        value={manualExtraAmount}
                                        onChange={setManualExtraAmount}
                                    />
                                    <LabelledInput
                                        label="Extra Description / Reason"
                                        placeholder="e.g. Special embroidery or custom packaging"
                                        value={manualExtraDescription}
                                        onChange={setManualExtraDescription}
                                    />
                                </div>
                            </div>

                            {/* Taxes & Commercial Terms */}
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-800">
                                            GST Rate (%)
                                        </label>
                                        {isGstManuallyOverridden ? (
                                            <span className="text-[10px] font-medium text-amber-600">
                                                (Manual Override)
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium text-emerald-600">
                                                (Auto HSN)
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        className="mt-1 h-9 text-xs"
                                        value={gstPercent}
                                        onChange={(e) => {
                                            setIsGstManuallyOverridden(true);
                                            setGstPercent(e.target.value);
                                        }}
                                    />
                                </div>

                                <LabelledInput
                                    label="Advance Required (%)"
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="30"
                                    value={advancePercent}
                                    onChange={setAdvancePercent}
                                />

                                <LabelledInput
                                    label="Quote Valid Until"
                                    type="date"
                                    value={validUntil}
                                    onChange={setValidUntil}
                                />
                            </div>

                            {/* Platform Commission & GST on Commission */}
                            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-emerald-600" />
                                    <span className="text-xs font-semibold text-slate-900">
                                        Platform Commission & Tax on Commission
                                    </span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <LabelledInput
                                        label="Commission Amount (₹)"
                                        type="number"
                                        min={0}
                                        placeholder="0"
                                        value={commissionAmount}
                                        onChange={setCommissionAmount}
                                    />
                                    <LabelledInput
                                        label="GST on Commission (%)"
                                        type="number"
                                        min={0}
                                        max={100}
                                        placeholder="18"
                                        value={commissionGstPercent}
                                        onChange={setCommissionGstPercent}
                                    />
                                </div>
                                {commissionAmountPaise > 0 && (
                                    <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                                        <span>
                                            Net Commission:{" "}
                                            <strong>
                                                {formatINR(
                                                    commissionAmountPaise
                                                )}
                                            </strong>{" "}
                                            + GST ({commissionGstPercentNum}%):{" "}
                                            <strong>
                                                {formatINR(
                                                    commissionGstAmountPaise
                                                )}
                                            </strong>
                                        </span>
                                        <span>
                                            Total:{" "}
                                            <strong>
                                                {formatINR(
                                                    commissionTotalPaise
                                                )}
                                            </strong>
                                        </span>
                                    </div>
                                )}
                            </div>

                            <LabelledInput
                                label="Commercial Notes & Enquiry Context"
                                placeholder="Terms, special SLA commitments, or client requests"
                                value={comments}
                                onChange={setComments}
                            />

                            {/* Clean Light-Themed Live Summary */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                                    <div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            Base Subtotal ({qtyNum} pcs)
                                        </div>
                                        <div className="mt-1 text-xs font-bold text-slate-800">
                                            {formatINR(subtotalPaise)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            Customization
                                        </div>
                                        <div className="mt-1 text-xs font-bold text-emerald-700">
                                            +
                                            {formatINR(
                                                extrasBreakdown.totalCustomizationPaise
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            GST on Base ({gstPercentNum}%)
                                        </div>
                                        <div className="mt-1 text-xs font-bold text-slate-800">
                                            {formatINR(baseGstPaise)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            GST on Custom (18%)
                                        </div>
                                        <div className="mt-1 text-xs font-bold text-slate-800">
                                            {formatINR(customizationGstPaise)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                            Total Amount
                                        </div>
                                        <div className="mt-1 text-sm font-extrabold text-slate-900">
                                            {formatINR(totalPaise)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2.5 text-xs text-slate-600">
                                    <span>
                                        Advance ({advancePercentNum}%):{" "}
                                        <strong className="text-slate-900">
                                            {formatINR(advancePaise)}
                                        </strong>
                                    </span>
                                    <span>
                                        Balance:{" "}
                                        <strong className="text-slate-900">
                                            {formatINR(balancePaise)}
                                        </strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3.5">
                    <div>
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 gap-1.5 text-xs"
                                onClick={() =>
                                    setCurrentStep((prev) =>
                                        Math.max(1, prev - 1)
                                    )
                                }
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Previous
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-9 text-xs text-slate-600 hover:text-slate-900"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>

                        {currentStep < 3 ? (
                            <Button
                                type="button"
                                className="h-9 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                                disabled={
                                    (currentStep === 1 && !isStep1Valid) ||
                                    (currentStep === 2 && !isStep2Valid)
                                }
                                onClick={() =>
                                    setCurrentStep((prev) =>
                                        Math.min(3, prev + 1)
                                    )
                                }
                            >
                                Next Step
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                className="h-9 gap-1.5 bg-emerald-600 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                                disabled={
                                    !canSubmit || createManualQuote.isPending
                                }
                                onClick={handleSubmit}
                            >
                                {createManualQuote.isPending ? (
                                    <>Creating Quote...</>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Create & Send Quote
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function LabelledInput({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
    maxLength,
    min,
    max,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    maxLength?: number;
    min?: number;
    max?: number;
}) {
    return (
        <div>
            <label className="text-xs font-semibold text-slate-800">
                {label}{" "}
                {required ? <span className="text-rose-500">*</span> : null}
            </label>
            <Input
                type={type}
                maxLength={maxLength}
                min={min}
                max={max}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 h-9 text-xs"
            />
        </div>
    );
}

function CompactSelect({
    label,
    value,
    onChange,
    options,
    optional,
    required,
}: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: Array<{ value: string; label: string }>;
    optional?: boolean;
    required?: boolean;
}) {
    return (
        <div>
            <label className="text-xs font-semibold text-slate-800">
                {label}{" "}
                {required ? <span className="text-rose-500">*</span> : null}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
                <option value="">
                    {optional ? "Not specified" : "Select option..."}
                </option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
