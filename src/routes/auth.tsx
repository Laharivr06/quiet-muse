import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,

  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      throw redirect({
        to: "/journal",
      });
    }
  },

  head: () => ({
    meta: [
      { title: "Sign in — Sanctuary" },
      { name: "description", content: "Open or create your private Sanctuary." },
    ],
  }),

  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/journal`,
          },
        });
        if (error) throw error;
        toast.success("Your sanctuary is ready.");
        navigate({
  to: "/journal",
  replace: true,
});
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({
  to: "/journal",
  replace: true,
});
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went quiet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
  setLoading(true);

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) throw error;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Sign-in failed.");
    setLoading(false);
  }
}

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link to="/" className="inline-block font-serif text-4xl italic text-foreground">
            Sanctuary
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "signup" ? "Begin a quiet place of your own." : "Welcome back."}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border/60 bg-card p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {mode === "signup" ? "Create sanctuary" : "Open sanctuary"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have one?" : "New here?"}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline-offset-2 hover:underline"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup" ? "Sign in" : "Create a sanctuary"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to landing</Link>
        </p>
      </div>
    </div>
  );
}
