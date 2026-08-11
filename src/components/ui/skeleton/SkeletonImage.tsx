"use client";

import {
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactEventHandler,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import Skeleton, { type SkeletonRounded } from "./Skeleton";

export default function SkeletonImage({
  children,
  className,
  skeletonClassName,
  rounded = "lg",
  fadeDuration = 400,
}: {
  children: ReactNode;
  className?: string;
  skeletonClassName?: string;
  rounded?: SkeletonRounded;
  fadeDuration?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const img = containerRef.current?.querySelector("img");
    if (img && img.complete) {
      setLoaded(true);
    }
  }, []);

  let child = children;
  if (isValidElement(children)) {
    const element = children as ReactElement<{ onLoad?: ReactEventHandler; onError?: ReactEventHandler }>;
    child = cloneElement(element, {
      onLoad: (e: React.SyntheticEvent) => {
        setLoaded(true);
        element.props.onLoad?.(e);
      },
      onError: (e: React.SyntheticEvent) => {
        setLoaded(true);
        element.props.onError?.(e);
      },
    });
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {!loaded && (
        <Skeleton
          rounded={rounded}
          className={cn("absolute inset-0", skeletonClassName)}
        />
      )}
      <div
        className={cn("relative transition-opacity ease-out", loaded ? "opacity-100" : "opacity-0")}
        style={{ transitionDuration: `${fadeDuration}ms` }}
      >
        {child}
      </div>
    </div>
  );
}
