import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Settings, Image, Star, CreditCard, Users,
  MessageSquare, Link2, LogOut, TrendingUp, DollarSign, Package, UserCheck,
  CheckCircle2, XCircle, Clock, BarChart3, Plus, Trash2, Edit, X, Save,
  Globe, Database, Shield, Send, Palette, Type, Hash, FileText, Search,
  Calendar, Filter, ArrowUpRight, ArrowDownRight, Activity, Paperclip,
  MoreVertical, Eye, Play, Ban, Truck, MessageCircle, ExternalLink,
  Sun, Moon, RotateCcw, Trash
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { services as defaultServices, type Service, type ServicePackage } from "@/data/services";
import { type MediaItem, getMedia, saveMedia } from "@/lib/mediaStorage";
import MediaUpload from "@/components/media/MediaUpload";
import PortfolioPanelComponent from "@/components/admin/PortfolioPanel";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { getSiteConfig, saveSiteConfig, fetchSiteConfig, type SiteConfig } from "@/lib/siteConfig";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend, RadialBarChart, RadialBar } from "recharts";
import RecruitmentPanel from "@/components/admin/RecruitmentPanel";

const sidebarItems = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "orders", icon: ShoppingCart, label: "Orders" },
  { id: "services", icon: Settings, label: "Services" },
  { id: "portfolio", icon: Image, label: "Portfolio" },
  { id: "reviews", icon: Star, label: "Reviews" },
  { id: "payments", icon: CreditCard, label: "Payments" },
  { id: "clients", icon: Users, label: "Clients" },
  { id: "messages", icon: MessageSquare, label: "Messages" },
  { id: "trash", icon: Trash, label: "Trash Bin" },
  { id: "social", icon: Link2, label: "Social Links" },
  { id: "recruitment", icon: Shield, label: "Recruitment" },
  { id: "site-settings", icon: Globe, label: "Site Settings" },
];

// ─── Trash Bin System ───
interface TrashItem {
  id: string;
  type: "order" | "review" | "invoice" | "client" | "message";
  data: any;
  deletedAt: string;
  label: string;
}

function getTrashBin(): TrashItem[] {
  try { const saved = localStorage.getItem("admin_trash_bin"); return saved ? JSON.parse(saved) : []; } catch { return []; }
}
function saveTrashBin(items: TrashItem[]) {
  localStorage.setItem("admin_trash_bin", JSON.stringify(items));
}
function addToTrash(item: TrashItem) {
  const bin = getTrashBin();
  bin.unshift(item);
  // Keep max 100 items
  saveTrashBin(bin.slice(0, 100));
}
function removeFromTrash(id: string) {
  saveTrashBin(getTrashBin().filter(i => i.id !== id));
}
function clearTrash() {
  saveTrashBin([]);
}

const statusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10",
  in_progress: "text-blue-400 bg-blue-400/10",
  completed: "text-emerald-400 bg-emerald-400/10",
  rejected: "text-red-400 bg-red-400/10",
  delivered: "text-purple-400 bg-purple-400/10",
};

interface DbOrder {
  id: string; user_id: string; order_number: string; service_id: string; service_title: string;
  package_name: string; price: number; status: string; requirements: string; admin_notes: string;
  created_at: string; updated_at: string;
}
interface DbProfile {
  id: string; full_name: string; email: string; phone: string; company: string; created_at: string;
}
interface DbMessage {
  id: string; sender_id: string; receiver_id: string | null; subject: string; body: string;
  is_from_admin: boolean; is_read: boolean; created_at: string;
  attachment_url?: string | null; attachment_name?: string | null; message_type?: string;
}
interface DbReview {
  id: string; user_id: string; service_id: string; service_title: string; rating: number;
  title: string; body: string; status: string; created_at: string;
}

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#ec4899", "#14b8a6"];

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 };

