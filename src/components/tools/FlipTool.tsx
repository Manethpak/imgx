import { useState } from "react";
import type { ImageData, FlipOptions } from "../../types/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FlipHorizontal } from "lucide-react";

interface FlipToolProps {
  imageData: ImageData | null;
  onProcess: (options: FlipOptions) => void;
}

export default function FlipTool({ imageData, onProcess }: FlipToolProps) {
  const [horizontal, setHorizontal] = useState(false);
  const [vertical, setVertical] = useState(false);

  const handleProcess = () => {
    onProcess({ horizontal, vertical });
  };

  if (!imageData) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <p className="text-muted-foreground">Upload an image to flip</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <FlipHorizontal className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Flip</h2>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
          <Label htmlFor="flip-h" className="text-base">
            Flip horizontal
          </Label>
          <Switch
            id="flip-h"
            checked={horizontal}
            onCheckedChange={setHorizontal}
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
          <Label htmlFor="flip-v" className="text-base">
            Flip vertical
          </Label>
          <Switch
            id="flip-v"
            checked={vertical}
            onCheckedChange={setVertical}
          />
        </div>
        <Button
          onClick={handleProcess}
          className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <FlipHorizontal className="w-5 h-5 mr-2" />
          Add Flip Step
        </Button>
      </div>
    </div>
  );
}
