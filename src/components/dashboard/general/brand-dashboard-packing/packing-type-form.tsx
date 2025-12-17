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
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

/* =========================
   FORM VALUES (NO BRAND ID)
========================= */
type FormValues = {
  productTypeId: string;// ✅ user selects
  packingTypeId: string | null;// ✅ user selects
  isFragile: boolean;// ✅ user selects
  shipsInOwnBox: boolean;// ✅ user selects
  canOverride: boolean;// 🔒 always FALSE for brand
};

export function BrandProductPackingForm({
  id, // ✅ packing rule id (edit only)
  onSuccess,
}: {
  id?: string;
  onSuccess: () => void;
}) {
  const router = useRouter();

  /* =========================
     FORM SETUP
  ========================= */
  const form = useForm<FormValues>({
    defaultValues: {
      productTypeId: "",
      packingTypeId: null,
      isFragile: false,
      shipsInOwnBox: false,
      canOverride: false, // 🔒 enforced
    },
  });

  /* =========================
     MASTER DATA
  ========================= */
const params = useParams();
const brandId = params?.bId as string;

const { data: productTypes } =
  trpc.general.productTypes.getByBrand.useQuery(
    { brandId },
    { enabled: !!brandId }
  );

useEffect(() => {
  form.setValue("productTypeId", "");
}, [brandId]);

  const { data: subCategories } =
    trpc.general.subCategories.getSubCategories.useQuery();

  const { data: packingTypes } =
    trpc.general.packingTypes.getAll.useQuery({
      page: 1,
      limit: 100,
    });

  /* =========================
     SUBCATEGORY MAP
  ========================= */
  const subCategoryMap = useMemo(() => {
    return new Map(
      subCategories?.data.map((s) => [s.id, s.name])
    );
  }, [subCategories]);

  /* =========================
     EDIT MODE (FETCH RULE)
  ========================= */
  const { data: packingRule } =
    trpc.brands.brandPacking.getById.useQuery(
      { id: id! },
      { enabled: !!id }
    );

  useEffect(() => {
    if (packingRule) {
      form.reset({
        ...packingRule,
        canOverride: false, // 🔒 force even on edit
      });
    }
  }, [packingRule, form]);

  /* =========================
     MUTATIONS
  ========================= */
  const create = trpc.brands.brandPacking.create.useMutation({
    onSuccess: () => {
      toast.success("Packing rule created");
      router.refresh(); // 🔥 refresh server table
      onSuccess();
    },
  });

  const update = trpc.brands.brandPacking.update.useMutation({
    onSuccess: () => {
      toast.success("Packing rule updated");
      router.refresh(); // 🔥 refresh server table
      onSuccess();
    },
  });

  /* =========================
     SUBMIT (FORCE canOverride = false)
  ========================= */
  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      canOverride: false, // 🔒 ALWAYS FALSE
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    id
      ? update.mutate({ id, ...payload })
      : create.mutate(payload);
  };

  /* =========================
     UI
  ========================= */
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* PRODUCT TYPE */}
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
         {productTypes?.map((p) => {
            const sub = subCategoryMap.get(p.subCategoryId);

            return (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
                {sub && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({sub})
                  </span>
                )}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* PACKING TYPE */}
      <Select
        value={form.watch("packingTypeId") ?? ""}
        onValueChange={(v) =>
          form.setValue("packingTypeId", v || null)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Packaging Delta" />
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

      {/* ❌ NO canOverride checkbox for Brand */}

      <Button type="submit" className="w-full">
        {id ? "Update Rule" : "Add Rule"}
      </Button>
    </form>
  );
}

/* =========================
   CHECKBOX COMPONENT
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
