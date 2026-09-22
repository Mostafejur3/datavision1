// Site configuration store - persisted in Supabase database

import { supabase } from "@/integrations/supabase/client";

export interface SiteConfig {
  // Branding
  siteName: string;
  siteTagline: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroBadge: string;
  ctaButton1: string;
  ctaButton2: string;

  // Stats
  stats: { value: string; label: string }[];

  // Sections
  featuredServicesTitle: string;
  featuredServicesSubtitle: string;
  portfolioTitle: string;
  portfolioSubtitle: string;
  testimonialsTitle: string;
  processTitle: string;
  processSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaBtn1: string;
  ctaBtn2: string;

  // Process steps
  processSteps: { title: string; desc: string }[];

  // Footer
  footerText: string;

  // Colors (CSS HSL values)
  primaryColor: string;
  accentColor: string;
  
  // Contact
  email: string;
  phone: string;
  address: string;
  whatsapp: string;

  // About page
  aboutTitle: string;
  aboutSubtitle: string;
  missionText: string;
  visionText: string;
  founderStoryTitle: string;
  founderStoryP1: string;
  founderStoryP2: string;
  teamMembers: { name: string; role: string; avatar: string }[];
  techStack: { name: string }[];
  whyUsItems: { title: string; desc: string }[];

  // Testimonials
  testimonials: { name: string; role: string; company: string; text: string; rating: number; avatar: string }[];

  // Maintenance
  maintenanceMode: boolean;

  // Card layout sizes (1=large, 2=medium/4-col, 3=compact)
  serviceCardSize: number;
  portfolioCardSize: number;

  // Delete button visibility per section
  deleteButtons: {
    orders: boolean;
    services: boolean;
    portfolio: boolean;
    reviews: boolean;
    payments: boolean;
    clients: boolean;
    messages: boolean;
    conversations: boolean;
  };
}

const defaultConfig: SiteConfig = {
  siteName: "DataVision",
  siteTagline: "Transform Your Data Into Strategic Insights",
  heroTitle: "Transform Your Data Into",
  heroHighlight: "Strategic Insights",
  heroSubtitle: "We turn complex data into clear, actionable strategies that drive growth, reduce costs, and give you a competitive edge.",
  heroBadge: "Data-Driven Excellence",
  ctaButton1: "View Services",
  ctaButton2: "Hire Us",

  stats: [
    { value: "150+", label: "Projects Completed" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "50+", label: "Global Clients" },
    { value: "$12M+", label: "Revenue Generated" },
  ],

  featuredServicesTitle: "Featured Services",
  featuredServicesSubtitle: "Premium data solutions tailored to accelerate your business growth.",
  portfolioTitle: "Client Results",
  portfolioSubtitle: "Real outcomes from real projects. See how data drives transformation.",
  testimonialsTitle: "What Clients Say",
  processTitle: "How We Work",
  processSubtitle: "A proven methodology that delivers consistent, high-quality results.",
  ctaTitle: "Ready to Unlock Your Data's Potential?",
  ctaSubtitle: "Let's transform your data into your greatest competitive advantage.",
  ctaBtn1: "Explore Services",
  ctaBtn2: "Contact Us",

  processSteps: [
    { title: "Discovery", desc: "We analyze your needs, data sources, and business objectives." },
    { title: "Analysis", desc: "Deep-dive into your data using advanced statistical methods." },
    { title: "Visualization", desc: "Transform insights into stunning, actionable dashboards." },
    { title: "Delivery", desc: "Present findings with strategic recommendations." },
  ],

  footerText: "© 2026 DataVision. All rights reserved.",

  primaryColor: "217 91% 40%",
  accentColor: "187 92% 50%",

  email: "hello@datavision.com",
  phone: "",
  address: "123 Data Street, Analytics City",
  whatsapp: "",

  aboutTitle: "About Us",
  aboutSubtitle: "We're a team of passionate data experts on a mission to democratize data analytics.",
  missionText: "To empower organizations with data-driven insights that fuel smarter decisions, accelerate growth, and create lasting competitive advantages.",
  visionText: "To become the world's most trusted data analytics partner, transforming complex data challenges into simple, elegant solutions.",
  founderStoryTitle: "The Story Behind DataVision",
  founderStoryP1: "DataVision was founded in 2020 by Alex Rivera, a former data scientist at Fortune 500 companies who saw a gap in the market: small and mid-size businesses were making critical decisions without proper data analysis.",
  founderStoryP2: "What started as a one-person consultancy has grown into a global agency of 15+ data professionals, serving clients across healthcare, finance, e-commerce, and logistics.",
  teamMembers: [
    { name: "Alex Rivera", role: "Founder & Lead Analyst", avatar: "AR" },
    { name: "Dr. Maya Patel", role: "Data Science Director", avatar: "MP" },
    { name: "James Wu", role: "BI Solutions Architect", avatar: "JW" },
    { name: "Sofia Martinez", role: "ML Engineer", avatar: "SM" },
  ],
  techStack: [
    { name: "Python" },
    { name: "Power BI" },
    { name: "TensorFlow" },
    { name: "Apache Spark" },
  ],
  whyUsItems: [
    { title: "Expert Team", desc: "PhD-level data scientists with 10+ years of industry experience." },
    { title: "Data Security", desc: "Enterprise-grade security with NDA protection for all projects." },
    { title: "Innovation", desc: "Cutting-edge ML and AI techniques applied to every project." },
    { title: "Dedicated Support", desc: "Personal project manager and 24/7 communication channel." },
  ],
  testimonials: [
    { name: "Sarah Chen", role: "VP of Analytics", company: "TechRetail Co.", text: "The data insights transformed our marketing strategy completely. We saw a 32% revenue increase within the first quarter.", rating: 5, avatar: "SC" },
    { name: "Marcus Johnson", role: "Operations Director", company: "MedCenter Group", text: "Their Power BI dashboards revolutionized how we manage patient flow. Wait times dropped 40%.", rating: 5, avatar: "MJ" },
    { name: "Elena Rodriguez", role: "CFO", company: "GlobalLogistics Inc.", text: "The ML models they built for demand forecasting saved us over $2M annually.", rating: 5, avatar: "ER" },
    { name: "David Park", role: "CEO", company: "PropInvest Group", text: "Their real estate prediction tool gave us a massive competitive advantage.", rating: 5, avatar: "DP" },
  ],

  maintenanceMode: false,
  serviceCardSize: 1,
  portfolioCardSize: 1,
  deleteButtons: {
    orders: true,
    services: true,
    portfolio: true,
    reviews: true,
    payments: true,
    clients: true,
    messages: true,
    conversations: true,
  },
};

