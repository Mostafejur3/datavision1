import { Link } from "react-router-dom";
import { BarChart3, Linkedin, Instagram, Facebook, Youtube, ExternalLink } from "lucide-react";
import { getSiteConfig, fetchSiteConfig } from "@/lib/siteConfig";
import { useState, useEffect } from "react";

const socialLinks = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: ExternalLink, href: "#", label: "Fiverr" },
];

export default function Footer() {
  const [config, setConfig] = useState(getSiteConfig());
  useEffect(() => { fetchSiteConfig().then(setConfig); }, []);

  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg btn-gradient flex items-center justify-center">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg md:text-xl text-foreground">{config.siteName}</span>
            </Link>
            <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
              {config.siteTagline}
            </p>
            <div className="flex gap-2 mt-4 md:mt-5">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors" aria-label={s.label}>
                  <s.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground text-xs md:text-base mb-3 md:mb-4">Services</h4>
            <ul className="space-y-1.5 md:space-y-2 text-[11px] md:text-sm text-muted-foreground">
              {["Data Analysis", "Power BI", "Python Analytics", "Machine Learning", "Visualization"].map((s) => (
                <li key={s}><Link to="/services" className="hover:text-accent transition-colors">{s}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-foreground text-xs md:text-base mb-3 md:mb-4">Company</h4>
            <ul className="space-y-1.5 md:space-y-2 text-[11px] md:text-sm text-muted-foreground">
              {[
                { label: "About", to: "/about" },
                { label: "Portfolio", to: "/portfolio" },
                { label: "Blog", to: "/blog" },
                { label: "Contact", to: "/contact" },
              ].map((l) => (
                <li key={l.label}><Link to={l.to} className="hover:text-accent transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="font-heading font-semibold text-foreground text-xs md:text-base mb-3 md:mb-4">Contact</h4>
            <ul className="space-y-1.5 md:space-y-2 text-[11px] md:text-sm text-muted-foreground">
              <li>{config.email}</li>
              <li>WhatsApp: {config.phone}</li>
              <li>Mon-Fri 9AM - 6PM EST</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 md:mt-12 pt-6 md:pt-8 text-center text-[11px] md:text-sm text-muted-foreground">
          {config.footerText}
        </div>
      </div>
    </footer>
  );
}
