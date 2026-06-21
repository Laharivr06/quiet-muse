import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export type PoemRow = {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  day_tag: string | null;
  is_locked: boolean;
  favorite: boolean;
  archived: boolean;
  status: string;
  word_count: number;
  created_at: string;
  updated_at: string;
};

const MOOD_VAR: Record<string, string> = {
  tender: "var(--color-mood-tender)",
  restless: "var(--color-mood-restless)",
  quiet: "var(--color-mood-quiet)",
  luminous: "var(--color-mood-luminous)",
  heavy: "var(--color-mood-heavy)",
  hopeful: "var(--color-mood-hopeful)",
  unsettled: "var(--color-mood-unsettled)",
  still: "var(--color-mood-still)",
  wistful: "var(--color-mood-wistful)",
  warm: "var(--color-mood-warm)",
};

export function moodColor(mood: string | null | undefined) {
  if (!mood) return "var(--color-border)";
  return MOOD_VAR[mood] ?? "var(--color-border)";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function PoemCard({ poem }: { poem: PoemRow }) {
  if (poem.is_locked) {
    return (
      <Link
        to="/poems/$id"
        params={{ id: poem.id }}
        className="block rounded-xl border border-border/60 bg-card p-5 transition hover:border-foreground/30"
      >
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(poem.updated_at)}</span>
          <Lock className="h-3.5 w-3.5" />
        </div>
        <h3 className="mt-3 font-serif text-xl text-foreground">
          {poem.title || <span className="italic text-muted-foreground">A secret kept</span>}
        </h3>
        <div className="mt-2 text-xs italic text-muted-foreground">Locked</div>
      </Link>
    );
  }
  const preview = (poem.content ?? "").split("\n").filter(Boolean).slice(0, 2).join(" / ");
  return (
    <Link
      to="/poems/$id"
      params={{ id: poem.id }}
      className="block rounded-xl border border-border/60 bg-card p-5 transition hover:border-foreground/30"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(poem.updated_at)}</span>
        <div className="flex items-center gap-2">
          {poem.status === "draft" && <span className="italic">draft</span>}
          {poem.mood && (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: moodColor(poem.mood) }}
              title={poem.mood}
            />
          )}
        </div>
      </div>
      <h3 className="mt-3 font-serif text-xl text-foreground">
        {poem.title || <span className="italic text-muted-foreground">Untitled</span>}
      </h3>
      {preview && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{preview}</p>}
    </Link>
  );
}
