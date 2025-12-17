"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  name?: string;
  baseLength: number;
  baseWidth: number;
  baseHeight: number;
  extraCm: number;
};

export function PackingTypeForm({
  id,
  onSuccess,
}: {
  id?: string;
  onSuccess: () => void;
}) {
  const utils = trpc.useUtils();

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      baseLength: 0,
      baseWidth: 0,
      baseHeight: 0,
      extraCm: 0, // ✅ default 0
    },
  });

  /* ================= EDIT MODE ================= */
  const { data } = trpc.general.packingTypes.getById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name ?? "",
        baseLength: data.baseLength,
        baseWidth: data.baseWidth,
        baseHeight: data.baseHeight,
        extraCm: data.extraCm ?? 0,
      });
    }
  }, [data, form]);

  /* ================= MUTATIONS ================= */
  const createMutation =
    trpc.general.packingTypes.create.useMutation({
      onSuccess: () => {
        toast.success("Packing type created");
        utils.general.packingTypes.getAll.invalidate();
        onSuccess();
      },
    });

  const updateMutation =
    trpc.general.packingTypes.update.useMutation({
      onSuccess: () => {
        toast.success("Packing type updated");
        utils.general.packingTypes.getAll.invalidate();
        onSuccess();
      },
    });

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      extraCm: values.extraCm ?? 0, // hard safety
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    id
      ? updateMutation.mutate({ id, ...payload })
      : createMutation.mutate(payload);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* HS CODE */}
      <div className="space-y-1">
        <label className="text-sm font-medium">HS Code</label>
        <Input
          placeholder="e.g. 420292"
          {...form.register("name")}
        />
      </div>

      {/* BASE LENGTH */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Base Length (cm)
        </label>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="e.g. 30"
          {...form.register("baseLength", {
            valueAsNumber: true,
          })}
        />
      </div>

      {/* BASE WIDTH */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Base Width (cm)
        </label>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="e.g. 20"
          {...form.register("baseWidth", {
            valueAsNumber: true,
          })}
        />
      </div>

      {/* BASE HEIGHT */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Base Height (cm)
        </label>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="e.g. 10"
          {...form.register("baseHeight", {
            valueAsNumber: true,
          })}
        />
      </div>

      {/* EXTRA CM */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Extra Cushion (cm)
        </label>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Default 0"
          {...form.register("extraCm", {
            valueAsNumber: true,
          })}
        />
        <p className="text-xs text-muted-foreground">
          Optional — default is 0
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createMutation.isLoading || updateMutation.isLoading}
      >
        {id ? "Update Packing Type" : "Create Packing Type"}
      </Button>
    </form>
  );
}
