import { createFileRoute, Link } from "@tanstack/react-router";
import { RotatingTagline } from "@/components/sanctuary/RotatingTagline";
import { Lock, Feather, Calendar, Heart, ShieldCheck, EyeOff } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sanctuary — A private poetry journal" },
      {
        name: "description",
        content:
          "A private place for poems, thoughts, and the feelings between them. Write freely, lock what matters, and receive gentle reflections without your words being rewritten.",
      },
      { property: "og:title", content: "Sanctuary — A private poetry journal" },
      {
        property: "og:description",
        content: "Write freely. Lock what matters. Reflect gently.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <header className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-2xl text-center">
          <div
            className="mb-6 text-xs uppercase tracking-[0.4em] text-muted-foreground"
            style={{ animation: "var(--animate-ink-fade)" }}
          >
            est. a quiet evening
          </div>
          <h1
            className="font-serif text-6xl italic leading-none text-foreground sm:text-7xl md:text-8xl"
            style={{ animation: "var(--animate-ink-fade)" }}
          >
            Sanctuary
          </h1>
          <p
            className="mx-auto mt-8 max-w-xl font-serif text-2xl leading-snug text-foreground/90 sm:text-3xl"
            style={{ animation: "var(--animate-ink-fade)", animationDelay: "120ms" }}
          >
            A private place for poems, thoughts, and the feelings between them.
          </p>
          <p
            className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground"
            style={{ animation: "var(--animate-ink-fade)", animationDelay: "240ms" }}
          >
            Write freely, lock what matters, and receive gentle emotional reflections
            without your words ever being rewritten.
          </p>
          <div
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animation: "var(--animate-ink-fade)", animationDelay: "360ms" }}
          >
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Get Started
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-transparent px-8 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Sign In
            </Link>
          </div>
          <div className="mt-14">
            <RotatingTagline />
          </div>
        </div>
      </header>

      <Divider />

      {/* What is Sanctuary */}
      <Section>
        <SectionHeading eyebrow="A quiet place" title="What is Sanctuary?" />
        <div className="mx-auto mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-foreground/85">
          <p>
            Sanctuary is a private notebook for the poems you don't want to perform.
            For lines that arrive at odd hours. For feelings that don't yet have a
            shape.
          </p>
          <p>
            There is no feed, no following, no audience. Only a page, your words,
            and — if you wish — a gentle reflection on the tone of what you've
            written.
          </p>
        </div>
      </Section>

      <Divider />

      {/* Why Sanctuary */}
      <Section>
        <SectionHeading eyebrow="Why" title="Why Sanctuary?" />
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          <Card
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Privacy by default"
            body="Your poems live in your account alone. No one else can see them — not other users, not the algorithm."
          />
          <Card
            icon={<Lock className="h-5 w-5" />}
            title="Per-poem locks"
            body="Lock individual poems with a PIN. Locked entries reveal nothing — not the title, not the first line."
          />
          <Card
            icon={<Feather className="h-5 w-5" />}
            title="Emotion-aware reflections"
            body="A short, gentle note about the tone of your poem. Never a rewrite. Never advice. Never a diagnosis."
          />
          <Card
            icon={<EyeOff className="h-5 w-5" />}
            title="No social features"
            body="No likes, comments, followers, or shares. Sanctuary is a journal, not a stage."
          />
        </div>
      </Section>

      <Divider />

      {/* How It Works */}
      <Section>
        <SectionHeading eyebrow="A simple rhythm" title="How It Works" />
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-4">
          {[
            { n: "01", t: "Write", d: "Open a blank page and begin." },
            { n: "02", t: "Save", d: "Your words are kept, quietly." },
            { n: "03", t: "Reflect", d: "A gentle note on the tone, if you'd like." },
            { n: "04", t: "Remember", d: "Return to any day. Any feeling." },
          ].map((step) => (
            <div key={step.n} className="text-center">
              <div className="font-serif text-sm italic text-muted-foreground">
                {step.n}
              </div>
              <div className="mt-2 font-serif text-2xl text-foreground">{step.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{step.d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* Key features */}
      <Section>
        <SectionHeading eyebrow="What's inside" title="Key Features" />
        <ul className="mx-auto mt-10 grid max-w-3xl gap-3 text-foreground/85 sm:grid-cols-2">
          {[
            { i: <Feather className="h-4 w-4" />, t: "A distraction-free editor" },
            { i: <Lock className="h-4 w-4" />, t: "Individual poem locks" },
            { i: <Calendar className="h-4 w-4" />, t: "A quiet mood calendar" },
            { i: <Heart className="h-4 w-4" />, t: "Favorites and archive" },
            { i: <EyeOff className="h-4 w-4" />, t: "Silence mode — no AI at all" },
            { i: <ShieldCheck className="h-4 w-4" />, t: "Gentle, non-clinical reflections" },
          ].map((f) => (
            <li key={f.t} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3">
              <span className="text-sage">{f.i}</span>
              <span className="text-sm">{f.t}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Divider />

      {/* Privacy promise */}
      <Section>
        <SectionHeading eyebrow="A promise" title="Privacy Promise" />
        <div className="mx-auto mt-8 max-w-2xl space-y-4 text-lg leading-relaxed text-foreground/85">
          <p>Your words are yours.</p>
          <p>
            Locked poems are protected by a passphrase only you know — we store
            only a one-way hash, never the secret itself.
          </p>
          <p>
            The reflection assistant never rewrites your poem, never names a
            condition, never offers advice. It speaks softly about the writing,
            never about you.
          </p>
          <p>No feeds. No likes. No sharing. No selling.</p>
        </div>
        <div className="mx-auto mt-10 max-w-xl text-center">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Begin your sanctuary
          </Link>
        </div>
      </Section>

      <footer className="border-t border-border/60 px-6 py-14 text-center">
        <p className="mx-auto max-w-xl font-serif text-lg italic leading-relaxed text-muted-foreground">
          Sanctuary is not a place to perform your words. It is a place to keep them.
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
          © Sanctuary
        </p>
      </footer>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="px-6 py-24 sm:py-32">{children}</section>;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{eyebrow}</div>
      <h2 className="mt-3 font-serif text-4xl italic text-foreground sm:text-5xl">{title}</h2>
    </div>
  );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3">
        <span className="text-sage">{icon}</span>
        <h3 className="font-serif text-xl text-foreground">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Divider() {
  return (
    <div className="mx-auto h-px w-24 bg-border" aria-hidden />
  );
}
