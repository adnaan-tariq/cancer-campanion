import { useModelStatus } from "@/contexts/ModelStatusContext";

const ModelStatusBadge = () => {
  const { status } = useModelStatus();

  if (status === "idle") return null;

  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col items-end gap-0.5">
      {status === "connecting" && (
        <span className="rounded-full bg-muted/80 backdrop-blur px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm border border-border/50">
          ⚪ Connecting to MedGemma…
        </span>
      )}
      {status === "MedGemma (Primary)" && (
        <span className="rounded-full bg-[hsl(var(--healing-green-light))] backdrop-blur px-2.5 py-1 text-[10px] font-medium text-[hsl(var(--healing-green))] shadow-sm border border-[hsl(var(--healing-green))]/20">
          🟢 MedGemma — Active
        </span>
      )}
      {status === "Claude Sonnet (Backup)" && (
        <div className="flex flex-col items-end gap-0.5">
          <span className="rounded-full bg-destructive/10 backdrop-blur px-2.5 py-1 text-[10px] font-medium text-destructive shadow-sm border border-destructive/20">
            🔴 MedGemma — Unreachable
          </span>
          <span className="rounded-full bg-[hsl(var(--healing-green-light))] backdrop-blur px-2.5 py-1 text-[10px] font-medium text-[hsl(var(--healing-green))] shadow-sm border border-[hsl(var(--healing-green))]/20">
            🟢 Claude Sonnet (Backup) — Active
          </span>
        </div>
      )}
    </div>
  );
};

export default ModelStatusBadge;
