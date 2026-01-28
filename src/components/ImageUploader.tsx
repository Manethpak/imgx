import { useCallback, useState, useEffect } from "react";
import type { ImageData } from "../types/types";
import { loadImage, decodeFromBase64 } from "../utils/imageUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageLoad: (imageData: ImageData | null) => void;
  currentImage: ImageData | null;
}

export default function ImageUploader({
  onImageLoad,
  currentImage,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File size must be less than 10MB");
        return;
      }

      try {
        const imageData = await loadImage(file);
        onImageLoad(imageData);
      } catch (err) {
        setError("Failed to load image. Please try again.");
        console.error(err);
      }
    },
    [onImageLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      if (e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        handleFile(file);
        return;
      }
      const text = e.clipboardData.getData("text/plain")?.trim();
      if (!text) return;
      const dataUrlMatch = text.match(/^data:image\/[a-z+]+;base64,/i);
      const looksLikeBase64 =
        dataUrlMatch ||
        (text.length > 100 && /^[A-Za-z0-9+/=]+$/.test(text.replace(/\s/g, "")));
      if (!looksLikeBase64) return;
      setError(null);
      try {
        const normalized = dataUrlMatch
          ? text.replace(/\s/g, "")
          : `data:image/png;base64,${text.replace(/\s/g, "")}`;
        const imageData = await decodeFromBase64(normalized);
        onImageLoad(imageData);
      } catch {
        setError("Invalid base64 image");
      }
    },
    [handleFile, onImageLoad]
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const handleClear = useCallback(() => {
    onImageLoad(null);
    setError(null);
  }, [onImageLoad]);

  return (
    <div className="w-full">
      {!currentImage ? (
        <Card
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed cursor-pointer transition-all duration-500 ease-out group relative overflow-hidden",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01] shadow-xl shadow-primary/10"
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30 hover:shadow-lg"
          )}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center relative z-10">
            <div
              className={cn(
                "p-6 rounded-full bg-muted mb-6 transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/10",
                isDragging && "bg-primary/20 scale-110"
              )}
            >
              <Upload
                className={cn(
                  "w-10 h-10 text-muted-foreground transition-colors duration-500 group-hover:text-primary",
                  isDragging && "text-primary"
                )}
              />
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">
              {isDragging ? "Drop your image here" : "Upload an image"}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base">
              Drag and drop, paste from clipboard or a base64 image, or click to
              browse files
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground/70 font-medium uppercase tracking-wider">
              <span className="bg-muted/50 px-2 py-1 rounded-md">JPG</span>
              <span className="bg-muted/50 px-2 py-1 rounded-md">PNG</span>
              <span className="bg-muted/50 px-2 py-1 rounded-md">WebP</span>
              <span className="bg-muted/50 px-2 py-1 rounded-md">GIF</span>
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileInput}
              className="hidden"
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border shadow-sm bg-card">
          <CardContent className="p-0">
            <div className="p-8 flex items-center justify-center bg-muted/30 min-h-[200px] relative">
              <div className="absolute top-3 right-3 z-10">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleClear}
                  className="h-9 w-9 rounded-full shadow-sm hover:scale-105 transition-transform"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <img
                src={currentImage.url}
                alt="Uploaded"
                className="max-h-[300px] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="bg-card p-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileImage className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm truncate max-w-[200px]">
                    {currentImage.file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentImage.width} × {currentImage.height} •{" "}
                    {(currentImage.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="text-xs"
              >
                Change Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="mt-4 p-4 p-4 bg-destructive/10 text-destructive rounded-xl text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <X className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
