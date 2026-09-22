import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, CheckCircle2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { services as defaultServices, serviceCategories as defaultCategories, type Service } from "@/data/services";
import { getSiteConfig, fetchSiteConfig } from "@/lib/siteConfig";

const getCategories = (): string[] => {
  const saved = localStorage.getItem("service_categories_list");
  if (saved) try { return JSON.parse(saved); } catch {}
  return defaultCategories;
};
import { getMedia } from "@/lib/mediaStorage";

const getServices = (): Service[] => {
  const saved = localStorage.getItem("services_list");
  if (saved) try { return (JSON.parse(saved) as Service[]).filter(s => s.active !== false); } catch {}
  return defaultServices.filter(s => s.active !== false);
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const [selectedPkg, setSelectedPkg] = useState<"basic" | "standard" | "premium">("standard");
  const pkg = service.packages[selectedPkg];
  const media = getMedia("service", service.id);
  const coverImage = media.length > 0 && media[0].type === "image" ? media[0].url : null;

  return (
    <Link to={`/services/${service.id}`} className="block">
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={index}
      className="glass-card-strong rounded-xl md:rounded-2xl overflow-hidden flex flex-col hover:border-accent/30 hover:shadow-lg transition-all cursor-pointer"
    >
      <div className="aspect-[4/3] md:h-40 overflow-hidden bg-muted/30">
        {coverImage ? (
          <img src={coverImage} alt={service.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/5">
            <span className="text-3xl md:text-3xl font-heading font-bold text-primary/20">{service.title.charAt(0)}</span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 md:p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-1.5 mb-1.5 md:mb-3">
          <h3 className="font-heading font-semibold text-foreground text-[13px] sm:text-sm md:text-lg leading-snug">{service.title}</h3>
          {service.featured && (
            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] md:text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              <Star className="w-2.5 h-2.5 md:w-3 md:h-3" /> Featured
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-[11px] sm:text-xs md:text-sm mb-2.5 md:mb-4 line-clamp-2 leading-relaxed">{service.description}</p>

        {/* Package selector */}
        <div className="flex rounded-lg bg-muted p-0.5 mb-2.5 md:mb-4">
          {(["basic", "standard", "premium"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPkg(p)}
              className={`flex-1 py-1 sm:py-1.5 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-medium rounded-md transition-all capitalize ${
                selectedPkg === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-col flex-1">
          <div className="mb-1.5 md:mb-3">
            <span className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-foreground">${pkg.price}</span>
          </div>

          <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] sm:text-[11px] md:text-sm mb-2 md:mb-3">
            <Clock className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
            <span>{pkg.deliveryDays} day{pkg.deliveryDays > 1 ? "s" : ""} delivery</span>
          </div>

          <ul className="space-y-1 md:space-y-2 flex-1">
            {pkg.deliverables.slice(0, 3).map((d) => (
              <li key={d} className="flex items-start gap-1 md:gap-2 text-[10px] sm:text-[11px] md:text-sm text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-accent shrink-0 mt-px" />
                <span className="line-clamp-1">{d}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-1.5 sm:gap-2 mt-2.5 md:mt-4 pt-2.5 md:pt-4 border-t border-border/30">
          <span className="flex-1 btn-gradient py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-[11px] sm:text-xs md:text-sm flex items-center justify-center gap-1">
            View Details <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </span>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}

export default function Services() {
  const [activeCategory, setActiveCategory] = useState("All");
  const services = getServices();
  const serviceCategories = getCategories();
  const [cardSize, setCardSize] = useState(getSiteConfig().serviceCardSize || 1);
  useEffect(() => { fetchSiteConfig().then(c => setCardSize(c.serviceCardSize || 1)); }, []);

  const filtered = activeCategory === "All" ? services : services.filter((s) => s.category === activeCategory);
  const gridCls = cardSize === 1 ? "grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-6" : cardSize === 2 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-4" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 md:gap-3";

  return (
    <Layout>
      <section className="pt-8 md:pt-10 pb-4 md:pb-6">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="font-heading text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-3"
          >
            Our <span className="gradient-text">Services</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto"
          >
            Premium data solutions with transparent pricing.
          </motion.p>
        </div>
      </section>

      <section className="py-6 md:py-20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 mb-6 md:mb-12">
            {serviceCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "btn-gradient"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={`grid ${gridCls}`}
            >
              {filtered.map((service, i) => (
                <ServiceCard key={service.id} service={service} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
}
