import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, Star, BarChart3, Zap, Shield, Users, Award, MessageCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { services as defaultServices, type Service } from "@/data/services";
import { getSiteConfig, fetchSiteConfig } from "@/lib/siteConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Load services from localStorage (admin-managed) with fallback to defaults
const getServices = (): Service[] => {
  const saved = localStorage.getItem("services_list");
  if (saved) try { return JSON.parse(saved); } catch {}
  return defaultServices;
};
import MediaGallery from "@/components/media/MediaGallery";
import { getMedia } from "@/lib/mediaStorage";
import OrderForm from "@/components/order/OrderForm";


const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function ServiceDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const services = getServices();
  const service = services.find((s) => s.id === id);
  const [selectedPkg, setSelectedPkg] = useState<"basic" | "standard" | "premium">("standard");
  const [orderOpen, setOrderOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState(getSiteConfig());
  useEffect(() => { fetchSiteConfig().then(setSiteConfig); }, []);

  useEffect(() => {
    if (searchParams.get("order") === "true") setOrderOpen(true);
  }, [searchParams]);

  if (!service) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground mb-4">Service Not Found</h1>
            <Link to="/services" className="text-accent hover:underline">← Back to Services</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const pkg = service.packages[selectedPkg];
  const relatedServices = services.filter((s) => s.category === service.category && s.id !== service.id).slice(0, 3);

  return (
    <Layout>
      {/* Header */}
      <section className="pt-6 md:pt-8 pb-4">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link to="/services" className="inline-flex items-center gap-2 text-accent text-xs md:text-sm mb-3 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> All Services
          </Link>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-[11px] md:text-xs text-accent bg-accent/10 px-2.5 py-0.5 rounded-full font-medium">{service.category}</span>
              {service.featured && (
                <span className="flex items-center gap-1 text-[11px] md:text-xs text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                  <Star className="w-3 h-3" /> Featured
                </span>
              )}
            </div>
            <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2">{service.title}</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">{service.description}</p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 md:gap-5 mt-4">
              {[
                { icon: Users, label: "50+ Clients Served" },
                { icon: Award, label: "100% Satisfaction" },
                { icon: Clock, label: `${service.packages.basic.deliveryDays}-${service.packages.premium.deliveryDays} Day Delivery` },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
                  <stat.icon className="w-3.5 h-3.5 text-accent" />
                  {stat.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Media gallery */}
              {(() => {
                const media = getMedia("service", service.id);
                return media.length > 0 ? (
                  <MediaGallery items={media} />
                ) : (
                  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
                    className="glass-card-strong rounded-2xl overflow-hidden"
                  >
                    <div className="h-64 md:h-80 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-20 h-20 text-primary/40 mx-auto mb-4" />
                        <p className="text-muted-foreground text-sm">Service preview & sample deliverables</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* About this service */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0.5}
                className="glass-card-strong rounded-2xl p-8"
              >
                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">About This Service</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-4">{service.description}</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Whether you're a startup needing quick insights or an enterprise requiring comprehensive analysis, 
                    our flexible packages are designed to match your exact needs. Every deliverable is crafted with 
                    precision and attention to detail, ensuring you receive maximum value from your data.
                  </p>
                </div>
              </motion.div>

              {/* What's included */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
                className="glass-card-strong rounded-2xl p-8"
              >
                <h2 className="font-heading text-2xl font-bold text-foreground mb-6">What You'll Get</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: BarChart3, title: "Professional Analysis", desc: "Expert-level analysis using industry-standard tools and methods." },
                    { icon: Zap, title: "Fast Turnaround", desc: `Delivery in as few as ${service.packages.basic.deliveryDays} days depending on package.` },
                    { icon: Shield, title: "Quality Guarantee", desc: "Revisions included to ensure you're completely satisfied." },
                    { icon: Star, title: "Actionable Insights", desc: "Clear recommendations you can implement immediately." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                        <p className="text-muted-foreground text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* How it works */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
                className="glass-card-strong rounded-2xl p-8"
              >
                <h2 className="font-heading text-2xl font-bold text-foreground mb-6">How It Works</h2>
                <div className="space-y-4">
                  {[
                    { title: "Share Your Data", desc: "Upload your data and describe your requirements through our secure order form." },
                    { title: "We Analyze", desc: "Our experts process and analyze your data using advanced techniques and tools." },
                    { title: "Review & Refine", desc: "Review the deliverables and request any adjustments until you're satisfied." },
                    { title: "Get Results", desc: "Receive your final report with actionable insights and recommendations." },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center shrink-0 text-sm font-bold group-hover:scale-110 transition-transform">{i + 1}</div>
                      <div className="pt-1">
                        <h4 className="font-semibold text-foreground text-sm mb-1">{step.title}</h4>
                        <p className="text-muted-foreground text-sm">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Why choose us */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
                className="glass-card-strong rounded-2xl p-8"
              >
                <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Why Choose Us</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  {[
                    { value: "500+", label: "Projects Delivered" },
                    { value: "98%", label: "Client Satisfaction" },
                    { value: "24h", label: "Avg Response Time" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-4 rounded-xl bg-muted/50">
                      <div className="font-heading text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Pricing sidebar */}
            <div>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="glass-card-strong rounded-2xl p-6 sticky top-24"
              >
                <div className="flex rounded-lg bg-muted p-1 mb-6">
                  {(["basic", "standard", "premium"] as const).map((p) => (
                    <button key={p} onClick={() => setSelectedPkg(p)}
                      className={`flex-1 py-2.5 text-xs font-medium rounded-md transition-all capitalize ${
                        selectedPkg === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <span className="font-heading text-4xl font-bold text-foreground">${pkg.price}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6">
                  <Clock className="w-4 h-4" />
                  {pkg.deliveryDays} day{pkg.deliveryDays > 1 ? "s" : ""} delivery
                </div>

                <ul className="space-y-3 mb-6">
                  {pkg.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      {d}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setOrderOpen(true)}
                  className="w-full btn-gradient py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                >
                  Order Now <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Have questions? <button onClick={async () => { const { data: { session } } = await supabase.auth.getSession(); window.scrollTo(0, 0); if (session) { navigate("/dashboard?tab=inbox"); } else { toast({ title: "Login required", description: "Please log in to access the inbox." }); navigate("/auth"); } }} className="text-accent hover:underline">Contact us</button>
                </p>

                {/* Quick contact */}
                {siteConfig.whatsapp && (
                <div className="mt-6 pt-6 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-3 text-center">Need urgent help?</p>
                  <a href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}?text=Hello`} target="_blank" rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl text-sm font-medium border border-accent/30 text-accent hover:bg-accent/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp Us
                  </a>
                </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Services */}
      {relatedServices.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-8">Similar Services</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedServices.map((s) => (
                <Link key={s.id} to={`/services/${s.id}`} className="glass-card-strong rounded-2xl p-6 hover:border-accent/30 transition-all group">
                  <h3 className="font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">{s.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{s.description}</p>
                  <span className="text-accent font-semibold text-sm">From ${s.packages.basic.price}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Order Form Modal */}
      <OrderForm
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        serviceTitle={service.title}
        serviceId={service.id}
        packageName={selectedPkg}
        price={pkg.price}
        orderInstructions={service.orderInstructions}
      />

    </Layout>
  );
}
