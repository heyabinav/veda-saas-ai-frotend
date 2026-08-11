import { cn } from "@/lib/utils";
import Skeleton from "./Skeleton";

export type SkeletonTextVariant = "heading" | "paragraph" | "meta";

const variantHeights: Record<SkeletonTextVariant, string> = {
  heading: "h-7",
  paragraph: "h-4",
  meta: "h-3",
};

export default function SkeletonText({
  lines = 3,
  variant = "paragraph",
  className,
  lastLineWidth = "w-3/5",
}: {
  lines?: number;
  variant?: SkeletonTextVariant;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("space-y-2.5", className)}>
      {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
        <Skeleton
          key={i}
          rounded="sm"
          className={cn(
            variantHeights[variant],
            i === lines - 1 ? lastLineWidth : "w-full"
          )}
        />
      ))}
    </div>
  );
}
