import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPoems, restorePoem, purgePoem } from "@/lib/poems.functions";
import { EmptyState } from "@/components/sanctuary/EmptyState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const opts = queryOptions({
  queryKey: ["poems", "trash"],
  queryFn: () => listPoems({ data: { trashed: true } }),
});

export const Route = createFileRoute("/_authenticated/trash")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: TrashPage,
});

function TrashPage() {
  const { data } = useSuspenseQuery(opts);
  const qc = useQueryClient();
  const restoreFn = useServerFn(restorePoem);
  const purgeFn = useServerFn(purgePoem);

  async function restore(id: string) {
    await restoreFn({ data: { id } });
    toast("Brought back.");
    qc.invalidateQueries({ queryKey: ["poems"] });
  }
  async function purge(id: string) {
    if (!confirm("Let this go forever?")) return;
    await purgeFn({ data: { id } });
    toast("Let go.");
    qc.invalidateQueries({ queryKey: ["poems"] });
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Released</p>
        <h1 className="mt-2 font-serif text-4xl italic text-foreground">Trash</h1>
      </header>
      {data.length === 0 ? (
        <EmptyState title="Nothing released yet." />
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4">
              <div className="min-w-0">
                <p className="truncate font-serif text-lg text-foreground">
                  {p.is_locked ? "A secret kept" : p.title || "Untitled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => restore(p.id)}>Restore</Button>
                <Button size="sm" variant="ghost" onClick={() => purge(p.id)}>Forever</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
