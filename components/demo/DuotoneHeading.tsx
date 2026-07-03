import { cn } from "@/lib/utils";

interface DuotoneHeadingProps {
  lead: string;
  fade: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  onDark?: boolean;
}

// Default sizes per heading level — can be overridden via className
const SIZE: Record<string, string> = {
  h1: "text-4xl sm:text-5xl lg:text-6xl",
  h2: "text-3xl sm:text-[2.25rem]",
  h3: "text-2xl sm:text-3xl",
};

export function DuotoneHeading({ lead, fade, as: Tag = "h2", className, onDark = false }: DuotoneHeadingProps) {
  return (
    <Tag className={cn("font-bold leading-tight tracking-tight", SIZE[Tag], className)}>
      <span className={onDark ? "text-white" : "text-stone-900"}>{lead} </span>
      <span className={onDark ? "text-white/40" : "text-stone-900/35"}>{fade}</span>
    </Tag>
  );
}
