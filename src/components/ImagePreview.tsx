import { useState } from "react";
import type { ProcessedImage } from "../types/types";
import {
  formatFileSize,
  downloadImage,
  blobToDataUrl,
} from "../utils/imageUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, Copy, Check } from "lucide-react";

interface ImagePreviewProps {
  processed: ProcessedImage | null;
  isProcessing: boolean;
}

export default function ImagePreview({
  processed,
  isProcessing,
}: ImagePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    if (processed) {
      const extension = processed.format.split("/")[1];
      const filename = `image.${extension}`;
      downloadImage(processed.blob, filename);
    }
  };

  const handleCopyBase64 = async () => {
    if (!processed) return;
    try {
      const dataUrl = await blobToDataUrl(processed.blob);
      await navigator.clipboard.writeText(dataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto animate-fade-in border-border/50 shadow-xl shadow-primary/5 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-muted/30">
        <CardTitle className="text-xl font-bold">Preview</CardTitle>
        {processed && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md border">
              {formatFileSize(processed.size)}
            </span>
            <Button
              onClick={handleDownload}
              size="sm"
              className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyBase64}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy as base64
                </>
              )}
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        <div className="relative rounded-xl overflow-hidden bg-muted/30 border-2 border-primary/20 flex items-center justify-center min-h-[300px] shadow-inner">
          {isProcessing ? (
            <div className="w-full min-h-[300px] flex items-center justify-center bg-background/50 backdrop-blur-sm z-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">
                  Updating...
                </p>
              </div>
            </div>
          ) : processed ? (
            <>
              <img
                src={processed.url}
                alt="Result"
                className="w-full h-auto max-h-[500px] object-contain relative z-10"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 p-2 rounded-lg backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity z-20">
                <p className="text-xs text-white font-medium text-center">
                  {processed.width} × {processed.height} •{" "}
                  {processed.format.split("/")[1].toUpperCase()}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center p-12 text-muted-foreground/50">
              <p className="text-sm font-medium">
                Upload an image to see the result
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
