import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, X, Save, Shield, UserPlus, Eye, EyeOff, ToggleLeft, ToggleRight, Search, ChevronDown, ChevronUp } from "lucide-react";

const PERMISSION_SECTIONS = [
  { key: "overview", label: "Overview / Dashboard" },
  { key: "orders", label: "Orders" },
  { key: "services", label: "Services" },
  { key: "portfolio", label: "Portfolio" },
  { key: "reviews", label: "Reviews" },
  { key: "payments", label: "Payments" },
  { key: "clients", label: "Clients" },
  { key: "messages", label: "Messages" },
  { key: "trash", label: "Trash Bin" },
  { key: "social", label: "Social Links" },
  { key: "site-settings", label: "Site Settings" },
  { key: "recruitment", label: "Recruitment" },
];

interface Manager {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
}

interface ConfirmDialogHook {
  confirm: (opts: { title: string; description: string; confirmText?: string; variant?: "danger" | "info" | "warning"; onConfirm: () => void }) => void;
}

export default function RecruitmentPanel({ confirmDialog }: { confirmDialog: ConfirmDialogHook }) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", email: "", phone: "", role: "manager",
    password: "",
    permissions: Object.fromEntries(PERMISSION_SECTIONS.map(s => [s.key, false])) as Record<string, boolean>,
  });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchManagers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("managers").select("*").order("created_at", { ascending: false });
    if (data) setManagers(data as any[]);
    if (error) console.error("Fetch managers error:", error);
    setLoading(false);
  };

  useEffect(() => { fetchManagers(); }, []);

  const resetForm = () => {
    setForm({
      name: "", email: "", phone: "", role: "manager", password: "",
      permissions: Object.fromEntries(PERMISSION_SECTIONS.map(s => [s.key, false])),
    });
    setShowForm(false);
    setEditId(null);
  };

  const toggleAllPermissions = (val: boolean) => {
    setForm(f => ({ ...f, permissions: Object.fromEntries(PERMISSION_SECTIONS.map(s => [s.key, val])) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        // Update existing manager
        const { error } = await supabase.from("managers").update({
          name: form.name, email: form.email, phone: form.phone,
          role: form.role, permissions: form.permissions as any,
          updated_at: new Date().toISOString(),
        }).eq("id", editId);
        if (error) throw error;
        toast({ title: "Manager updated" });
      } else {
        // Create new manager via edge function (preserves admin session)
        if (!form.password || form.password.length < 6) {
          toast({ title: "Password must be at least 6 characters", variant: "destructive" });
          setSaving(false);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await supabase.functions.invoke("create-manager", {
          body: {
            email: form.email,
            password: form.password,
            name: form.name,
            phone: form.phone,
            role: form.role,
            permissions: form.permissions,
          },
        });

        if (res.error) {
          const msg = res.error.message || "Failed to create manager";
          toast({ title: msg, variant: "destructive" });
          setSaving(false);
          return;
        }

        const result = res.data;
        if (result?.error) {
          toast({ title: result.error, variant: "destructive" });
          setSaving(false);
          return;
        }

        toast({ title: "Manager recruited successfully!" });
      }
      resetForm();
      fetchManagers();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleEdit = (m: Manager) => {
    setForm({
      name: m.name, email: m.email, phone: m.phone || "",
      role: m.role, password: "",
      permissions: { ...Object.fromEntries(PERMISSION_SECTIONS.map(s => [s.key, false])), ...m.permissions },
    });
    setEditId(m.id);
    setShowForm(true);
  };

  const handleDelete = (m: Manager) => {
    confirmDialog.confirm({
      title: "Remove Manager?",
      description: `This will remove ${m.name} from the team. Their auth account will remain but access will be revoked.`,
      confirmText: "Remove",
      variant: "danger",
      onConfirm: async () => {
        await supabase.from("managers").update({ is_active: false } as any).eq("id", m.id);
        if (m.user_id) {
          await supabase.from("user_roles").delete().eq("user_id", m.user_id).eq("role", "moderator" as any);
        }
        toast({ title: "Manager removed" });
        fetchManagers();
      },
    });
  };

  const handleToggleActive = async (m: Manager) => {
    const newActive = !m.is_active;
    await supabase.from("managers").update({ is_active: newActive } as any).eq("id", m.id);
    if (m.user_id) {
      if (newActive) {
        // Re-add role via edge function would be better, but for toggle we just update manager record
        // The login check should use managers table is_active flag
      } else {
        await supabase.from("user_roles").delete().eq("user_id", m.user_id).eq("role", "moderator" as any);
      }
    }
    toast({ title: newActive ? "Manager activated" : "Manager deactivated" });
    fetchManagers();
  };

  const filtered = managers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = (perms: Record<string, boolean>) => Object.values(perms || {}).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Recruitment & Access
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage team members and their dashboard permissions</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg btn-gradient text-primary-foreground text-sm font-medium">
          <UserPlus className="w-4 h-4" /> New Recruit
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card-strong rounded-xl p-5 space-y-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-foreground">{editId ? "Edit Manager" : "New Recruitment"}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role / Title</label>
              <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Manager, Moderator, Support" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="John Doe" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="john@example.com"
                disabled={!!editId} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="+1 555-0000" />
            </div>
          </div>

          {/* Credentials (only for new) */}
          {!editId && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Admin Access Password *</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm pr-10" placeholder="Min 6 characters" />
                <button onClick={() => setShowPass(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Section Permissions</label>
              <div className="flex gap-2">
                <button onClick={() => toggleAllPermissions(true)} className="text-xs text-primary hover:underline">Enable All</button>
                <button onClick={() => toggleAllPermissions(false)} className="text-xs text-destructive hover:underline">Disable All</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {PERMISSION_SECTIONS.map(s => (
                <button key={s.key}
                  onClick={() => setForm(f => ({ ...f, permissions: { ...f.permissions, [s.key]: !f.permissions[s.key] } }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    form.permissions[s.key]
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground"
                  }`}>
                  {form.permissions[s.key] ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg btn-gradient text-primary-foreground text-sm font-medium disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : editId ? "Update" : "Create & Recruit"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm" placeholder="Search managers..." />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {managers.length === 0 ? "No team members yet. Click 'New Recruit' to add one." : "No results found."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} className={`glass-card-strong rounded-xl overflow-hidden border ${m.is_active ? "border-border/50" : "border-destructive/30 opacity-60"}`}>
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${m.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {m.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm truncate">{m.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{m.role}</span>
                    {!m.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">Inactive</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.email} {m.phone ? `· ${m.phone}` : ""}</div>
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {enabledCount(m.permissions || {})}/{PERMISSION_SECTIONS.length} sections
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleToggleActive(m); }}
                    className={`p-1.5 rounded-lg ${m.is_active ? "text-emerald-400 hover:bg-emerald-400/10" : "text-muted-foreground hover:bg-muted"}`}>
                    {m.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(m); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(m); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedId === m.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded permissions view */}
              {expandedId === m.id && (
                <div className="border-t border-border/50 p-4 bg-muted/20">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Permissions</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                    {PERMISSION_SECTIONS.map(s => (
                      <div key={s.key} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                        (m.permissions as any)?.[s.key] ? "text-primary bg-primary/5" : "text-muted-foreground"
                      }`}>
                        {(m.permissions as any)?.[s.key] ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        {s.label}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Created: {new Date(m.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
