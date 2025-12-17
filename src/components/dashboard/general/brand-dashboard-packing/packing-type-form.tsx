"use client";

import { Button } from "@/components/ui/button-dash";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-dash";
import { trpc } from "@/lib/trpc/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

/* =========================
   FORM VALUES (NO BRAND ID)
========================= */
type FormValues = {
  productTypeId: string;// ✅ PRODUCT TYPE (USER SELECTS)
  packingTypeId: string | null; // ✅ PACKING TYPE (USER SELECTS)
  isFragile: boolean;// ✅ FLAG
  shipsInOwnBox: boolean;// ✅ FLAG
  canOverride: boolean;// ✅ FLAG
};

export function BrandProductPackingForm({
  id,// ✅ PACKING RULE ID (ONLY FOR EDIT)
  onSuccess,
}: {
  id?: string;
  onSuccess: () => void;
}) {
  const utils = trpc.useUtils();

  /* =========================
     FORM SETUP
  ========================= */
  const form = useForm<FormValues>({
    defaultValues: {
      productTypeId: "",
      packingTypeId: null,
      isFragile: false,
      shipsInOwnBox: false,
      canOverride: false,
    },
  });

  /* =========================
     MASTER DATA (DROPDOWNS)
  ========================= */
  const { data: productTypes } =
    trpc.general.productTypes.getProductTypes.useQuery();
const { data: subCategories } =
  trpc.general.subCategories.getSubCategories.useQuery();

  const { data: packingTypes } =
    trpc.general.packingTypes.getAll.useQuery({
      page: 1,
      limit: 100,
    });
const router = useRouter();

  /* =========================
     EDIT MODE (FETCH RULE)
     🔴 NOT BRAND
  ========================= */
  const { data: packingRule } =
    trpc.brands.brandPacking.getById.useQuery(
      { id: id! },
      { enabled: !!id }
    );

const subCategoryMap = useMemo(() => {
  return new Map(
    subCategories?.data.map((s) => [s.id, s.name])
  );
}, [subCategories]);

  useEffect(() => {
    if (packingRule) {
      form.reset(packingRule);
    }
  }, [packingRule, form]);

  /* =========================
     MUTATIONS
  ========================= */
const create = trpc.brands.brandPacking.create.useMutation({
  onSuccess: () => {
    toast.success("Packing rule created");
    router.refresh(); // 🔥 THIS reloads table data
    onSuccess();
  },
});

const update = trpc.brands.brandPacking.update.useMutation({
  onSuccess: () => {
    toast.success("Packing rule updated");
    router.refresh(); // 🔥 REQUIRED
    onSuccess();
  },
});


  /* =========================
     SUBMIT
  ========================= */
  const onSubmit = (values: FormValues) =>
    id
      ? update.mutate({ id, ...values })
      : create.mutate(values);

  /* =========================
     UI
  ========================= */
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* PRODUCT TYPE (WHAT PRODUCT?) */}
      <Select
        value={form.watch("productTypeId")}
        onValueChange={(v) =>
          form.setValue("productTypeId", v)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Product Type" />
        </SelectTrigger>
        <SelectContent>
{productTypes?.data.map((p) => {
  const subCategoryName = subCategoryMap.get(p.subCategoryId);

  return (
    <SelectItem key={p.id} value={p.id}>
      {p.name}
      {subCategoryName && (
        <span className="text-muted-foreground">
          {" "}
          ({subCategoryName})
        </span>
      )}
    </SelectItem>
  );
})}

        </SelectContent>
      </Select>

      {/* PACKING TYPE (HOW TO PACK?) */}
      <Select
        value={form.watch("packingTypeId") ?? ""}
        onValueChange={(v) =>
          form.setValue("packingTypeId", v || null)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Packing Type" />
        </SelectTrigger>
        <SelectContent>
          {packingTypes?.data.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* FLAGS */}
      <CheckboxRow label="Fragile" name="isFragile" form={form} />
      <CheckboxRow
        label="Ships in Own Box"
        name="shipsInOwnBox"
        form={form}
      />
      <CheckboxRow
        label="Can Override"
        name="canOverride"
        form={form}
      />

      <Button type="submit" className="w-full">
        {id ? "Update Rule" : "Add Rule"}
      </Button>
    </form>
  );
}

/* =========================
   REUSABLE CHECKBOX
========================= */
function CheckboxRow({ label, name, form }: any) {
  return (
    <label className="flex items-center gap-2">
      <Checkbox
        checked={form.watch(name)}
        onCheckedChange={(v) =>
          form.setValue(name, !!v)
        }
      />
      {label}
    </label>
  );
}