// In-memory cache to avoid repeated DB calls on same page load
let cachedConfig: SiteConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds

export function getDefaultConfig(): SiteConfig {
  return { ...defaultConfig };
}

// Synchronous getter that returns cached or default (for initial render)
export function getSiteConfig(): SiteConfig {
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }
  // Also check localStorage as fallback for immediate render
  try {
    const saved = localStorage.getItem("site_config");
    if (saved) {
      return { ...defaultConfig, ...JSON.parse(saved) };
    }
  } catch {}
  return { ...defaultConfig };
}

// Async getter that fetches from DB
export async function fetchSiteConfig(): Promise<SiteConfig> {
  try {
    const { data, error } = await supabase
      .from("site_config")
      .select("config_data")
      .eq("config_key", "main")
      .maybeSingle();
    
    if (error) throw error;
    
    if (data?.config_data) {
      const config = { ...defaultConfig, ...(data.config_data as Partial<SiteConfig>) };
      cachedConfig = config;
      cacheTime = Date.now();
      // Also cache in localStorage for fast sync reads
      localStorage.setItem("site_config", JSON.stringify(config));
      return config;
    }
  } catch (e) {
    console.error("Failed to fetch site config from DB:", e);
  }
  return getSiteConfig();
}

// Save to DB (upsert)
export async function saveSiteConfig(config: Partial<SiteConfig>): Promise<SiteConfig> {
  const current = getSiteConfig();
  const updated = { ...current, ...config };
  
  // Update localStorage immediately for fast reads
  localStorage.setItem("site_config", JSON.stringify(updated));
  cachedConfig = updated;
  cacheTime = Date.now();

  // Persist to DB
  try {
    const { data: existing } = await supabase
      .from("site_config")
      .select("id")
      .eq("config_key", "main")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("site_config")
        .update({ config_data: updated as any, updated_at: new Date().toISOString() })
        .eq("config_key", "main");
    } else {
      await supabase
        .from("site_config")
        .insert({ config_key: "main", config_data: updated as any });
    }
  } catch (e) {
    console.error("Failed to save site config to DB:", e);
  }

  return updated;
}
