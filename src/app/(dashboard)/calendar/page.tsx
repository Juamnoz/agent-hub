import { Suspense } from "react";
import CalendarContent from "./_content";

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarContent />
    </Suspense>
  );
}
