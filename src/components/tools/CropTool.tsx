import type { ImageData, CropOptions } from "../../types/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Crop,
  RotateCcw,
  Maximize,
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from "lucide-react";

interface CropToolProps {
  imageData: ImageData | null;
  options: CropOptions;
  onOptionsChange: (options: CropOptions) => void;
  onReset?: () => void;
}

const presets = [
  { name: "Original", ratio: null, icon: Maximize },
  { name: "1:1 Square", ratio: 1, icon: Square },
  { name: "16:9 HD", ratio: 16 / 9, icon: RectangleHorizontal },
  { name: "4:3 SD", ratio: 4 / 3, icon: RectangleHorizontal },
  { name: "3:2 Photo", ratio: 3 / 2, icon: RectangleHorizontal },
  { name: "9:16 Story", ratio: 9 / 16, icon: RectangleVertical },
];

export default function CropTool({
  imageData,
  options,
  onOptionsChange,
  onReset,
}: CropToolProps) {
  if (!imageData) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <p className="text-muted-foreground">Upload an image to crop</p>
      </div>
    );
  }

  const { x, y, width, height } = options;

  const handleXChange = (val: number) => {
    const maxX = imageData.width - width;
    const newX = Math.max(0, Math.min(val, maxX));
    onOptionsChange({ ...options, x: newX });
  };

  const handleYChange = (val: number) => {
    const maxY = imageData.height - height;
    const newY = Math.max(0, Math.min(val, maxY));
    onOptionsChange({ ...options, y: newY });
  };

  const handleWidthChange = (val: number) => {
    const maxWidth = imageData.width - x;
    const newWidth = Math.max(1, Math.min(val, maxWidth));
    onOptionsChange({ ...options, width: newWidth });
  };

  const handleHeightChange = (val: number) => {
    const maxHeight = imageData.height - y;
    const newHeight = Math.max(1, Math.min(val, maxHeight));
    onOptionsChange({ ...options, height: newHeight });
  };

  const handlePreset = (ratio: number | null) => {
    if (ratio === null) {
      onOptionsChange({
        x: 0,
        y: 0,
        width: imageData.width,
        height: imageData.height,
      });
      return;
    }

    let newWidth, newHeight;
    const imageRatio = imageData.width / imageData.height;

    if (imageRatio > ratio) {
      // Image is wider than preset ratio
      newHeight = imageData.height;
      newWidth = Math.round(newHeight * ratio);
    } else {
      // Image is taller than preset ratio
      newWidth = imageData.width;
      newHeight = Math.round(newWidth / ratio);
    }

    const newX = Math.round((imageData.width - newWidth) / 2);
    const newY = Math.round((imageData.height - newHeight) / 2);

    onOptionsChange({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Crop</h2>
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="crop-x">X Position (px)</Label>
            <Input
              id="crop-x"
              type="number"
              value={x}
              onChange={(e) => handleXChange(Number(e.target.value))}
              min={0}
              max={imageData.width - 1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crop-y">Y Position (px)</Label>
            <Input
              id="crop-y"
              type="number"
              value={y}
              onChange={(e) => handleYChange(Number(e.target.value))}
              min={0}
              max={imageData.height - 1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crop-width">Width (px)</Label>
            <Input
              id="crop-width"
              type="number"
              value={width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              min={1}
              max={imageData.width - x}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crop-height">Height (px)</Label>
            <Input
              id="crop-height"
              type="number"
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              min={1}
              max={imageData.height - y}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Aspect Ratio Presets</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handlePreset(preset.ratio)}
                className="justify-start gap-2 h-10"
              >
                <preset.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-xs text-muted-foreground text-center">
            Tip: Center cropping is applied automatically when using presets.
          </p>
        </div>
      </div>
    </div>
  );
}
