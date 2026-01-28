import { useState } from "react";
import type { ImageData, RotateOptions } from "../../types/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface RotateToolProps {
  imageData: ImageData | null;
  onProcess: (options: RotateOptions) => void;
}

const presets = [90, 180, 270];

export default function RotateTool({
  imageData,
  onProcess,
}: RotateToolProps) {
  const [angle, setAngle] = useState(0);

  const handleProcess = () => {
    onProcess({ angle });
  };

  if (!imageData) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center p-8">
        <p className="text-muted-foreground">
          Upload an image to rotate
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <RotateCw className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Rotate</h2>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="angle">Angle (degrees)</Label>
          <Input
            id="angle"
            type="number"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            min={-360}
            max={360}
            className="text-lg font-medium"
          />
        </div>
        <div className="space-y-2">
          <Label>Presets</Label>
          <div className="flex gap-2">
            {presets.map((deg) => (
              <Button
                key={deg}
                variant="outline"
                size="sm"
                onClick={() => setAngle(deg)}
              >
                {deg}°
              </Button>
            ))}
          </div>
        </div>
        <Button
          onClick={handleProcess}
          className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <RotateCw className="w-5 h-5 mr-2" />
          Add Rotate Step
        </Button>
      </div>
    </div>
  );
}
