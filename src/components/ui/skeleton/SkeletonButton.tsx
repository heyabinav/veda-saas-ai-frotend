import { cn } from "@/lib/utils";
import Skeleton from "./Skeleton";

export default function SkeletonButton({
  width = 128,
  height = 40,
  className,
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <Skeleton
      rounded="lg"
      className={cn("shrink-0", className)}
      style={{ width, height }}
    />
  );
}
