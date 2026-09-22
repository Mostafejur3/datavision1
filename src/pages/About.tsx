import { motion } from "framer-motion";
import { Target, Eye, Users, Award, Lightbulb, Shield, BarChart3, Code2, Brain, Zap } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { getSiteConfig, fetchSiteConfig } from "@/lib/siteConfig";
import { useState, useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const iconMap: Record<string, any> = { Code2, BarChart3, Brain, Zap, Award, Shield, Lightbulb, Users };
const whyUsIcons = [Award, Shield, Lightbulb, Users];
const techIcons = [Code2, BarChart3, Brain, Zap];

export default function About() {
  const [config, setConfig] = useState(getSiteConfig());
  useEffect(() => { fetchSiteConfig().then(setConfig); }, []);

  return (
    <Layout>
      <section className="pt-8 md:pt-10 pb-4 md:pb-6">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="font-heading text-2xl md:text-5xl font-bold text-foreground mb-2 md:mb-3"
          >
            About <span className="gradient-text">{config.siteName}</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto"
          >
            {config.aboutSubtitle}
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="glass-card-strong rounded-xl md:rounded-2xl p-5 md:p-8"
            >
              <Target className="w-8 h-8 md:w-10 md:h-10 text-accent mb-3 md:mb-4" />
              <h2 className="font-heading text-lg md:text-2xl font-bold text-foreground mb-2 md:mb-3">Our Mission</h2>
              <p className="text-muted-foreground text-xs md:text-base leading-relaxed">{config.missionText}</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="glass-card-strong rounded-xl md:rounded-2xl p-5 md:p-8"
            >
              <Eye className="w-8 h-8 md:w-10 md:h-10 text-accent mb-3 md:mb-4" />
              <h2 className="font-heading text-lg md:text-2xl font-bold text-foreground mb-2 md:mb-3">Our Vision</h2>
              <p className="text-muted-foreground text-xs md:text-base leading-relaxed">{config.visionText}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-10 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="font-heading text-xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">{config.founderStoryTitle}</h2>
            <p className="text-muted-foreground text-xs md:text-base leading-relaxed mb-3 md:mb-4">{config.founderStoryP1}</p>
            <p className="text-muted-foreground text-xs md:text-base leading-relaxed">{config.founderStoryP2}</p>
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 md:mb-14">
            <h2 className="font-heading text-xl md:text-4xl font-bold text-foreground mb-2 md:mb-4">Our Team</h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">World-class experts driving data innovation.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {config.teamMembers.map((member, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card-strong rounded-xl md:rounded-2xl p-4 md:p-6 text-center"
              >
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3 md:mb-4 text-foreground font-heading font-bold text-sm md:text-xl">
                  {member.avatar}
                </div>
                <h3 className="font-heading font-semibold text-foreground text-xs md:text-base">{member.name}</h3>
                <p className="text-muted-foreground text-[10px] md:text-sm mt-0.5 md:mt-1">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-10 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 md:mb-14">
            <h2 className="font-heading text-xl md:text-4xl font-bold text-foreground mb-2 md:mb-4">Technology Stack</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-2xl mx-auto">
            {config.techStack.map((tech, i) => {
              const Icon = techIcons[i % techIcons.length];
              return (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="glass-card-strong rounded-xl md:rounded-2xl p-4 md:p-6 text-center"
                >
                  <Icon className="w-6 h-6 md:w-8 md:h-8 text-accent mx-auto mb-2 md:mb-3" />
                  <div className="font-heading font-semibold text-foreground text-xs md:text-sm">{tech.name}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-8 md:mb-14">
            <h2 className="font-heading text-xl md:text-4xl font-bold text-foreground mb-2 md:mb-4">Why Choose {config.siteName}</h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {config.whyUsItems.map((item, i) => {
              const Icon = whyUsIcons[i % whyUsIcons.length];
              return (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="glass-card-strong rounded-xl md:rounded-2xl p-4 md:p-6 text-center"
                >
                  <Icon className="w-8 h-8 md:w-10 md:h-10 text-accent mx-auto mb-2 md:mb-4" />
                  <h3 className="font-heading font-semibold text-foreground text-xs md:text-base mb-1 md:mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-[11px] md:text-sm line-clamp-3">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}
