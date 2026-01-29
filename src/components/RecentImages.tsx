import { useState, useEffect, useCallback } from "react";
import type { ImageData } from "../types/types";
import {
  getRecentImages,
  clearRecents,
  type RecentImage as RecentImageType,
} from "../utils/recentImages";
import { decodeFromBase64 } from "../utils/imageUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ImageIcon, Loader2 } from "lucide-react";

interface RecentImagesProps {
  onSelect: (image: ImageData) => void;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString();
}

export default function RecentImages({ onSelect }: RecentImagesProps) {
  const [recents, setRecents] = useState<RecentImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getRecentImages();
      setRecents(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = useCallback(
    async (item: RecentImageType) => {
      setLoadingId(item.id);
      try {
        const imageData = await decodeFromBase64(item.dataUrl);
        onSelect(imageData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingId(null);
      }
    },
    [onSelect]
  );

  const handleClear = useCallback(async () => {
    setClearing(true);
    try {
      await clearRecents();
      setRecents([]);
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  }, []);

  if (loading || recents.length === 0) {
    if (loading) {
      return (
        <Card className="border-border/50">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
          Recent images
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={clearing}
          className="text-muted-foreground hover:text-destructive"
        >
          {clearing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span className="ml-1.5">Clear recents</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {recents.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              disabled={loadingId !== null}
              className="group flex flex-col items-center rounded-lg border border-border/50 bg-muted/20 p-2 hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
            >
              <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted/50 mb-2">
                <img
                  src={item.thumbnailDataUrl || item.dataUrl}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-medium truncate w-full">
                {item.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatDate(item.createdAt)}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
