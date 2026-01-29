# imgx

Image tools in your browser. Upload an image, tweak it with resize, compress, convert, transform, and filters—all with live preview. Nothing is sent to a server; everything runs locally using the browser’s Canvas and File APIs.

## What it does

- **Resize** – Change dimensions, with optional aspect-ratio lock
- **Compress** – Adjust quality to reduce file size
- **Convert** – Switch format (JPEG, PNG, WebP, GIF)
- **Transform** – Rotate, flip, skew
- **Filter** – Opacity, brightness, contrast, grayscale, sepia, invert, blur

Then download the result or copy it as base64.

## Run it

```bash
pnpm install
pnpm dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173/imgx`).

**Build:** `pnpm build`  
**Preview build:** `pnpm preview`  
**Lint:** `pnpm lint`

## Stack

React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui. No image-processing libraries—only native browser APIs.
