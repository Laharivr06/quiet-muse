import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MOODS = [
  "tender", "restless", "quiet", "luminous", "heavy",
  "hopeful", "unsettled", "still", "wistful", "warm",
] as const;
const DAY_TAGS = [
  "Special", "Peaceful", "Healing", "Heavy",
  "Breakthrough", "Memory", "Letting Go", "Ordinary but Calm",
] as const;

function countWords(s: string) {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export const listPoems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    status?: "draft" | "saved";
    favorite?: boolean;
    archived?: boolean;
    trashed?: boolean;
    mood?: typeof MOODS[number];
    search?: string;
  } = {}) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("poems")
      .select("id,title,content,status,word_count,mood,day_tag,is_locked,favorite,archived,created_at,updated_at,last_opened_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });

    if (data.trashed) q = q.not("deleted_at", "is", null);
    else q = q.is("deleted_at", null);

    if (data.status) q = q.eq("status", data.status);
    if (data.favorite) q = q.eq("favorite", true);
    if (typeof data.archived === "boolean") q = q.eq("archived", data.archived);
    else if (!data.trashed) q = q.eq("archived", false);
    if (data.mood) q = q.eq("mood", data.mood);
    if (data.search) q = q.or(`title.ilike.%${data.search}%,content.ilike.%${data.search}%`);

    const { data: rows, error } = await q.limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPoem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("poems")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    // touch last_opened_at only
    await context.supabase
      .from("poems")
      .update({ last_opened_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    // never expose hash/content if locked
    if (row.is_locked) {
      return { ...row, content: "", lock_hash: null };
    }
    return { ...row, lock_hash: null };
  });

const savePoemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(200).nullable().optional(),
  content: z.string().default(""),
  status: z.enum(["draft", "saved"]).optional(),
  mood: z.enum(MOODS).nullable().optional(),
  day_tag: z.enum(DAY_TAGS).nullable().optional(),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const savePoem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => savePoemSchema.parse(d))
  .handler(async ({ data, context }) => {
    const word_count = countWords(data.content ?? "");
    if (data.id) {
      const { data: existing, error: e1 } = await context.supabase
        .from("poems")
        .select("title,content,mood,day_tag,favorite,archived,status,is_locked")
        .eq("id", data.id)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (e1) throw new Error(e1.message);
      if (!existing) throw new Error("Not found");
      if (existing.is_locked) throw new Error("Unlock the poem before editing it.");

      const next = {
        title: data.title ?? existing.title,
        content: data.content,
        status: data.status ?? existing.status,
        mood: data.mood ?? existing.mood,
        day_tag: data.day_tag ?? existing.day_tag,
        favorite: data.favorite ?? existing.favorite,
        archived: data.archived ?? existing.archived,
      };
      const changed =
        next.title !== existing.title ||
        next.content !== existing.content ||
        next.status !== existing.status ||
        next.mood !== existing.mood ||
        next.day_tag !== existing.day_tag ||
        next.favorite !== existing.favorite ||
        next.archived !== existing.archived;
      if (!changed) return { id: data.id, unchanged: true };

      const { error } = await context.supabase
        .from("poems")
        .update({
          ...next,
          word_count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { id: data.id, unchanged: false };
    }

    const { data: ins, error } = await context.supabase
      .from("poems")
      .insert({
        user_id: context.userId,
        title: data.title ?? null,
        content: data.content,
        status: data.status ?? "draft",
        word_count,
        mood: data.mood ?? null,
        day_tag: data.day_tag ?? null,
        favorite: data.favorite ?? false,
        archived: data.archived ?? false,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id, unchanged: false };
  });

export const deletePoem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("poems")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restorePoem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("poems")
      .update({ deleted_at: null })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const purgePoem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("poems")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; favorite: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("poems")
      .update({ favorite: data.favorite, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archivePoem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; archived: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("poems")
      .update({ archived: data.archived, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

function b64encode(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64decode(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function hashSecret(secret: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iter = 100_000;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: iter },
    key,
    256,
  );
  return `pbkdf2$${iter}$${b64encode(salt)}$${b64encode(new Uint8Array(bits))}`;
}
async function verifySecret(secret: string, stored: string): Promise<boolean> {
  if (!stored.startsWith("pbkdf2$")) {
    // Legacy bcrypt-format hash — no longer verifiable in this runtime.
    throw new Error("This poem was locked with an older method. Please clear the lock and set a new one.");
  }
  const [, iterStr, saltB64, hashB64] = stored.split("$");
  const iter = parseInt(iterStr, 10);
  const salt = b64decode(saltB64);
  const expected = b64decode(hashB64);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: iter },
      key,
      expected.length * 8,
    ),
  );
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
}

export const lockPoem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; secret: string }) => {
    if (!d.secret || d.secret.length < 4) throw new Error("Secret must be at least 4 characters.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const hash = await hashSecret(data.secret);
    const { error } = await context.supabase
      .from("poems")
      .update({ is_locked: true, lock_hash: hash, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unlockPoem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; secret: string; remove?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("poems")
      .select("id,title,content,mood,day_tag,favorite,archived,status,word_count,created_at,updated_at,last_opened_at,lock_hash")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row || !row.lock_hash) throw new Error("Not locked");
    const ok = await verifySecret(data.secret, row.lock_hash);
    if (!ok) throw new Error("That's not the right key.");

    if (data.remove) {
      const { error: e2 } = await context.supabase
        .from("poems")
        .update({ is_locked: false, lock_hash: null, updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (e2) throw new Error(e2.message);
    }
    // Strip hash from return; do NOT touch updated_at/last_opened_at on read-only unlock
    const { lock_hash: _h, ...rest } = row;
    void _h;
    return { ...rest, is_locked: !data.remove };
  });

export const forceClearLock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    // Only allow clearing legacy (non-pbkdf2) hashes without the key.
    const { data: row, error } = await context.supabase
      .from("poems")
      .select("lock_hash")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row?.lock_hash) return { ok: true };
    if (row.lock_hash.startsWith("pbkdf2$")) {
      throw new Error("Use the key to unlock this poem.");
    }
    const { error: e2 } = await context.supabase
      .from("poems")
      .update({ is_locked: false, lock_hash: null })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

export const getJournalStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("poems")
      .select("word_count,created_at,mood")
      .eq("user_id", context.userId)
      .is("deleted_at", null);
    if (error) throw new Error(error.message);
    const totalPoems = rows?.length ?? 0;
    const totalWords = (rows ?? []).reduce((a, r) => a + (r.word_count ?? 0), 0);
    const longest = (rows ?? []).reduce((m, r) => Math.max(m, r.word_count ?? 0), 0);
    const days = new Set((rows ?? []).map((r) => (r.created_at as string).slice(0, 10))).size;
    return { totalPoems, totalWords, longest, days };
  });
