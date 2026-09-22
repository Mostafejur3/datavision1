import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, MessageSquare, Star, User, LogOut,
  Clock, CheckCircle2, Package, Send, ArrowRight, Plus, Home, Briefcase,
  FolderOpen, BookOpen, Phone, TrendingUp, Zap, ChevronRight, Bell,
  FileText, CreditCard, ExternalLink, Paperclip, ChevronDown, ChevronUp,
  Calendar, DollarSign, Receipt, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { services as defaultServices, type Service } from "@/data/services";
import Layout from "@/components/layout/Layout";

// Load services from localStorage (admin-managed) with fallback to defaults
const getServices = (): Service[] => {
  const saved = localStorage.getItem("services_list");
  if (saved) try { return JSON.parse(saved); } catch {}
  return defaultServices;
};
const services = getServices();

interface Profile {
  id: string; full_name: string; email: string; phone: string; company: string;
}
interface Order {
  id: string; order_number: string; service_id: string; service_title: string;
  package_name: string; price: number; status: string; requirements: string; created_at: string;
}
interface Message {
  id: string; sender_id: string; receiver_id: string | null; body: string; subject: string;
  is_from_admin: boolean; is_read: boolean; created_at: string;
  attachment_url?: string | null; attachment_name?: string | null; message_type?: string;
}
interface Review {
  id: string; service_id: string; service_title: string; rating: number;
  title: string; body: string; status: string; created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10",
  in_progress: "text-blue-400 bg-blue-400/10",
  completed: "text-emerald-400 bg-emerald-400/10",
  delivered: "text-purple-400 bg-purple-400/10",
  rejected: "text-red-400 bg-red-400/10",
};

const dashboardItems = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "orders", icon: ShoppingCart, label: "My Orders" },
  { id: "invoices", icon: Receipt, label: "Invoices" },
  { id: "messages", icon: MessageSquare, label: "Inbox" },
  { id: "reviews", icon: Star, label: "My Reviews" },
  { id: "services", icon: Zap, label: "Featured Services" },
  { id: "profile", icon: User, label: "Profile" },
];

const siteNavItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/about", icon: Briefcase, label: "About" },
  { to: "/services", icon: TrendingUp, label: "Services" },
  { to: "/portfolio", icon: FolderOpen, label: "Portfolio" },
  { to: "/blog", icon: BookOpen, label: "Blog" },
  { to: "/contact", icon: Phone, label: "Contact" },
];

// ─── Overview ───
function OverviewPanel({ orders, messages, profile, onNavigate }: { orders: Order[]; messages: Message[]; profile: Profile | null; onNavigate: (id: string) => void }) {
  const unread = messages.filter((m) => !m.is_read && m.is_from_admin).length;
  const totalSpent = orders.reduce((s, o) => s + o.price, 0);
  const stats = [
    { icon: Package, label: "Total Orders", value: String(orders.length), color: "text-primary bg-primary/10" },
    { icon: Clock, label: "Active Orders", value: String(orders.filter((o) => o.status === "in_progress" || o.status === "pending").length), color: "text-blue-400 bg-blue-400/10" },
    { icon: CheckCircle2, label: "Completed", value: String(orders.filter((o) => o.status === "completed" || o.status === "delivered").length), color: "text-emerald-400 bg-emerald-400/10" },
    { icon: MessageSquare, label: "Unread Messages", value: String(unread), color: "text-accent bg-accent/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">
          Welcome back, {profile?.full_name?.split(" ")[0] || "User"} 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your account.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border/50 p-5 hover:border-border transition-colors">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-5 h-5" /></div>
            <div className="font-heading text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-muted-foreground text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: "orders", icon: ShoppingCart, color: "primary", title: "View Orders", desc: "Track your order status" },
          { id: "messages", icon: MessageSquare, color: "accent", title: `Messages${unread > 0 ? ` (${unread} new)` : ""}`, desc: "Chat with our team" },
          { id: "services", icon: Zap, color: "emerald-400", title: "Browse Services", desc: "Explore what we offer" },
        ].map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className="rounded-xl bg-card border border-border/50 p-4 flex items-center gap-3 hover:border-primary/30 transition-colors text-left group">
            <div className={`w-10 h-10 rounded-lg bg-${item.color}/10 flex items-center justify-center shrink-0`}><item.icon className={`w-5 h-5 text-${item.color}`} /></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5 flex items-center justify-between">
        <div><p className="text-sm text-muted-foreground">Total Investment</p><p className="font-heading text-3xl font-bold text-foreground">${totalSpent.toLocaleString()}</p></div>
        <TrendingUp className="w-10 h-10 text-primary/50" />
      </div>
      <div className="rounded-xl bg-card border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-foreground">Recent Orders</h3>
          <button onClick={() => onNavigate("orders")} className="text-xs text-accent hover:underline">View All</button>
        </div>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-sm">No orders yet. <Link to="/services" className="text-accent hover:underline">Browse services</Link> to get started!</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div><span className="text-sm font-medium text-foreground">{o.service_title}</span><span className="text-xs text-muted-foreground ml-2 capitalize">· {o.package_name}</span></div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">${o.price}</span>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[o.status] || ""}`}>{o.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Orders ───
function OrdersPanel({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">My Orders</h2>
      {orders.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 p-8 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">No orders yet.</p>
          <Link to="/services" className="inline-flex items-center gap-2 mt-4 text-accent text-sm hover:underline">Browse Services <ArrowRight className="w-4 h-4" /></Link>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border/50">{["Order #", "Service", "Package", "Price", "Status", "Date"].map((h) => <th key={h} className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-foreground">{o.order_number}</td>
                    <td className="p-4 text-sm text-foreground">{o.service_title}</td>
                    <td className="p-4 text-sm text-muted-foreground capitalize">{o.package_name}</td>
                    <td className="p-4 text-sm font-semibold text-foreground">${o.price}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColors[o.status] || ""}`}>{o.status.replace("_", " ")}</span></td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment Method Modal ───
