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
    bg: "bg-orange-50 dark:bg-orange-500/15",
    icon: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-600/5 dark:ring-orange-400/10",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    icon: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-600/5 dark:ring-emerald-400/10",
  },
  violet: {
    bg: "bg-orange-50 dark:bg-orange-500/15",
    icon: "text-orange-600 dark:text-orange-400",
    ring: "ring-orange-600/5 dark:ring-orange-400/10",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-500/15",
    icon: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-600/5 dark:ring-amber-400/10",
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
        "rounded-2xl bg-card p-3 sm:p-4 ring-1 ring-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-[13px] font-medium text-muted-foreground leading-tight">
            {title}
          </p>
          <p className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight mt-0.5 sm:mt-1">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "text-[10px] sm:text-xs font-medium mt-1",
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
            "flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ring-1",
            colors.bg,
            colors.ring
          )}
        >
          <Icon className={cn("h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]", colors.icon)} />
        </div>
      </div>
    </div>
  );
}
