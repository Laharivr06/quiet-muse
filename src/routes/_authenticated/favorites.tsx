import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPoems } from "@/lib/poems.functions";
import { PoemCard } from "@/components/sanctuary/PoemCard";
import { EmptyState } from "@/components/sanctuary/EmptyState";

const opts = queryOptions({
  queryKey: ["poems", "favorites"],
  queryFn: () => listPoems({ data: { favorite: true } }),
});

export const Route = createFileRoute("/_authenticated/favorites")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: Favorites,
});

function Favorites() {
  const { data } = useSuspenseQuery(opts);
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Kept close</p>
        <h1 className="mt-2 font-serif text-4xl italic text-foreground">Favorites</h1>
      </header>
      {data.length === 0 ? (
        <EmptyState title="Nothing has been set aside here yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{data.map((p) => <PoemCard key={p.id} poem={p} />)}</div>
      )}
    </div>
  );
}
