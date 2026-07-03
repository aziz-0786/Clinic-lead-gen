import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KickerTagProps {
  icon: ReactNode;
  label: string;
  color: string;
  className?: string;
}

export function KickerTag({ icon, label, color, className }: KickerTagProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 mb-4", className)}>
      <span className="flex items-center justify-center w-5 h-5" style={{ color }}>
        {icon}
      </span>
      <span
        className="text-xs font-semibold uppercase tracking-[0.12em]"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
