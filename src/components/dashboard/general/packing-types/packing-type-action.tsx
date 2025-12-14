"use client";

import { Button } from "@/components/ui/button-dash";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

export function PackingTypeAction({
  packingType,
}: {
  packingType: {
    id: string;
  };
}) {
  const utils = trpc.useUtils();

  const deleteMutation =
    trpc.general.packingTypes.deletePackingType.useMutation({
      onSuccess: () => {
        toast.success("Packing type deleted");
        utils.general.packingTypes.getPackingTypes.invalidate();
      },
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <Icons.MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            deleteMutation.mutate({ id: packingType.id })
          }
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
