// apps/desktop/src/components/DotLoader.tsx
// Implementation based on Engineering Playbook §D-20.2
export function DotLoader({ stage }: { stage: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{stage}</p>
    </div>
  );
}