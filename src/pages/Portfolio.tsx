import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { portfolioItems as defaultItems, portfolioCategories } from "@/data/portfolio";
import MediaGallery from "@/components/media/MediaGallery";
import { getMedia } from "@/lib/mediaStorage";
import { getSiteConfig, fetchSiteConfig } from "@/lib/siteConfig";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [cardSize, setCardSize] = useState(getSiteConfig().portfolioCardSize || 1);
  useEffect(() => { fetchSiteConfig().then(c => setCardSize(c.portfolioCardSize || 1)); }, []);

  const portfolioItems = (() => {
    try {
      const saved = localStorage.getItem("portfolio_items");
      const items = saved ? JSON.parse(saved) : defaultItems;
      return items.filter((p: any) => p.active !== false);
    } catch { return defaultItems; }
  })();

  const filtered = activeCategory === "All" ? portfolioItems : portfolioItems.filter((p: any) => p.category === activeCategory);
  const selectedItem = portfolioItems.find((p: any) => p.id === selected);

  return (
    <Layout>
      <section className="pt-8 md:pt-10 pb-4 md:pb-6">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="font-heading text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-3"
          >
            Our <span className="gradient-text">Portfolio</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto"
          >
            Case studies showcasing real results and measurable impact.
          </motion.p>
        </div>
      </section>

      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 mb-8 md:mb-12">
            {portfolioCategories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  activeCategory === cat ? "btn-gradient" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className={`grid ${cardSize === 1 ? "grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6" : cardSize === 2 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 md:gap-3"}`}
            >
              {filtered.map((item, i) => (
                <motion.div key={item.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="glass-card-strong rounded-xl md:rounded-2xl overflow-hidden cursor-pointer hover:border-accent/30 transition-all group"
                  onClick={() => setSelected(item.id)}
                >
                  <div className="h-28 md:h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                    {(() => {
                      const media = getMedia("portfolio", item.id);
                      return media.length > 0 && media[0].type === "image" ? (
                        <img src={media[0].url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <PieChart className="w-10 h-10 md:w-16 md:h-16 text-primary/40 group-hover:text-accent/60 transition-colors" />
                      );
                    })()}
                  </div>
                  <div className="p-3 md:p-6">
                    <div className="text-[10px] md:text-xs text-accent font-medium mb-1 md:mb-2">{item.category}</div>
                    <h3 className="font-heading font-semibold text-foreground text-xs md:text-base mb-1 md:mb-2 line-clamp-1">{item.title}</h3>
                    <p className="text-muted-foreground text-[11px] md:text-sm mb-2 md:mb-4 hidden sm:block">{item.client}</p>
                    <div className="flex gap-3 md:gap-4">
                      {item.metrics.slice(0, 2).map((m) => (
                        <div key={m.label} className="text-center">
                          <div className={`font-heading font-bold text-xs md:text-base ${m.color}`}>{m.value}</div>
                          <div className="text-muted-foreground text-[9px] md:text-xs">{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex-wrap gap-1 mt-2 md:mt-4 hidden md:flex">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm p-0 md:p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-card-strong rounded-t-2xl md:rounded-2xl p-5 md:p-8 w-full md:max-w-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-xs text-accent font-medium mb-1 md:mb-2">{selectedItem.category}</div>
              <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-1">{selectedItem.title}</h2>
              <p className="text-muted-foreground text-xs md:text-sm mb-4 md:mb-6">{selectedItem.client}</p>

              {(() => {
                const media = getMedia("portfolio", selectedItem.id);
                return media.length > 0 ? <div className="mb-4 md:mb-6"><MediaGallery items={media} /></div> : null;
              })()}

              <div className="space-y-3 md:space-y-4">
                {[
                  { label: "Problem", text: selectedItem.problem },
                  { label: "Data Source", text: selectedItem.dataSource },
                  { label: "Analysis Method", text: selectedItem.method },
                  { label: "Results", text: selectedItem.result },
                ].map((s) => (
                  <div key={s.label}>
                    <h4 className="font-heading font-semibold text-foreground text-sm mb-0.5">{s.label}</h4>
                    <p className="text-muted-foreground text-xs md:text-sm">{s.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 md:gap-6 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
                {selectedItem.metrics.map((m) => (
                  <div key={m.label} className="text-center">
                    <div className={`font-heading text-lg md:text-2xl font-bold ${m.color}`}>{m.value}</div>
                    <div className="text-muted-foreground text-[10px] md:text-xs">{m.label}</div>
                  </div>
                ))}
              </div>

              <button onClick={() => setSelected(null)} className="mt-4 md:mt-6 w-full py-2.5 md:py-3 bg-muted text-foreground rounded-xl font-medium text-sm hover:bg-muted/80 transition-colors">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
