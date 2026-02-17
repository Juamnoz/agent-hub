"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocaleStore } from "@/stores/locale-store";
import type { WeeklyMessageData } from "@/lib/mock-data";

interface MessageChartProps {
  data: WeeklyMessageData[];
}

export function MessageChart({ data }: MessageChartProps) {
  const { t } = useLocaleStore();
  const max = Math.max(...data.map((d) => d.messages), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.analytics.messagesThisWeek}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-40">
          {data.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{d.messages}</span>
              <div
                className="w-full bg-orange-500 rounded-t-sm min-h-[4px] transition-all"
                style={{ height: `${(d.messages / max) * 100}%` }}
              />
              <span className="text-xs text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
