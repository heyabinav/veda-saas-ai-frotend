import { cn } from "@/lib/utils";
import Skeleton from "./Skeleton";
import SkeletonAvatar from "./SkeletonAvatar";

export default function SkeletonList({
  count = 5,
  avatar = true,
  trailing = true,
  className,
}: {
  count?: number;
  avatar?: boolean;
  trailing?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("divide-y divide-black/5", className)}>
      {Array.from({ length: Math.max(1, count) }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          {avatar && <SkeletonAvatar size={36} />}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton rounded="sm" className="h-3.5 w-3/4" />
            <Skeleton rounded="sm" className="h-3 w-1/2" />
          </div>
          {trailing && <Skeleton rounded="lg" className="h-7 w-16" />}
        </div>
      ))}
    </div>
  );
}
