import type { ImageData, ConvertOptions, ImageFormat } from "../../types/types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConvertToolProps {
  imageData: ImageData | null;
  options: ConvertOptions;
  onOptionsChange: (options: ConvertOptions) => void;
  onReset?: () => void;
}

const formats: { value: ImageFormat; label: string }[] = [
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/gif", label: "GIF" },
];

export default function ConvertTool({
  imageData,
  options,
  onOptionsChange,
  onReset,
}: ConvertToolProps) {
  const { format: targetFormat, quality = 90 } = options;
  const showQuality =
    targetFormat === "image/jpeg" || targetFormat === "image/webp";

  if (!imageData) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <p className="text-muted-foreground">Upload an image to convert</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Convert</h2>
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
        <div className="space-y-3">
          <Label>Format</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {formats.map((f) => {
              const isSelected = targetFormat === f.value;
              const isCurrent = imageData.format === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  disabled={isCurrent}
                  onClick={() =>
                    onOptionsChange({
                      format: f.value,
                      quality: f.value === "image/jpeg" || f.value === "image/webp" ? quality : undefined,
                    })
                  }
                  className={cn(
                    "py-3 px-4 rounded-lg border text-sm font-medium transition-all",
                    isSelected && "bg-primary text-primary-foreground border-primary",
                    !isSelected && !isCurrent && "hover:bg-muted/50 border-border",
                    isCurrent && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="flex items-center justify-center gap-1">
                    {f.label}
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {showQuality && (
          <div className="space-y-2">
            <Label>Quality: {quality}%</Label>
            <Slider
              value={[quality]}
              onValueChange={(vals) =>
                onOptionsChange({ ...options, quality: vals[0] })
              }
              min={1}
              max={100}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
