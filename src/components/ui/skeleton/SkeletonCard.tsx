import { cn } from "@/lib/utils";
import Skeleton from "./Skeleton";
import SkeletonAvatar from "./SkeletonAvatar";
import SkeletonText from "./SkeletonText";

export default function SkeletonCard({
  className,
  image = false,
  avatar = false,
  lines = 3,
  footer = false,
}: {
  className?: string;
  image?: boolean;
  avatar?: boolean;
  lines?: number;
  footer?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-2xl border border-black/5 bg-white p-6 shadow-sm",
        className
      )}
    >
      {image && (
        <Skeleton rounded="lg" className="mb-5 aspect-[16/9] w-full" />
      )}
      <div className="flex items-start gap-3">
        {avatar && <SkeletonAvatar size={36} />}
        <div className="min-w-0 flex-1">
          <SkeletonText lines={lines} />
        </div>
      </div>
      {footer && (
        <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
          <Skeleton rounded="sm" className="h-3 w-1/4" />
          <Skeleton rounded="lg" className="h-8 w-20" />
        </div>
      )}
    </div>
  );
}
