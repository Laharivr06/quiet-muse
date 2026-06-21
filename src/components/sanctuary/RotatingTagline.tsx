import { useEffect, useState } from "react";

const LINES = [
  "Some words are meant to be spoken. Others are meant to be kept safe.",
  "Not every feeling needs an audience.",
  "A poem can be a memory folded into words.",
];

export function RotatingTagline() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LINES.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-8 overflow-hidden text-center">
      {LINES.map((line, idx) => (
        <p
          key={idx}
          className="absolute inset-0 font-serif italic text-muted-foreground transition-opacity duration-1000"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
