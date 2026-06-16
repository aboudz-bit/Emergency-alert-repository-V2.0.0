import { Card } from "@/components/ui/Card";

export function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <h1 className="mb-3 text-lg font-medium">{title}</h1>
      <Card>
        <p className="text-sm text-[var(--keas-text-secondary)]">
          This page is delivered in Phase {phase}. The app shell, routing, shared data model
          (<code>@workspace/keas-core</code>), theme tokens, and React Query are already in place.
        </p>
      </Card>
    </div>
  );
}
