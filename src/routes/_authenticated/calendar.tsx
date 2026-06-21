import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPoems } from "@/lib/poems.functions";
import { moodColor } from "@/components/sanctuary/PoemCard";
import { EmptyState } from "@/components/sanctuary/EmptyState";
import { useState } from "react";

const opts = queryOptions({
  queryKey: ["poems", "calendar"],
  queryFn: () => listPoems({ data: {} }),
});

export const Route = createFileRoute("/_authenticated/calendar")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: CalendarPage,
});

function CalendarPage() {
  const { data: poems } = useSuspenseQuery(opts);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const byDay = new Map<string, typeof poems>();
  for (const p of poems) {
    const k = new Date(p.created_at).toDateString();
    const arr = byDay.get(k) ?? [];
    arr.push(p);
    byDay.set(k, arr);
  }

  const monthStart = cursor;
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const startDow = monthStart.getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= monthEnd.getDate(); d++) {
    days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  }

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  if (poems.length === 0) {
    return (
      <div className="space-y-8">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">A quiet year</p>
          <h1 className="mt-2 font-serif text-4xl italic text-foreground">Calendar</h1>
        </header>
        <EmptyState title="Your days will appear here, one poem at a time." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">A quiet year</p>
          <h1 className="mt-2 font-serif text-4xl italic text-foreground">{monthLabel}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ←
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            →
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const items = byDay.get(d.toDateString()) ?? [];
          return (
            <div
              key={i}
              className="aspect-square rounded-lg border border-border/60 bg-card p-2 text-left"
            >
              <div className="text-xs text-muted-foreground">{d.getDate()}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {items.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to="/poems/$id"
                    params={{ id: p.id }}
                    title={p.is_locked ? "A secret kept" : p.title || "Untitled"}
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: moodColor(p.mood) }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
