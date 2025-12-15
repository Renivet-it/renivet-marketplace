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

type FormValues = {
  brandId: string;
  productTypeId: string;
  packingTypeId: string | null;
  isFragile: boolean;
  shipsInOwnBox: boolean;
  canOverride: boolean;
};

export function BrandProductPackingForm({
  id,
  onSuccess,
}: {
  id?: string;
  onSuccess: () => void;
}) {
  const utils = trpc.useUtils();

  const form = useForm<FormValues>({
    defaultValues: {
      brandId: "",
      productTypeId: "",
      packingTypeId: null,
      isFragile: false,
      shipsInOwnBox: false,
      canOverride: false,
    },
  });

  /* ===================== QUERIES ===================== */

  const { data: brands } =
    trpc.general.brands.getBrands.useQuery({
      page: 1,
      limit: 1000,
    });

  const { data: productTypes } =
    trpc.general.productTypes.getProductTypes.useQuery();

  const { data: subCategories } =
    trpc.general.subCategories.getSubCategories.useQuery();

  const { data: packingTypes } =
    trpc.general.packingTypes.getAll.useQuery({
      page: 1,
      limit: 1000,
    });

  const { data } =
    trpc.general.brandProductTypePacking.getById.useQuery(
      { id: id! },
      { enabled: !!id }
    );

  /* ===================== SUBCATEGORY MAP ===================== */

  const subCategoryMap = useMemo(() => {
    return new Map(
      subCategories?.data.map((s) => [s.id, s.name])
    );
  }, [subCategories]);

  /* ===================== EDIT MODE ===================== */

  useEffect(() => {
    if (data) form.reset(data);
  }, [data, form]);

  /* ===================== MUTATIONS ===================== */

  const create =
    trpc.general.brandProductTypePacking.create.useMutation({
      onSuccess: () => {
        toast.success("Rule created");
        utils.general.brandProductTypePacking.getAll.invalidate();
        onSuccess();
      },
    });

  const update =
    trpc.general.brandProductTypePacking.update.useMutation({
      onSuccess: () => {
        toast.success("Rule updated");
        utils.general.brandProductTypePacking.getAll.invalidate();
        onSuccess();
      },
    });

  const onSubmit = (values: FormValues) =>
    id
      ? update.mutate({ id, ...values })
      : create.mutate(values);

  /* ===================== UI ===================== */

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* BRAND */}
      <Select onValueChange={(v) => form.setValue("brandId", v)}>
        <SelectTrigger>
          <SelectValue placeholder="Select Brand" />
        </SelectTrigger>
        <SelectContent>
          {brands?.data.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* PRODUCT TYPE (WITH SUBCATEGORY) */}
      <Select
        onValueChange={(v) =>
          form.setValue("productTypeId", v)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Product Type" />
        </SelectTrigger>
        <SelectContent>
          {productTypes?.data.map((p) => {
            const subCategoryName = subCategoryMap.get(
              p.subCategoryId
            );

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

      {/* PACKING TYPE */}
      <Select
        onValueChange={(v) =>
          form.setValue("packingTypeId", v)
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
      <label className="flex items-center gap-2">
        <Checkbox
          checked={form.watch("isFragile")}
          onCheckedChange={(v) =>
            form.setValue("isFragile", !!v)
          }
        />
        Fragile
      </label>

      <label className="flex items-center gap-2">
        <Checkbox
          checked={form.watch("shipsInOwnBox")}
          onCheckedChange={(v) =>
            form.setValue("shipsInOwnBox", !!v)
          }
        />
        Ships in Own Box
      </label>

      <label className="flex items-center gap-2">
        <Checkbox
          checked={form.watch("canOverride")}
          onCheckedChange={(v) =>
            form.setValue("canOverride", !!v)
          }
        />
        Can Override
      </label>

      <Button type="submit" className="w-full">
        {id ? "Update Rule" : "Add Rule"}
      </Button>
    </form>
  );
}
