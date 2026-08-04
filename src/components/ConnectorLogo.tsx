"use client";

import type { Connector } from "@/config/connectors";

const SIZES = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-14 w-14",
} as const;

type Size = keyof typeof SIZES;

export default function ConnectorLogo({
  connector,
  size = "md",
  className = "",
}: {
  connector: Connector;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${SIZES[size]} ${className}`}
    >
      <connector.icon
        className={`max-h-full max-w-full ${connector.logoClassName ?? ""}`}
      />
    </span>
  );
}
