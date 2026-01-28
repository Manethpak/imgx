import type { ImageData, TransformOptions } from "../../types/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

interface TransformToolProps {
  imageData: ImageData | null;
  options: TransformOptions;
  onOptionsChange: (options: TransformOptions) => void;
  onReset?: () => void;
}

export default function TransformTool({
  imageData,
  options,
  onOptionsChange,
  onReset,
}: TransformToolProps) {
  const { angle, horizontal, vertical, skewX, skewY } = options;

  if (!imageData) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <p className="text-muted-foreground">Upload an image to transform</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Transform</h2>
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
          <Label>Rotate: {angle}°</Label>
          <Slider
            value={[angle]}
            onValueChange={(v) => onOptionsChange({ ...options, angle: v[0] })}
            min={-180}
            max={180}
            step={1}
            className="w-full"
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
          <Label htmlFor="flip-h" className="text-base">
            Flip horizontal
          </Label>
          <Switch
            id="flip-h"
            checked={horizontal}
            onCheckedChange={(checked) =>
              onOptionsChange({ ...options, horizontal: checked })
            }
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
          <Label htmlFor="flip-v" className="text-base">
            Flip vertical
          </Label>
          <Switch
            id="flip-v"
            checked={vertical}
            onCheckedChange={(checked) =>
              onOptionsChange({ ...options, vertical: checked })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Skew X: {skewX}°</Label>
          <Slider
            value={[skewX]}
            onValueChange={(v) => onOptionsChange({ ...options, skewX: v[0] })}
            min={-45}
            max={45}
            step={1}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Skew Y: {skewY}°</Label>
          <Slider
            value={[skewY]}
            onValueChange={(v) => onOptionsChange({ ...options, skewY: v[0] })}
            min={-45}
            max={45}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
