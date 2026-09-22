export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  text: string;
  rating: number;
  avatar: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "VP of Analytics",
    company: "TechRetail Co.",
    text: "The data insights transformed our marketing strategy completely. We saw a 32% revenue increase within the first quarter. Absolutely world-class work.",
    rating: 5,
    avatar: "SC",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Operations Director",
    company: "MedCenter Group",
    text: "Their Power BI dashboards revolutionized how we manage patient flow. Wait times dropped 40% and our staff loves the new system.",
    rating: 5,
    avatar: "MJ",
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    role: "CFO",
    company: "GlobalLogistics Inc.",
    text: "The ML models they built for demand forecasting saved us over $2M annually. The ROI on this project was incredible.",
    rating: 5,
    avatar: "ER",
  },
  {
    id: "4",
    name: "David Park",
    role: "CEO",
    company: "PropInvest Group",
    text: "Their real estate prediction tool gave us a massive competitive advantage. Investment decisions backed by data have never been this accurate.",
    rating: 5,
    avatar: "DP",
  },
];
