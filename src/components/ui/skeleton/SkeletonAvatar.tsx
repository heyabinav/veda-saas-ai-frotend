import { cn } from "@/lib/utils";
import Skeleton, { type SkeletonRounded } from "./Skeleton";

export default function SkeletonAvatar({
  size = 40,
  className,
  rounded = "full",
}: {
  size?: number;
  className?: string;
  rounded?: SkeletonRounded;
}) {
  return (
    <Skeleton
      className={cn("shrink-0", className)}
      rounded={rounded}
      style={{ width: size, height: size }}
    />
  );
}
