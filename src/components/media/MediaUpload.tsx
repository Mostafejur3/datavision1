import { useState, useRef } from "react";
import { Upload, X, Image, Video, File, GripVertical } from "lucide-react";
import { type MediaItem, fileToMediaItem } from "@/lib/mediaStorage";

interface MediaUploadProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxFiles?: number;
  accept?: string;
}

export default function MediaUpload({ items, onChange, maxFiles = 10, accept = "image/*,video/*,.pdf,.doc,.docx" }: MediaUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = maxFiles - items.length;
    const toProcess = Array.from(files).slice(0, remaining);
    const newItems = await Promise.all(toProcess.map(fileToMediaItem));
    onChange([...items, ...newItems]);
  };

  const remove = (id: string) => onChange(items.filter(i => i.id !== id));

  const reorder = (from: number, to: number) => {
    const arr = [...items];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange(arr);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (dragIdx !== null) return; // internal reorder handled elsewhere
    handleFiles(e.dataTransfer.files);
  };

  const iconForType = (type: MediaItem["type"]) => {
    switch (type) {
      case "image": return <Image className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
        }`}
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Drop images, videos or files here, or <span className="text-accent">browse</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {items.length}/{maxFiles} files · Max 5MB per file
        </p>
        <input ref={fileRef} type="file" multiple accept={accept} className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragIdx !== null && dragIdx !== idx) reorder(dragIdx, idx);
                setDragIdx(null);
              }}
              onDragEnd={() => setDragIdx(null)}
              className={`relative group rounded-lg overflow-hidden border border-border bg-muted aspect-square ${
                dragIdx === idx ? "opacity-50" : ""
              }`}
            >
              {item.type === "image" ? (
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              ) : item.type === "video" ? (
                <video src={item.url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <File className="w-8 h-8 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground truncate w-full text-center">{item.name}</span>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <GripVertical className="w-4 h-4 text-foreground cursor-grab" />
                <button onClick={(e) => { e.stopPropagation(); remove(item.id); }}
                  className="p-1.5 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/40">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Type badge */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] bg-background/70 text-foreground flex items-center gap-1">
                {iconForType(item.type)}
              </div>

              {idx === 0 && (
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] bg-accent/80 text-accent-foreground font-medium">
                  Cover
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
