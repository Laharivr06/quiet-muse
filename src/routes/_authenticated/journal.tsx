import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPoems, getJournalStats } from "@/lib/poems.functions";
import { PoemCard } from "@/components/sanctuary/PoemCard";
import { EmptyState } from "@/components/sanctuary/EmptyState";
import { Button } from "@/components/ui/button";
import { Feather } from "lucide-react";

const recentOpts = queryOptions({
  queryKey: ["poems", "recent"],
  queryFn: () => listPoems({ data: {} }),
});
const statsOpts = queryOptions({
  queryKey: ["stats"],
  queryFn: () => getJournalStats({ data: undefined as never }),
});

export const Route = createFileRoute("/_authenticated/journal")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(recentOpts),
      context.queryClient.ensureQueryData(statsOpts),
    ]),
  component: Journal,
});

function Journal() {
  const { data: poems } = useSuspenseQuery(recentOpts);
  const { data: stats } = useSuspenseQuery(statsOpts);
  const visible = poems.filter((p) => !p.archived);
  const recent = visible.slice(0, 6);

  return (
    <div className="space-y-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Your journal</p>
          <h1 className="mt-2 font-serif text-5xl italic text-foreground">Today's page</h1>
        </div>
        <Button asChild>
          <Link to="/write"><Feather className="mr-2 h-4 w-4" /> Begin a poem</Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Poems" value={stats.totalPoems} />
        <Stat label="Words written" value={stats.totalWords} />
        <Stat label="Longest poem" value={stats.longest} />
        <Stat label="Days written" value={stats.days} />
      </div>

      <section>
        <h2 className="font-serif text-2xl italic text-foreground">Recent</h2>
        {recent.length === 0 ? (
          <EmptyState
            title="The page is waiting for your words."
            body="No poems yet."
            action={
              <Button asChild>
                <Link to="/write">Begin a poem</Link>
              </Button>
            }
          />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {recent.map((p) => (
              <PoemCard key={p.id} poem={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-5 text-center">
      <div className="font-serif text-3xl text-foreground">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
