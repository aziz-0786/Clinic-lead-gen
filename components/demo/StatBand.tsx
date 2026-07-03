"use client";
import { useCountUp } from "@/hooks/useCountUp";
import { useRef } from "react";

interface Stat {
  value: number;
  suffix: string;
  label: string;
  icon: string;
}

function StatItem({ stat, color }: { stat: Stat; color: string }) {
  const { value, ref } = useCountUp(stat.value, 2000);
  return (
    <div ref={ref as any} className="flex flex-col items-center text-center px-4">
      <span className="text-3xl mb-2">{stat.icon}</span>
      <div className="text-3xl md:text-4xl font-bold text-stone-900 tabular-nums">
        {value.toLocaleString("en-IN")}{stat.suffix}
      </div>
      <div className="text-sm text-stone-500 mt-1 font-medium">{stat.label}</div>
    </div>
  );
}

export function StatBand({ color }: { color: string }) {
  const stats: Stat[] = [
    { value: 15, suffix: "+", label: "Years of Practice", icon: "🏅" },
    { value: 10000, suffix: "+", label: "Patients Served", icon: "👥" },
    { value: 4, suffix: ".9 / 5", label: "Patient Rating", icon: "⭐" },
    { value: 6, suffix: " days", label: "Open Every Week", icon: "📅" },
  ];

  return (
    <div className="bg-white border-y border-stone-100 py-12">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-stone-100">
        {stats.map((s, i) => (
          <StatItem key={i} stat={s} color={color} />
        ))}
      </div>
    </div>
  );
}
