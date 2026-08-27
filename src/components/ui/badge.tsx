import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

function Badge({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:size-3 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
        "border-transparent bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
