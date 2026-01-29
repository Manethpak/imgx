# Agent Context: imgx (Image Transform)

This document provides context for AI agents working on this codebase. Use it to understand project goals, architecture, and conventions.

---

## Project Goal

**imgx** is a browser-based image transformation application. Goals:

- **Professional-grade tools**: Resize, compress, convert format, transform (rotate/flip/skew), and apply filters with real-time preview.
- **Privacy-first**: All processing runs in the browser using native APIs; no server upload of image data.
- **Real-time UX**: Changes apply live with debounced pipeline execution so users see results immediately as they adjust options.
- **Extensibility**: New tools and pipeline stages can be added following existing patterns; see `FEATURE_PLAN.md` for a prioritized roadmap (crop, color adjustments, watermark, etc.).

---

## Tech Stack

- **Runtime**: React 19, TypeScript.
- **Build**: Vite (rolldown-vite), path alias `@` → `src/`.
- **Styling**: Tailwind CSS v4, `tw-animate-css`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **UI**: shadcn/ui, Base UI (radix-ui), Lucide React icons.
- **APIs**: Canvas 2D, ImageData, File/Blob, `URL.createObjectURL`. No image-processing libraries; all logic is native browser APIs.

---

## Repository Structure

```
image-transform/
├── src/
│   ├── App.tsx                 # Root: renders <ImageTransform />
│   ├── main.tsx                # Entry, React root
│   ├── index.css               # Global styles
│   ├── components/
│   │   ├── ImageTransform.tsx  # Main screen: upload, tabs, pipeline state, preview
│   │   ├── ImageUploader.tsx   # File input + load image
│   │   ├── ImagePreview.tsx    # Preview card, download, copy base64
│   │   ├── RecentImages.tsx    # Recently used images (localStorage)
│   │   ├── TabNavigation.tsx   # Tabs for tool selection (resize, compress, etc.)
│   │   ├── tools/              # One component per tool
│   │   │   ├── ResizeTool.tsx
│   │   │   ├── CompressTool.tsx
│   │   │   ├── ConvertTool.tsx
│   │   │   ├── TransformTool.tsx  # Rotate, flip, skew
│   │   │   ├── FilterTool.tsx     # Opacity, brightness, contrast, etc.
│   │   │   ├── Base64Tool.tsx
│   │   │   └── ...
│   │   └── ui/                 # shadcn-style primitives (button, card, input, etc.)
│   ├── lib/
│   │   └── utils.ts            # cn() and other helpers
│   ├── types/
│   │   └── types.ts            # ImageData, ProcessedImage, *Options, PipelineOptions, ToolType
│   ├── utils/
│   │   ├── imageUtils.ts       # loadImage, runPipeline, per-stage functions, download, base64
│   │   └── recentImages.ts     # Recent images persistence
├── public/
├── FEATURE_PLAN.md             # Roadmap and implementation notes for new features
├── package.json                # name: "imgx", pnpm
└── vite.config.ts              # base: "/imgx"
```

---

## Application Flow

1. **Upload**: User selects a file → `ImageUploader` uses `loadImage()` from `imageUtils` → produces `ImageData` (file, object URL, width, height, size, format).
2. **State**: `ImageTransform` holds `originalImage`, `options` (`PipelineOptions`), and `pipelineResult` (`ProcessedImage | null`). Options are the single source of truth for all tool settings.
3. **Tools**: User picks a tab (e.g. Resize); the corresponding `*Tool` component receives `imageData`, `options.<stage>`, and callbacks `onOptionsChange`, `onReset`. Tools only update their slice of `options`; they do not run the pipeline directly.
4. **Pipeline**: A debounced effect (e.g. 150 ms) runs `runPipeline(originalImage, options)` whenever `originalImage` or `options` change. Result is stored in `pipelineResult` and passed to `ImagePreview`.
5. **Preview**: `ImagePreview` shows the processed image, file size, and actions: Download (blob) and Copy as base64.

Pipeline execution order in `imageUtils.runPipeline()`: **resize → transform (rotate/flip/skew) → filter → compress → convert**. Each stage takes the previous stage’s output (canvas/blob) and returns a `ProcessedImage` (or equivalent) for the next.

---

## Data Model (Summary)

