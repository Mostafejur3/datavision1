import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Linkedin, Facebook, Instagram, Youtube, ExternalLink, MessageCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getSiteConfig, fetchSiteConfig, type SiteConfig } from "@/lib/siteConfig";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(getSiteConfig());

  useEffect(() => {
    fetchSiteConfig().then(setConfig);
  }, []);

  const socialData = (() => {
    try { return JSON.parse(localStorage.getItem("social_links") || "{}"); } catch { return {}; }
  })();

  const socialLinks = [
    { icon: ExternalLink, label: "Fiverr", href: socialData.fiverr || "#", color: "hover:text-emerald-400" },
    { icon: MessageCircle, label: "WhatsApp", href: (socialData.whatsapp || config.whatsapp) ? `https://wa.me/${(socialData.whatsapp || config.whatsapp || "").replace(/\D/g, '')}?text=Hello` : "", color: "hover:text-emerald-400" },
    { icon: Linkedin, label: "LinkedIn", href: socialData.linkedin || "#", color: "hover:text-blue-400" },
    { icon: Facebook, label: "Facebook", href: socialData.facebook || "#", color: "hover:text-blue-500" },
    { icon: Instagram, label: "Instagram", href: socialData.instagram || "#", color: "hover:text-pink-400" },
    { icon: Youtube, label: "YouTube", href: socialData.youtube || "#", color: "hover:text-red-400" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);

    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Logged in user: send as a normal message
        const { error } = await supabase.from("messages").insert({
          sender_id: session.user.id,
          body: `[Contact Form]\nName: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\n${form.message}`,
          subject: form.subject || "Contact Form",
          is_from_admin: false,
          message_type: "text",
        } as any);
        if (error) throw error;
      } else {
        // Guest user: use edge function to insert message as a guest
        const { error } = await supabase.functions.invoke("contact-message", {
          body: { name: form.name, email: form.email, subject: form.subject, message: form.message },
        });
        if (error) throw error;
      }

      toast.success("Message sent! We'll get back to you within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      console.error("Contact form error:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <section className="pt-8 md:pt-10 pb-4 md:pb-6">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="font-heading text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-3"
          >
            Get In <span className="gradient-text">Touch</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto"
          >
            Ready to transform your data? Let's start a conversation.
          </motion.p>
        </div>
      </section>

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            {/* Form */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 className="font-heading text-lg md:text-2xl font-bold text-foreground mb-4 md:mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                  <input type="text" placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 text-xs md:text-sm"
                  />
                  <input type="email" placeholder="Your Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 text-xs md:text-sm"
                  />
                </div>
                <input type="text" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 text-xs md:text-sm"
                />
                <textarea placeholder="Your Message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 text-xs md:text-sm resize-none"
                />
                <button type="submit" disabled={sending} className="btn-gradient px-6 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm flex items-center gap-2 disabled:opacity-50">
                  {sending ? "Sending..." : "Send Message"} <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </form>
            </motion.div>

            {/* Info */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="space-y-6 md:space-y-8">
              <div>
                <h2 className="font-heading text-lg md:text-2xl font-bold text-foreground mb-4 md:mb-6">Contact Information</h2>
                <div className="space-y-3 md:space-y-4">
                  {[
                    { icon: Mail, text: config.email },
                    { icon: Phone, text: config.phone },
                    { icon: MapPin, text: config.address },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3 text-muted-foreground">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                      <span className="text-xs md:text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">Connect With Us</h3>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {socialLinks.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      className={`glass-card-strong rounded-lg md:rounded-xl p-3 md:p-4 flex flex-col items-center gap-1.5 md:gap-2 text-muted-foreground ${s.color} transition-colors`}
                    >
                      <s.icon className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-[10px] md:text-xs font-medium">{s.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
