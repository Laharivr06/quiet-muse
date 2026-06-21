import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getPoem, savePoem } from "@/lib/poems.functions";
import { analyzePoem, suggestTitles } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";

const poemQuery = (id: string) =>
  queryOptions({ queryKey: ["poem", id], queryFn: () => getPoem({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/poems/$id_/edit")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(poemQuery(params.id)),
  component: Edit,
});

function Edit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: poem } = useSuspenseQuery(poemQuery(id));
  const saveFn = useServerFn(savePoem);
  const analyzeFn = useServerFn(analyzePoem);
  const titlesFn = useServerFn(suggestTitles);
  const [title, setTitle] = useState(poem.title ?? "");
  const [content, setContent] = useState(poem.content ?? "");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const lastHash = useRef(title + "\u0000" + content);
  const saving = useRef(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const hash = title + "\u0000" + content;
      if (hash === lastHash.current) return;
      if (!content.trim() && !title.trim()) return;
      if (saving.current) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      saving.current = true;
      try {
        await saveFn({ data: { id, title: title || null, content, status: poem.status as "draft" | "saved" } });
        lastHash.current = hash;
        setSavedAt(new Date());
      } catch (e) {
        console.error(e);
      } finally {
        saving.current = false;
      }
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  async function handleSave() {
    saving.current = true;
    try {
      await saveFn({ data: { id, title: title || null, content, status: "saved" } });
      qc.setQueryData(["poem", id], {
        ...poem,
        title: title || null,
        content,
        status: "saved",
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      });
      void analyzeFn({ data: { id, title: title || null, content } })
        .then(() => qc.invalidateQueries({ queryKey: ["poem", id] }))
        .catch(console.error);
      qc.invalidateQueries({ queryKey: ["poems"] });
      toast.success("Kept.");
      navigate({ to: "/poems/$id", params: { id } });
    } finally {
      saving.current = false;
    }
  }

  async function suggestTitlesNow() {
    const res = await titlesFn({ data: { content } });
    setTitles(res.titles);
    if (res.titles.length === 0) toast("No titles came to mind.");
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  if (poem.is_locked) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <Lock className="mx-auto h-6 w-6 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-3xl italic text-foreground">
          {poem.title || "This poem is locked"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Remove the lock before editing this poem.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/poems/$id", params: { id } })}>
          Return to poem
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="!font-serif !text-3xl !italic !text-foreground !border-0 !bg-transparent px-0 placeholder:text-muted-foreground/60 focus-visible:!ring-0"
      />
      {titles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {titles.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTitle(t)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs italic text-muted-foreground hover:text-foreground"
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={20}
        className="mt-6 w-full resize-none border-0 bg-transparent font-serif text-xl leading-relaxed text-foreground focus:outline-none"
      />
      <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-full border border-border/60 bg-card px-5 py-3 text-xs text-muted-foreground shadow-sm">
        <span>
          {wordCount} {wordCount === 1 ? "word" : "words"}
          {savedAt && <span className="ml-3 italic">saved {savedAt.toLocaleTimeString()}</span>}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={suggestTitlesNow}>
            <Sparkles className="mr-2 h-4 w-4" /> Help me name this
          </Button>
          <Button size="sm" onClick={handleSave}>Keep</Button>
        </div>
      </div>
    </div>
  );
}
