import { useState } from "react";
import { ChevronLeft, ChevronRight, Play, Maximize2, X } from "lucide-react";
import { type MediaItem } from "@/lib/mediaStorage";

interface MediaGalleryProps {
  items: MediaItem[];
  className?: string;
}

export default function MediaGallery({ items, className = "" }: MediaGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (!items.length) return null;

  const visibleItems = items.filter(i => i.type === "image" || i.type === "video");
  if (!visibleItems.length) return null;

  const item = visibleItems[current] || visibleItems[0];
  const prev = () => setCurrent((current - 1 + visibleItems.length) % visibleItems.length);
  const next = () => setCurrent((current + 1) % visibleItems.length);

  const renderMedia = (mediaItem: MediaItem, isFull = false) => {
    if (mediaItem.type === "video") {
      return (
        <video
          src={mediaItem.url}
          controls
          className={`w-full ${isFull ? "max-h-[85vh] object-contain" : "h-full object-cover"}`}
        />
      );
    }
    return (
      <img
        src={mediaItem.url}
        alt={mediaItem.name}
        className={`w-full ${isFull ? "max-h-[85vh] object-contain" : "h-full object-cover"}`}
      />
    );
  };

  return (
    <>
      <div className={`relative group ${className}`}>
        {/* Main display */}
        <div className="relative overflow-hidden rounded-xl bg-muted aspect-video">
          {renderMedia(item)}

          {item.type === "video" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-background/70 flex items-center justify-center">
                <Play className="w-6 h-6 text-foreground ml-0.5" />
              </div>
            </div>
          )}

          {/* Nav arrows */}
          {visibleItems.length > 1 && (
            <>
              <button onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/70 flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/70 flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90">
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Fullscreen */}
          <button onClick={() => setFullscreen(true)}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/70 flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90">
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Counter */}
          {visibleItems.length > 1 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-background/70 text-foreground text-xs">
              {current + 1} / {visibleItems.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {visibleItems.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {visibleItems.map((thumb, idx) => (
              <button
                key={thumb.id}
                onClick={() => setCurrent(idx)}
                className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === current ? "border-accent" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {thumb.type === "video" ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Play className="w-4 h-4 text-muted-foreground" />
                  </div>
                ) : (
                  <img src={thumb.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[60] bg-background/95 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80">
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            {renderMedia(item, true)}
            {visibleItems.length > 1 && (
              <div className="flex justify-center gap-4 mt-4">
                <button onClick={prev} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-foreground text-sm self-center">{current + 1} / {visibleItems.length}</span>
                <button onClick={next} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
