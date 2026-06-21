import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { savePoem } from "@/lib/poems.functions";
import { analyzePoem, suggestTitles } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/write")({
  component: Write,
});

const DRAFT_KEY = (uid: string) => `sanctuary:draft:${uid}:new`;

function Write() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const saveFn = useServerFn(savePoem);
  const analyzeFn = useServerFn(analyzePoem);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [poemId, setPoemId] = useState<string | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const lastHash = useRef("");
  const saving = useRef(false);
  const titlesFn = useServerFn(suggestTitles);
  const uidRef = useRef<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      uidRef.current = data.user.id;
      const raw = localStorage.getItem(DRAFT_KEY(data.user.id));
      if (raw) {
  const [pendingPoemId, setPendingPoemId] = useState<string | null>(null);
        try {
          const d = JSON.parse(raw);
          if ((d.content || d.title) && confirm("Would you like to continue where you left off?")) {
            setTitle(d.title || "");
            setContent(d.content || "");
          } else {
            localStorage.removeItem(DRAFT_KEY(data.user.id));
          }
        } catch {
          // ignore malformed draft
        }
      }
    });
  }, []);

  // Local draft persistence
  useEffect(() => {
    if (!uidRef.current) return;
    const t = setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY(uidRef.current),
        JSON.stringify({ title, content, savedAt: Date.now() }),
      );
    }, 500);
    return () => clearTimeout(t);
  }, [title, content]);

  // Autosave
  useEffect(() => {
    const t = setTimeout(autosave, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  async function autosave() {
    const hash = title + "\u0000" + content;
    if (hash === lastHash.current) return;
    if (!content.trim() && !title.trim()) return;
    if (saving.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    saving.current = true;
    try {
      const res = await saveFn({
        data: { id: poemId ?? undefined, title: title || null, content, status: "draft" },
      });
      lastHash.current = hash;
      if (!poemId) setPoemId(res.id);
      setSavedAt(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      saving.current = false;
    }
  }

  async function handleSave() {
    if (!content.trim() && !title.trim()) {
      toast("Nothing to keep yet.");
      return;
    }
    saving.current = true;
    try {
      const res = await saveFn({
        data: { id: poemId ?? undefined, title: title || null, content, status: "saved" },
      });
      await analyzeFn({ data: { id: res.id, title: title || null, content } });
      qc.invalidateQueries({ queryKey: ["poem", res.id] });
      qc.invalidateQueries({ queryKey: ["poems"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      lastHash.current = title + "\u0000" + content;
      if (uidRef.current) localStorage.removeItem(DRAFT_KEY(uidRef.current));
      toast.success("Kept.");
      navigate({ to: "/poems/$id", params: { id: res.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      saving.current = false;
    }
  }

  async function suggestTitlesNow() {
    if (!content.trim()) {
      toast("Add a few lines first so I can suggest a title.");
      return;
    }
    const res = await titlesFn({ data: { content } });
    setTitles(res.titles);
    if (res.titles.length === 0) {
      toast("No titles came to mind.");
    }
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="!font-serif !text-3xl !italic !text-foreground !border-0 !bg-transparent px-0 placeholder:text-muted-foreground/60 focus-visible:!ring-0"
      />
      {titles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
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
        placeholder="Begin…"
        rows={20}
        className="mt-6 w-full resize-none border-0 bg-transparent font-serif text-xl leading-relaxed text-foreground placeholder:italic placeholder:text-muted-foreground/60 focus:outline-none"
      />
      <div className="sticky bottom-4 mt-8 flex items-center justify-between rounded-full border border-border/60 bg-card px-5 py-3 text-xs text-muted-foreground shadow-sm">
        <span>
          {wordCount} {wordCount === 1 ? "word" : "words"}
          {savedAt && <span className="ml-3 italic">draft saved {savedAt.toLocaleTimeString()}</span>}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { void suggestTitlesNow(); }}>
            <Sparkles className="mr-2 h-4 w-4" /> Help me name this
          </Button>
          <Button onClick={handleSave} size="sm">Keep this poem</Button>
        </div>
      </div>
    </div>
  );
}
