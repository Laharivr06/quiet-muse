export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h2 className="font-serif text-3xl italic text-foreground">{title}</h2>
      {body && <p className="mt-3 text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
