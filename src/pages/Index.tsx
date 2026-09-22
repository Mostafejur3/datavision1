import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, PieChart, Brain, Zap, CheckCircle2, Star, ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { services as defaultServices, type Service } from "@/data/services";
import { portfolioItems } from "@/data/portfolio";
import { getSiteConfig, fetchSiteConfig } from "@/lib/siteConfig";
import { useState, useEffect } from "react";

const getServices = (): Service[] => {
  const saved = localStorage.getItem("services_list");
  if (saved) try { return JSON.parse(saved); } catch {}
  return defaultServices;
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function Index() {
  const [config, setConfig] = useState(getSiteConfig());
  useEffect(() => { fetchSiteConfig().then(setConfig); }, []);
  const services = getServices();
  const featuredServices = services.filter((s) => s.featured).slice(0, 4);

  return (
    <Layout>
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden min-h-[75vh] md:min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-40 md:w-80 h-40 md:h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-accent text-xs md:text-sm font-medium mb-4 md:mb-6">
                <Zap className="w-3.5 h-3.5" /> {config.heroBadge}
              </span>
            </motion.div>
            <motion.h1
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="font-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-4 md:mb-6"
            >
              {config.heroTitle}{" "}
              <span className="gradient-text">{config.heroHighlight}</span>
            </motion.h1>
            <motion.p
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-sm sm:text-base md:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-6 md:mb-10 px-2"
            >
              {config.heroSubtitle}
            </motion.p>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
              <Link to="/services" className="btn-gradient px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg inline-flex items-center gap-2 justify-center">
                {config.ctaButton1} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
              <Link to="/contact" className="glass-card px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-lg text-primary-foreground hover:bg-primary-foreground/10 transition-colors inline-flex items-center gap-2 justify-center">
                {config.ctaButton2} <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 md:py-16 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {config.stats.map((stat, i) => (
              <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center">
                <div className="font-heading text-2xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="text-muted-foreground text-xs md:text-sm mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 md:mb-14">
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2 md:mb-4">{config.featuredServicesTitle}</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">{config.featuredServicesSubtitle}</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {featuredServices.map((service, i) => (
              <motion.div key={service.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Link to={`/services/${service.id}`} className="block glass-card-strong rounded-xl md:rounded-2xl p-4 md:p-6 h-full hover:border-accent/30 transition-all group">
                  <div className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center mb-3 md:mb-4 group-hover:bg-accent/10 transition-colors">
                    <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-primary group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground text-sm md:text-lg mb-1 md:mb-2 line-clamp-2">{service.title}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm mb-2 md:mb-4 line-clamp-2 hidden sm:block">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-semibold text-xs md:text-base">From ${service.packages.basic.price}</span>
                    <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-6 md:mt-10">
            <Link to="/services" className="inline-flex items-center gap-2 text-accent font-medium text-sm hover:underline">
              View All Services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Portfolio Showcase */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 md:mb-14">
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2 md:mb-4">{config.portfolioTitle}</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">{config.portfolioSubtitle}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {portfolioItems.slice(0, 3).map((item, i) => (
              <motion.div key={item.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Link to="/portfolio" className="block glass-card-strong rounded-xl md:rounded-2xl overflow-hidden hover:border-accent/30 transition-all group">
                  <div className="h-32 md:h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <PieChart className="w-10 h-10 md:w-16 md:h-16 text-primary/40" />
                  </div>
                  <div className="p-4 md:p-6">
                    <h3 className="font-heading font-semibold text-foreground text-sm md:text-base mb-1 md:mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{item.result}</p>
                    <div className="flex gap-4">
                      {item.metrics.slice(0, 2).map((m) => (
                        <div key={m.label} className="text-center">
                          <div className={`font-heading font-bold text-sm md:text-lg ${m.color}`}>{m.value}</div>
                          <div className="text-muted-foreground text-[10px] md:text-xs">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 md:mb-14">
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2 md:mb-4">{config.testimonialsTitle}</h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {config.testimonials.map((t, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card-strong rounded-xl md:rounded-2xl p-3 md:p-6"
              >
                <div className="flex gap-0.5 mb-2 md:mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3 h-3 md:w-4 md:h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-muted-foreground text-[11px] md:text-sm mb-3 md:mb-4 italic line-clamp-3 md:line-clamp-none">"{t.text}"</p>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-[10px] md:text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-[11px] md:text-sm leading-tight">{t.name}</div>
                    <div className="text-muted-foreground text-[10px] md:text-xs">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Work Process */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 md:mb-14">
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-foreground mb-2 md:mb-4">{config.processTitle}</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">{config.processSubtitle}</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {config.processSteps.map((step, i) => (
              <motion.div key={step.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card-strong rounded-xl md:rounded-2xl p-4 md:p-6 text-center relative"
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl btn-gradient flex items-center justify-center mx-auto mb-3 md:mb-4 font-heading font-bold text-sm md:text-lg">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-heading font-semibold text-foreground text-xs md:text-base mb-1 md:mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-[11px] md:text-sm line-clamp-3">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="hero-gradient rounded-2xl md:rounded-3xl p-8 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-40 md:w-64 h-40 md:h-64 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-primary/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="font-heading text-2xl md:text-5xl font-bold text-primary-foreground mb-3 md:mb-4">
                {config.ctaTitle}
              </h2>
              <p className="text-primary-foreground/70 max-w-xl mx-auto mb-6 md:mb-8 text-sm md:text-lg">
                {config.ctaSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/services" className="btn-gradient px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-base inline-flex items-center gap-2 justify-center">
                  {config.ctaBtn1} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </Link>
                <Link to="/contact" className="glass-card px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-sm md:text-base text-primary-foreground hover:bg-primary-foreground/10 transition-colors inline-flex items-center gap-2 justify-center">
                  {config.ctaBtn2}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
