import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { type PortfolioItem, portfolioItems as defaultPortfolio, portfolioCategories } from "@/data/portfolio";
import MediaUpload from "@/components/media/MediaUpload";
import { getSiteConfig } from "@/lib/siteConfig";
import { type MediaItem, getMedia, saveMedia } from "@/lib/mediaStorage";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";

export default function PortfolioPanel() {
  const confirmDialog = useConfirmDialog();
  const [items, setItems] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem("portfolio_items");
    if (saved) try { return JSON.parse(saved); } catch {}
    return defaultPortfolio;
  });
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    localStorage.setItem("portfolio_items", JSON.stringify(items));
  }, [items]);

  const emptyItem: PortfolioItem = {
    id: "", title: "", client: "", category: "Analysis",
    problem: "", dataSource: "", method: "", result: "",
    metrics: [
      { label: "Metric 1", value: "+0%", color: "text-emerald-400" },
      { label: "Metric 2", value: "+0%", color: "text-cyan-400" },
      { label: "Metric 3", value: "+0%", color: "text-blue-400" },
    ],
    image: "/placeholder.svg",
    tags: [],
  };

  const startEdit = (item: PortfolioItem) => {
    setEditing(item);
    setAdding(false);
    setMediaItems(getMedia("portfolio", item.id));
  };

  const startAdd = () => {
    const newId = `portfolio-${Date.now()}`;
    setEditing({ ...emptyItem, id: newId });
    setAdding(true);
    setMediaItems([]);
  };

  const handleSave = (item: PortfolioItem) => {
    const saved = saveMedia("portfolio", item.id, mediaItems);
    if (!saved) {
      toast.error("Storage full! Images are too large for local storage. Try fewer or smaller images.");
      return;
    }
    if (adding) {
      setItems([...items, item]);
    } else {
      setItems(items.map(i => i.id === item.id ? item : i));
    }
    setEditing(null);
    setAdding(false);
    toast.success("Project saved!");
  };

  const handleDelete = (id: string, title: string) => {
    confirmDialog.confirm({
      title: "Delete Portfolio Item?",
      description: `"${title}" will be permanently removed.`,
      confirmText: "Delete",
      variant: "danger",
      onConfirm: () => {
        setItems(items.filter(i => i.id !== id));
        saveMedia("portfolio", id, []);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">Portfolio Management</h2>
        <button onClick={startAdd} className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {editing && (
        <PortfolioEditor
          item={editing}
          mediaItems={mediaItems}
          onMediaChange={setMediaItems}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setAdding(false); }}
          isNew={adding}
        />
      )}

      <div className="grid gap-4">
        {items.map((p) => {
          const media = getMedia("portfolio", p.id);
          const isActive = p.active !== false;
          return (
            <div key={p.id} className={`glass-card-strong rounded-xl p-5 flex items-center justify-between gap-4 ${!isActive ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {media.length > 0 && media[0].type === "image" ? (
                  <img src={media[0].url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-foreground truncate">{p.title}</h3>
                    {!isActive && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">Inactive</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{p.client} · {p.category} · {media.length} media</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 items-center">
                <button onClick={() => { setItems(items.map(i => i.id === p.id ? { ...i, active: !isActive } : i)); }} className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-muted"}`} title={isActive ? "Deactivate" : "Activate"}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "left-6" : "left-1"}`}/></button>
                <button onClick={() => startEdit(p)} className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                {getSiteConfig().deleteButtons?.portfolio !== false && <button onClick={() => handleDelete(p.id, p.title)} className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>}
              </div>
            </div>
          );
        })}
      </div>
      <confirmDialog.Dialog />
    </div>
  );
}

function PortfolioEditor({
  item, mediaItems, onMediaChange, onSave, onCancel, isNew
}: {
  item: PortfolioItem; mediaItems: MediaItem[]; onMediaChange: (m: MediaItem[]) => void;
  onSave: (i: PortfolioItem) => void; onCancel: () => void; isNew: boolean;
}) {
  const [form, setForm] = useState(item);
  const [tagsText, setTagsText] = useState(item.tags.join(", "));

  const updateMetric = (idx: number, field: string, value: string) => {
    const metrics = [...form.metrics];
    metrics[idx] = { ...metrics[idx], [field]: value };
    setForm({ ...form, metrics });
  };

  const save = () => {
    onSave({ ...form, tags: tagsText.split(",").map(s => s.trim()).filter(Boolean) });
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm";

  return (
    <div className="glass-card-strong rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-foreground">{isNew ? "Add Project" : "Edit Project"}</h3>
        <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
      </div>

      {/* Media Upload */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Project Media (Images, Videos, Files)</label>
        <MediaUpload items={mediaItems} onChange={onMediaChange} maxFiles={10} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Client</label>
          <input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className={inputCls} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Category</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
            {portfolioCategories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">Tags (comma-separated)</label>
          <input value={tagsText} onChange={e => setTagsText(e.target.value)} className={inputCls} />
        </div>
      </div>

      {["problem", "dataSource", "method", "result"].map(field => (
        <div key={field}>
          <label className="text-sm font-medium text-foreground block mb-1 capitalize">{field === "dataSource" ? "Data Source" : field}</label>
          <textarea value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} rows={2} className={inputCls} />
        </div>
      ))}

      {/* Metrics */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Metrics</label>
        <div className="grid md:grid-cols-3 gap-3">
          {form.metrics.map((m, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-muted/50 space-y-2">
              <input placeholder="Label" value={m.label} onChange={e => updateMetric(idx, "label", e.target.value)} className={inputCls} />
              <input placeholder="Value (e.g. +32%)" value={m.value} onChange={e => updateMetric(idx, "value", e.target.value)} className={inputCls} />
              <select value={m.color} onChange={e => updateMetric(idx, "color", e.target.value)} className={inputCls}>
                <option value="text-emerald-400">Green</option>
                <option value="text-cyan-400">Cyan</option>
                <option value="text-blue-400">Blue</option>
                <option value="text-amber-400">Amber</option>
                <option value="text-purple-400">Purple</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="btn-gradient px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Save className="w-4 h-4" /> Save
        </button>
        <button onClick={onCancel} className="px-6 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
}
