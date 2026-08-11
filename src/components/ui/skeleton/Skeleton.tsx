import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export const skeletonRounded = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full",
} as const;

export type SkeletonRounded = keyof typeof skeletonRounded;

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: SkeletonRounded;
};

export default function Skeleton({
  className,
  rounded = "md",
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-skeleton=""
      className={cn("skeleton", skeletonRounded[rounded], className)}
      {...rest}
    />
  );
}
