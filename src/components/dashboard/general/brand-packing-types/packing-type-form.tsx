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

  const { data: brands } =
    trpc.general.brands.getAll.useQuery();
  const { data: productTypes } =
    trpc.general.productTypes.getProductTypes.useQuery();
  const { data: packingTypes } =
    trpc.general.packingTypes.getAll.useQuery({
      page: 1,
      limit: 100,
    });

  const { data } =
    trpc.general.brandProductTypePacking.getById.useQuery(
      { id: id! },
      { enabled: !!id }
    );

  useEffect(() => {
    if (data) form.reset(data);
  }, [data]);

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

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* Brand */}
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

      {/* Product Type */}
      <Select
        onValueChange={(v) =>
          form.setValue("productTypeId", v)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Product Type" />
        </SelectTrigger>
        <SelectContent>
          {productTypes?.data.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Packing Type */}
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
        <Checkbox {...form.register("isFragile")} />
        Fragile
      </label>

      <label className="flex items-center gap-2">
        <Checkbox {...form.register("shipsInOwnBox")} />
        Ships in Own Box
      </label>

      <label className="flex items-center gap-2">
        <Checkbox {...form.register("canOverride")} />
        Can Override
      </label>

      <Button type="submit" className="w-full">
        {id ? "Update Rule" : "Add Rule"}
      </Button>
    </form>
  );
}