function PaymentModal({ invoice, onClose, onMarkPaid }: { invoice: Invoice; onClose: () => void; onMarkPaid: (invId: string) => void }) {
  const [paymentConfigs, setPaymentConfigs] = useState<Record<string, any>>({});
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      const { data } = await supabase.from("site_config").select("config_data").eq("config_key", "payment_configs").maybeSingle();
      if (data?.config_data) setPaymentConfigs(data.config_data as Record<string, any>);
      setLoading(false);
    };
    fetchConfigs();
  }, []);

  const enabledMethods = PAYMENT_METHODS_CLIENT.filter(pm => {
    const cfg = paymentConfigs[pm.configKey];
    return cfg?.enabled;
  });

  const selectedConfig = selectedMethod ? paymentConfigs[PAYMENT_METHODS_CLIENT.find(m => m.id === selectedMethod)?.configKey || ""] : null;
  const selectedLabel = PAYMENT_METHODS_CLIENT.find(m => m.id === selectedMethod);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
          <div>
            <h3 className="font-heading font-bold text-foreground text-lg">Pay Invoice</h3>
            <p className="text-xs text-muted-foreground">#{invoice.invoice_number} · ${Number(invoice.amount).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : !selectedMethod ? (
            /* Step 1: Choose Payment Method */
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">Select a payment method</p>
              {enabledMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No payment methods available. Please contact admin.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {enabledMethods.map(pm => (
                    <button key={pm.id} onClick={() => setSelectedMethod(pm.id)}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group">
                      <span className="text-2xl">{pm.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{pm.label}</p>
                        <p className="text-[10px] text-muted-foreground">{pm.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : confirming ? (
            /* Step 3: Confirm Payment */
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-5 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-amber-500" />
                </div>
                <h4 className="font-heading font-bold text-foreground">Confirm Your Payment</h4>
                <p className="text-sm text-muted-foreground">
                  By confirming, you're letting us know you've completed the payment of <strong className="text-foreground">${Number(invoice.amount).toLocaleString()}</strong> via <strong className="text-foreground">{selectedLabel?.label}</strong>.
                </p>
                <p className="text-xs text-muted-foreground">Our team will verify the payment and update the status.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { onMarkPaid(invoice.id); onClose(); }}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Yes, I've Paid
                </button>
                <button onClick={() => setConfirming(false)}
                  className="px-4 py-3 rounded-xl text-sm bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  Back
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Show Payment Details */
            <div className="space-y-4">
              <button onClick={() => setSelectedMethod(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronUp className="w-3 h-3 rotate-[-90deg]" /> Back to methods
              </button>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedLabel?.emoji}</span>
                  <div>
                    <h4 className="font-heading font-bold text-foreground">{selectedLabel?.label}</h4>
                    <p className="text-xs text-muted-foreground">Send exactly ${Number(invoice.amount).toLocaleString()} using the details below</p>
                  </div>
                </div>

                {/* Payment details based on method */}
                <div className="space-y-3 bg-card rounded-lg p-4 border border-border/50">
                  {selectedMethod === "paypal" && selectedConfig?.clientId && (
                    <PaymentDetailRow label="PayPal Account" value={selectedConfig.clientId} />
                  )}
                  {selectedMethod === "stripe" && selectedConfig?.publicKey && (
                    <PaymentDetailRow label="Stripe Account" value={selectedConfig.publicKey} />
                  )}
                  {selectedMethod === "bank_transfer" && (
                    <>
                      {selectedConfig?.bankName && <PaymentDetailRow label="Bank Name" value={selectedConfig.bankName} />}
                      {selectedConfig?.accountName && <PaymentDetailRow label="Account Holder" value={selectedConfig.accountName} />}
                      {selectedConfig?.accountNumber && <PaymentDetailRow label="Account Number" value={selectedConfig.accountNumber} />}
                    </>
                  )}
                  {selectedMethod === "bkash" && selectedConfig?.bkashNumber && (
                    <PaymentDetailRow label="bKash Number" value={selectedConfig.bkashNumber} />
                  )}
                  {selectedMethod === "nagad" && selectedConfig?.nagadNumber && (
                    <PaymentDetailRow label="Nagad Number" value={selectedConfig.nagadNumber} />
                  )}
                  {selectedMethod === "wise" && selectedConfig?.clientId && (
                    <PaymentDetailRow label="Wise Account" value={selectedConfig.clientId} />
                  )}
                  {selectedMethod === "crypto" && selectedConfig?.clientId && (
                    <PaymentDetailRow label="Wallet Address" value={selectedConfig.clientId} />
                  )}
                  {selectedMethod === "other" && selectedConfig?.instructions && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Instructions</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedConfig.instructions}</p>
                    </div>
                  )}
                  <PaymentDetailRow label="Amount" value={`$${Number(invoice.amount).toLocaleString()}`} />
                  <PaymentDetailRow label="Reference" value={invoice.invoice_number} />
                </div>

                {invoice.payment_link && (
                  <a href={invoice.payment_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                    <ExternalLink className="w-4 h-4" /> Open Payment Page
                  </a>
                )}
              </div>

              <button onClick={() => setConfirming(true)}
                className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> I've Made the Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentDetailRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
      <button onClick={copy} className="shrink-0 text-[10px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

// ─── Invoices Panel ───
function InvoicesPanel({ userId }: { userId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data } = await supabase.from("invoices").select("*").eq("client_id", userId).order("created_at", { ascending: false });
      if (data) setInvoices(data as any[]);
      setLoading(false);
    };
    fetchInvoices();
    const channel = supabase.channel("client-invoices-panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `client_id=eq.${userId}` }, () => fetchInvoices())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAsInReview = async (invId: string) => {
    const { error } = await supabase.from("invoices").update({ status: "in_review", updated_at: new Date().toISOString() } as any).eq("id", invId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Payment submitted for review! 🔍", description: "Our team will verify and confirm your payment." });
  };

  const totalPending = invoices.filter(i => i.status === "pending" || i.status === "in_review").reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">My Invoices</h2>

      {/* Payment Modal */}
      {payingInvoice && (
        <PaymentModal invoice={payingInvoice} onClose={() => setPayingInvoice(null)} onMarkPaid={markAsInReview} />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-2"><Receipt className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Total Invoices</span></div>
          <p className="font-heading text-2xl font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-amber-400" /><span className="text-xs text-muted-foreground">Pending</span></div>
          <p className="font-heading text-2xl font-bold text-foreground">${totalPending.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-card border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-xs text-muted-foreground">Paid</span></div>
          <p className="font-heading text-2xl font-bold text-foreground">${totalPaid.toLocaleString()}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 p-8 text-center">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">No invoices yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const isExpanded = expandedId === inv.id;
            const isPending = inv.status === "pending";
            const isPaid = inv.status === "paid";
            const isInReview = inv.status === "in_review";
            const method = PAYMENT_METHODS_CLIENT.find(pm => pm.id === inv.payment_method);

            return (
              <div key={inv.id} className={`rounded-xl bg-card border overflow-hidden transition-all ${isPending ? "border-amber-400/20" : isPaid ? "border-emerald-400/20" : isInReview ? "border-blue-400/20" : "border-border/50"}`}>
                {/* Clickable Header */}
                <button onClick={() => setExpandedId(isExpanded ? null : inv.id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPaid ? "bg-emerald-400/10" : isInReview ? "bg-blue-400/10" : isPending ? "bg-amber-400/10" : "bg-red-400/10"}`}>
                      <FileText className={`w-5 h-5 ${isPaid ? "text-emerald-400" : isInReview ? "text-blue-400" : isPending ? "text-amber-400" : "text-red-400"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{inv.service_title}</p>
                        {inv.package_name && <span className="text-[10px] text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-full">{inv.package_name}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">#{inv.invoice_number} · {new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-lg font-bold text-foreground">${Number(inv.amount).toLocaleString()}</p>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize border ${invoiceStatusColors[inv.status] || invoiceStatusColors.pending}`}>{inv.status === "in_review" ? "In Review" : inv.status}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border/30 p-5 bg-muted/10 space-y-4">
                    {/* Invoice Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Service</p>
                        <p className="text-sm text-foreground font-medium">{inv.service_title}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Package</p>
                        <p className="text-sm text-foreground capitalize">{inv.package_name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Payment Method</p>
                        <p className="text-sm text-foreground">{method?.emoji} {method?.label || inv.payment_method}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Amount</p>
                        <p className="text-lg font-bold text-foreground">${Number(inv.amount).toLocaleString()}</p>
                      </div>
                    </div>

                    {inv.description && (
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                        <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{inv.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Invoice Date</p>
                        <p className="text-sm text-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{new Date(inv.created_at).toLocaleDateString()}</p>
                      </div>
                      {inv.due_date && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Due Date</p>
                          <p className={`text-sm flex items-center gap-1 ${new Date(inv.due_date) < new Date() && isPending ? "text-red-400 font-semibold" : "text-foreground"}`}>
                            <Calendar className="w-3.5 h-3.5" />{new Date(inv.due_date).toLocaleDateString()}
                            {new Date(inv.due_date) < new Date() && isPending && <span className="text-[10px] bg-red-400/10 text-red-400 px-1.5 py-0.5 rounded-full ml-1">Overdue</span>}
                          </p>
                        </div>
                      )}
                      {inv.paid_at && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Paid On</p>
                          <p className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{new Date(inv.paid_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {inv.notes && (
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                        <p className="text-sm text-muted-foreground italic">{inv.notes}</p>
                      </div>
                    )}

                    {/* Payment Actions */}
                    {isPending && (
                      <div className="border-t border-border/30 pt-4">
                        <button onClick={() => setPayingInvoice(inv)}
                          className="w-full px-4 py-3.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                          <CreditCard className="w-4 h-4" /> Pay Now
                        </button>
                      </div>
                    )}

                    {isInReview && (
                      <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 text-center space-y-1">
                        <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                          <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                        </div>
                        <p className="text-sm font-semibold text-blue-400">Payment Under Review</p>
                        <p className="text-xs text-muted-foreground">Our team is verifying your payment. You'll be notified once confirmed.</p>
                      </div>
                    )}

                    {isPaid && (
                      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-emerald-400">Payment Confirmed</p>
                        {inv.paid_at && <p className="text-xs text-muted-foreground mt-1">Paid on {new Date(inv.paid_at).toLocaleDateString()}</p>}
                      </div>
                    )}

                    {inv.status === "cancelled" && (
                      <div className="rounded-xl bg-red-400/5 border border-red-400/20 p-4 text-center">
                        <p className="text-sm font-medium text-red-400">This invoice has been cancelled</p>
                      </div>
                    )}
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

// ─── Invoice interface (client side) ───
interface Invoice {
  id: string; invoice_number: string; service_title: string; package_name: string;
  description: string; amount: number; payment_method: string; payment_link: string;
  status: string; due_date: string | null; paid_at: string | null; created_at: string;
  notes?: string | null;
}

const PAYMENT_METHODS_CLIENT = [
  { id: "paypal", label: "PayPal", emoji: "🅿️", configKey: "paypal", desc: "Pay with PayPal" },
  { id: "stripe", label: "Stripe", emoji: "💳", configKey: "stripe", desc: "Pay with card" },
  { id: "bank_transfer", label: "Bank Transfer", emoji: "🏦", configKey: "bankTransfer", desc: "Direct bank transfer" },
  { id: "bkash", label: "bKash", emoji: "📱", configKey: "mobileBanking", desc: "Mobile banking" },
  { id: "nagad", label: "Nagad", emoji: "📱", configKey: "mobileBanking", desc: "Mobile banking" },
  { id: "wise", label: "Wise", emoji: "🌍", configKey: "wise", desc: "International transfer" },
  { id: "crypto", label: "Cryptocurrency", emoji: "₿", configKey: "crypto", desc: "Pay with crypto" },
  { id: "other", label: "Other", emoji: "💰", configKey: "manualPayment", desc: "Manual payment" },
];

const invoiceStatusColors: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  in_review: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  paid: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  overdue: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

// ─── Chat-Style Messages ───
function MessagesPanel({ messages, userId, onRefresh, onOptimisticMessage, onMarkRead }: { messages: Message[]; userId: string; onRefresh: () => void; onOptimisticMessage: (msg: Message) => void; onMarkRead?: (ids: string[]) => void }) {
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Fetch invoices for this client
  useEffect(() => {
    const fetchInvoices = async () => {
      const { data } = await supabase.from("invoices").select("*").eq("client_id", userId).order("created_at", { ascending: false });
      if (data) setInvoices(data as any[]);
    };
    fetchInvoices();
    const channel = supabase.channel("client-invoices")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `client_id=eq.${userId}` }, () => fetchInvoices())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const sorted = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [sorted.length]);

  useEffect(() => {
    const unreadIds = messages.filter((m) => !m.is_read && m.is_from_admin).map((m) => m.id).filter(id => !id.startsWith('temp-'));
    if (unreadIds.length > 0) {
      onMarkRead?.(unreadIds);
      supabase.from("messages").update({ is_read: true }).in("id", unreadIds).then();
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`, sender_id: userId, receiver_id: null, body: newMsg.trim(),
      subject: "Chat", is_from_admin: false, is_read: false, created_at: new Date().toISOString(), message_type: "text",
    };
    onOptimisticMessage(optimisticMsg);
    const msgText = newMsg.trim();
    setNewMsg("");
    const { error } = await supabase.from("messages").insert({ sender_id: userId, body: msgText, subject: "Chat", is_from_admin: false } as any);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setSending(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `client/${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("message-attachments").upload(path, file);
    if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(path);
    await supabase.from("messages").insert({ sender_id: userId, body: file.name, subject: "Chat", is_from_admin: false, attachment_url: urlData.publicUrl, attachment_name: file.name } as any);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getInvoice = (msgBody: string) => invoices.find(i => i.id === msgBody);

  const markInvoiceInReview = async (invId: string) => {
    await supabase.from("invoices").update({ status: "in_review", updated_at: new Date().toISOString() } as any).eq("id", invId);
    toast({ title: "Payment submitted for review! 🔍" });
  };

  const [msgPayingInvoice, setMsgPayingInvoice] = useState<Invoice | null>(null);

  const renderMessage = (m: Message) => {
    const isOwn = !m.is_from_admin;
    const inv = m.message_type === "invoice" ? getInvoice(m.body) : undefined;

    return (
      <div key={m.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isOwn ? "btn-gradient text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
          {m.is_from_admin && <p className="text-[10px] font-semibold text-primary mb-0.5">Admin</p>}

          {m.message_type === "invoice" && inv ? (
            <div className="rounded-xl overflow-hidden bg-card border border-border text-foreground">
              {/* Invoice Header */}
              <div className="px-4 py-3 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">Invoice</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border capitalize ${invoiceStatusColors[inv.status] || invoiceStatusColors.pending}`}>
                  {inv.status === "in_review" ? "In Review" : inv.status}
                </span>
              </div>
              {/* Invoice Body */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{inv.service_title}</p>
                    {inv.package_name && <p className="text-[10px] text-muted-foreground capitalize">{inv.package_name} Package</p>}
                  </div>
                  <p className="text-xl font-bold text-foreground">${Number(inv.amount).toLocaleString()}</p>
                </div>
                {inv.description && <p className="text-[11px] text-muted-foreground">{inv.description}</p>}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  <span>{PAYMENT_METHODS_CLIENT.find(pm => pm.id === inv.payment_method)?.emoji} {PAYMENT_METHODS_CLIENT.find(pm => pm.id === inv.payment_method)?.label}</span>
                  <span>#{inv.invoice_number}</span>
                  {inv.due_date && <span>Due: {new Date(inv.due_date).toLocaleDateString()}</span>}
                </div>
                {inv.status === "pending" && (
                  <button onClick={() => setMsgPayingInvoice(inv)} className="w-full text-[11px] py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold border border-primary/20 transition-colors flex items-center justify-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Pay Now
                  </button>
                )}
                {inv.status === "in_review" && (
                  <div className="text-[10px] text-blue-400 text-center font-medium py-1.5 bg-blue-400/5 rounded-lg border border-blue-400/10">
                    🔍 Payment under review
                  </div>
                )}
                {inv.status === "paid" && inv.paid_at && (
                  <p className="text-[10px] text-emerald-500 text-center font-medium">✅ Paid on {new Date(inv.paid_at).toLocaleDateString()}</p>
                )}
                {inv.status === "cancelled" && (
                  <p className="text-[10px] text-red-400 text-center font-medium">This invoice has been cancelled</p>
                )}
              </div>
            </div>
          ) : m.message_type === "payment_link" ? (
            <div className={`rounded-lg p-3 ${isOwn ? "bg-white/10" : "bg-accent/10 border border-accent/20"}`}>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold">Payment Link</span>
              </div>
              <a href={m.body} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline break-all flex items-center gap-1">
                Click to Pay <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : m.message_type === "service_link" ? (
            <div className={`rounded-lg p-3 ${isOwn ? "bg-white/10" : "bg-primary/10 border border-primary/20"}`}>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold">Recommended Service</span>
              </div>
              <Link to={`/services/${m.body}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                View Service Details <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{m.body}</p>
          )}

          {m.attachment_url && (() => {
            const ext = (m.attachment_name || "").split(".").pop()?.toLowerCase() || "";
            const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
            const isVideo = ["mp4", "webm", "mov"].includes(ext);
            if (isImage) return <a href={m.attachment_url!} target="_blank" rel="noopener noreferrer" className="block mt-2"><img src={m.attachment_url!} alt={m.attachment_name || ""} className="rounded-lg max-w-[200px]" /></a>;
            if (isVideo) return <video src={m.attachment_url!} controls className="mt-2 rounded-lg max-w-[200px]" />;
            return (
              <a href={m.attachment_url!} target="_blank" rel="noopener noreferrer" className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${isOwn ? "bg-white/10 hover:bg-white/20" : "bg-muted/80 hover:bg-muted"} transition-colors`}>
                <FileText className="w-3 h-3 shrink-0" />
                <span className="truncate">{m.attachment_name || "File"}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
              </a>
            );
          })()}

          <p className={`text-[10px] mt-1 ${isOwn ? "opacity-70" : "text-muted-foreground"}`}>
            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  };

  // Get social links from localStorage (social_links panel) and site_config as fallback
  const socialLinks = (() => {
    try { 
      const social = JSON.parse(localStorage.getItem("social_links") || "{}");
      const siteConfig = JSON.parse(localStorage.getItem("site_config") || "{}");
      return {
        ...social,
        whatsapp: social.whatsapp || siteConfig.whatsapp || "",
        facebook: social.facebook || "",
        telegram: social.telegram || "",
      };
    } catch { return {}; }
  })();

  const contactChannels = [
    { id: "inapp", label: "In-App", url: "#inapp", icon: (
      <MessageSquare className="w-6 h-6" />
    ), activeColor: "bg-primary/10 border-primary/30 text-primary", online: true },
    { id: "whatsapp", label: "WhatsApp", url: socialLinks.whatsapp ? `https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, "")}` : null, icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    ), activeColor: "bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]" },
    { id: "telegram", label: "Telegram", url: socialLinks.telegram || null, icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.012-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
    ), activeColor: "bg-[#0088cc]/10 border-[#0088cc]/30 text-[#0088cc]" },
    { id: "messenger", label: "Messenger", url: socialLinks.facebook ? `https://m.me/${socialLinks.facebook.split("/").pop()}` : null, icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z"/></svg>
    ), activeColor: "bg-[#006AFF]/10 border-[#006AFF]/30 text-[#006AFF]" },
    { id: "email", label: "Email", url: (() => { try { const cfg = JSON.parse(localStorage.getItem("site_config") || "{}"); return cfg.email ? `mailto:${cfg.email}` : null; } catch { return null; } })(), icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
    ), activeColor: "bg-primary/10 border-primary/30 text-primary" },
  ];

  return (
    <div className="space-y-3">
      {/* Payment Modal for messages */}
      {msgPayingInvoice && (
        <PaymentModal invoice={msgPayingInvoice} onClose={() => setMsgPayingInvoice(null)} onMarkPaid={markInvoiceInReview} />
      )}
      <h2 className="font-heading text-2xl font-bold text-foreground">Messages</h2>
      
      <div className="flex gap-3 h-[calc(100vh-8rem)]">
        {/* Left Sidebar - Contact Channels */}
        <div className="w-20 md:w-24 shrink-0 flex flex-col gap-3">
          {contactChannels.map(ch => {
            if (ch.id === "inapp") {
              return (
                <button key={ch.id} className={`group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${ch.activeColor}`} title="In-App Chat (Active)">
                  <div className="relative">
                    {ch.icon}
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-card" />
                  </div>
                  <span className="text-[10px] font-medium mt-1.5 hidden md:block">{ch.label}</span>
                </button>
              );
            }
            if (!ch.url) {
              return (
                <div key={ch.id} className="group flex flex-col items-center justify-center p-3 rounded-xl border border-border/30 bg-muted/30 opacity-40 cursor-not-allowed" title={`${ch.label} (not configured)`}>
                  <div className="text-muted-foreground">{ch.icon}</div>
                  <span className="text-[10px] font-medium text-muted-foreground mt-1.5 hidden md:block">{ch.label}</span>
                </div>
              );
            }
            return (
              <button key={ch.id} onClick={() => window.open(ch.url!, '_blank', 'noopener,noreferrer')} className={`group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all hover:scale-105 ${ch.activeColor} cursor-pointer`} title={`Chat on ${ch.label}`}>
                {ch.icon}
                <span className="text-[10px] font-medium mt-1.5 hidden md:block">{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side - In-App Chat */}
        <div className="flex-1 rounded-xl bg-card border border-border/50 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2 bg-muted/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-foreground">In-App Chat</span>
            <span className="text-xs text-muted-foreground ml-1">· Direct message to our team</span>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {sorted.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">No messages yet. Start a conversation!</p>
                </div>
              </div>
            ) : sorted.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border/50 p-3 flex gap-2 items-center">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" title="Attach file">
              {uploading ? <Clock className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground"
            />
            <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reviews ───
function ReviewsPanel({ reviews, userId, onRefresh }: { reviews: Review[]; userId: string; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ service_id: "", rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!form.service_id || !form.body.trim()) return;
    setSubmitting(true);
    const service = services.find((s) => s.id === form.service_id);
    const { error } = await supabase.from("reviews").insert({
      user_id: userId, service_id: form.service_id, service_title: service?.title || form.service_id,
      rating: form.rating, title: form.title.trim(), body: form.body.trim(),
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Review submitted!" }); setForm({ service_id: "", rating: 5, title: "", body: "" }); setShowForm(false); onRefresh(); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold text-foreground">My Reviews</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Write Review</button>
      </div>
      {showForm && (
        <div className="rounded-xl bg-card border border-border/50 p-6 space-y-4">
          <select value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
            <option value="">Select a service</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <div className="flex gap-1">{[1,2,3,4,5].map((r) => <button key={r} onClick={() => setForm({ ...form, rating: r })} className="p-1"><Star className={`w-6 h-6 ${r <= form.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} /></button>)}</div>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Review title (optional)" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Share your experience..." rows={4} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
          <div className="flex gap-2">
            <button onClick={submitReview} disabled={submitting} className="btn-gradient px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{submitting ? "Submitting..." : "Submit Review"}</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg bg-muted text-muted-foreground text-sm">Cancel</button>
          </div>
        </div>
      )}
      {reviews.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/50 p-8 text-center">
          <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl bg-card border border-border/50 p-5">
              <div className="flex items-start justify-between mb-2">
                <div><h4 className="font-semibold text-foreground text-sm">{r.service_title}</h4><div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map((s) => <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />)}</div></div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${r.status === "approved" ? "text-emerald-400 bg-emerald-400/10" : r.status === "rejected" ? "text-red-400 bg-red-400/10" : "text-amber-400 bg-amber-400/10"}`}>{r.status}</span>
              </div>
              {r.title && <p className="text-sm font-medium text-foreground mb-1">{r.title}</p>}
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Featured Services ───
function FeaturedServicesPanel() {
  const featured = services.filter((s) => s.featured);
  return (
    <div className="space-y-6">
      <div><h2 className="font-heading text-2xl font-bold text-foreground">Featured Services</h2><p className="text-muted-foreground text-sm mt-1">Popular services you might be interested in.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featured.map((s) => (
          <Link key={s.id} to={`/services/${s.id}`} className="rounded-xl bg-card border border-border/50 p-6 hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Zap className="w-5 h-5 text-primary" /></div>
              <div><h3 className="font-heading font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{s.title}</h3><span className="text-xs text-muted-foreground">{s.category}</span></div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{s.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">From ${s.packages.basic.price}</span>
              <span className="text-xs text-accent flex items-center gap-1 group-hover:underline">View Details <ArrowRight className="w-3 h-3" /></span>
            </div>
          </Link>
        ))}
      </div>
      <div className="text-center"><Link to="/services" className="btn-gradient px-6 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2">View All Services <ArrowRight className="w-4 h-4" /></Link></div>
    </div>
  );
}

// ─── Profile ───
function ProfilePanel({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Partial<Profile>) => void }) {
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: form.full_name, phone: form.phone, company: form.company }).eq("id", profile.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Profile updated!" }); onUpdate(form); }
    setSaving(false);
  };
  const inputCls = "w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm";
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">Profile Settings</h2>
      <div className="rounded-xl bg-card border border-border/50 p-6 space-y-4 max-w-lg">
        <div><label className="text-sm font-medium text-foreground block mb-1">Full Name</label><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} /></div>
        <div><label className="text-sm font-medium text-foreground block mb-1">Email</label><input value={form.email} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} /></div>
        <div><label className="text-sm font-medium text-foreground block mb-1">Phone</label><input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+1 234 567 890" /></div>
        <div><label className="text-sm font-medium text-foreground block mb-1">Company</label><input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} placeholder="Your company name" /></div>
        <button onClick={save} disabled={saving} className="btn-gradient px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>
  );
}

// ─── Main ───
export default function ClientDashboard() {
  const [activePanel, setActivePanel] = useState("overview");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async (userId: string) => {
    const [ordersRes, messagesRes, reviewsRes, profileRes] = await Promise.all([
      supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("messages").select("*").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", userId).single(),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (messagesRes.data) setMessages(messagesRes.data as Message[]);
    if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      fetchData(session.user.id);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      fetchData(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate, fetchData]);

  // Realtime messages & orders with notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("client-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id === user.id || msg.sender_id === user.id) {
          setMessages((prev) => {
            // Replace optimistic temp message with real one
            const tempMatch = prev.find(m => m.id.startsWith('temp-') && m.body === msg.body && m.sender_id === msg.sender_id);
            if (tempMatch) return prev.map(m => m.id === tempMatch.id ? (msg as Message) : m);
            if (prev.find(m => m.id === msg.id)) return prev;
            return [msg as Message, ...prev];
          });
          // Show toast notification for admin replies
          if (msg.is_from_admin && msg.receiver_id === user.id) {
            toast({
              title: "New message from Admin",
              description: msg.body.length > 50 ? msg.body.substring(0, 50) + "..." : msg.body,
            });
            // Play notification sound
            try {
              const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdW+JkIeEg4p/hYWKd3J0dXuAgoaCgISLhXlzcXF0eYGGiYeDgYKBf319f4GEhoeIiYqLjIyMjY2NjY2MjIuLioqJiYiIiIiIiYmJiouLjIyNjY2Njo6Ojo6OjY2NjIyLi4qKiYmJiYmJiYmKiouLi4yMjI2NjY2Ojo6Ojo2NjYyMjIuLi4qKioqKioqKioqLi4uMjIyMjY2NjY2Ojo6OjY2NjYyMjIyLi4uLi4uLi4uLi4uMjIyMjIyNjY2NjY2NjY2NjY2MjIyMjIyLi4uLi4uLi4yMjIyMjIyMjI2NjY2NjY2NjY2NjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI2NjY2NjY2NjY2NjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIw==");
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id === user.id || msg.sender_id === user.id) {
          setMessages((prev) => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        const order = payload.new as any;
        if (payload.eventType === "UPDATE" && order.user_id === user.id) {
          // Optimistically update local state
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...order } : o));
          toast({
            title: "Order Updated",
            description: `Order ${order.order_number} status: ${order.status}`,
          });
        } else if (payload.eventType === "INSERT" && order.user_id === user.id) {
          setOrders(prev => [order, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };
  const unreadCount = messages.filter((m) => !m.is_read && m.is_from_admin).length;

  const renderPanel = () => {
    switch (activePanel) {
      case "overview": return <OverviewPanel orders={orders} messages={messages} profile={profile} onNavigate={setActivePanel} />;
      case "orders": return <OrdersPanel orders={orders} />;
      case "invoices": return <InvoicesPanel userId={user?.id || ""} />;
      case "messages": return <MessagesPanel messages={messages} userId={user?.id || ""} onRefresh={() => fetchData(user?.id)} onOptimisticMessage={(msg) => setMessages(prev => { if (prev.find(m => m.id === msg.id)) return prev; return [msg, ...prev]; })} onMarkRead={(ids) => setMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, is_read: true } : m))} />;
      case "reviews": return <ReviewsPanel reviews={reviews} userId={user?.id || ""} onRefresh={() => fetchData(user?.id)} />;
      case "services": return <FeaturedServicesPanel />;
      case "profile": return profile ? <ProfilePanel profile={profile} onUpdate={(p) => setProfile({ ...profile!, ...p })} /> : null;
      default: return <OverviewPanel orders={orders} messages={messages} profile={profile} onNavigate={setActivePanel} />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className={`${sidebarCollapsed ? "w-16" : "w-64"} shrink-0 border-r border-border/50 bg-card/30 hidden lg:flex flex-col transition-all duration-300`}>
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-primary" /></div>
                <div className="min-w-0"><p className="font-heading font-bold text-foreground text-sm truncate">{profile?.full_name || "User"}</p><p className="text-xs text-muted-foreground truncate">{profile?.email}</p></div>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            <div>
              {!sidebarCollapsed && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">Dashboard</p>}
              <nav className="space-y-1">
                {dashboardItems.map((item) => {
                  const isActive = activePanel === item.id;
                  const badge = item.id === "messages" ? unreadCount : 0;
                  return (
                    <button key={item.id} onClick={() => setActivePanel(item.id)} title={sidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                      {!sidebarCollapsed && badge > 0 && <span className="ml-auto text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">{badge}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div>
              {!sidebarCollapsed && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">Navigate</p>}
              <nav className="space-y-1">
                {siteNavItems.map((item) => (
                  <Link key={item.to} to={item.to} title={sidebarCollapsed ? item.label : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <item.icon className="w-4 h-4 shrink-0" />{!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <div className="p-3 border-t border-border/50">
            <button onClick={handleLogout} title={sidebarCollapsed ? "Sign Out" : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4 shrink-0" />{!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 flex">
          {dashboardItems.slice(0, 5).map((item) => {
            const badge = item.id === "messages" ? unreadCount : 0;
            return (
              <button key={item.id} onClick={() => setActivePanel(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs relative ${activePanel === item.id ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="w-4 h-4" /><span className="text-[10px]">{item.label}</span>
                {badge > 0 && <span className="absolute top-1.5 right-1/2 translate-x-4 w-4 h-4 bg-accent text-accent-foreground text-[9px] rounded-full flex items-center justify-center">{badge}</span>}
              </button>
            );
          })}
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          <motion.div key={activePanel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {renderPanel()}
          </motion.div>
        </main>
      </div>
    </Layout>
  );
}
