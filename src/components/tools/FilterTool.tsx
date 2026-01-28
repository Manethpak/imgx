import type { ImageData, FilterOptions } from "../../types/types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wand2, RotateCcw } from "lucide-react";

interface FilterToolProps {
  imageData: ImageData | null;
  options: FilterOptions;
  onOptionsChange: (options: FilterOptions) => void;
  onReset?: () => void;
}

export default function FilterTool({
  imageData,
  options,
  onOptionsChange,
  onReset,
}: FilterToolProps) {
  const brightness = options.brightness ?? 1;
  const contrast = options.contrast ?? 1;
  const grayscale = options.grayscale ?? 0;
  const sepia = options.sepia ?? 0;
  const invert = options.invert ?? 0;
  const blur = options.blur ?? 0;
  const opacity = options.opacity ?? 1;

  const update = (patch: Partial<FilterOptions>) => {
    onOptionsChange({ ...options, ...patch });
  };

  if (!imageData) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <p className="text-muted-foreground">Upload an image to apply filters</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Filter</h2>
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
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Opacity: {(opacity * 100).toFixed(0)}%</Label>
          <Slider
            value={[opacity * 100]}
            onValueChange={(v) => update({ opacity: v[0] / 100 })}
            min={1}
            max={100}
            step={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Brightness: {(brightness * 100).toFixed(0)}%</Label>
          <Slider
            value={[brightness * 100]}
            onValueChange={(v) => update({ brightness: v[0] / 100 })}
            min={10}
            max={200}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Contrast: {(contrast * 100).toFixed(0)}%</Label>
          <Slider
            value={[contrast * 100]}
            onValueChange={(v) => update({ contrast: v[0] / 100 })}
            min={10}
            max={200}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Grayscale: {(grayscale * 100).toFixed(0)}%</Label>
          <Slider
            value={[grayscale * 100]}
            onValueChange={(v) => update({ grayscale: v[0] / 100 })}
            min={0}
            max={100}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Sepia: {(sepia * 100).toFixed(0)}%</Label>
          <Slider
            value={[sepia * 100]}
            onValueChange={(v) => update({ sepia: v[0] / 100 })}
            min={0}
            max={100}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Invert: {(invert * 100).toFixed(0)}%</Label>
          <Slider
            value={[invert * 100]}
            onValueChange={(v) => update({ invert: v[0] / 100 })}
            min={0}
            max={100}
            step={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Blur: {blur}px</Label>
          <Slider
            value={[blur]}
            onValueChange={(v) => update({ blur: v[0] })}
            min={0}
            max={10}
            step={1}
          />
        </div>
      </div>
    </div>
  );
}
