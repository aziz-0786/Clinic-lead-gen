"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
        <p className="text-sm text-slate-500">An unexpected error occurred. This has been logged.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
