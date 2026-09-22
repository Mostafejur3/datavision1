import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmText = "Confirm", variant = "danger" }: ConfirmDialogProps) {
  const variantStyles = {
    danger: { icon: "bg-destructive/10", iconColor: "text-destructive", btn: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
    warning: { icon: "bg-amber-400/10", iconColor: "text-amber-400", btn: "bg-amber-500 text-white hover:bg-amber-600" },
    info: { icon: "bg-primary/10", iconColor: "text-primary", btn: "btn-gradient" },
  };
  const style = variantStyles[variant];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="glass-card-strong rounded-2xl p-6 w-full max-w-sm relative"
          >
            <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <div className={`w-14 h-14 rounded-2xl ${style.icon} flex items-center justify-center mx-auto mb-4`}>
                {variant === "danger" ? <Trash2 className={`w-6 h-6 ${style.iconColor}`} /> : <AlertTriangle className={`w-6 h-6 ${style.iconColor}`} />}
              </div>
              <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
              <p className="text-muted-foreground text-sm mt-2">{description}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${style.btn}`}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for easy usage
export function useConfirmDialog() {
  const [state, setState] = useState<{ open: boolean; title: string; description: string; confirmText: string; variant: "danger" | "warning" | "info"; onConfirm: () => void }>({
    open: false, title: "", description: "", confirmText: "Confirm", variant: "danger", onConfirm: () => {},
  });

  const confirm = (opts: { title: string; description: string; confirmText?: string; variant?: "danger" | "warning" | "info"; onConfirm: () => void }) => {
    setState({ open: true, title: opts.title, description: opts.description, confirmText: opts.confirmText || "Confirm", variant: opts.variant || "danger", onConfirm: opts.onConfirm });
  };

  const close = () => setState((s) => ({ ...s, open: false }));

  const Dialog = () => (
    <ConfirmDialog open={state.open} onClose={close} onConfirm={state.onConfirm}
      title={state.title} description={state.description} confirmText={state.confirmText} variant={state.variant} />
  );

  return { confirm, Dialog };
}
