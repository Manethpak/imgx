import { useState } from "react";
import type { ImageData, SkewOptions } from "../../types/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

interface SkewToolProps {
  imageData: ImageData | null;
  onProcess: (options: SkewOptions) => void;
}

export default function SkewTool({
  imageData,
  onProcess,
}: SkewToolProps) {
  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);

  const handleProcess = () => {
    onProcess({ skewX, skewY });
  };

  if (!imageData) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <p className="text-muted-foreground">
          Upload an image to skew
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <SlidersHorizontal className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Skew</h2>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="skewX">Skew X (degrees)</Label>
            <Input
              id="skewX"
              type="number"
              value={skewX}
              onChange={(e) => setSkewX(Number(e.target.value))}
              min={-45}
              max={45}
              className="text-lg font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skewY">Skew Y (degrees)</Label>
            <Input
              id="skewY"
              type="number"
              value={skewY}
              onChange={(e) => setSkewY(Number(e.target.value))}
              min={-45}
              max={45}
              className="text-lg font-medium"
            />
          </div>
        </div>
        <Button
          onClick={handleProcess}
          className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <SlidersHorizontal className="w-5 h-5 mr-2" />
          Add Skew Step
        </Button>
      </div>
    </div>
  );
}
