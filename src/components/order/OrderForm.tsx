import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2, LogIn, Info, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
  serviceTitle: string;
  serviceId: string;
  packageName: string;
  price: number;
  orderInstructions?: string;
}

const defaultInstructions = [
  "Describe your project goals and what you want to achieve",
  "Share any relevant data files, links, or references",
  "Mention your preferred timeline if different from the package delivery",
  "Include any brand guidelines, color preferences, or style references",
  "After placing the order, send a message in your dashboard for any follow-up",
];

export default function OrderForm({ open, onClose, serviceTitle, serviceId, packageName, price, orderInstructions }: OrderFormProps) {
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      service_id: serviceId,
      service_title: serviceTitle,
      package_name: packageName,
      price,
      requirements: details.trim(),
      status: "pending",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Order placed successfully!" });
    }
    setSubmitting(false);
  };

  const reset = () => {
    setDetails("");
    setSubmitted(false);
    onClose();
  };

  const instructions = orderInstructions
    ? orderInstructions.split("\n").filter(Boolean)
    : defaultInstructions;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={reset}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass-card-strong rounded-2xl w-full max-w-lg p-6 border border-border/50 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : !user ? (
              <div className="text-center py-8">
                <LogIn className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">Sign In Required</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Please sign in to place an order.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to="/auth" onClick={reset} className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium">Cancel</button>
                </div>
              </div>
            ) : submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-4" />
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">Order Placed!</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  We'll review your order and get back to you within 24 hours.
                </p>
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">What's Next?</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Check your <Link to="/dashboard" className="text-accent hover:underline">Dashboard</Link> for order status updates</li>
                    <li>• Send us a message if you have additional requirements</li>
                    <li>• Our team will contact you for any clarifications</li>
                  </ul>
                </div>
                <div className="flex gap-3 justify-center">
                  <Link to="/dashboard" onClick={reset} className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold">
                    Go to Dashboard
                  </Link>
                  <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">Place Order</h3>
                    <p className="text-xs text-muted-foreground mt-1">{serviceTitle} · {packageName} · ${price}</p>
                  </div>
                  <button onClick={reset} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Instructions */}
                <div className="rounded-xl bg-accent/5 border border-accent/20 p-4 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground">How to Order</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    {instructions.map((inst, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-accent/10 text-accent text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                        {inst}
                      </li>
                    ))}
                  </ul>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    Ordering as <span className="text-foreground font-medium">{user.user_metadata?.full_name || user.email}</span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Project Details & Requirements</label>
                    <textarea required value={details} onChange={(e) => setDetails(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground resize-none"
                      placeholder="Describe your project goals, share relevant details, data sources, preferred tools, deadlines, and any specific requirements..." />
                  </div>

                  <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>After ordering, you can send files, images, and additional details through your <Link to="/dashboard" className="text-accent hover:underline">Dashboard Messages</Link>.</span>
                  </div>

                  <button type="submit" disabled={submitting} className="w-full btn-gradient py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {submitting ? "Placing Order..." : `Confirm Order · $${price}`} <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