- **ImageData**: `file`, `url`, `width`, `height`, `size`, `format` (jpeg/png/webp/gif).
- **ProcessedImage**: `url`, `width`, `height`, `size`, `format`, `blob`.
- **PipelineOptions**: One key per pipeline stage: `resize`, `compress`, `convert`, `transform`, `filter`. Each has its own options type (e.g. `ResizeOptions`, `FilterOptions`).
- **ToolType**: Union of tab IDs: `"resize" | "compress" | "convert" | "transform" | "filter"`. Adding a new pipeline tool requires extending this and `PipelineOptions`, plus registering the tool in `ImageTransform` and `TabNavigation`.

---

## Tool Component Pattern

Each pipeline tool component:

- Receives `imageData: ImageData`, `options: <Stage>Options`, `onOptionsChange: (opts) => void`, and optional `onReset: () => void`.
- Renders controls (inputs, sliders, presets) and calls `onOptionsChange` when the user changes settings.
- Does not perform image processing; the parent runs the pipeline when options change.

Non-pipeline tools (e.g. Base64 encode/decode) may have a different contract (e.g. custom callbacks or local state) and might not be in `TabNavigation` or `PipelineOptions`.

---

## Adding a New Pipeline Feature

1. **Types** (`types/types.ts`): Add options interface and extend `ToolType` and `PipelineOptions`.
2. **Processing** (`utils/imageUtils.ts`): Implement the transformation (Canvas/ImageData). Add the stage to `runPipeline()` in the correct order.
3. **Tool UI** (`components/tools/<Name>Tool.tsx`): New component following the pattern above; wire to `onOptionsChange` and `onReset`.
4. **Integration**: In `ImageTransform.tsx`, add state updaters and reset handlers, default values in `defaultPipelineOptions`, a tab in `TabNavigation`, and conditional render of the new tool. Ensure the pipeline receives the new options and runs the new stage.

Keep processing in `imageUtils` and UI in `components/tools`; use TypeScript types for all new options and results.

---

## Conventions and Constraints

- **Native only**: Do not add server-side processing or third-party image libraries; use Canvas 2D, ImageData, File/Blob, and object URLs.
- **Real-time preview**: Preserve the debounced pipeline so that changing any option updates the preview without manual “Apply” in normal flow.
- **Type safety**: New options and pipeline stages should be fully typed in `types/types.ts`.
- **Accessibility and mobile**: Maintain keyboard navigation and touch-friendly controls where applicable.
- **Errors**: Handle load/processing failures (e.g. invalid file, canvas errors) and avoid leaving the UI in a broken state.

---

## Key Files for Common Tasks

- **Change pipeline order or add a stage**: `src/utils/imageUtils.ts` (`runPipeline` and per-stage functions).
- **Add or modify a tool tab**: `src/components/ImageTransform.tsx`, `src/components/TabNavigation.tsx`, and the corresponding `src/components/tools/*.tsx`.
- **Adjust defaults or option shapes**: `src/types/types.ts` and `defaultPipelineOptions` in `ImageTransform.tsx`.
- **Preview or download behavior**: `src/components/ImagePreview.tsx` and helpers in `src/utils/imageUtils.ts`.

---

## Pipeline Stages (Current)

- **Resize**: Width/height with optional aspect-ratio lock; presets (thumbnail, HD, 4K, etc.).
- **Transform**: Rotate (degrees), flip horizontal/vertical, skew X/Y.
- **Filter**: Opacity, brightness, contrast, grayscale, sepia, invert, blur.
- **Compress**: Quality (0–100) for JPEG/WebP.
- **Convert**: Output format (JPEG, PNG, WebP, GIF).

All stages are applied in sequence; each stage receives the previous output (canvas or blob) and returns a `ProcessedImage`-like result for the next.

---

## Quick Reference: Where Things Live

- **Image load / pipeline execution**: `imageUtils.loadImage`, `imageUtils.runPipeline`.
- **Download / base64**: `imageUtils.downloadImage`, `imageUtils.blobToDataUrl`; used in `ImagePreview`.
- **Recent images**: `utils/recentImages.ts`; used by `RecentImages` and on load in `ImageTransform`.
- **UI primitives**: `components/ui/` (button, card, input, label, slider, switch, tabs, etc.).
- **Path alias**: Use `@/` for `src/` in imports (e.g. `@/components/ImageTransform`).

---

## References

- **Feature roadmap and implementation ideas**: `FEATURE_PLAN.md` (crop, color adjustments, watermark, comparison view, etc.).
- **Setup and tooling**: `README.md`, `package.json`, `vite.config.ts`.
