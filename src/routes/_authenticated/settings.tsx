import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSettings, updateSettings, getProfile, updateProfile } from "@/lib/settings.functions";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const sOpts = queryOptions({ queryKey: ["settings"], queryFn: () => getSettings({ data: undefined as never }) });
const pOpts = queryOptions({ queryKey: ["profile"], queryFn: () => getProfile({ data: undefined as never }) });

export const Route = createFileRoute("/_authenticated/settings")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(sOpts),
      context.queryClient.ensureQueryData(pOpts),
    ]),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings } = useSuspenseQuery(sOpts);
  const { data: profile } = useSuspenseQuery(pOpts);
  const qc = useQueryClient();
  const updFn = useServerFn(updateSettings);
  const profFn = useServerFn(updateProfile);
  const [name, setName] = useState(profile?.name ?? "");

  useEffect(() => {
    if (settings?.dark_mode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [settings?.dark_mode]);

  async function toggle(key: string, value: boolean) {
    await updFn({ data: { [key]: value } as never });
    qc.invalidateQueries({ queryKey: ["settings"] });
  }
  async function saveName() {
    await profFn({ data: { name: name || null } });
    toast.success("Saved.");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="mx-auto max-w-xl space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">A quiet workshop</p>
        <h1 className="mt-2 font-serif text-4xl italic text-foreground">Settings</h1>
      </header>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-serif text-xl text-foreground">Your name</h2>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
          <Button onClick={saveName}>Save</Button>
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-border/60 bg-card p-6">
        <Row
          label="Silence Mode"
          help="Hide all reflections and mood notes. AI never runs."
          value={settings.silence_mode}
          onChange={(v) => toggle("silence_mode", v)}
        />
        <Row
          label="Gentle reminders"
          help="One soft browser notification if you've been away a while."
          value={settings.notifications_enabled}
          onChange={(v) => toggle("notifications_enabled", v)}
        />
        <Row
          label="Dark mode"
          help="Evening light, lower contrast."
          value={settings.dark_mode}
          onChange={(v) => toggle("dark_mode", v)}
        />
      </section>
    </div>
  );
}

function Row({
  label, help, value, onChange,
}: { label: string; help: string; value: boolean; onChange: (v: boolean) => void }) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id} className="font-serif text-lg">{label}</Label>
        <p className="text-sm text-muted-foreground">{help}</p>
      </div>
      <Switch id={id} checked={value} onCheckedChange={onChange} />
    </div>
  );
}
