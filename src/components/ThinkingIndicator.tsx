"use client";

import { useEffect, useState } from "react";

const THINKING_MESSAGES = [
  "Searching on web...",
  "Scanning sources...",
  "Reading pages...",
  "Analyzing results...",
  "Drafting answer...",
  "Generating final answer...",
];

export default function ThinkingIndicator() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => (a + 1) % THINKING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <span key={active} className="thinking-text-fade text-[15px] text-foreground/60">
      {THINKING_MESSAGES[active]}
    </span>
  );
}