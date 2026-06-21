import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPoems } from "@/lib/poems.functions";
import { PoemCard } from "@/components/sanctuary/PoemCard";
import { EmptyState } from "@/components/sanctuary/EmptyState";
import { Button } from "@/components/ui/button";

const opts = queryOptions({
  queryKey: ["poems", "drafts"],
  queryFn: () => listPoems({ data: { status: "draft" } }),
});

export const Route = createFileRoute("/_authenticated/drafts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: Drafts,
});

function Drafts() {
  const { data } = useSuspenseQuery(opts);
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">In progress</p>
        <h1 className="mt-2 font-serif text-4xl italic text-foreground">Drafts</h1>
      </header>
      {data.length === 0 ? (
        <EmptyState
          title="Nothing in progress."
          body="Begin when you're ready."
          action={<Button asChild><Link to="/write">Begin a poem</Link></Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{data.map((p) => <PoemCard key={p.id} poem={p} />)}</div>
      )}
    </div>
  );
}
