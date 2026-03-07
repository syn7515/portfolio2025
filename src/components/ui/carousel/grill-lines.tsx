"use client";

import { useId } from "react";

/**
 * Theme-responsive schematic grill line art for carousel background.
 * Uses currentColor so parent can set color via e.g. text-stone-300 dark:text-zinc-700.
 */
export function GrillLines({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const clipId = `grill-lines-clip-${id}`;
  return (
    <svg
      className={`w-full h-full text-stone-300 dark:text-zinc-700 ${className ?? ""}`.trim()}
      width="100%"
      height="100%"
      viewBox="0 0 840 472"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g clipPath={`url(#${clipId})`}>
        <path d="M187.721 187.774H-584.642V217.927H187.721" stroke="currentColor" strokeWidth={0.5} />
        <rect x="621.701" y="324.869" width="85.3181" height="152.581" rx="3.75" stroke="currentColor" strokeWidth={0.5} />
        <rect x="187.971" y="-71.75" width="553.838" height="688.364" rx="4.75" stroke="currentColor" strokeWidth={0.5} />
        <rect x="234.359" y="-23.0435" width="372.925" height="521.367" rx="10.75" stroke="currentColor" strokeWidth={0.5} />
        <circle cx="665.52" cy="401.159" r="34.5411" stroke="currentColor" strokeWidth={0.5} />
        <path d="M741.737 157.038H900.611C941.143 157.038 974 189.895 974 230.426C974 270.957 941.143 303.815 900.611 303.815H741.737" stroke="currentColor" strokeWidth={0.5} />
        <path d="M741.737 197.361H900.611C919.763 197.361 935.289 212.887 935.289 232.039C935.289 251.191 919.763 266.717 900.611 266.717H741.737" stroke="currentColor" strokeWidth={0.5} />
        <path d="M-651.905 514.809L-567.649 506.945C-566.107 506.801 -564.927 505.507 -564.927 503.958V402.318H188" stroke="currentColor" strokeWidth={0.5} />
        <path d="M188 100.584H-276.023" stroke="currentColor" strokeWidth={0.5} />
        <path d="M-181.064 310.703L188 309.543" stroke="currentColor" strokeWidth={0.5} />
        <path d="M147.132 531.045V463.782H116.979V531.045" stroke="currentColor" strokeWidth={0.5} />
        <path d="M126.257 463.783V435.95H137.854V463.783" stroke="currentColor" strokeWidth={0.5} />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="840" height="472" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
