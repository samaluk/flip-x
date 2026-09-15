import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const skeletonVariants = cva("animate-pulse bg-muted", {
  variants: {
    radius: {
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    radius: "md",
  },
});

function Skeleton({
  className,
  radius = "md",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof skeletonVariants>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ radius }), className)}
      {...props}
    />
  );
}

export { Skeleton };
