import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accentColor?: "blue" | "emerald" | "violet" | "amber";
  className?: string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    ring: "ring-blue-600/5",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    ring: "ring-emerald-600/5",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    ring: "ring-violet-600/5",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    ring: "ring-amber-600/5",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  accentColor = "blue",
  className,
}: StatsCardProps) {
  const colors = colorMap[accentColor];

  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-4 ring-1 ring-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground truncate">
            {title}
          </p>
          <p className="text-[28px] font-bold tracking-tight leading-tight mt-1">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-xs font-medium mt-1.5",
                trend.value >= 0 ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
            colors.bg,
            colors.ring
          )}
        >
          <Icon className={cn("h-[18px] w-[18px]", colors.icon)} />
        </div>
      </div>
    </div>
  );
}
