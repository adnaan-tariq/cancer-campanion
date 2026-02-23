import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AudioBriefingPlayerProps {
  /** Pre-generated audio URL (data URI or blob URL) */
  audioUrl?: string;
  /** Text to generate audio from on-demand (lazy mode) */
  ttsText?: string;
  label?: string;
  isGenerating?: boolean;
}

const AudioBriefingPlayer = ({
  audioUrl,
  ttsText,
  label = "Audio Briefing",
  isGenerating = false,
}: AudioBriefingPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const effectiveUrl = audioUrl || generatedUrl;

  const generateAndPlay = useCallback(async () => {
    if (!ttsText) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("tts-generate", {
        body: { text: ttsText },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const url = `data:audio/mpeg;base64,${data.audioBase64}`;
      setGeneratedUrl(url);

      // Wait for audio element to update then play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
    } catch (e: any) {
      console.error("TTS error:", e);
      toast({
        title: "Audio generation failed",
        description: e?.message || "Could not generate audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [ttsText, toast]);

  const togglePlay = () => {
    // If no audio yet and we have ttsText, generate on-demand
    if (!effectiveUrl && ttsText) {
      generateAndPlay();
      return;
    }

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (isGenerating) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-sky-calm p-4">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-gentle">
          <Volume2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Generating audio briefing...</p>
          <p className="text-xs text-muted-foreground">This usually takes a few seconds</p>
        </div>
      </div>
    );
  }

  // Show player if we have audio OR ttsText (lazy mode)
  if (!effectiveUrl && !ttsText) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-sky-calm p-4">
      {effectiveUrl && (
        <audio ref={audioRef} src={effectiveUrl} onEnded={() => setIsPlaying(false)} />
      )}
      {!effectiveUrl && <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />}
      <Button
        onClick={togglePlay}
        size="icon"
        variant="default"
        className="h-10 w-10 rounded-full shrink-0"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Generating audio..." : effectiveUrl ? "Listen to your personalized briefing" : "Click play to generate audio"}
        </p>
      </div>
    </div>
  );
};

export default AudioBriefingPlayer;
