import type { ImageData, CompressOptions } from "../../types/types";
import { formatFileSize } from "../../utils/imageUtils";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Minimize2, Info, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompressToolProps {
  imageData: ImageData | null;
  options: CompressOptions;
  onOptionsChange: (options: CompressOptions) => void;
  onReset?: () => void;
}

const qualityPresets = [
  { name: "Low", quality: 50 },
  { name: "Medium", quality: 70 },
  { name: "High", quality: 85 },
  { name: "Maximum", quality: 95 },
];

export default function CompressTool({
  imageData,
  options,
  onOptionsChange,
  onReset,
}: CompressToolProps) {
  const { quality } = options;

  if (!imageData) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <p className="text-muted-foreground">Upload an image to compress</p>
      </div>
    );
  }

  const estimatedSize = Math.round((imageData.size * quality) / 100);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Minimize2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Compress</h2>
        </div>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        )}
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base">Quality: {quality}%</Label>
          <Slider
            value={[quality]}
            onValueChange={(vals) => onOptionsChange({ quality: vals[0] })}
            min={1}
            max={100}
            step={1}
            className="w-full py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Smaller</span>
            <span>Better quality</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-xl p-4 border text-center">
            <p className="text-xs text-muted-foreground mb-1">Original</p>
            <p className="text-lg font-bold">{formatFileSize(imageData.size)}</p>
          </div>
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 text-center">
            <p className="text-xs text-muted-foreground mb-1">Estimated</p>
            <p className="text-lg font-bold text-primary">
              {formatFileSize(estimatedSize)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {qualityPresets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onOptionsChange({ quality: preset.quality })}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium border transition-all",
                quality === preset.quality
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/30 border-border hover:bg-muted/50"
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div className="bg-muted/30 rounded-xl p-4 border flex gap-3">
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Quality 70–85% usually gives the best balance. PNG will be converted
            to JPEG for compression.
          </p>
        </div>
      </div>
    </div>
  );
}
