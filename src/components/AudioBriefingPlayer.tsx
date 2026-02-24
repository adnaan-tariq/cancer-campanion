import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatSupabaseFunctionInvokeError } from "@/lib/formatSupabaseFunctionError";

interface AudioBriefingPlayerProps {
  audioUrl?: string;
  ttsText?: string;
  label?: string;
  isGenerating?: boolean;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [generatedUrl, audioUrl]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  };

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
        description: formatSupabaseFunctionInvokeError(e),
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

  if (!effectiveUrl && !ttsText) return null;

  const hasAudio = !!effectiveUrl;

  return (
    <div className="rounded-xl bg-sky-calm p-4 space-y-2.5">
      {effectiveUrl && <audio ref={audioRef} src={effectiveUrl} />}
      {!effectiveUrl && <audio ref={audioRef} />}
      <div className="flex items-center gap-3">
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
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Generating audio..." : hasAudio ? "Listen to your personalized briefing" : "Click play to generate audio"}
          </p>
        </div>
        {hasAudio && duration > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
      </div>
      {hasAudio && (
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="h-1.5 w-full rounded-full bg-primary/20 cursor-pointer group"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default AudioBriefingPlayer;
