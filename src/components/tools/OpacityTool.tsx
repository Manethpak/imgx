import { useState } from "react";
import type { ImageData, OpacityOptions } from "../../types/types";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sun } from "lucide-react";

interface OpacityToolProps {
  imageData: ImageData | null;
  onProcess: (options: OpacityOptions) => void;
}

export default function OpacityTool({
  imageData,
  onProcess,
}: OpacityToolProps) {
  const [opacity, setOpacity] = useState(100);

  const handleProcess = () => {
    onProcess({ opacity: opacity / 100 });
  };

  if (!imageData) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <p className="text-muted-foreground">
          Upload an image to set opacity
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Sun className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Opacity</h2>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base">Opacity: {Math.round(opacity)}%</Label>
          <Slider
            value={[opacity]}
            onValueChange={(vals) => setOpacity(vals[0])}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
        <Button
          onClick={handleProcess}
          className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <Sun className="w-5 h-5 mr-2" />
          Add Opacity Step
        </Button>
      </div>
    </div>
  );
}