// ─── Enhanced Overview with Charts & Filters ───
function OverviewPanel({ dbOrders, dbClients, dbMessages, dbReviews, dbInvoices = [], onNavigate }: { dbOrders: DbOrder[]; dbClients: DbProfile[]; dbMessages: DbMessage[]; dbReviews: DbReview[]; dbInvoices?: any[]; onNavigate: (panel: string) => void }) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y" | "all">("30d");

  const filterByTime = (date: string) => {
    if (timeRange === "all") return true;
    const d = new Date(date);
    const now = new Date();
    const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[timeRange];
    return d >= new Date(now.getTime() - days * 86400000);
  };

  const filteredOrders = dbOrders.filter(o => filterByTime(o.created_at));
  const totalRevenue = filteredOrders.filter(o => o.status === "completed" || o.status === "delivered").reduce((a, b) => a + Number(b.price), 0);
  const pendingRevenue = filteredOrders.filter(o => o.status === "pending" || o.status === "in_progress").reduce((a, b) => a + Number(b.price), 0);
  const avgOrderValue = filteredOrders.length > 0 ? Math.round(filteredOrders.reduce((a, b) => a + Number(b.price), 0) / filteredOrders.length) : 0;
  const completionRate = filteredOrders.length > 0 ? Math.round((filteredOrders.filter(o => o.status === "completed" || o.status === "delivered").length / filteredOrders.length) * 100) : 0;
  const rejectionRate = filteredOrders.length > 0 ? Math.round((filteredOrders.filter(o => o.status === "rejected").length / filteredOrders.length) * 100) : 0;
  const avgRating = dbReviews.length > 0 ? (dbReviews.reduce((a, b) => a + b.rating, 0) / dbReviews.length).toFixed(1) : "0";
  const repeatClients = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach(o => { counts[o.user_id] = (counts[o.user_id] || 0) + 1; });
    return Object.values(counts).filter(c => c > 1).length;
  }, [filteredOrders]);

  // Revenue over time chart data
  const revenueData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const key = new Date(o.created_at).toLocaleDateString("en", { month: "short", day: "numeric" });
      groups[key] = (groups[key] || 0) + Number(o.price);
    });
    return Object.entries(groups).map(([name, revenue]) => ({ name, revenue })).slice(-14);
  }, [filteredOrders]);

  // Orders by status for pie chart
  const statusData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredOrders.forEach(o => { groups[o.status] = (groups[o.status] || 0) + 1; });
    return Object.entries(groups).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [filteredOrders]);

  // Orders by service for bar chart
  const serviceData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredOrders.forEach(o => { groups[o.service_title] = (groups[o.service_title] || 0) + 1; });
    return Object.entries(groups).map(([name, orders]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, orders })).sort((a, b) => b.orders - a.orders).slice(0, 6);
  }, [filteredOrders]);

  // Client growth over time
  const clientGrowthData = useMemo(() => {
    const sorted = [...dbClients].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const groups: Record<string, number> = {};
    sorted.forEach(c => {
      const key = new Date(c.created_at).toLocaleDateString("en", { month: "short", day: "numeric" });
      groups[key] = (groups[key] || 0) + 1;
    });
    let cumulative = 0;
    return Object.entries(groups).map(([name, count]) => {
      cumulative += count;
      return { name, clients: cumulative, new: count };
    }).slice(-14);
  }, [dbClients]);

  // Revenue by package type
  const packageRevenueData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const pkg = o.package_name.charAt(0).toUpperCase() + o.package_name.slice(1);
      groups[pkg] = (groups[pkg] || 0) + Number(o.price);
    });
    return Object.entries(groups).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    dbReviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
    return dist.map((count, i) => ({ name: `${i + 1}★`, count, fill: i >= 3 ? "hsl(var(--primary))" : i >= 2 ? "hsl(var(--accent))" : "#f59e0b" }));
  }, [dbReviews]);

  // Message activity over time
  const messageActivityData = useMemo(() => {
    const filtered = dbMessages.filter(m => filterByTime(m.created_at));
    const groups: Record<string, { sent: number; received: number }> = {};
    filtered.forEach(m => {
      const key = new Date(m.created_at).toLocaleDateString("en", { month: "short", day: "numeric" });
      if (!groups[key]) groups[key] = { sent: 0, received: 0 };
      if (m.is_from_admin) groups[key].sent++;
      else groups[key].received++;
    });
    return Object.entries(groups).map(([name, v]) => ({ name, sent: v.sent, received: v.received })).slice(-14);
  }, [dbMessages, timeRange]);

  // Top clients by revenue
  const topClients = useMemo(() => {
    const groups: Record<string, { revenue: number; orders: number; name: string; email: string }> = {};
    filteredOrders.forEach(o => {
      const client = dbClients.find(c => c.id === o.user_id);
      if (!groups[o.user_id]) groups[o.user_id] = { revenue: 0, orders: 0, name: client?.full_name || "Unknown", email: client?.email || "" };
      groups[o.user_id].revenue += Number(o.price);
      groups[o.user_id].orders++;
    });
    return Object.values(groups).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders, dbClients]);

  // Revenue by service (for horizontal bar)
  const serviceRevenueData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredOrders.forEach(o => { groups[o.service_title] = (groups[o.service_title] || 0) + Number(o.price); });
    return Object.entries(groups).map(([name, revenue]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [filteredOrders]);

  // Get counts for services, portfolio, blogs
  const servicesList = useMemo(() => {
    const saved = localStorage.getItem("services_list");
    if (saved) try { return JSON.parse(saved) as any[]; } catch {}
    return defaultServices;
  }, []);
  const portfolioCount = useMemo(() => {
    try { const saved = localStorage.getItem("portfolio_items"); if (saved) return JSON.parse(saved).length; } catch {}
    return 0;
  }, []);
  const blogCount = useMemo(() => {
    try { const saved = localStorage.getItem("blog_posts"); if (saved) return JSON.parse(saved).length; } catch {}
    return 0;
  }, []);

  const stats = [
    { icon: DollarSign, label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, sub: `+$${pendingRevenue.toLocaleString()} pending`, color: "text-emerald-400 bg-emerald-400/10", trend: totalRevenue > 0 ? "up" : "none", target: "payments" },
    { icon: Package, label: "Total Orders", value: String(filteredOrders.length), sub: `${filteredOrders.filter(o => o.status === "pending").length} pending`, color: "text-blue-400 bg-blue-400/10", trend: filteredOrders.length > 0 ? "up" : "none", target: "orders" },
    { icon: Users, label: "Total Clients", value: String(dbClients.length), sub: `${dbClients.filter(c => filterByTime(c.created_at)).length} new · ${repeatClients} returning`, color: "text-purple-400 bg-purple-400/10", trend: "up", target: "clients" },
    { icon: Activity, label: "Avg Order Value", value: `$${avgOrderValue}`, sub: `${completionRate}% complete · ${rejectionRate}% rejected`, color: "text-accent bg-accent/10", trend: "none", target: "orders" },
    { icon: MessageSquare, label: "Messages", value: String(dbMessages.filter(m => filterByTime(m.created_at)).length), sub: `${dbMessages.filter(m => !m.is_read && !m.is_from_admin).length} unread`, color: "text-amber-400 bg-amber-400/10", trend: "none", target: "messages" },
    { icon: Star, label: "Reviews", value: String(dbReviews.filter(r => filterByTime(r.created_at)).length), sub: `${dbReviews.filter(r => r.status === "pending").length} pending · ⭐ ${avgRating}`, color: "text-primary bg-primary/10", trend: "none", target: "reviews" },
    { icon: Settings, label: "Active Services", value: String(servicesList.length), sub: `${servicesList.filter((s: any) => s.featured).length} featured`, color: "text-cyan-400 bg-cyan-400/10", trend: "none", target: "services" },
    { icon: Image, label: "Portfolio", value: String(portfolioCount), sub: "projects showcased", color: "text-pink-400 bg-pink-400/10", trend: "none", target: "portfolio" },
    { icon: CreditCard, label: "Invoices", value: String(dbInvoices.length), sub: `${dbInvoices.filter((i: any) => i.status === "pending").length} pending · ${dbInvoices.filter((i: any) => i.status === "paid").length} paid`, color: "text-indigo-400 bg-indigo-400/10", trend: "none", target: "payments" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Track your business performance at a glance.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {([["7d", "7D"], ["30d", "30D"], ["90d", "90D"], ["1y", "1Y"], ["all", "All"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTimeRange(key)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeRange === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {stats.map((s) => (
          <button key={s.label} onClick={() => onNavigate(s.target)} className="glass-card-strong rounded-xl p-4 text-left hover:ring-2 hover:ring-primary/30 transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4" /></div>
              <div className="flex items-center gap-1">
                {s.trend === "up" && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="font-heading text-xl font-bold text-foreground">{s.value}</div>
            <div className="text-muted-foreground text-[10px] mt-0.5">{s.label}</div>
            <div className="text-[10px] text-muted-foreground/70 mt-1">{s.sub}</div>
          </button>
        ))}
      </div>

      {/* Row 1: Revenue Trend + Orders by Service */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Revenue Trend</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-16">No data for selected period</p>}
        </div>

        <div className="glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Orders by Service</h3>
          {serviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-16">No data for selected period</p>}
        </div>
      </div>

      {/* Row 2: Client Growth + Revenue by Package */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Client Growth</h3>
          {clientGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={clientGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="clients" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Total Clients" />
                <Line type="monotone" dataKey="new" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} name="New Signups" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-16">No client data</p>}
        </div>

        <div className="glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Revenue by Package</h3>
          {packageRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={packageRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value}`, "Revenue"]} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {packageRevenueData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-16">No data for selected period</p>}
        </div>
      </div>

      {/* Row 3: Message Activity + Rating Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Message Activity</h3>
          {messageActivityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={messageActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="received" name="From Clients" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sent" name="Admin Replies" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-16">No messages in this period</p>}
        </div>

        <div className="glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Rating Distribution</h3>
          {ratingDistribution.some(r => r.count > 0) ? (
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ratingDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={35} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {ratingDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">⭐ {avgRating}</div>
                  <div className="text-[10px] text-muted-foreground">Avg Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{dbReviews.length}</div>
                  <div className="text-[10px] text-muted-foreground">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{dbReviews.filter(r => r.status === "approved").length}</div>
                  <div className="text-[10px] text-muted-foreground">Published</div>
                </div>
              </div>
            </div>
          ) : <p className="text-muted-foreground text-sm text-center py-16">No reviews yet</p>}
        </div>
      </div>

      {/* Row 4: Order Status Pie + Revenue by Service */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Order Status</h3>
          {statusData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="capitalize">{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-muted-foreground text-sm text-center py-16">No orders</p>}
        </div>

        <div className="lg:col-span-2 glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Revenue by Service</h3>
          {serviceRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serviceRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={120} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value}`, "Revenue"]} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {serviceRevenueData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center py-16">No data</p>}
        </div>
      </div>

      {/* Row 5: Top Clients + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Top Clients by Revenue</h3>
          {topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-400/20 text-amber-400" : i === 1 ? "bg-slate-300/20 text-slate-400" : i === 2 ? "bg-orange-400/20 text-orange-400" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">${c.revenue.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{c.orders} order{c.orders !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm text-center py-16">No client orders yet</p>}
        </div>

        <div className="glass-card-strong rounded-xl p-6">
          <h3 className="font-heading font-semibold text-foreground mb-4">Recent Orders</h3>
          {filteredOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders in this period.</p>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {filteredOrders.slice(0, 10).map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{o.order_number} · {o.service_title}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">${o.price}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${statusColors[o.status]}`}>{o.status.replace("_", " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Orders ───
function DbOrdersPanel({ dbOrders, clients, confirmDialog, onMessageClient, onOptimisticOrderUpdate }: { dbOrders: DbOrder[]; clients: DbProfile[]; confirmDialog: ReturnType<typeof useConfirmDialog>; onMessageClient?: (clientId: string) => void; onOptimisticOrderUpdate?: (id: string, updates: Partial<DbOrder>) => void }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  const filtered = dbOrders.filter(o => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const clientName = clients.find(c => c.id === o.user_id)?.full_name || "";
      return o.order_number.toLowerCase().includes(q) || o.service_title.toLowerCase().includes(q) || clientName.toLowerCase().includes(q);
    }
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    // Optimistic update
    onOptimisticOrderUpdate?.(id, { status, updated_at: new Date().toISOString() });
    setOpenMenu(null);
    toast({ title: `Order ${status.replace("_", " ")}` });
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const saveNotes = async (id: string) => {
    const { error } = await supabase.from("orders").update({ admin_notes: notesText, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Notes saved" });
    setEditingNotes(null);
  };

  const getClientName = (userId: string) => clients.find((c) => c.id === userId)?.full_name || "Unknown";
  const getClientEmail = (userId: string) => clients.find((c) => c.id === userId)?.email || "";
  const pendingCount = dbOrders.filter(o => o.status === "pending").length;

  const handleReject = (id: string) => {
    confirmDialog.confirm({ title: "Reject Order?", description: "This will mark the order as rejected.", confirmText: "Reject", variant: "danger", onConfirm: () => updateStatus(id, "rejected") });
  };

  const handleDelete = (id: string, orderNum: string) => {
    confirmDialog.confirm({ title: "Delete Order?", description: `Order ${orderNum} will be moved to trash.`, confirmText: "Delete", variant: "danger", onConfirm: async () => {
      const order = dbOrders.find(o => o.id === id);
      if (order) addToTrash({ id: order.id, type: "order", data: order, deletedAt: new Date().toISOString(), label: `Order ${order.order_number}` });
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Order moved to trash", description: "You can restore it from the Trash Bin." });
    }});
  };

  const statusActions = [
    { status: "pending", label: "Mark Pending", icon: Clock, color: "text-amber-400" },
    { status: "in_progress", label: "Start Progress", icon: Play, color: "text-blue-400" },
    { status: "completed", label: "Mark Completed", icon: CheckCircle2, color: "text-emerald-400" },
    { status: "delivered", label: "Mark Delivered", icon: Truck, color: "text-purple-400" },
    { status: "rejected", label: "Reject", icon: Ban, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-bold text-foreground">Order Management</h2>
          {pendingCount > 0 && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 animate-pulse">{pendingCount} new</span>}
        </div>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search orders..." className="pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm w-48" /></div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
            <option value="all">All Status</option><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="delivered">Delivered</option><option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="glass-card-strong rounded-xl p-8 text-center text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" /><p className="text-sm">No orders found.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const isNew = o.status === "pending";
            const isExpanded = expandedOrder === o.id;
            return (
              <div key={o.id} className={`glass-card-strong rounded-xl overflow-hidden transition-all ${isNew ? "ring-1 ring-amber-400/30" : ""}`}>
                {/* Order row */}
                <div className="p-4 flex items-center gap-4">
                  {isNew && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                  <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 items-center">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{o.order_number}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <button onClick={() => onMessageClient?.(o.user_id)} className="text-sm font-medium text-primary hover:underline text-left">{getClientName(o.user_id)}</button>
                      <p className="text-[10px] text-muted-foreground">{getClientEmail(o.user_id)}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm text-foreground">{o.service_title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{o.package_name}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-semibold text-foreground">${o.price}</p>
                    </div>
                    <div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full capitalize font-medium ${statusColors[o.status]}`}>{o.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setExpandedOrder(isExpanded ? null : o.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View details">
                      <Eye className="w-4 h-4" />
                    </button>
                    {/* 3-dot menu */}
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === o.id ? null : o.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === o.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-10 z-50 w-52 rounded-xl bg-card border border-border shadow-xl py-1.5 animate-in fade-in slide-in-from-top-2">
                            {/* Message client */}
                            <button onClick={() => { onMessageClient?.(o.user_id); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                              <MessageCircle className="w-4 h-4 text-primary" /> Message Client
                            </button>
                            <div className="border-t border-border/50 my-1" />
                            {/* Status actions */}
                            {statusActions.filter(a => a.status !== o.status).map(a => (
                              <button key={a.status} onClick={() => a.status === "rejected" ? (setOpenMenu(null), handleReject(o.id)) : updateStatus(o.id, a.status)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                                <a.icon className={`w-4 h-4 ${a.color}`} /> {a.label}
                              </button>
                            ))}
                            <div className="border-t border-border/50 my-1" />
                            {/* Add notes */}
                            <button onClick={() => { setEditingNotes(o.id); setNotesText(o.admin_notes || ""); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                              <Edit className="w-4 h-4 text-muted-foreground" /> {o.admin_notes ? "Edit Notes" : "Add Notes"}
                            </button>
                            {/* Delete */}
                            {getSiteConfig().deleteButtons?.orders !== false && <button onClick={() => { setOpenMenu(null); handleDelete(o.id, o.order_number); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                              <Trash2 className="w-4 h-4" /> Delete Order
                            </button>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border/30 p-4 bg-muted/20 space-y-3">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div><p className="text-xs font-medium text-muted-foreground mb-1">Service</p><p className="text-sm text-foreground">{o.service_title} ({o.package_name})</p></div>
                      <div><p className="text-xs font-medium text-muted-foreground mb-1">Price</p><p className="text-sm font-semibold text-foreground">${o.price}</p></div>
                      <div><p className="text-xs font-medium text-muted-foreground mb-1">Last Updated</p><p className="text-sm text-foreground">{new Date(o.updated_at).toLocaleString()}</p></div>
                    </div>
                    {o.requirements && (
                      <div><p className="text-xs font-medium text-muted-foreground mb-1">Client Requirements</p><p className="text-sm text-foreground bg-muted rounded-lg p-3 whitespace-pre-wrap">{o.requirements}</p></div>
                    )}
                    {o.admin_notes && !editingNotes && (
                      <div><p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p><p className="text-sm text-foreground bg-primary/5 rounded-lg p-3 whitespace-pre-wrap">{o.admin_notes}</p></div>
                    )}
                  </div>
                )}

                {/* Inline notes editor */}
                {editingNotes === o.id && (
                  <div className="border-t border-border/30 p-4 bg-muted/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Admin Notes</p>
                    <textarea value={notesText} onChange={e => setNotesText(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm mb-2" placeholder="Add internal notes about this order..." />
                    <div className="flex gap-2">
                      <button onClick={() => saveNotes(o.id)} className="btn-gradient px-4 py-1.5 rounded-lg text-xs font-medium">Save</button>
                      <button onClick={() => setEditingNotes(null)} className="px-4 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Services Panel with Category Management ───
function ServicesPanel({ servicesList, setServicesList, confirmDialog }: { servicesList: Service[]; setServicesList: (s: Service[]) => void; confirmDialog: ReturnType<typeof useConfirmDialog> }) {
  const [editing, setEditing] = useState<Service | null>(null);
  const [adding, setAdding] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Derive categories from services + saved custom categories
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("service_categories");
    if (saved) try { return JSON.parse(saved); } catch {}
    return [];
  });

  const allCategories = useMemo(() => {
    const fromServices = new Set(servicesList.map(s => s.category));
    customCategories.forEach(c => fromServices.add(c));
    return Array.from(fromServices).sort();
  }, [servicesList, customCategories]);

  const saveCustomCategories = (cats: string[]) => {
    setCustomCategories(cats);
    localStorage.setItem("service_categories", JSON.stringify(cats));
    // Also update the exported serviceCategories in localStorage for the Services page
    const allCats = new Set(servicesList.map(s => s.category));
    cats.forEach(c => allCats.add(c));
    localStorage.setItem("service_categories_list", JSON.stringify(["All", ...Array.from(allCats).sort()]));
  };

  const addCategory = () => {
    const cat = newCategory.trim();
    if (!cat || allCategories.includes(cat)) return;
    saveCustomCategories([...customCategories, cat]);
    setNewCategory("");
  };

  const deleteCategory = (cat: string) => {
    const usedBy = servicesList.filter(s => s.category === cat);
    if (usedBy.length > 0) {
      toast({ title: "Cannot delete", description: `"${cat}" is used by ${usedBy.length} service(s). Reassign them first.`, variant: "destructive" });
      return;
    }
    saveCustomCategories(customCategories.filter(c => c !== cat));
  };

  const emptyPkg: ServicePackage = { name: "", price: 0, deliverables: [], deliveryDays: 1 };
  const emptyService: Service = { id: "", title: "", description: "", icon: "BarChart3", category: allCategories[0] || "Analysis", featured: false, orderInstructions: "", packages: { basic: { ...emptyPkg, name: "Basic" }, standard: { ...emptyPkg, name: "Standard" }, premium: { ...emptyPkg, name: "Premium" } } };
  const startEdit = (service: Service) => { setEditing(service); setAdding(false); setMediaItems(getMedia("service", service.id)); };
  const handleSave = (service: Service) => {
    const id = adding ? `svc-${Date.now()}` : service.id;
    const saved = saveMedia("service", id, mediaItems);
    if (!saved) {
      toast({ title: "Storage full!", description: "Images are too large for local storage. Try fewer or smaller images.", variant: "destructive" });
      return;
    }
    const newList = adding ? [...servicesList, { ...service, id }] : servicesList.map(s => s.id === service.id ? service : s);
    setServicesList(newList);
    const allCats = new Set(newList.map(s => s.category));
    customCategories.forEach(c => allCats.add(c));
    localStorage.setItem("service_categories_list", JSON.stringify(["All", ...Array.from(allCats).sort()]));
    setEditing(null); setAdding(false);
    toast({ title: "Service saved!" });
  };
  const handleDelete = (id: string, title: string) => { confirmDialog.confirm({ title: "Delete Service?", description: `"${title}" will be permanently removed.`, confirmText: "Delete", variant: "danger", onConfirm: () => setServicesList(servicesList.filter(s => s.id !== id)) }); };
  const toggleActive = (id: string) => {
    setServicesList(servicesList.map(s => s.id === id ? { ...s, active: s.active === false ? true : false } : s));
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-2xl font-bold text-foreground">Service Management</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryManager(!showCategoryManager)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showCategoryManager ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            <Filter className="w-4 h-4" /> Categories
          </button>
          <button onClick={() => { setEditing(emptyService); setAdding(true); setMediaItems([]); }} className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Service</button>
        </div>
      </div>

      {/* Category Manager */}
      {showCategoryManager && (
        <div className="glass-card-strong rounded-xl p-5 space-y-4">
          <h3 className="font-heading font-semibold text-foreground text-sm">Manage Categories</h3>
          <div className="flex gap-2">
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} placeholder="New category name..." className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            <button onClick={addCategory} disabled={!newCategory.trim()} className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allCategories.map(cat => {
              const count = servicesList.filter(s => s.category === cat).length;
              const isCustom = customCategories.includes(cat);
              return (
                <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border/50 text-sm">
                  <span className="text-foreground font-medium">{cat}</span>
                  <span className="text-[10px] text-muted-foreground">({count})</span>
                  {count === 0 && (
                    <button onClick={() => deleteCategory(cat)} className="ml-1 p-0.5 rounded text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete category">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {allCategories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet. Add one above or create a service with a category.</p>}
        </div>
      )}

      {editing && <ServiceEditor service={editing} onSave={handleSave} onCancel={() => { setEditing(null); setAdding(false); }} mediaItems={mediaItems} onMediaChange={setMediaItems} categories={allCategories} />}
      <div className="grid gap-4">{servicesList.map((s) => {
        const isActive = s.active !== false;
        return (
        <div key={s.id} className={`glass-card-strong rounded-xl p-5 flex items-center justify-between ${!isActive ? "opacity-50" : ""}`}>
          <div><div className="flex items-center gap-2"><h3 className="font-heading font-semibold text-foreground">{s.title}</h3>{s.featured && <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">Featured</span>}{!isActive && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Inactive</span>}</div><p className="text-sm text-muted-foreground mt-1">{s.category} · Basic ${s.packages.basic.price} · Standard ${s.packages.standard.price} · Premium ${s.packages.premium.price}</p></div>
          <div className="flex gap-2 items-center">
            <button onClick={() => toggleActive(s.id)} className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-muted"}`} title={isActive ? "Deactivate" : "Activate"}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "left-6" : "left-1"}`}/></button>
            <button onClick={() => startEdit(s)} className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-4 h-4" /></button>{getSiteConfig().deleteButtons?.services !== false && <button onClick={() => handleDelete(s.id, s.title)} className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>}
          </div>
        </div>
      );})}</div>
    </div>
  );
}

function ServiceEditor({ service, onSave, onCancel, mediaItems, onMediaChange, categories = [] }: { service: Service; onSave: (s: Service) => void; onCancel: () => void; mediaItems: MediaItem[]; onMediaChange: (m: MediaItem[]) => void; categories?: string[] }) {
  const [form, setForm] = useState(service);
  const [deliverablesText, setDeliverablesText] = useState({ basic: service.packages.basic.deliverables.join(", "), standard: service.packages.standard.deliverables.join(", "), premium: service.packages.premium.deliverables.join(", ") });
  const updatePkg = (tier: "basic" | "standard" | "premium", field: string, value: string | number) => { setForm({ ...form, packages: { ...form.packages, [tier]: { ...form.packages[tier], [field]: value } } }); };
  const save = () => { onSave({ ...form, packages: { basic: { ...form.packages.basic, deliverables: deliverablesText.basic.split(",").map(s => s.trim()).filter(Boolean) }, standard: { ...form.packages.standard, deliverables: deliverablesText.standard.split(",").map(s => s.trim()).filter(Boolean) }, premium: { ...form.packages.premium, deliverables: deliverablesText.premium.split(",").map(s => s.trim()).filter(Boolean) } } }); };
  return (
    <div className="glass-card-strong rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between"><h3 className="font-heading font-semibold text-foreground">{service.id ? "Edit Service" : "Add New Service"}</h3><button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button></div>
      <div><label className="text-sm font-medium text-foreground block mb-2">Service Media</label><MediaUpload items={mediaItems} onChange={onMediaChange} maxFiles={10} /></div>
      <div className="grid md:grid-cols-2 gap-4"><div><label className="text-sm font-medium text-foreground block mb-1">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" /></div><div><label className="text-sm font-medium text-foreground block mb-1">Category</label>{categories.length > 0 ? (<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"><option value="">Select category</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>) : (<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />)}</div></div>
      <div><label className="text-sm font-medium text-foreground block mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" /></div>
      <div><label className="text-sm font-medium text-foreground block mb-1">Order Instructions (one per line, shown to clients when ordering)</label><textarea value={form.orderInstructions || ""} onChange={(e) => setForm({ ...form, orderInstructions: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" placeholder="Describe your project goals&#10;Share relevant data files or links&#10;Mention preferred timeline" /></div>
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured Service</label>
      {(["basic", "standard", "premium"] as const).map((tier) => (
        <div key={tier} className="p-4 rounded-lg bg-muted/50 space-y-3"><h4 className="text-sm font-semibold text-foreground capitalize">{tier} Package</h4><div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-muted-foreground">Price ($)</label><input type="number" value={form.packages[tier].price} onChange={(e) => updatePkg(tier, "price", Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" /></div><div><label className="text-xs text-muted-foreground">Delivery Days</label><input type="number" value={form.packages[tier].deliveryDays} onChange={(e) => updatePkg(tier, "deliveryDays", Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" /></div></div><div><label className="text-xs text-muted-foreground">Deliverables (comma-separated)</label><input value={deliverablesText[tier]} onChange={(e) => setDeliverablesText({ ...deliverablesText, [tier]: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" /></div></div>
      ))}
      <div className="flex gap-2"><button onClick={save} className="btn-gradient px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save</button><button onClick={onCancel} className="px-6 py-2 rounded-lg bg-muted text-muted-foreground text-sm">Cancel</button></div>
    </div>
  );
}

const PortfolioPanel = PortfolioPanelComponent;

// ─── Reviews ───
function DbReviewsPanel({ reviews, confirmDialog }: { reviews: DbReview[]; confirmDialog: ReturnType<typeof useConfirmDialog> }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", company: "", service_title: "", rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const updateStatus = async (id: string, status: string) => { const { error } = await supabase.from("reviews").update({ status }).eq("id", id); if (error) toast({ title: "Error", description: error.message, variant: "destructive" }); else toast({ title: `Review ${status}` }); };
  const handleReject = (id: string) => { confirmDialog.confirm({ title: "Reject Review?", description: "This review will be hidden from the website.", confirmText: "Reject", variant: "danger", onConfirm: () => updateStatus(id, "rejected") }); };
  const handleDeleteReview = (r: DbReview) => {
    confirmDialog.confirm({ title: "Delete Review?", description: `This review will be moved to trash.`, confirmText: "Delete", variant: "danger", onConfirm: async () => {
      addToTrash({ id: r.id, type: "review", data: r, deletedAt: new Date().toISOString(), label: `Review by ${r.title || "Unknown"} - ${r.service_title}` });
      const { error } = await supabase.from("reviews").delete().eq("id", r.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Review moved to trash" });
    }});
  };
  const addManualReview = async () => {
    if (!form.body.trim() || !form.name.trim()) return;
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSubmitting(false); return; }
    const { error } = await supabase.from("reviews").insert({ user_id: session.user.id, service_id: "manual", service_title: form.service_title || "General", rating: form.rating, title: `${form.name}${form.role ? ` - ${form.role}` : ""}${form.company ? ` @ ${form.company}` : ""}`, body: form.body.trim(), status: "approved" });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Review added!" }); setForm({ name: "", role: "", company: "", service_title: "", rating: 5, title: "", body: "" }); setShowAdd(false); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="font-heading text-2xl font-bold text-foreground">Review Management</h2><button onClick={() => setShowAdd(!showAdd)} className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Add Manual Review</button></div>
      {showAdd && (
        <div className="glass-card-strong rounded-xl p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">{[{k:"name",l:"Reviewer Name",p:"John Doe"},{k:"role",l:"Role",p:"CEO"},{k:"company",l:"Company",p:"Acme Inc."}].map(f=><div key={f.k}><label className="text-sm font-medium text-foreground block mb-1">{f.l}</label><input value={(form as any)[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" placeholder={f.p}/></div>)}</div>
          <div className="grid md:grid-cols-2 gap-4"><div><label className="text-sm font-medium text-foreground block mb-1">Service</label><input value={form.service_title} onChange={e=>setForm({...form,service_title:e.target.value})} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" /></div><div><label className="text-sm font-medium text-foreground block mb-1">Rating</label><div className="flex gap-1 pt-1">{[1,2,3,4,5].map(r=><button key={r} onClick={()=>setForm({...form,rating:r})}><Star className={`w-6 h-6 ${r<=form.rating?"text-amber-400 fill-amber-400":"text-muted-foreground"}`}/></button>)}</div></div></div>
          <div><label className="text-sm font-medium text-foreground block mb-1">Review Text</label><textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} rows={3} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" /></div>
          <div className="flex gap-2"><button onClick={addManualReview} disabled={submitting} className="btn-gradient px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{submitting?"Adding...":"Add Review"}</button><button onClick={()=>setShowAdd(false)} className="px-6 py-2 rounded-lg bg-muted text-muted-foreground text-sm">Cancel</button></div>
        </div>
      )}
      {reviews.length === 0 ? <div className="glass-card-strong rounded-xl p-8 text-center"><Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" /><p className="text-muted-foreground text-sm">No reviews yet.</p></div> : (
        <div className="grid gap-4">{reviews.map(r=>{
          const isActive = r.status === "approved";
          return (
          <div key={r.id} className={`glass-card-strong rounded-xl p-5 ${r.status === "rejected" ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1"><div className="flex items-center gap-2 mb-2 flex-wrap"><span className="font-semibold text-foreground text-sm">{r.service_title}</span><div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className={`w-3 h-3 ${s<=r.rating?"text-amber-400 fill-amber-400":"text-muted-foreground"}`}/>)}</div><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${r.status==="approved"?"text-emerald-400 bg-emerald-400/10":r.status==="rejected"?"text-red-400 bg-red-400/10":"text-amber-400 bg-amber-400/10"}`}>{r.status}</span></div>{r.title&&<p className="text-sm font-medium text-foreground mb-1">{r.title}</p>}<p className="text-muted-foreground text-sm italic">"{r.body}"</p></div>
              <div className="flex gap-2 shrink-0 ml-4 items-center">
                <button onClick={() => updateStatus(r.id, isActive ? "rejected" : "approved")} className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-muted"}`} title={isActive ? "Deactivate" : "Activate"}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? "left-6" : "left-1"}`}/></button>
                {r.status==="pending"&&<button onClick={()=>updateStatus(r.id,"approved")} className="text-xs px-2 py-1 rounded bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20">Approve</button>}
                {getSiteConfig().deleteButtons?.reviews !== false && <button onClick={() => handleDeleteReview(r)} className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          </div>
        );})}</div>
      )}
    </div>
  );
}

// ─── Payments ───
function PaymentsPanel({ invoices, clients, onRefresh, confirmDialog }: { invoices: DbInvoice[]; clients: DbProfile[]; onRefresh: () => void; confirmDialog: ReturnType<typeof useConfirmDialog> }) {
  const [paymentConfigs, setPaymentConfigs] = useState(() => { const saved = localStorage.getItem("payment_configs"); if (saved) try { return JSON.parse(saved); } catch {} return { stripe: { enabled: false, publicKey: "", secretKey: "", testMode: true }, paypal: { enabled: false, clientId: "" }, bankTransfer: { enabled: false, bankName: "", accountName: "", accountNumber: "" }, mobileBanking: { enabled: false, bkashNumber: "", nagadNumber: "" }, crypto: { enabled: false, btcAddress: "", ethAddress: "", usdtAddress: "", usdtErcAddress: "", network: "", cryptoInstructions: "" }, manualPayment: { enabled: false, instructions: "" } }; });
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"invoices" | "config">("invoices");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoiceSearch, setInvoiceSearch] = useState("");

  const updateConfig = (method: string, field: string, value: string | boolean) => { setPaymentConfigs((prev: any) => ({ ...prev, [method]: { ...prev[method], [field]: value } })); setSavedMsg(""); };
  const saveAll = async () => {
    localStorage.setItem("payment_configs", JSON.stringify(paymentConfigs));
    try {
      const { data: existing } = await supabase.from("site_config").select("id").eq("config_key", "payment_configs").maybeSingle();
      if (existing) {
        await supabase.from("site_config").update({ config_data: paymentConfigs as any, updated_at: new Date().toISOString() }).eq("config_key", "payment_configs");
      } else {
        await supabase.from("site_config").insert({ config_key: "payment_configs", config_data: paymentConfigs as any } as any);
      }
    } catch (e) { console.error("Failed to save payment configs to DB:", e); }
    setSavedMsg("✓ Saved!"); setTimeout(() => setSavedMsg(""), 3000);
  };

  useEffect(() => {
    const loadFromDb = async () => {
      const { data } = await supabase.from("site_config").select("config_data").eq("config_key", "payment_configs").maybeSingle();
      if (data?.config_data) {
        const cfg = data.config_data as Record<string, any>;
        setPaymentConfigs((prev: any) => ({ ...prev, ...cfg }));
        localStorage.setItem("payment_configs", JSON.stringify({ ...paymentConfigs, ...cfg }));
      }
    };
    loadFromDb();
  }, []);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.full_name || "Unknown";
  const getClientEmail = (id: string) => clients.find(c => c.id === id)?.email || "";

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (invoiceSearch) {
      const q = invoiceSearch.toLowerCase();
      const clientName = getClientName(inv.client_id).toLowerCase();
      const clientEmail = getClientEmail(inv.client_id).toLowerCase();
      return inv.invoice_number.toLowerCase().includes(q) || inv.service_title.toLowerCase().includes(q) || clientName.includes(q) || clientEmail.includes(q);
    }
    return true;
  });

  const totalPaid = invoices.filter(i => i.status === "paid").reduce((a, b) => a + Number(b.amount), 0);
  const totalPending = invoices.filter(i => i.status === "pending").reduce((a, b) => a + Number(b.amount), 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((a, b) => a + Number(b.amount), 0);

  const updateInvoiceStatus = async (invId: string, status: string) => {
    await supabase.from("invoices").update({ status, updated_at: new Date().toISOString(), ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}) } as any).eq("id", invId);
    toast({ title: `Invoice marked ${status}` });
    onRefresh();
  };

  const handleDeleteInvoice = (inv: DbInvoice) => {
    confirmDialog.confirm({ title: "Delete Invoice?", description: `Invoice ${inv.invoice_number} will be moved to trash.`, confirmText: "Delete", variant: "danger", onConfirm: async () => {
      addToTrash({ id: inv.id, type: "invoice", data: inv, deletedAt: new Date().toISOString(), label: `Invoice ${inv.invoice_number} - $${inv.amount}` });
      const { error } = await supabase.from("invoices").delete().eq("id", inv.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Invoice moved to trash" }); onRefresh(); }
    }});
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm";
  const methods = [
    { id: "stripe", label: "Stripe", emoji: "💳", fields: [{ key: "publicKey", label: "Publishable Key", placeholder: "pk_test_..." }, { key: "secretKey", label: "Secret Key", placeholder: "sk_test_...", type: "password" }] },
    { id: "paypal", label: "PayPal", emoji: "🅿️", fields: [{ key: "clientId", label: "Client ID", placeholder: "Client ID" }] },
    { id: "bankTransfer", label: "Bank Transfer", emoji: "🏦", fields: [{ key: "bankName", label: "Bank Name", placeholder: "Bank" }, { key: "accountName", label: "Account Holder", placeholder: "Name" }, { key: "accountNumber", label: "Account #", placeholder: "Number", type: "password" }] },
    { id: "mobileBanking", label: "Mobile Banking", emoji: "📱", fields: [{ key: "bkashNumber", label: "bKash", placeholder: "+880..." }, { key: "nagadNumber", label: "Nagad", placeholder: "+880..." }] },
    { id: "crypto", label: "Cryptocurrency", emoji: "₿", fields: [{ key: "btcAddress", label: "Bitcoin (BTC) Wallet", placeholder: "bc1q..." }, { key: "ethAddress", label: "Ethereum (ETH) Wallet", placeholder: "0x..." }, { key: "usdtAddress", label: "USDT (TRC-20) Wallet", placeholder: "T..." }, { key: "usdtErcAddress", label: "USDT (ERC-20) Wallet", placeholder: "0x..." }, { key: "network", label: "Preferred Network", placeholder: "e.g. Bitcoin, Ethereum, Tron" }, { key: "cryptoInstructions", label: "Payment Instructions", placeholder: "Send exact amount and share TX hash..." }] },
    { id: "manualPayment", label: "Manual", emoji: "✋", fields: [{ key: "instructions", label: "Instructions", placeholder: "How to pay..." }] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-2xl font-bold text-foreground">Payment Management</h2>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("invoices")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "invoices" ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            <FileText className="w-4 h-4 inline mr-1.5" />All Invoices
          </button>
          <button onClick={() => setActiveTab("config")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "config" ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            <Settings className="w-4 h-4 inline mr-1.5" />Payment Methods
          </button>
        </div>
      </div>

      {activeTab === "invoices" ? (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Invoices", value: String(invoices.length), color: "text-foreground" },
              { label: "Paid", value: `$${totalPaid.toLocaleString()}`, color: "text-emerald-400" },
              { label: "Pending", value: `$${totalPending.toLocaleString()}`, color: "text-amber-400" },
              { label: "Overdue", value: `$${totalOverdue.toLocaleString()}`, color: "text-red-400" },
            ].map(s => (
              <div key={s.label} className="glass-card-strong rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} placeholder="Search by invoice #, client, service..." className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Invoice Table */}
          {filteredInvoices.length === 0 ? (
            <div className="glass-card-strong rounded-xl p-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No invoices found.</p>
            </div>
          ) : (
            <div className="glass-card-strong rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      {["Invoice #", "Client", "Service", "Package", "Amount", "Method", "Status", "Due Date", "Sent", "Paid At", "Actions"].map(h => (
                        <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                        <td className="p-3"><span className="text-xs font-mono px-2 py-1 rounded bg-primary/10 text-primary font-semibold">{inv.invoice_number}</span></td>
                        <td className="p-3">
                          <p className="text-sm font-medium text-foreground">{getClientName(inv.client_id)}</p>
                          <p className="text-[10px] text-muted-foreground">{getClientEmail(inv.client_id)}</p>
                        </td>
                        <td className="p-3 text-sm text-foreground">{inv.service_title}</td>
                        <td className="p-3 text-sm text-muted-foreground capitalize">{inv.package_name || "—"}</td>
                        <td className="p-3 text-sm font-bold text-foreground">${Number(inv.amount).toLocaleString()}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          <span>{PAYMENT_METHODS.find(m => m.id === inv.payment_method)?.emoji} {PAYMENT_METHODS.find(m => m.id === inv.payment_method)?.label || inv.payment_method}</span>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border capitalize ${invoiceStatusColors[inv.status] || invoiceStatusColors.pending}`}>
                            {inv.status === "in_review" ? "In Review" : inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</td>
                        <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : "—"}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {inv.status !== "paid" && (
                              <button onClick={() => updateInvoiceStatus(inv.id, "paid")} className="text-[10px] px-2 py-1 rounded bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20" title="Mark Paid">
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                            )}
                            {inv.status === "pending" && (
                              <button onClick={() => updateInvoiceStatus(inv.id, "overdue")} className="text-[10px] px-2 py-1 rounded bg-orange-400/10 text-orange-400 hover:bg-orange-400/20" title="Mark Overdue">
                                <Clock className="w-3 h-3" />
                              </button>
                            )}
                            {inv.status !== "cancelled" && inv.status !== "paid" && (
                              <button onClick={() => updateInvoiceStatus(inv.id, "cancelled")} className="text-[10px] px-2 py-1 rounded bg-red-400/10 text-red-400 hover:bg-red-400/20" title="Cancel">
                                <XCircle className="w-3 h-3" />
                              </button>
                            )}
                            {inv.payment_link && (
                              <a href={inv.payment_link} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20" title="Payment Link">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {getSiteConfig().deleteButtons?.payments !== false && <button onClick={() => handleDeleteInvoice(inv)} className="text-[10px] px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20" title="Delete">
                              <Trash2 className="w-3 h-3" />
                            </button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between bg-muted/20">
                <p className="text-xs text-muted-foreground">{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}</p>
                <p className="text-sm font-bold text-foreground">Total: ${filteredInvoices.reduce((a, b) => a + Number(b.amount), 0).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {savedMsg && <div className="px-4 py-3 rounded-lg bg-emerald-400/10 text-emerald-400 text-sm font-medium">{savedMsg}</div>}
          <div className="flex justify-end"><button onClick={saveAll} className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save All</button></div>
          {methods.map(m => { const config = (paymentConfigs[m.id]||{}) as Record<string,any>; const isExp = expandedMethod===m.id; return (
            <div key={m.id} className="glass-card-strong rounded-xl overflow-hidden">
              <button onClick={()=>setExpandedMethod(isExp?null:m.id)} className="w-full flex items-center justify-between p-5 text-left"><div className="flex items-center gap-3"><span className="text-2xl">{m.emoji}</span><h4 className="font-heading font-semibold text-foreground">{m.label}</h4></div><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.enabled?"bg-emerald-400/10 text-emerald-400":"bg-muted text-muted-foreground"}`}>{config.enabled?"Active":"Off"}</span></button>
              {isExp && <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4"><div className="flex items-center justify-between"><label className="text-sm font-medium text-foreground">Enable</label><button onClick={()=>updateConfig(m.id,"enabled",!config.enabled)} className={`relative w-12 h-6 rounded-full transition-colors ${config.enabled?"bg-accent":"bg-muted"}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform ${config.enabled?"left-7":"left-1"}`}/></button></div><div className="grid md:grid-cols-2 gap-4">{m.fields.map(f=><div key={f.key}><label className="text-sm font-medium text-foreground block mb-1">{f.label}</label><input type={(f as any).type||"text"} value={config[f.key]||""} onChange={e=>updateConfig(m.id,f.key,e.target.value)} placeholder={f.placeholder} className={inputCls}/></div>)}</div><button onClick={saveAll} className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mt-2"><Save className="w-4 h-4" /> Save</button></div>}
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}

// ─── Clients with Search & Client ID ───
function ClientsPanel({ clients, orders, onMessageClient, confirmDialog }: { clients: DbProfile[]; orders: DbOrder[]; onMessageClient: (id: string) => void; confirmDialog: ReturnType<typeof useConfirmDialog> }) {
  const [search, setSearch] = useState("");
  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const clientId = c.id.slice(0, 8).toUpperCase();
    return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q) || clientId.includes(q.toUpperCase());
  });

  const handleDeleteClient = (c: DbProfile) => {
    confirmDialog.confirm({ title: "Delete Client?", description: `${c.full_name || c.email} will be moved to trash.`, confirmText: "Delete", variant: "danger", onConfirm: async () => {
      addToTrash({ id: c.id, type: "client", data: c, deletedAt: new Date().toISOString(), label: `Client: ${c.full_name || c.email}` });
      const { error } = await supabase.from("profiles").delete().eq("id", c.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Client moved to trash" });
    }});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-2xl font-bold text-foreground">Client Management</h2>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, ID..." className="pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm w-64" /></div>
      </div>
      {filtered.length === 0 ? (
        <div className="glass-card-strong rounded-xl p-8 text-center text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" /><p className="text-sm">No clients found.</p></div>
      ) : (
        <div className="glass-card-strong rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border/50">{["Client ID", "Name", "Email", "Phone", "Company", "Orders", "Total Spent", "Joined", "Actions"].map(h => <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>)}</tr></thead>
              <tbody>{filtered.map(c => {
                const clientOrders = orders.filter(o => o.user_id === c.id);
                const totalSpent = clientOrders.reduce((a, o) => a + Number(o.price), 0);
                return (
                  <tr key={c.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                    <td className="p-4"><span className="text-xs font-mono px-2 py-1 rounded bg-primary/10 text-primary font-semibold">#{c.id.slice(0, 8).toUpperCase()}</span></td>
                    <td className="p-4 text-sm font-medium text-foreground">{c.full_name || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{c.email}</td>
                    <td className="p-4 text-sm text-muted-foreground">{c.phone || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{c.company || "—"}</td>
                    <td className="p-4 text-sm text-foreground font-medium">{clientOrders.length}</td>
                    <td className="p-4 text-sm font-semibold text-foreground">${totalSpent.toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => onMessageClient(c.id)} className="text-xs px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"><Send className="w-3 h-3" /> Message</button>
                        {getSiteConfig().deleteButtons?.clients !== false && <button onClick={() => handleDeleteClient(c)} className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoice interface ───
interface DbInvoice {
  id: string; invoice_number: string; admin_id: string; client_id: string;
  service_title: string; package_name: string; description: string; amount: number;
  payment_method: string; payment_link: string; status: string; notes: string;
  due_date: string | null; paid_at: string | null; created_at: string; updated_at: string;
}

const PAYMENT_METHODS = [
  { id: "paypal", label: "PayPal", emoji: "🅿️" },
  { id: "stripe", label: "Stripe", emoji: "💳" },
  { id: "bank_transfer", label: "Bank Transfer", emoji: "🏦" },
  { id: "bkash", label: "bKash", emoji: "📱" },
  { id: "nagad", label: "Nagad", emoji: "📱" },
  { id: "wise", label: "Wise", emoji: "🌍" },
  { id: "crypto", label: "Cryptocurrency", emoji: "₿" },
  { id: "other", label: "Other", emoji: "💰" },
];

const invoiceStatusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  in_review: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  paid: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  overdue: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

// ─── Client Search for Compose ───
function ComposeClientSearch({ clients, value, onChange }: { clients: DbProfile[]; value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = clients.find(c => c.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = clients.filter(c => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.slice(0, 8).toUpperCase().includes(q.toUpperCase());
  });

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={open ? query : selected ? `${selected.full_name} (${selected.email})` : query}
          onChange={e => { setQuery(e.target.value); onChange(""); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name, email, or client ID..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-card border border-border shadow-xl">
          {filtered.map(c => (
            <button key={c.id} onClick={() => { onChange(c.id); setQuery(""); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{c.full_name}</p>
                <p className="text-xs text-muted-foreground">{c.email}</p>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">#{c.id.slice(0, 8).toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
      {open && query && filtered.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl bg-card border border-border shadow-xl p-4 text-center text-sm text-muted-foreground">No clients found</div>
      )}
    </div>
  );
}

// ─── Chat-Style Messages for Admin ───
function DbMessagesPanel({ messages, clients, adminId, preselectedClientId, onClearPreselected, onOptimisticMessage, onMarkRead, confirmDialog, onRefresh }: { messages: DbMessage[]; clients: DbProfile[]; adminId: string; preselectedClientId?: string | null; onClearPreselected?: () => void; onOptimisticMessage?: (msg: DbMessage) => void; onMarkRead?: (ids: string[]) => void; confirmDialog: ReturnType<typeof useConfirmDialog>; onRefresh: () => void }) {
  const [selectedClient, setSelectedClient] = useState<string | null>(preselectedClientId || null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTarget, setComposeTarget] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [selectedServiceLink, setSelectedServiceLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invoice builder state
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    service_title: "", package_name: "", description: "", amount: "",
    payment_method: "paypal", payment_link: "", notes: "", due_date: ""
  });
  const [invoices, setInvoices] = useState<DbInvoice[]>([]);

  // Fetch invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      const { data } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (data) setInvoices(data as any[]);
    };
    fetchInvoices();
    const channel = supabase.channel("admin-invoices")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => fetchInvoices())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const clientMsgMap: Record<string, DbMessage[]> = {};
  messages.forEach((m) => { const cid = m.is_from_admin ? (m.receiver_id || "") : m.sender_id; if (cid && cid !== adminId) { if (!clientMsgMap[cid]) clientMsgMap[cid] = []; clientMsgMap[cid].push(m); } });
  
  useEffect(() => {
    if (preselectedClientId) {
      setSelectedClient(preselectedClientId);
      if (!clientMsgMap[preselectedClientId]) clientMsgMap[preselectedClientId] = [];
      onClearPreselected?.();
    }
  }, [preselectedClientId]);

  const allClientIds = new Set([...Object.keys(clientMsgMap), ...(preselectedClientId ? [preselectedClientId] : [])]);

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.full_name || "Unknown Client";
  const getLastMsg = (cid: string) => clientMsgMap[cid]?.[clientMsgMap[cid].length - 1];

  const filteredClients = Array.from(allClientIds).filter(cid => {
    if (!clientSearch) return true;
    const name = getClientName(cid).toLowerCase();
    return name.includes(clientSearch.toLowerCase()) || cid.slice(0, 8).toUpperCase().includes(clientSearch.toUpperCase());
  });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedClient, messages.length]);

  useEffect(() => {
    if (!selectedClient) return;
    const unreadIds = (clientMsgMap[selectedClient] || []).filter(m => !m.is_read && !m.is_from_admin).map(m => m.id).filter(id => !id.startsWith('temp-'));
    if (unreadIds.length > 0) {
      onMarkRead?.(unreadIds);
      supabase.from("messages").update({ is_read: true }).in("id", unreadIds).then();
    }
  }, [selectedClient, messages]);

  const sendMsg = async (body: string, receiverId: string, msgType = "text", attachUrl?: string, attachName?: string) => {
    setSending(true);
    const payload: any = { sender_id: adminId, receiver_id: receiverId, body, subject: "Chat", is_from_admin: true, message_type: msgType };
    if (attachUrl) { payload.attachment_url = attachUrl; payload.attachment_name = attachName; }
    const optimisticMsg: DbMessage = {
      id: `temp-${Date.now()}`, sender_id: adminId, receiver_id: receiverId, body, subject: "Chat",
      is_from_admin: true, is_read: false, created_at: new Date().toISOString(),
      attachment_url: attachUrl || null, attachment_name: attachName || null, message_type: msgType,
    };
    onOptimisticMessage?.(optimisticMsg);
    const { error } = await supabase.from("messages").insert(payload as any);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setSending(false);
    return !error;
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedClient) return;
    if (await sendMsg(reply.trim(), selectedClient)) setReply("");
  };

  const sendCompose = async () => {
    if (!composeBody.trim() || !composeTarget) return;
    if (await sendMsg(composeBody.trim(), composeTarget)) {
      toast({ title: "Sent!" }); setComposeBody(""); setComposeTarget(""); setShowCompose(false); setSelectedClient(composeTarget);
    }
  };

  const sendInvoice = async () => {
    if (!selectedClient || !invoiceForm.amount || !invoiceForm.service_title) return;
    setSending(true);
    // Create invoice in database
    const { data: inv, error: invErr } = await supabase.from("invoices").insert({
      admin_id: adminId,
      client_id: selectedClient,
      service_title: invoiceForm.service_title,
      package_name: invoiceForm.package_name,
      description: invoiceForm.description,
      amount: Number(invoiceForm.amount),
      payment_method: invoiceForm.payment_method,
      payment_link: invoiceForm.payment_link,
      notes: invoiceForm.notes,
      due_date: invoiceForm.due_date ? new Date(invoiceForm.due_date).toISOString() : null,
    } as any).select().single();
    if (invErr) { toast({ title: "Error creating invoice", description: invErr.message, variant: "destructive" }); setSending(false); return; }
    // Send invoice as message
    const invoiceId = (inv as any).id;
    await sendMsg(invoiceId, selectedClient, "invoice");
    setInvoiceForm({ service_title: "", package_name: "", description: "", amount: "", payment_method: "paypal", payment_link: "", notes: "", due_date: "" });
    setShowInvoiceBuilder(false);
    setShowActions(false);
    toast({ title: "Invoice sent!" });
    setSending(false);
  };

  const updateInvoiceStatus = async (invId: string, status: string) => {
    await supabase.from("invoices").update({ status, updated_at: new Date().toISOString(), ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}) } as any).eq("id", invId);
    toast({ title: `Invoice marked ${status}` });
  };

  const sendServiceLink = async () => {
    if (!selectedServiceLink || !selectedClient) return;
    if (await sendMsg(selectedServiceLink, selectedClient, "service_link")) {
      setSelectedServiceLink(""); setShowActions(false); toast({ title: "Service link sent!" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) return;
    setUploading(true);
    const path = `admin/${selectedClient}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("message-attachments").upload(path, file);
    if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(path);
    await sendMsg(file.name, selectedClient, "text", urlData.publicUrl, file.name);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Get invoice for a message
  const getInvoice = (msgBody: string) => invoices.find(i => i.id === msgBody);

  const handleDeleteMessage = (msg: DbMessage) => {
    confirmDialog.confirm({ title: "Delete Message?", description: "This message will be moved to trash.", confirmText: "Delete", variant: "danger", onConfirm: async () => {
      addToTrash({ id: msg.id, type: "message", data: msg, deletedAt: new Date().toISOString(), label: `Message: "${msg.body.slice(0, 40)}${msg.body.length > 40 ? "..." : ""}"` });
      const { error } = await supabase.from("messages").delete().eq("id", msg.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Message moved to trash" }); onRefresh(); }
    }});
  };

  const handleDeleteConversation = (clientId: string) => {
    const clientName = getClientName(clientId);
    const clientMessages = clientMsgMap[clientId] || [];
    confirmDialog.confirm({ title: "Delete Conversation?", description: `All ${clientMessages.length} messages with ${clientName} will be moved to trash.`, confirmText: "Delete", variant: "danger", onConfirm: async () => {
      clientMessages.forEach(msg => {
        addToTrash({ id: msg.id, type: "message", data: msg, deletedAt: new Date().toISOString(), label: `Message: "${msg.body.slice(0, 40)}${msg.body.length > 40 ? "..." : ""}"` });
      });
      const ids = clientMessages.map(m => m.id).filter(id => !id.startsWith('temp-'));
      if (ids.length > 0) {
        const { error } = await supabase.from("messages").delete().in("id", ids);
        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      }
      if (selectedClient === clientId) setSelectedClient(null);
      toast({ title: "Conversation deleted", description: `${clientMessages.length} messages moved to trash.` });
      onRefresh();
    }});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">Messages</h2>
        <button onClick={() => setShowCompose(!showCompose)} className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> New Chat</button>
      </div>

      {showCompose && (
        <div className="glass-card-strong rounded-xl p-4 space-y-3">
          <ComposeClientSearch clients={clients} value={composeTarget} onChange={setComposeTarget} />
          <div className="flex gap-2"><input value={composeBody} onChange={e => setComposeBody(e.target.value)} onKeyDown={e => e.key === "Enter" && sendCompose()} placeholder="Type message..." className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" /><button onClick={sendCompose} disabled={sending} className="btn-gradient px-4 py-2 rounded-lg text-sm disabled:opacity-50"><Send className="w-4 h-4" /></button></div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4" style={{ height: "calc(100vh - 14rem)" }}>
        {/* Client list */}
        <div className="space-y-2 overflow-y-auto">
          <div className="relative mb-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search chats..." className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" /></div>
          {filteredClients.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No conversations</p>
          ) : filteredClients.map(cid => {
            const lastMsg = getLastMsg(cid);
            const unread = (clientMsgMap[cid] || []).filter(m => !m.is_read && !m.is_from_admin).length;
            return (
              <div key={cid} className={`relative group w-full text-left p-3 rounded-xl transition-colors cursor-pointer ${selectedClient === cid ? "bg-primary/10 border border-primary/30" : "glass-card-strong hover:bg-muted/80"}`} onClick={() => setSelectedClient(cid)}>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-sm truncate">{getClientName(cid)}</h4>
                  <div className="flex items-center gap-1.5">
                    {unread > 0 && <span className="w-5 h-5 bg-accent text-accent-foreground text-[10px] rounded-full flex items-center justify-center shrink-0">{unread}</span>}
                    {getSiteConfig().deleteButtons?.conversations !== false && <button onClick={(e) => { e.stopPropagation(); handleDeleteConversation(cid); }} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all" title="Delete conversation">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>}
                  </div>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground">#{cid.slice(0, 8).toUpperCase()}</p>
                {lastMsg && <p className="text-xs text-muted-foreground mt-1 truncate">{lastMsg.is_from_admin ? "You: " : ""}{lastMsg.message_type === "invoice" ? "📄 Invoice" : lastMsg.message_type === "service_link" ? "🔗 Service link" : lastMsg.body}</p>}
              </div>
            );
          })}
        </div>

        {/* Chat area */}
        <div className="lg:col-span-2 glass-card-strong rounded-xl flex flex-col overflow-hidden">
          {selectedClient ? (
            <>
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
                <div><p className="font-semibold text-foreground text-sm">{getClientName(selectedClient)}</p><p className="text-[10px] font-mono text-muted-foreground">#{selectedClient.slice(0, 8).toUpperCase()}</p></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(clientMsgMap[selectedClient] || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(msg => (
                  <ChatMessageBubble key={msg.id} msg={msg} isOwn={msg.is_from_admin} invoice={msg.message_type === "invoice" ? getInvoice(msg.body) : undefined} onUpdateInvoiceStatus={updateInvoiceStatus} onDelete={getSiteConfig().deleteButtons?.messages !== false ? handleDeleteMessage : undefined} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Invoice Builder */}
              {showInvoiceBuilder && (
                <div className="border-t border-border/30 p-4 space-y-3 bg-muted/30 max-h-[50vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Create Invoice
                    </h4>
                    <button onClick={() => setShowInvoiceBuilder(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Service</label>
                      <select value={invoiceForm.service_title} onChange={e => {
                        const svc = defaultServices.find(s => s.title === e.target.value);
                        setInvoiceForm({ ...invoiceForm, service_title: e.target.value, amount: svc ? String(svc.packages.basic.price) : invoiceForm.amount });
                      }} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
                        <option value="">Select service</option>
                        {defaultServices.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                        <option value="custom">Custom Service</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Package</label>
                      <select value={invoiceForm.package_name} onChange={e => {
                        const svc = defaultServices.find(s => s.title === invoiceForm.service_title);
                        const pkg = e.target.value as "basic" | "standard" | "premium";
                        setInvoiceForm({ ...invoiceForm, package_name: e.target.value, amount: svc?.packages?.[pkg] ? String(svc.packages[pkg].price) : invoiceForm.amount });
                      }} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
                        <option value="">Select package</option>
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  {invoiceForm.service_title === "custom" && (
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Custom Service Name</label>
                      <input value={invoiceForm.service_title === "custom" ? "" : invoiceForm.service_title} onChange={e => setInvoiceForm({ ...invoiceForm, service_title: e.target.value })} placeholder="Enter service name..." className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Description / What's Included</label>
                    <textarea value={invoiceForm.description} onChange={e => setInvoiceForm({ ...invoiceForm, description: e.target.value })} rows={2} placeholder="Describe what the client is paying for..." className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Amount ($)</label>
                      <input type="number" value={invoiceForm.amount} onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Due Date</label>
                      <input type="date" value={invoiceForm.due_date} onChange={e => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Payment Link (optional)</label>
                    <input value={invoiceForm.payment_link} onChange={e => setInvoiceForm({ ...invoiceForm, payment_link: e.target.value })} placeholder="https://paypal.me/... or https://pay.stripe.com/..." className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Internal Notes (not shown to client)</label>
                    <input value={invoiceForm.notes} onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Any internal notes..." className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
                  </div>

                  {/* Preview */}
                  {invoiceForm.service_title && invoiceForm.amount && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Invoice Preview</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-foreground">{invoiceForm.service_title}</p>
                          {invoiceForm.package_name && <p className="text-xs text-muted-foreground capitalize">{invoiceForm.package_name} Package</p>}
                        </div>
                        <p className="text-lg font-bold text-foreground">${Number(invoiceForm.amount).toLocaleString()}</p>
                      </div>
                      {invoiceForm.description && <p className="text-xs text-muted-foreground">{invoiceForm.description}</p>}
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        {invoiceForm.due_date && <span>Due: {new Date(invoiceForm.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={sendInvoice} disabled={sending || !invoiceForm.service_title || !invoiceForm.amount} className="btn-gradient px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                      <Send className="w-3.5 h-3.5" /> Send Invoice
                    </button>
                    <button onClick={() => setShowInvoiceBuilder(false)} className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {/* Service link action */}
              {showActions && !showInvoiceBuilder && (
                <div className="border-t border-border/30 p-3 space-y-3 bg-muted/30">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-foreground mb-1 block">🔗 Service Link</label>
                      <select value={selectedServiceLink} onChange={e => setSelectedServiceLink(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
                        <option value="">Select a service</option>
                        {defaultServices.map(s => <option key={s.id} value={s.id}>{s.title} (from ${s.packages.basic.price})</option>)}
                      </select>
                    </div>
                    <button onClick={sendServiceLink} disabled={!selectedServiceLink || sending} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 disabled:opacity-50">Send</button>
                  </div>
                </div>
              )}

              <div className="border-t border-border/50 p-3 flex gap-2 items-center">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Attach file">
                  {uploading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
                <button onClick={() => { setShowInvoiceBuilder(!showInvoiceBuilder); setShowActions(false); }} className={`p-2.5 rounded-xl transition-colors ${showInvoiceBuilder ? "bg-primary/10 text-primary" : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"}`} title="Create Invoice">
                  <CreditCard className="w-4 h-4" />
                </button>
                <button onClick={() => { setShowActions(!showActions); setShowInvoiceBuilder(false); }} className={`p-2.5 rounded-xl transition-colors ${showActions ? "bg-accent/10 text-accent" : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"}`} title="Service Links">
                  <Link2 className="w-4 h-4" />
                </button>
                <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder="Type a reply..." className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" />
                <button onClick={sendReply} disabled={sending || !reply.trim()} className="btn-gradient px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"><Send className="w-4 h-4" /></button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm"><MessageSquare className="w-5 h-5 mr-2 opacity-50" /> Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}


// Chat message bubble used in admin panel
function ChatMessageBubble({ msg, isOwn, invoice, onUpdateInvoiceStatus, onDelete }: { msg: DbMessage; isOwn: boolean; invoice?: DbInvoice; onUpdateInvoiceStatus?: (id: string, status: string) => void; onDelete?: (msg: DbMessage) => void }) {
  const [showDelete, setShowDelete] = useState(false);
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group`} onMouseEnter={() => setShowDelete(true)} onMouseLeave={() => setShowDelete(false)}>
      {isOwn && showDelete && onDelete && (
        <button onClick={() => onDelete(msg)} className="self-center mr-1 p-1 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete message">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isOwn ? "btn-gradient text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
        {!isOwn && <p className="text-[10px] font-semibold text-primary mb-0.5">Client</p>}

        {msg.message_type === "invoice" && invoice ? (
          <div className={`rounded-xl overflow-hidden ${isOwn ? "bg-white/10" : "bg-card border border-border"}`}>
            {/* Invoice Header */}
            <div className={`px-4 py-3 ${isOwn ? "bg-white/5" : "bg-primary/5"} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Invoice</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border capitalize ${invoiceStatusColors[invoice.status] || invoiceStatusColors.pending}`}>
                {invoice.status === "in_review" ? "In Review" : invoice.status}
              </span>
            </div>
            {/* Invoice Body */}
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{invoice.service_title}</p>
                  {invoice.package_name && <p className="text-[10px] opacity-70 capitalize">{invoice.package_name} Package</p>}
                </div>
                <p className="text-xl font-bold">${Number(invoice.amount).toLocaleString()}</p>
              </div>
              {invoice.description && <p className="text-[11px] opacity-80">{invoice.description}</p>}
              <div className="flex items-center gap-3 text-[10px] opacity-60 pt-1 border-t border-current/10">
                <span>{PAYMENT_METHODS.find(m => m.id === invoice.payment_method)?.emoji} {PAYMENT_METHODS.find(m => m.id === invoice.payment_method)?.label}</span>
                <span>#{invoice.invoice_number}</span>
                {invoice.due_date && <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>}
              </div>
              {invoice.payment_link && (
                <a href={invoice.payment_link} target="_blank" rel="noopener noreferrer" className={`mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${isOwn ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 text-primary hover:bg-primary/20"} transition-colors`}>
                  <CreditCard className="w-3.5 h-3.5" /> Pay Now <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {/* Admin status controls */}
              {isOwn && (invoice.status === "pending" || invoice.status === "in_review") && (
                <div className="space-y-1.5 mt-1">
                  {invoice.status === "in_review" && (
                    <div className="text-[10px] text-blue-300 text-center py-1 bg-blue-400/10 rounded-lg mb-1">🔍 Client claims payment made</div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => onUpdateInvoiceStatus?.(invoice.id, "paid")} className="flex-1 text-[10px] py-1.5 rounded-lg bg-emerald-400/20 text-emerald-300 hover:bg-emerald-400/30 font-medium">
                      {invoice.status === "in_review" ? "✅ Confirm Paid" : "Mark Paid"}
                    </button>
                    {invoice.status === "in_review" && (
                      <button onClick={() => onUpdateInvoiceStatus?.(invoice.id, "pending")} className="flex-1 text-[10px] py-1.5 rounded-lg bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 font-medium">Reject</button>
                    )}
                    <button onClick={() => onUpdateInvoiceStatus?.(invoice.id, "cancelled")} className="flex-1 text-[10px] py-1.5 rounded-lg bg-red-400/20 text-red-300 hover:bg-red-400/30 font-medium">Cancel</button>
                  </div>
                </div>
              )}
              {isOwn && invoice.status === "paid" && invoice.paid_at && (
                <p className="text-[10px] opacity-60 text-center">✅ Paid on {new Date(invoice.paid_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ) : msg.message_type === "service_link" ? (
          <div className={`rounded-lg p-2 ${isOwn ? "bg-white/10" : "bg-primary/10"}`}>
            <div className="flex items-center gap-1 text-xs font-semibold mb-1"><Settings className="w-3 h-3" /> Service Link</div>
            <p className="text-xs">{defaultServices.find(s => s.id === msg.body)?.title || msg.body}</p>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
        )}
        {msg.attachment_url && (
          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className={`mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${isOwn ? "bg-white/10 hover:bg-white/20" : "bg-muted/80 hover:bg-muted"}`}>
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">{msg.attachment_name || "File"}</span>
          </a>
        )}
        <p className={`text-[10px] mt-1 ${isOwn ? "opacity-70" : "text-muted-foreground"}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
      {!isOwn && showDelete && onDelete && (
        <button onClick={() => onDelete(msg)} className="self-center ml-1 p-1 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete message">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Trash Bin ───
function TrashBinPanel({ confirmDialog, onRefresh }: { confirmDialog: ReturnType<typeof useConfirmDialog>; onRefresh: () => void }) {
  const [trashItems, setTrashItems] = useState<TrashItem[]>(getTrashBin());
  const [filter, setFilter] = useState<string>("all");

  const refreshTrash = () => setTrashItems(getTrashBin());

  const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
    order: { label: "Order", icon: ShoppingCart, color: "text-blue-400 bg-blue-400/10" },
    review: { label: "Review", icon: Star, color: "text-amber-400 bg-amber-400/10" },
    invoice: { label: "Invoice", icon: CreditCard, color: "text-purple-400 bg-purple-400/10" },
    client: { label: "Client", icon: Users, color: "text-emerald-400 bg-emerald-400/10" },
    message: { label: "Message", icon: MessageSquare, color: "text-primary bg-primary/10" },
  };

  const filtered = filter === "all" ? trashItems : trashItems.filter(i => i.type === filter);

  const handleRestore = async (item: TrashItem) => {
    try {
      const table = item.type === "order" ? "orders" : item.type === "review" ? "reviews" : item.type === "invoice" ? "invoices" : item.type === "client" ? "profiles" : "messages";
      // Remove internal fields and re-insert
      const data = { ...item.data };
      const { error } = await supabase.from(table).upsert(data as any);
      if (error) { toast({ title: "Restore failed", description: error.message, variant: "destructive" }); return; }
      removeFromTrash(item.id);
      refreshTrash();
      onRefresh();
      toast({ title: "Restored!", description: `${item.label} has been restored.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handlePermanentDelete = (item: TrashItem) => {
    confirmDialog.confirm({ title: "Permanently Delete?", description: `"${item.label}" will be gone forever. This cannot be undone.`, confirmText: "Delete Forever", variant: "danger", onConfirm: () => {
      removeFromTrash(item.id);
      refreshTrash();
      toast({ title: "Permanently deleted" });
    }});
  };

  const handleClearAll = () => {
    confirmDialog.confirm({ title: "Empty Trash?", description: `All ${trashItems.length} items will be permanently deleted.`, confirmText: "Empty Trash", variant: "danger", onConfirm: () => {
      clearTrash();
      refreshTrash();
      toast({ title: "Trash emptied" });
    }});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Trash Bin</h2>
          <p className="text-sm text-muted-foreground mt-1">Deleted items can be restored or permanently removed.</p>
        </div>
        {trashItems.length > 0 && (
          <button onClick={handleClearAll} className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-2 transition-colors">
            <Trash2 className="w-4 h-4" /> Empty Trash ({trashItems.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[{ id: "all", label: "All" }, { id: "order", label: "Orders" }, { id: "review", label: "Reviews" }, { id: "invoice", label: "Invoices" }, { id: "client", label: "Clients" }, { id: "message", label: "Messages" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.id ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {f.label} {f.id !== "all" && `(${trashItems.filter(i => i.type === f.id).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card-strong rounded-xl p-12 text-center">
          <Trash className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">{trashItems.length === 0 ? "Trash is empty." : "No items in this category."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const typeInfo = typeLabels[item.type] || typeLabels.order;
            const Icon = typeInfo.icon;
            return (
              <div key={`${item.id}-${item.deletedAt}`} className="glass-card-strong rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${typeInfo.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${typeInfo.color}`}>{typeInfo.label}</span>
                    <span className="text-[10px] text-muted-foreground">Deleted {new Date(item.deletedAt).toLocaleDateString()} at {new Date(item.deletedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleRestore(item)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 flex items-center gap-1.5 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                  <button onClick={() => handlePermanentDelete(item)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Delete permanently">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Social ───
function SocialPanel() {
  const [links, setLinks] = useState<{ key: string; label: string; url: string }[]>(() => {
    const saved = localStorage.getItem("social_links_v2");
    if (saved) try { return JSON.parse(saved); } catch {}
    // Migrate from old format
    const old = localStorage.getItem("social_links");
    if (old) try {
      const parsed = JSON.parse(old);
      return Object.entries(parsed).filter(([, v]) => v).map(([k, v]) => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1), url: v as string }));
    } catch {}
    return [
      { key: "fiverr", label: "Fiverr", url: "" },
      { key: "whatsapp", label: "WhatsApp", url: "" },
      { key: "linkedin", label: "LinkedIn", url: "" },
      { key: "facebook", label: "Facebook", url: "" },
      { key: "instagram", label: "Instagram", url: "" },
      { key: "youtube", label: "YouTube", url: "" },
    ];
  });
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const save = () => {
    localStorage.setItem("social_links_v2", JSON.stringify(links));
    // Also save old format for backward compatibility
    const obj: Record<string, string> = {};
    links.forEach(l => { obj[l.key] = l.url; });
    localStorage.setItem("social_links", JSON.stringify(obj));
    toast({ title: "Social links saved!" });
  };

  const addLink = () => {
    if (!newLabel.trim()) return;
    const key = newLabel.trim().toLowerCase().replace(/\s+/g, "_");
    if (links.find(l => l.key === key)) { toast({ title: "Already exists", variant: "destructive" }); return; }
    setLinks([...links, { key, label: newLabel.trim(), url: newUrl.trim() }]);
    setNewLabel(""); setNewUrl("");
  };

  const removeLink = (key: string) => setLinks(links.filter(l => l.key !== key));
  const updateLink = (key: string, field: "label" | "url", value: string) => setLinks(links.map(l => l.key === key ? { ...l, [field]: value } : l));

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">Social Media Links</h2>
        <button onClick={save} className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"><Save className="w-4 h-4" /> Save Links</button>
      </div>

      <div className="glass-card-strong rounded-xl p-6 space-y-4">
        {links.map((link) => (
          <div key={link.key} className="flex items-end gap-3 group">
            <div className="w-32 shrink-0">
              <label className="text-xs text-muted-foreground block mb-1">Label</label>
              <input value={link.label} onChange={e => updateLink(link.key, "label", e.target.value)} className={inputCls} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">URL</label>
              <input value={link.url} onChange={e => updateLink(link.key, "url", e.target.value)} className={inputCls} placeholder={`https://${link.key}.com/...`} />
            </div>
            <button onClick={() => removeLink(link.key)} className="p-2.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors shrink-0 mb-0.5" title="Remove">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {links.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No social links added yet.</p>}

        {/* Add new link */}
        <div className="border-t border-border/30 pt-4">
          <p className="text-sm font-medium text-foreground mb-3">Add New Link</p>
          <div className="flex items-end gap-3">
            <div className="w-32 shrink-0">
              <label className="text-xs text-muted-foreground block mb-1">Label</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && addLink()} className={inputCls} placeholder="e.g. Twitter" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">URL</label>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && addLink()} className={inputCls} placeholder="https://..." />
            </div>
            <button onClick={addLink} disabled={!newLabel.trim()} className="btn-gradient px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 shrink-0">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Site Settings (kept same) ───
function SiteSettingsPanel({ confirmDialog, dbOrders, dbClients, dbMessages, dbReviews, dbInvoices }: { confirmDialog: ReturnType<typeof useConfirmDialog>; dbOrders: DbOrder[]; dbClients: DbProfile[]; dbMessages: DbMessage[]; dbReviews: DbReview[]; dbInvoices: any[] }) {
  const [config, setConfig] = useState<SiteConfig>(getSiteConfig());
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  useEffect(() => { fetchSiteConfig().then(c => setConfig(c)); }, []);
  const update = (key: keyof SiteConfig, value: any) => { setConfig({ ...config, [key]: value }); setSaved(false); };
  const updateStat = (i: number, f: string, v: string) => { const stats = [...config.stats]; stats[i] = { ...stats[i], [f]: v }; setConfig({ ...config, stats }); setSaved(false); };
  const addStat = () => setConfig({ ...config, stats: [...config.stats, { value: "0", label: "New Stat" }] });
  const removeStat = (i: number) => { const stats = config.stats.filter((_, idx) => idx !== i); setConfig({ ...config, stats }); };
  const updateStep = (i: number, f: string, v: string) => { const steps = [...config.processSteps]; steps[i] = { ...steps[i], [f]: v }; setConfig({ ...config, processSteps: steps }); setSaved(false); };
  const updateTeam = (i: number, f: string, v: string) => { const t = [...config.teamMembers]; t[i] = { ...t[i], [f]: v }; setConfig({ ...config, teamMembers: t }); setSaved(false); };
  const addTeam = () => setConfig({ ...config, teamMembers: [...config.teamMembers, { name: "New Member", role: "Role", avatar: "NM" }] });
  const removeTeam = (i: number) => setConfig({ ...config, teamMembers: config.teamMembers.filter((_, idx) => idx !== i) });
  const updateTech = (i: number, v: string) => { const t = [...config.techStack]; t[i] = { name: v }; setConfig({ ...config, techStack: t }); setSaved(false); };
  const addTech = () => setConfig({ ...config, techStack: [...config.techStack, { name: "New Tech" }] });
  const removeTech = (i: number) => setConfig({ ...config, techStack: config.techStack.filter((_, idx) => idx !== i) });
  const updateWhyUs = (i: number, f: string, v: string) => { const w = [...config.whyUsItems]; w[i] = { ...w[i], [f]: v }; setConfig({ ...config, whyUsItems: w }); setSaved(false); };
  const addWhyUs = () => setConfig({ ...config, whyUsItems: [...config.whyUsItems, { title: "New Item", desc: "Description" }] });
  const removeWhyUs = (i: number) => setConfig({ ...config, whyUsItems: config.whyUsItems.filter((_, idx) => idx !== i) });
  const updateTestimonial = (i: number, f: string, v: any) => { const t = [...config.testimonials]; t[i] = { ...t[i], [f]: v }; setConfig({ ...config, testimonials: t }); setSaved(false); };
  const addTestimonial = () => setConfig({ ...config, testimonials: [...config.testimonials, { name: "New Client", role: "Role", company: "Company", text: "Testimonial text...", rating: 5, avatar: "NC" }] });
  const removeTestimonial = (i: number) => setConfig({ ...config, testimonials: config.testimonials.filter((_, idx) => idx !== i) });
  const handleSave = async () => { await saveSiteConfig(config); setSaved(true); toast({ title: "Site settings saved!" }); };
  const handleMaintenance = (val: boolean) => {
    if (val) confirmDialog.confirm({ title: "Enable Maintenance?", description: "Site will be hidden.", confirmText: "Enable", variant: "warning", onConfirm: () => { update("maintenanceMode", true); } });
    else update("maintenanceMode", false);
  };
  const inputCls = "w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm";
  const labelCls = "text-sm font-medium text-foreground block mb-1";
  const tabs = [{ id: "general", label: "General", icon: Globe },{ id: "hero", label: "Hero", icon: Type },{ id: "stats", label: "Stats", icon: Hash },{ id: "sections", label: "Sections", icon: FileText },{ id: "process", label: "Process", icon: Settings },{ id: "layout", label: "Layout", icon: Eye },{ id: "about", label: "About Page", icon: Users },{ id: "testimonials", label: "Testimonials", icon: Star },{ id: "colors", label: "Colors", icon: Palette },{ id: "contact", label: "Contact", icon: MessageSquare },{ id: "delete-controls", label: "Delete Buttons", icon: Trash2 },{ id: "database", label: "Database", icon: Database },{ id: "db-export", label: "DB Export", icon: Save }];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="font-heading text-2xl font-bold text-foreground">Site Settings</h2><button onClick={handleSave} className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"><Save className="w-4 h-4" /> {saved ? "✓ Saved" : "Save All"}</button></div>
      <div className="glass-card-strong rounded-xl p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Shield className="w-5 h-5 text-primary" /><div><h3 className="font-heading font-semibold text-foreground">Maintenance Mode</h3><p className="text-xs text-muted-foreground">Hide site</p></div></div><button onClick={() => handleMaintenance(!config.maintenanceMode)} className={`relative w-12 h-6 rounded-full transition-colors ${config.maintenanceMode ? "bg-accent" : "bg-muted"}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-foreground transition-transform ${config.maintenanceMode ? "left-7" : "left-1"}`} /></button></div></div>
      <div className="flex flex-wrap gap-2">{tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === t.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}><t.icon className="w-4 h-4" /> {t.label}</button>)}</div>
      <div className="glass-card-strong rounded-xl p-6 space-y-4">
        {activeTab === "general" && <><h3 className="font-heading font-semibold text-foreground">General</h3><div className="grid md:grid-cols-2 gap-4"><div><label className={labelCls}>Site Name</label><input value={config.siteName} onChange={e => update("siteName", e.target.value)} className={inputCls} /></div><div><label className={labelCls}>Tagline</label><input value={config.siteTagline} onChange={e => update("siteTagline", e.target.value)} className={inputCls} /></div></div><div><label className={labelCls}>Footer</label><input value={config.footerText} onChange={e => update("footerText", e.target.value)} className={inputCls} /></div></>}
        {activeTab === "hero" && <><h3 className="font-heading font-semibold text-foreground">Hero Section</h3><div><label className={labelCls}>Badge</label><input value={config.heroBadge} onChange={e => update("heroBadge", e.target.value)} className={inputCls} /></div><div className="grid md:grid-cols-2 gap-4"><div><label className={labelCls}>Title</label><input value={config.heroTitle} onChange={e => update("heroTitle", e.target.value)} className={inputCls} /></div><div><label className={labelCls}>Highlight</label><input value={config.heroHighlight} onChange={e => update("heroHighlight", e.target.value)} className={inputCls} /></div></div><div><label className={labelCls}>Subtitle</label><textarea value={config.heroSubtitle} onChange={e => update("heroSubtitle", e.target.value)} rows={2} className={inputCls} /></div><div className="grid md:grid-cols-2 gap-4"><div><label className={labelCls}>CTA 1</label><input value={config.ctaButton1} onChange={e => update("ctaButton1", e.target.value)} className={inputCls} /></div><div><label className={labelCls}>CTA 2</label><input value={config.ctaButton2} onChange={e => update("ctaButton2", e.target.value)} className={inputCls} /></div></div></>}
        {activeTab === "stats" && <><div className="flex items-center justify-between"><h3 className="font-heading font-semibold text-foreground">Stats</h3><button onClick={addStat} className="text-xs px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button></div>{config.stats.map((stat, i) => <div key={i} className="flex gap-3 items-end"><div className="flex-1"><label className="text-xs text-muted-foreground">Value</label><input value={stat.value} onChange={e => updateStat(i, "value", e.target.value)} className={inputCls} /></div><div className="flex-1"><label className="text-xs text-muted-foreground">Label</label><input value={stat.label} onChange={e => updateStat(i, "label", e.target.value)} className={inputCls} /></div><button onClick={() => removeStat(i)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0 mb-0.5"><Trash2 className="w-4 h-4" /></button></div>)}</>}
        {activeTab === "sections" && <><h3 className="font-heading font-semibold text-foreground">Section Titles</h3>{[{key:"featuredServicesTitle",label:"Featured Services Title"},{key:"featuredServicesSubtitle",label:"Featured Services Subtitle"},{key:"portfolioTitle",label:"Portfolio Title"},{key:"portfolioSubtitle",label:"Portfolio Subtitle"},{key:"testimonialsTitle",label:"Testimonials Title"},{key:"processTitle",label:"Process Title"},{key:"processSubtitle",label:"Process Subtitle"},{key:"ctaTitle",label:"CTA Title"},{key:"ctaSubtitle",label:"CTA Subtitle"},{key:"ctaBtn1",label:"CTA Button 1"},{key:"ctaBtn2",label:"CTA Button 2"}].map(f=><div key={f.key}><label className={labelCls}>{f.label}</label><input value={(config as any)[f.key]} onChange={e=>update(f.key as keyof SiteConfig,e.target.value)} className={inputCls}/></div>)}</>}
        {activeTab === "process" && <><h3 className="font-heading font-semibold text-foreground">Process Steps</h3>{config.processSteps.map((step,i)=><div key={i} className="p-4 rounded-lg bg-muted/50 space-y-2"><div className="flex items-center gap-2 mb-1"><span className="w-8 h-8 rounded-full btn-gradient flex items-center justify-center text-xs font-bold">{i+1}</span><span className="text-sm font-semibold text-foreground">Step {i+1}</span></div><div><label className="text-xs text-muted-foreground">Title</label><input value={step.title} onChange={e=>updateStep(i,"title",e.target.value)} className={inputCls}/></div><div><label className="text-xs text-muted-foreground">Description</label><input value={step.desc} onChange={e=>updateStep(i,"desc",e.target.value)} className={inputCls}/></div></div>)}</>}
        {activeTab === "layout" && <>
          <h3 className="font-heading font-semibold text-foreground">Card Layout Sizes</h3>
          <p className="text-xs text-muted-foreground mb-4">Control how many cards appear per row on Services and Portfolio pages.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Service Card Size</label>
              <div className="flex gap-2 mt-2">
                {[{v:1,l:"Large (3/row)",d:"Current default layout"},{v:2,l:"Medium (4/row)",d:"More compact cards"},{v:3,l:"Small (5/row)",d:"Maximum density"}].map(s=>(
                  <button key={s.v} onClick={()=>update("serviceCardSize",s.v)} className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${config.serviceCardSize===s.v ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/30"}`}>
                    <div className="text-sm font-semibold mb-1">{s.l}</div>
                    <div className="text-[10px] opacity-70">{s.d}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Portfolio Card Size</label>
              <div className="flex gap-2 mt-2">
                {[{v:1,l:"Large (3/row)",d:"Current default layout"},{v:2,l:"Medium (4/row)",d:"More compact cards"},{v:3,l:"Small (5/row)",d:"Maximum density"}].map(s=>(
                  <button key={s.v} onClick={()=>update("portfolioCardSize",s.v)} className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${config.portfolioCardSize===s.v ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:border-primary/30"}`}>
                    <div className="text-sm font-semibold mb-1">{s.l}</div>
                    <div className="text-[10px] opacity-70">{s.d}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">💡 Don't forget to click <strong>"Save All"</strong> at the top to apply changes to your site.</p>
        </>}
        {activeTab === "about" && <>
          <h3 className="font-heading font-semibold text-foreground mb-4">About Page Content</h3>
          <div className="space-y-4">
            <div><label className={labelCls}>Page Subtitle</label><input value={config.aboutSubtitle} onChange={e=>update("aboutSubtitle",e.target.value)} className={inputCls}/></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><label className={labelCls}>Mission Text</label><textarea value={config.missionText} onChange={e=>update("missionText",e.target.value)} rows={3} className={inputCls}/></div>
              <div><label className={labelCls}>Vision Text</label><textarea value={config.visionText} onChange={e=>update("visionText",e.target.value)} rows={3} className={inputCls}/></div>
            </div>
            <h4 className="font-heading font-semibold text-foreground text-sm pt-2">Founder Story</h4>
            <div><label className={labelCls}>Story Title</label><input value={config.founderStoryTitle} onChange={e=>update("founderStoryTitle",e.target.value)} className={inputCls}/></div>
            <div><label className={labelCls}>Paragraph 1</label><textarea value={config.founderStoryP1} onChange={e=>update("founderStoryP1",e.target.value)} rows={3} className={inputCls}/></div>
            <div><label className={labelCls}>Paragraph 2</label><textarea value={config.founderStoryP2} onChange={e=>update("founderStoryP2",e.target.value)} rows={3} className={inputCls}/></div>
            <div className="flex items-center justify-between pt-2"><h4 className="font-heading font-semibold text-foreground text-sm">Team Members</h4><button onClick={addTeam} className="text-xs px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"><Plus className="w-3 h-3"/> Add</button></div>
            {config.teamMembers.map((m,i)=><div key={i} className="flex gap-3 items-end p-3 rounded-lg bg-muted/50"><div className="flex-1"><label className="text-xs text-muted-foreground">Name</label><input value={m.name} onChange={e=>updateTeam(i,"name",e.target.value)} className={inputCls}/></div><div className="flex-1"><label className="text-xs text-muted-foreground">Role</label><input value={m.role} onChange={e=>updateTeam(i,"role",e.target.value)} className={inputCls}/></div><div className="w-20"><label className="text-xs text-muted-foreground">Avatar</label><input value={m.avatar} onChange={e=>updateTeam(i,"avatar",e.target.value)} className={inputCls}/></div><button onClick={()=>removeTeam(i)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0 mb-0.5"><Trash2 className="w-4 h-4"/></button></div>)}
            <div className="flex items-center justify-between pt-2"><h4 className="font-heading font-semibold text-foreground text-sm">Technology Stack</h4><button onClick={addTech} className="text-xs px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"><Plus className="w-3 h-3"/> Add</button></div>
            {config.techStack.map((t,i)=><div key={i} className="flex gap-3 items-end"><div className="flex-1"><input value={t.name} onChange={e=>updateTech(i,e.target.value)} className={inputCls}/></div><button onClick={()=>removeTech(i)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0 mb-0.5"><Trash2 className="w-4 h-4"/></button></div>)}
            <div className="flex items-center justify-between pt-2"><h4 className="font-heading font-semibold text-foreground text-sm">Why Choose Us</h4><button onClick={addWhyUs} className="text-xs px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"><Plus className="w-3 h-3"/> Add</button></div>
            {config.whyUsItems.map((w,i)=><div key={i} className="flex gap-3 items-end p-3 rounded-lg bg-muted/50"><div className="flex-1"><label className="text-xs text-muted-foreground">Title</label><input value={w.title} onChange={e=>updateWhyUs(i,"title",e.target.value)} className={inputCls}/></div><div className="flex-1"><label className="text-xs text-muted-foreground">Description</label><input value={w.desc} onChange={e=>updateWhyUs(i,"desc",e.target.value)} className={inputCls}/></div><button onClick={()=>removeWhyUs(i)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 shrink-0 mb-0.5"><Trash2 className="w-4 h-4"/></button></div>)}
          </div>
        </>}
        {activeTab === "testimonials" && <>
          <div className="flex items-center justify-between mb-4"><h3 className="font-heading font-semibold text-foreground">Client Testimonials</h3><button onClick={addTestimonial} className="text-xs px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1"><Plus className="w-3 h-3"/> Add Testimonial</button></div>
          <div className="space-y-4">
            {config.testimonials.map((t,i)=><div key={i} className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">Testimonial {i+1}</span><button onClick={()=>removeTestimonial(i)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-3.5 h-3.5"/></button></div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Name</label><input value={t.name} onChange={e=>updateTestimonial(i,"name",e.target.value)} className={inputCls}/></div>
                <div><label className="text-xs text-muted-foreground">Role</label><input value={t.role} onChange={e=>updateTestimonial(i,"role",e.target.value)} className={inputCls}/></div>
                <div><label className="text-xs text-muted-foreground">Company</label><input value={t.company} onChange={e=>updateTestimonial(i,"company",e.target.value)} className={inputCls}/></div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Avatar (initials)</label><input value={t.avatar} onChange={e=>updateTestimonial(i,"avatar",e.target.value)} className={inputCls}/></div>
                <div><label className="text-xs text-muted-foreground">Rating (1-5)</label><input type="number" min={1} max={5} value={t.rating} onChange={e=>updateTestimonial(i,"rating",Number(e.target.value))} className={inputCls}/></div>
              </div>
              <div><label className="text-xs text-muted-foreground">Testimonial Text</label><textarea value={t.text} onChange={e=>updateTestimonial(i,"text",e.target.value)} rows={2} className={inputCls}/></div>
            </div>)}
          </div>
        </>}
        {activeTab === "colors" && <><h3 className="font-heading font-semibold text-foreground">Brand Colors</h3><p className="text-xs text-muted-foreground">HSL values (e.g. "217 91% 40%")</p><div className="grid md:grid-cols-2 gap-4"><div><label className={labelCls}>Primary</label><div className="flex gap-2 items-center"><input value={config.primaryColor} onChange={e=>update("primaryColor",e.target.value)} className={inputCls}/><div className="w-10 h-10 rounded-lg shrink-0 border border-border" style={{background:`hsl(${config.primaryColor})`}}/></div></div><div><label className={labelCls}>Accent</label><div className="flex gap-2 items-center"><input value={config.accentColor} onChange={e=>update("accentColor",e.target.value)} className={inputCls}/><div className="w-10 h-10 rounded-lg shrink-0 border border-border" style={{background:`hsl(${config.accentColor})`}}/></div></div></div></>}
        {activeTab === "contact" && <><h3 className="font-heading font-semibold text-foreground">Contact</h3><div className="grid md:grid-cols-2 gap-4"><div><label className={labelCls}>Email</label><input value={config.email} onChange={e=>update("email",e.target.value)} className={inputCls}/></div><div><label className={labelCls}>Phone</label><input value={config.phone} onChange={e=>update("phone",e.target.value)} className={inputCls}/></div><div><label className={labelCls}>WhatsApp</label><input value={config.whatsapp} onChange={e=>update("whatsapp",e.target.value)} className={inputCls}/></div><div><label className={labelCls}>Address</label><input value={config.address} onChange={e=>update("address",e.target.value)} className={inputCls}/></div></div></>}
        {activeTab === "delete-controls" && <>
          <h3 className="font-heading font-semibold text-foreground">Delete Button Controls</h3>
          <p className="text-sm text-muted-foreground">Choose which sections show delete buttons. Disabled sections will hide all delete/trash icons.</p>
          <div className="space-y-3 mt-4">
            {([
              { key: "orders", label: "Orders", icon: ShoppingCart, desc: "Delete buttons on order rows" },
              { key: "services", label: "Services", icon: Settings, desc: "Remove buttons on service cards" },
              { key: "portfolio", label: "Portfolio", icon: Image, desc: "Remove buttons on portfolio items" },
              { key: "reviews", label: "Reviews", icon: Star, desc: "Delete buttons on review rows" },
              { key: "payments", label: "Payments / Invoices", icon: CreditCard, desc: "Delete buttons on invoice rows" },
              { key: "clients", label: "Clients", icon: Users, desc: "Delete buttons on client rows" },
              { key: "messages", label: "Messages", icon: MessageSquare, desc: "Delete buttons on individual messages" },
              { key: "conversations", label: "Conversations", icon: Users, desc: "Delete buttons on entire client conversations" },
            ] as const).map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/30">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <button onClick={() => { const db = { ...(config.deleteButtons || {}), [item.key]: !(config.deleteButtons?.[item.key] ?? true) }; update("deleteButtons", db); }} className={`relative w-12 h-6 rounded-full transition-colors ${(config.deleteButtons?.[item.key] ?? true) ? "bg-primary" : "bg-muted border border-border"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${(config.deleteButtons?.[item.key] ?? true) ? "left-7 bg-primary-foreground" : "left-1 bg-muted-foreground"}`} />
                </button>
              </div>
            ))}
          </div>
        </>}
        {activeTab === "database" && <><h3 className="font-heading font-semibold text-foreground">Database</h3><DatabaseConfig /></>}
        {activeTab === "db-export" && <DatabaseExportPanel dbOrders={dbOrders} dbClients={dbClients} dbMessages={dbMessages} dbReviews={dbReviews} dbInvoices={dbInvoices} />}
      </div>
    </div>
  );
}

function DatabaseConfig() {
  const [dbMode, setDbMode] = useState<"local" | "external">(() => {
    return localStorage.getItem("db_mode") === "external" ? "external" : "local";
  });
  const [dbConfig, setDbConfig] = useState(() => { const saved = localStorage.getItem("db_config"); if (saved) try { return JSON.parse(saved); } catch {} return { dbType: "mysql", host: "", port: "", database: "", username: "", password: "" }; });
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbSaved, setDbSaved] = useState(false);
  const updateDb = (f: string, v: string) => { setDbConfig({ ...dbConfig, [f]: v }); setDbTestResult(null); setDbSaved(false); };
  const toggleMode = (mode: "local" | "external") => { setDbMode(mode); localStorage.setItem("db_mode", mode); };
  const testDb = async () => { setDbTesting(true); setDbTestResult(null); try { const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/test-db-connection`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`, "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }, body: JSON.stringify(dbConfig) }); const data = await res.json(); setDbTestResult({ success: data.success, message: data.success ? data.message : data.error }); } catch { setDbTestResult({ success: false, message: "Failed to connect." }); } finally { setDbTesting(false); } };
  const saveDb = () => { localStorage.setItem("db_config", JSON.stringify(dbConfig)); setDbSaved(true); };
  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm";
  return (
    <div className="space-y-5">
      {/* Database Mode Toggle */}
      <div className="p-4 rounded-xl bg-muted/50 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-heading font-semibold text-foreground text-sm">Database Mode</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Switch between built-in storage and your own external database.</p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button onClick={() => toggleMode("local")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${dbMode === "local" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              Local (Built-in)
            </button>
            <button onClick={() => toggleMode("external")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${dbMode === "external" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              External DB
            </button>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${dbMode === "local" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"}`}>
          <div className={`w-2 h-2 rounded-full ${dbMode === "local" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          {dbMode === "local" ? "Using built-in storage — data is stored locally and in the cloud backend." : "External database mode — configure your own database connection below."}
        </div>
      </div>

      {dbMode === "external" && (
        <div className="space-y-4">
          <select value={dbConfig.dbType} onChange={e => updateDb("dbType", e.target.value)} className={inputCls}><option value="mysql">MySQL</option><option value="postgresql">PostgreSQL</option><option value="mariadb">MariaDB</option></select>
          <div className="grid md:grid-cols-2 gap-4"><div><label className="text-sm font-medium text-foreground block mb-1">Host</label><input value={dbConfig.host} onChange={e => updateDb("host", e.target.value)} className={inputCls} placeholder="localhost or your-server.com" /></div><div><label className="text-sm font-medium text-foreground block mb-1">Port</label><input value={dbConfig.port} onChange={e => updateDb("port", e.target.value)} className={inputCls} placeholder="3306 / 5432" /></div></div>
          <div><label className="text-sm font-medium text-foreground block mb-1">Database Name</label><input value={dbConfig.database} onChange={e => updateDb("database", e.target.value)} className={inputCls} /></div>
          <div className="grid md:grid-cols-2 gap-4"><div><label className="text-sm font-medium text-foreground block mb-1">Username</label><input value={dbConfig.username} onChange={e => updateDb("username", e.target.value)} className={inputCls} /></div><div><label className="text-sm font-medium text-foreground block mb-1">Password</label><input type="password" value={dbConfig.password} onChange={e => updateDb("password", e.target.value)} className={inputCls} /></div></div>
          {dbTestResult && <div className={`flex items-start gap-2 px-4 py-3 rounded-lg text-sm ${dbTestResult.success ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>{dbTestResult.success ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}<span>{dbTestResult.message}</span></div>}
          <div className="flex gap-3"><button onClick={testDb} disabled={dbTesting} className="px-5 py-2.5 rounded-lg text-sm font-medium border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 flex items-center gap-2">{dbTesting ? <><Clock className="w-4 h-4 animate-spin" /> Testing...</> : <><Database className="w-4 h-4" /> Test Connection</>}</button><button onClick={saveDb} className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"><Save className="w-4 h-4" /> {dbSaved ? "✓ Saved" : "Save"}</button></div>
        </div>
      )}
    </div>
  );
}

// ─── Database Export Panel ───
function DatabaseExportPanel({ dbOrders, dbClients, dbMessages, dbReviews, dbInvoices = [] }: { dbOrders: DbOrder[]; dbClients: DbProfile[]; dbMessages: DbMessage[]; dbReviews: DbReview[]; dbInvoices?: any[] }) {
  const [exporting, setExporting] = useState<string | null>(null);

  const generateSchemaSql = () => {
    return `-- ================================================
-- Database Schema Export
-- Generated: ${new Date().toISOString()}
-- Compatible with: MySQL / PostgreSQL / MariaDB
-- ================================================

-- Enable UUID extension (PostgreSQL only)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── User Roles Enum ───
-- For PostgreSQL:
-- CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
-- For MySQL, use VARCHAR and CHECK constraint or ENUM type in column definition.

-- ─── Profiles Table ───
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  company VARCHAR(255) DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── User Roles Table ───
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(20) NOT NULL,
  UNIQUE(user_id, role),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- ─── Orders Table ───
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  service_id VARCHAR(100) NOT NULL,
  service_title VARCHAR(255) NOT NULL,
  package_name VARCHAR(50) NOT NULL DEFAULT 'standard',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  requirements TEXT DEFAULT '',
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- ─── Messages Table ───
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) DEFAULT NULL,
  subject TEXT DEFAULT '',
  body TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  order_id VARCHAR(36) DEFAULT NULL,
  attachment_url TEXT DEFAULT NULL,
  attachment_name TEXT DEFAULT NULL,
  message_type VARCHAR(30) NOT NULL DEFAULT 'text',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- ─── Reviews Table ───
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  service_id VARCHAR(100) NOT NULL,
  service_title VARCHAR(255) NOT NULL DEFAULT '',
  rating INT NOT NULL DEFAULT 5,
  title VARCHAR(255) DEFAULT '',
  body TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- ─── Invoices Table ───
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL,
  admin_id VARCHAR(36) NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  service_title VARCHAR(255) NOT NULL DEFAULT '',
  package_name VARCHAR(100) NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'paypal',
  payment_link TEXT DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  due_date TIMESTAMP DEFAULT NULL,
  paid_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- ─── Site Config Table ───
CREATE TABLE IF NOT EXISTS site_config (
  id VARCHAR(36) PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE DEFAULT 'main',
  config_data JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(36) DEFAULT NULL
);

-- ─── Managers Table ───
CREATE TABLE IF NOT EXISTS managers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) DEFAULT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  role VARCHAR(100) NOT NULL DEFAULT 'manager',
  permissions JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indexes for Performance ───
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_managers_user_id ON managers(user_id);
CREATE INDEX idx_managers_email ON managers(email);

-- ================================================
-- Schema export complete!
-- ================================================
`;
  };

  const escSql = (s: string) => (s || "").replace(/'/g, "''").replace(/\\/g, "\\\\");

  const generateDataBackup = () => {
    let sql = `-- ================================================
-- Data Backup Export
-- Generated: ${new Date().toISOString()}
-- Records: ${dbClients.length} profiles, ${dbOrders.length} orders, ${dbMessages.length} messages, ${dbReviews.length} reviews, ${dbInvoices.length} invoices
-- ================================================

`;

    // Profiles
    if (dbClients.length > 0) {
      sql += "-- ─── Profiles ───\n";
      dbClients.forEach(p => {
        sql += `INSERT INTO profiles (id, full_name, email, phone, company, avatar_url, created_at, updated_at) VALUES ('${escSql(p.id)}', '${escSql(p.full_name)}', '${escSql(p.email)}', '${escSql(p.phone)}', '${escSql(p.company)}', '', '${p.created_at}', '${p.created_at}') ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);\n`;
      });
      sql += "\n";
    }

    // Orders
    if (dbOrders.length > 0) {
      sql += "-- ─── Orders ───\n";
      dbOrders.forEach(o => {
        sql += `INSERT INTO orders (id, user_id, order_number, service_id, service_title, package_name, price, status, requirements, admin_notes, created_at, updated_at) VALUES ('${escSql(o.id)}', '${escSql(o.user_id)}', '${escSql(o.order_number)}', '${escSql(o.service_id)}', '${escSql(o.service_title)}', '${escSql(o.package_name)}', ${o.price}, '${escSql(o.status)}', '${escSql(o.requirements)}', '${escSql(o.admin_notes)}', '${o.created_at}', '${o.updated_at}') ON DUPLICATE KEY UPDATE status=VALUES(status);\n`;
      });
      sql += "\n";
    }

    // Messages
    if (dbMessages.length > 0) {
      sql += "-- ─── Messages ───\n";
      dbMessages.forEach(m => {
        sql += `INSERT INTO messages (id, sender_id, receiver_id, subject, body, is_from_admin, is_read, created_at) VALUES ('${escSql(m.id)}', '${escSql(m.sender_id)}', ${m.receiver_id ? `'${escSql(m.receiver_id)}'` : "NULL"}, '${escSql(m.subject)}', '${escSql(m.body)}', ${m.is_from_admin ? 1 : 0}, ${m.is_read ? 1 : 0}, '${m.created_at}') ON DUPLICATE KEY UPDATE id=id;\n`;
      });
      sql += "\n";
    }

    // Reviews
    if (dbReviews.length > 0) {
      sql += "-- ─── Reviews ───\n";
      dbReviews.forEach(r => {
        sql += `INSERT INTO reviews (id, user_id, service_id, service_title, rating, title, body, status, created_at) VALUES ('${escSql(r.id)}', '${escSql(r.user_id)}', '${escSql(r.service_id)}', '${escSql(r.service_title)}', ${r.rating}, '${escSql(r.title)}', '${escSql(r.body)}', '${escSql(r.status)}', '${r.created_at}') ON DUPLICATE KEY UPDATE status=VALUES(status);\n`;
      });
      sql += "\n";
    }

    // Invoices
    if (dbInvoices.length > 0) {
      sql += "-- ─── Invoices ───\n";
      dbInvoices.forEach((inv: any) => {
        sql += `INSERT INTO invoices (id, invoice_number, admin_id, client_id, service_title, package_name, description, amount, payment_method, payment_link, status, notes, due_date, paid_at, created_at, updated_at) VALUES ('${escSql(inv.id)}', '${escSql(inv.invoice_number)}', '${escSql(inv.admin_id)}', '${escSql(inv.client_id)}', '${escSql(inv.service_title)}', '${escSql(inv.package_name)}', '${escSql(inv.description)}', ${inv.amount}, '${escSql(inv.payment_method)}', '${escSql(inv.payment_link || '')}', '${escSql(inv.status)}', '${escSql(inv.notes || '')}', ${inv.due_date ? `'${inv.due_date}'` : 'NULL'}, ${inv.paid_at ? `'${inv.paid_at}'` : 'NULL'}, '${inv.created_at}', '${inv.updated_at}') ON DUPLICATE KEY UPDATE status=VALUES(status);\n`;
      });
      sql += "\n";
    }

    sql += "-- ================================================\n-- Data backup complete!\n-- ================================================\n";
    return sql;
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/sql;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSchemaDownload = () => {
    setExporting("schema");
    const sql = generateSchemaSql();
    downloadFile(sql, `schema_${new Date().toISOString().slice(0, 10)}.sql`);
    toast({ title: "Schema SQL downloaded!" });
    setTimeout(() => setExporting(null), 1000);
  };

  const handleBackupDownload = () => {
    setExporting("backup");
    const sql = generateDataBackup();
    downloadFile(sql, `backup_${new Date().toISOString().slice(0, 10)}.sql`);
    toast({ title: "Data backup downloaded!" });
    setTimeout(() => setExporting(null), 1000);
  };

  const handleFullDownload = () => {
    setExporting("full");
    const sql = generateSchemaSql() + "\n\n" + generateDataBackup();
    downloadFile(sql, `full_export_${new Date().toISOString().slice(0, 10)}.sql`);
    toast({ title: "Full export downloaded!" });
    setTimeout(() => setExporting(null), 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Database Export</h2>
        <p className="text-sm text-muted-foreground mt-1">Download SQL files to set up or back up your own database on cPanel.</p>
      </div>

      {/* Info Banner */}
      <div className="glass-card-strong rounded-xl p-5 border-l-4 border-primary">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-heading font-semibold text-foreground text-sm">How it works</h3>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1.5">
              <li>• <strong>Schema SQL</strong> — Creates all tables, indexes & relationships. Run this first on your database.</li>
              <li>• <strong>Data Backup</strong> — Exports all current data as INSERT statements. Use to migrate or restore.</li>
              <li>• <strong>Full Export</strong> — Schema + Data combined in one file. Perfect for fresh setup.</li>
              <li>• Files auto-update with any changes made to the platform — just re-download when needed.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card-strong rounded-xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">Schema SQL</h3>
            <p className="text-xs text-muted-foreground mt-1">Table structures, indexes, foreign keys</p>
          </div>
          <button onClick={handleSchemaDownload} disabled={exporting === "schema"} className="w-full btn-gradient px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {exporting === "schema" ? <><Clock className="w-4 h-4 animate-spin" /> Generating...</> : <><Save className="w-4 h-4" /> Download Schema</>}
          </button>
        </div>

        <div className="glass-card-strong rounded-xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">Data Backup</h3>
            <p className="text-xs text-muted-foreground mt-1">{dbClients.length} profiles, {dbOrders.length} orders, {dbMessages.length} messages, {dbReviews.length} reviews, {dbInvoices.length} invoices</p>
          </div>
          <button onClick={handleBackupDownload} disabled={exporting === "backup"} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 flex items-center justify-center gap-2">
            {exporting === "backup" ? <><Clock className="w-4 h-4 animate-spin" /> Generating...</> : <><Save className="w-4 h-4" /> Download Backup</>}
          </button>
        </div>

        <div className="glass-card-strong rounded-xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">Full Export</h3>
            <p className="text-xs text-muted-foreground mt-1">Schema + Data in one file</p>
          </div>
          <button onClick={handleFullDownload} disabled={exporting === "full"} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 border border-emerald-400/30 disabled:opacity-50 flex items-center justify-center gap-2">
            {exporting === "full" ? <><Clock className="w-4 h-4 animate-spin" /> Generating...</> : <><Save className="w-4 h-4" /> Download Full</>}
          </button>
        </div>
      </div>

      {/* Table Summary */}
      <div className="glass-card-strong rounded-xl p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4">Current Database Tables</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {["Table", "Records", "Key Columns", "Status"].map(h => (
                  <th key={h} className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "profiles", records: dbClients.length, cols: "id, full_name, email, phone, company" },
                { name: "orders", records: dbOrders.length, cols: "id, user_id, order_number, service_title, price, status" },
                { name: "messages", records: dbMessages.length, cols: "id, sender_id, receiver_id, body, is_from_admin" },
                { name: "reviews", records: dbReviews.length, cols: "id, user_id, service_title, rating, body, status" },
                { name: "user_roles", records: "—", cols: "id, user_id, role" },
                { name: "invoices", records: dbInvoices.length, cols: "id, invoice_number, client_id, amount, status, payment_method" },
                { name: "managers", records: "—", cols: "id, user_id, name, email, phone, role, permissions, is_active" },
                { name: "site_config", records: "—", cols: "id, config_key, config_data, updated_at" },
              ].map(t => (
                <tr key={t.name} className="border-b border-border/30 last:border-0">
                  <td className="p-3 text-sm font-medium text-foreground font-mono">{t.name}</td>
                  <td className="p-3 text-sm text-foreground">{t.records}</td>
                  <td className="p-3 text-xs text-muted-foreground font-mono">{t.cols}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


export default function AdminDashboard() {
  const [activePanel, setActivePanel] = useState("overview");
  const { logout, userRole } = useAdminAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggleTheme = () => { document.documentElement.classList.toggle("dark"); setDark(d => !d); localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light"); };
  const confirmDialog = useConfirmDialog();
  const [servicesList, setServicesListState] = useState<Service[]>(() => {
    const saved = localStorage.getItem("services_list");
    if (saved) try { return JSON.parse(saved); } catch {}
    return defaultServices;
  });
  const setServicesList = (newList: Service[]) => {
    setServicesListState(newList);
    localStorage.setItem("services_list", JSON.stringify(newList));
  };
  const [dbOrders, setDbOrders] = useState<DbOrder[]>([]);
  const [dbClients, setDbClients] = useState<DbProfile[]>([]);
  const [dbMessages, setDbMessages] = useState<DbMessage[]>([]);
  const [dbReviews, setDbReviews] = useState<DbReview[]>([]);
  const [dbInvoices, setDbInvoices] = useState<any[]>([]);
  const [adminId, setAdminId] = useState("");
  const [deleteButtons, setDeleteButtons] = useState<SiteConfig["deleteButtons"]>(() => getSiteConfig().deleteButtons);
  const [managerPermissions, setManagerPermissions] = useState<Record<string, boolean> | null>(null);

  // Fetch manager permissions for moderator users
  useEffect(() => {
    const fetchPermissions = async () => {
      if (userRole === "moderator") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data } = await supabase.from("managers").select("permissions").eq("user_id", session.user.id).eq("is_active", true).maybeSingle();
          if (data?.permissions) {
            setManagerPermissions(data.permissions as Record<string, boolean>);
            // Set active panel to first allowed section
            const firstAllowed = sidebarItems.find(i => (data.permissions as any)[i.id]);
            if (firstAllowed) setActivePanel(firstAllowed.id);
          } else {
            setManagerPermissions({});
          }
        }
      } else if (userRole === "admin") {
        setManagerPermissions(null); // Admin sees everything
      }
    };
    fetchPermissions();
  }, [userRole]);

  const isAdmin = userRole === "admin";
  const filteredSidebarItems = isAdmin ? sidebarItems : sidebarItems.filter(item => managerPermissions?.[item.id]);

  const fetchDbData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setAdminId(session.user.id);
    const [o, p, m, r, inv] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("messages").select("*").order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    ]);
    if (o.data) setDbOrders(o.data as any[]); if (p.data) setDbClients(p.data as any[]);
    if (m.data) setDbMessages(m.data as any[]); if (r.data) setDbReviews(r.data as any[]);
    if (inv.data) setDbInvoices(inv.data as any[]);
  };

  useEffect(() => {
    fetchDbData();
    fetchSiteConfig().then(c => setDeleteButtons(c.deleteButtons));
    const channel = supabase.channel("admin-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        setDbMessages(prev => {
          if (prev.find(m => m.id === msg.id || (m.id.startsWith('temp-') && m.body === msg.body && m.receiver_id === msg.receiver_id && m.sender_id === msg.sender_id))) {
            // Replace optimistic message with real one
            return prev.map(m => (m.id.startsWith('temp-') && m.body === msg.body && m.receiver_id === msg.receiver_id && m.sender_id === msg.sender_id) ? msg : m);
          }
          return [msg, ...prev];
        });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        setDbMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        const order = payload.new as any;
        if (payload.eventType === "UPDATE") {
          setDbOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...order } : o));
        } else if (payload.eventType === "INSERT") {
          setDbOrders(prev => [order, ...prev]);
        } else if (payload.eventType === "DELETE") {
          const old = payload.old as any;
          setDbOrders(prev => prev.filter(o => o.id !== old.id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => fetchDbData())
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => fetchDbData())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchDbData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = () => { confirmDialog.confirm({ title: "Logout?", description: "Are you sure?", confirmText: "Logout", variant: "warning", onConfirm: () => { logout(); navigate("/"); } }); };

  const [preselectedClientId, setPreselectedClientId] = useState<string | null>(null);
  const handleMessageClient = (clientId: string) => { setPreselectedClientId(clientId); setActivePanel("messages"); };

  const renderPanel = () => {
    // Block unauthorized access for moderators
    if (!isAdmin && managerPermissions && !managerPermissions[activePanel]) {
      const firstAllowed = filteredSidebarItems[0];
      if (firstAllowed) {
        setTimeout(() => setActivePanel(firstAllowed.id), 0);
      }
      return <div className="text-center py-12 text-muted-foreground">You don't have access to this section.</div>;
    }
    switch (activePanel) {
      case "overview": return <OverviewPanel dbOrders={dbOrders} dbClients={dbClients} dbMessages={dbMessages} dbReviews={dbReviews} dbInvoices={dbInvoices} onNavigate={(panel) => { if (isAdmin || managerPermissions?.[panel]) setActivePanel(panel); }} />;
      case "orders": return <DbOrdersPanel dbOrders={dbOrders} clients={dbClients} confirmDialog={confirmDialog} onMessageClient={handleMessageClient} onOptimisticOrderUpdate={(id, updates) => setDbOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } as DbOrder : o))} />;
      case "services": return <ServicesPanel servicesList={servicesList} setServicesList={setServicesList} confirmDialog={confirmDialog} />;
      case "portfolio": return <PortfolioPanel />;
      case "reviews": return <DbReviewsPanel reviews={dbReviews} confirmDialog={confirmDialog} />;
      case "payments": return <PaymentsPanel invoices={dbInvoices as DbInvoice[]} clients={dbClients} onRefresh={fetchDbData} confirmDialog={confirmDialog} />;
      case "clients": return <ClientsPanel clients={dbClients} orders={dbOrders} onMessageClient={handleMessageClient} confirmDialog={confirmDialog} />;
      case "messages": return <DbMessagesPanel messages={dbMessages} clients={dbClients} adminId={adminId} preselectedClientId={preselectedClientId} onClearPreselected={() => setPreselectedClientId(null)} onOptimisticMessage={(msg) => setDbMessages(prev => { if (prev.find(m => m.id === msg.id)) return prev; return [msg, ...prev]; })} onMarkRead={(ids) => setDbMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, is_read: true } : m))} confirmDialog={confirmDialog} onRefresh={fetchDbData} />;
      case "trash": return <TrashBinPanel confirmDialog={confirmDialog} onRefresh={fetchDbData} />;
      case "social": return <SocialPanel />;
      case "recruitment": return <RecruitmentPanel confirmDialog={confirmDialog} />;
      case "site-settings": return <SiteSettingsPanel confirmDialog={confirmDialog} dbOrders={dbOrders} dbClients={dbClients} dbMessages={dbMessages} dbReviews={dbReviews} dbInvoices={dbInvoices} />;
      default: return <OverviewPanel dbOrders={dbOrders} dbClients={dbClients} dbMessages={dbMessages} dbReviews={dbReviews} dbInvoices={dbInvoices} onNavigate={setActivePanel} />;
    }
  };

  const unreadMessages = dbMessages.filter(m => !m.is_read && !m.is_from_admin).length;
  const pendingOrders = dbOrders.filter(o => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-background flex">
      <confirmDialog.Dialog />
      <aside className="w-64 shrink-0 border-r border-border/50 bg-card/50 p-4 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center"><BarChart3 className="w-4 h-4 text-primary-foreground" /></div>
          <span className="font-heading font-bold text-foreground">Admin Panel</span>
        </div>
        <nav className="flex-1 space-y-1">
          {filteredSidebarItems.map((item) => {
            const badge = item.id === "messages" ? unreadMessages : item.id === "orders" ? pendingOrders : 0;
            return (
              <button key={item.id} onClick={() => setActivePanel(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activePanel === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <item.icon className="w-4 h-4" />{item.label}
                {badge > 0 && <span className="ml-auto text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Toggle theme">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile nav */}
        <div className="lg:hidden flex overflow-x-auto gap-1 p-2 sm:p-3 border-b border-border/50 bg-card/50 sticky top-0 z-30">
          {filteredSidebarItems.map(item => {
            const badge = item.id === "messages" ? unreadMessages : item.id === "orders" ? pendingOrders : 0;
            return (
              <button key={item.id} onClick={() => setActivePanel(item.id)} className={`shrink-0 px-2.5 py-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors ${activePanel === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <item.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.slice(0, 3)}</span>
                {badge > 0 && <span className="w-4 h-4 text-[9px] bg-accent text-accent-foreground rounded-full flex items-center justify-center">{badge}</span>}
              </button>
            );
          })}
          <button onClick={toggleTheme} className="shrink-0 px-2.5 py-2 rounded-lg text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleLogout} className="shrink-0 px-2.5 py-2 rounded-lg text-[11px] font-medium text-destructive flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          <motion.div key={activePanel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {renderPanel()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
