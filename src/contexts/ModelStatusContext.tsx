import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ModelSource, registerModelStatusUpdater } from "@/services/aiService";
import { toast } from "@/hooks/use-toast";

interface ModelStatusState {
  status: ModelSource;
  lastUpdated: number;
}

const ModelStatusContext = createContext<ModelStatusState>({
  status: "idle",
  lastUpdated: 0,
});

export const useModelStatus = () => useContext(ModelStatusContext);

export function ModelStatusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModelStatusState>({
    status: "idle",
    lastUpdated: Date.now(),
  });

  useEffect(() => {
    registerModelStatusUpdater((source) => {
      setState({ status: source, lastUpdated: Date.now() });
    });

    const handleFallback = () => {
      toast({
        title: "⚠️ Primary model unreachable",
        description: "MedGemma is unreachable. Switching to backup model...",
        duration: 4000,
      });
    };

    window.addEventListener("medgemma-fallback", handleFallback);
    return () => window.removeEventListener("medgemma-fallback", handleFallback);
  }, []);

  return (
    <ModelStatusContext.Provider value={state}>
      {children}
    </ModelStatusContext.Provider>
  );
}
