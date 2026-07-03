"use client";
import { Users } from "lucide-react";

export function OpenChatButton({ color }: { color: string }) {
  return (
    <button
      className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
      style={{ backgroundColor: color }}
      onClick={() => {
        const el = document.querySelector('[aria-label="Open chat"]') as HTMLElement;
        el?.click();
      }}
    >
      <Users className="h-4 w-4" /> Chat with us now
    </button>
  );
}
