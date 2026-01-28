import { useState, useEffect, useCallback, useRef } from "react";
import ImageUploader from "./ImageUploader";
import ImagePreview from "./ImagePreview";
import RecentImages from "./RecentImages";
import TabNavigation from "./TabNavigation";
import ResizeTool from "./tools/ResizeTool";
import CompressTool from "./tools/CompressTool";
import ConvertTool from "./tools/ConvertTool";
import TransformTool from "./tools/TransformTool";
import FilterTool from "./tools/FilterTool";
import { runPipeline } from "../utils/imageUtils";
import { addRecentImage } from "../utils/recentImages";
import type {
  ImageData,
  ProcessedImage,
  ResizeOptions,
  CompressOptions,
  ConvertOptions,
  TransformOptions,
  FilterOptions,
  PipelineOptions,
  ToolType,
} from "../types/types";

function defaultPipelineOptions(image: ImageData): PipelineOptions {
  return {
    resize: {
      width: image.width,
      height: image.height,
      maintainAspectRatio: true,
    },
    compress: { quality: 80 },
    convert: { format: image.format },
    transform: {
      angle: 0,
      horizontal: false,
      vertical: false,
      skewX: 0,
      skewY: 0,
    },
    filter: {
      opacity: 1,
      brightness: 1,
      contrast: 1,
      grayscale: 0,
      sepia: 0,
      invert: 0,
      blur: 0,
    },
  };
}

const DEBOUNCE_MS = 150;

export default function ImageTransform() {
  const [activeTool, setActiveTool] = useState<ToolType>("resize");
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [options, setOptions] = useState<PipelineOptions | null>(null);
  const [pipelineResult, setPipelineResult] = useState<ProcessedImage | null>(null);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const handleImageLoad = useCallback((image: ImageData | null) => {
    setOriginalImage(image);
    setPipelineResult(null);
    if (image) {
      setOptions(defaultPipelineOptions(image));
      addRecentImage(image).catch(() => {});
    } else {
      setOptions(null);
    }
  }, []);

  useEffect(() => {
    if (!originalImage || !options) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    cancelledRef.current = false;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      setIsPipelineRunning(true);
      runPipeline(originalImage, options)
        .then((result) => {
          if (!cancelledRef.current) setPipelineResult(result);
        })
        .catch((err) => {
          if (!cancelledRef.current) console.error(err);
        })
        .finally(() => {
          if (!cancelledRef.current) setIsPipelineRunning(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelledRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [originalImage, options]);

  const setResizeOptions = useCallback((resize: ResizeOptions) => {
    setOptions((o) => (o ? { ...o, resize } : null));
  }, []);
  const setCompressOptions = useCallback((compress: CompressOptions) => {
    setOptions((o) => (o ? { ...o, compress } : null));
  }, []);
  const setConvertOptions = useCallback((convert: ConvertOptions) => {
    setOptions((o) => (o ? { ...o, convert } : null));
  }, []);
  const setTransformOptions = useCallback((transform: TransformOptions) => {
    setOptions((o) => (o ? { ...o, transform } : null));
  }, []);
  const setFilterOptions = useCallback((filter: FilterOptions) => {
    setOptions((o) => (o ? { ...o, filter } : null));
  }, []);

  const handleResetResize = useCallback(() => {
    if (originalImage) {
      setOptions((o) =>
        o
          ? {
              ...o,
              resize: {
                width: originalImage.width,
                height: originalImage.height,
                maintainAspectRatio: true,
              },
            }
          : null
      );
    }
  }, [originalImage]);
  const handleResetCompress = useCallback(() => {
    setOptions((o) => (o ? { ...o, compress: { quality: 80 } } : null));
  }, []);
  const handleResetConvert = useCallback(() => {
    if (originalImage) {
      setOptions((o) =>
        o ? { ...o, convert: { format: originalImage.format } } : null
      );
    }
  }, [originalImage]);
  const handleResetTransform = useCallback(() => {
    setOptions((o) =>
      o
        ? {
            ...o,
            transform: {
              angle: 0,
              horizontal: false,
              vertical: false,
              skewX: 0,
              skewY: 0,
            },
          }
        : null
    );
  }, []);
  const handleResetFilter = useCallback(() => {
    setOptions((o) =>
      o
        ? {
            ...o,
            filter: {
              opacity: 1,
              brightness: 1,
              contrast: 1,
              grayscale: 0,
              sepia: 0,
              invert: 0,
              blur: 0,
            },
          }
        : null
    );
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 space-y-4 max-w-7xl">
      <div className="text-center space-y-6 mb-12 pt-8">
        <div className="inline-flex items-center justify-center p-2 bg-muted/50 rounded-full mb-4 backdrop-blur-sm border border-border/50">
          <span className="text-xs font-medium px-3 py-1">
            ✨ Free & Secure Image Tools
          </span>
        </div>
        <h1 className="text-3xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/80 to-foreground/40 pb-2">
          imgx
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Professional grade image tools in your browser. Changes apply in real
          time.
        </p>
      </div>

      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6 md:p-8 shadow-2xl shadow-primary/5">
        <div className="grid lg:grid-cols-12 gap-8 items-start mt-8">
          <div className="lg:col-span-5 space-y-6">
            <ImageUploader
              currentImage={originalImage}
              onImageLoad={handleImageLoad}
            />
            {!originalImage && (
              <RecentImages onSelect={handleImageLoad} />
            )}

            {originalImage && options && (
              <>
                <TabNavigation activeTool={activeTool} onToolChange={setActiveTool} />

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-card border rounded-2xl p-6 shadow-sm">
                  {activeTool === "resize" && (
                    <ResizeTool
                      imageData={originalImage}
                      options={options.resize}
                      onOptionsChange={setResizeOptions}
                      onReset={handleResetResize}
                    />
                  )}
                  {activeTool === "compress" && (
                    <CompressTool
                      imageData={originalImage}
                      options={options.compress}
                      onOptionsChange={setCompressOptions}
                      onReset={handleResetCompress}
                    />
                  )}
                  {activeTool === "convert" && (
                    <ConvertTool
                      imageData={originalImage}
                      options={options.convert}
                      onOptionsChange={setConvertOptions}
                      onReset={handleResetConvert}
                    />
                  )}
                  {activeTool === "transform" && (
                    <TransformTool
                      imageData={originalImage}
                      options={options.transform}
                      onOptionsChange={setTransformOptions}
                      onReset={handleResetTransform}
                    />
                  )}
                  {activeTool === "filter" && (
                    <FilterTool
                      imageData={originalImage}
                      options={options.filter}
                      onOptionsChange={setFilterOptions}
                      onReset={handleResetFilter}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-7 lg:sticky lg:top-8">
            <ImagePreview
              processed={originalImage ? pipelineResult : null}
              isProcessing={isPipelineRunning}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
