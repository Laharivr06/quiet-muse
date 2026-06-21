import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getPoem,
  toggleFavorite,
  archivePoem,
  deletePoem,
  lockPoem,
  unlockPoem,
} from "@/lib/poems.functions";
import { moodColor } from "@/components/sanctuary/PoemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Heart, Archive, Trash2, Lock, Unlock, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/poems/$id")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(poemQuery(params.id)),
  component: View,
});

const poemQuery = (id: string) =>
  queryOptions({
    queryKey: ["poem", id],
    queryFn: () => getPoem({ data: { id } }),
  });

function View() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: poem } = useSuspenseQuery(poemQuery(id));
  const favFn = useServerFn(toggleFavorite);
  const archFn = useServerFn(archivePoem);
  const delFn = useServerFn(deletePoem);
  const lockFn = useServerFn(lockPoem);
  const unlockFn = useServerFn(unlockPoem);

  const [unlockOpen, setUnlockOpen] = useState(poem.is_locked);
  const [unlockMode, setUnlockMode] = useState<"view" | "remove">("view");
  const [lockOpen, setLockOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState<typeof poem | null>(null);
  const [reflectionOpen, setReflectionOpen] = useState(false);

  const display = unlocked ?? poem;

  useEffect(() => {
    if (!display.ai_reflection) return;
    setReflectionOpen(true);
  }, [display.ai_reflection]);
  const showLocked = poem.is_locked && !unlocked;
  const canEdit = !display.is_locked;

  async function doFav() {
    await favFn({ data: { id, favorite: !display.favorite } });
    qc.invalidateQueries({ queryKey: ["poem", id] });
    qc.invalidateQueries({ queryKey: ["poems"] });
  }
  async function doArchive() {
    await archFn({ data: { id, archived: !display.archived } });
    toast(display.archived ? "Brought back." : "Sent to archive.");
    qc.invalidateQueries({ queryKey: ["poems"] });
    navigate({ to: "/journal" });
  }
  async function doDelete() {
    if (!confirm("Release this poem to the trash?")) return;
    await delFn({ data: { id } });
    toast("Released.");
    qc.invalidateQueries({ queryKey: ["poems"] });
    navigate({ to: "/journal" });
  }
  async function doUnlock(e: React.FormEvent) {
    e.preventDefault();
    try {
      const removing = unlockMode === "remove";
      const res = await unlockFn({ data: { id, secret, remove: removing } });
      setUnlocked(res as never);
      setUnlockOpen(false);
      setSecret("");
      if (removing) {
        toast("Lock removed.");
        // Write fresh poem into cache so the edit route's loader sees unlocked data
        qc.setQueryData(["poem", id], res);
        qc.invalidateQueries({ queryKey: ["poems"] });
      } else {
        // View-only unlock: update cache with full content too
        qc.setQueryData(["poem", id], res);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wrong key.");
    }
  }
  async function doLock(e: React.FormEvent) {
    e.preventDefault();
    if (secret.length < 4) {
      toast.error("Use at least 4 characters.");
      return;
    }
    await lockFn({ data: { id, secret } });
    toast("Locked.");
    setLockOpen(false);
    setSecret("");
    setUnlocked(null);
    qc.invalidateQueries({ queryKey: ["poem", id] });
    qc.invalidateQueries({ queryKey: ["poems"] });
  }
  async function doRemoveLock() {
    setUnlockMode("remove");
    setUnlockOpen(true);
  }

  return (
    <article className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{new Date(display.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</span>
        <div className="flex items-center gap-2">
          {display.mood && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: moodColor(display.mood) }} />
              <span className="italic">{display.mood}</span>
            </span>
          )}
          {display.day_tag && <span>· {display.day_tag}</span>}
        </div>
      </div>

      <h1 className="mt-4 font-serif text-4xl italic text-foreground">
        {display.title || <span className="text-muted-foreground">Untitled</span>}
      </h1>

      {showLocked ? (
        <div className="mt-12 rounded-2xl border border-border/60 bg-card p-10 text-center">
          <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">This poem is locked.</p>
          <Button className="mt-6" onClick={() => { setUnlockMode("view"); setUnlockOpen(true); }}>Unlock</Button>
        </div>
      ) : (
        <div className="mt-8 whitespace-pre-wrap font-serif text-xl leading-relaxed text-foreground">
          {display.content}
        </div>
      )}

      {!showLocked && display.ai_reflection && (
        <div className="mt-10 rounded-2xl border border-border/60 bg-secondary/40 p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">A reflection</p>
          <p className="mt-3 font-serif text-lg italic text-foreground">{display.ai_reflection}</p>
          {display.highlighted_line && (
            <p className="mt-3 border-l-2 border-border pl-3 font-serif text-sm italic text-muted-foreground">
              {display.highlighted_line}
            </p>
          )}
        </div>
      )}

      <Dialog open={reflectionOpen} onOpenChange={setReflectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl italic">A reflection</DialogTitle>
            <DialogDescription>Here’s a gentle note for this poem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="font-serif text-lg italic text-foreground">{display.ai_reflection}</p>
            {display.highlighted_line && (
              <p className="border-l-2 border-border pl-3 font-serif text-sm italic text-muted-foreground">
                {display.highlighted_line}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setReflectionOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!showLocked && (
        <div className="mt-10 flex flex-wrap items-center gap-2">
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link to="/poems/$id/edit" params={{ id }}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={doFav}>
            <Heart className={`mr-2 h-4 w-4 ${display.favorite ? "fill-current" : ""}`} />
            {display.favorite ? "Set aside" : "Set aside"}
          </Button>
          {display.is_locked ? (
            <Button variant="outline" size="sm" onClick={doRemoveLock}>
              <Unlock className="mr-2 h-4 w-4" /> Remove lock
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setLockOpen(true)}>
              <Lock className="mr-2 h-4 w-4" /> Lock
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={doArchive}>
            <Archive className="mr-2 h-4 w-4" /> {display.archived ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="ghost" size="sm" onClick={doDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Release
          </Button>
        </div>
      )}

      <Dialog open={unlockOpen} onOpenChange={setUnlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl italic">
              {unlockMode === "remove" ? "Remove this lock" : "Unlock this poem"}
            </DialogTitle>
            <DialogDescription>
              {unlockMode === "remove"
                ? "Enter the key to remove the lock and allow editing again."
                : "Enter the key you set when you locked it."}
            </DialogDescription>
            </DialogHeader>
          <form onSubmit={doUnlock} className="space-y-4">
            <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} autoFocus />
            <DialogFooter>
              <Button type="submit">{unlockMode === "remove" ? "Remove lock" : "Unlock"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={lockOpen} onOpenChange={setLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl italic">Lock this poem</DialogTitle>
            <DialogDescription>
              Set a key (at least 4 characters). Keep it somewhere safe — there's no recovery.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={doLock} className="space-y-4">
            <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} minLength={4} autoFocus />
            <DialogFooter>
              <Button type="submit">Lock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  );
}
