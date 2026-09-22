export interface PortfolioItem {
  id: string;
  title: string;
  client: string;
  category: string;
  problem: string;
  dataSource: string;
  method: string;
  result: string;
  metrics: { label: string; value: string; color: string }[];
  image: string;
  tags: string[];
  active?: boolean;
}

export const portfolioItems: PortfolioItem[] = [
  {
    id: "1",
    title: "E-Commerce Revenue Optimization",
    client: "TechRetail Co.",
    category: "Analysis",
    problem: "Declining conversion rates and unclear customer segmentation leading to inefficient marketing spend.",
    dataSource: "Shopify analytics, Google Analytics, CRM data",
    method: "RFM analysis, cohort analysis, predictive modeling with Python",
    result: "Identified 3 high-value customer segments and optimized marketing campaigns.",
    metrics: [
      { label: "Revenue Increase", value: "+32%", color: "text-emerald-400" },
      { label: "Cost Reduction", value: "-18%", color: "text-cyan-400" },
      { label: "Conversion Rate", value: "+45%", color: "text-blue-400" },
    ],
    image: "/placeholder.svg",
    tags: ["Python", "Power BI", "E-Commerce"],
  },
  {
    id: "2",
    title: "Healthcare Patient Flow Analysis",
    client: "MedCenter Group",
    category: "Dashboards",
    problem: "Long patient wait times and inefficient resource allocation across 12 departments.",
    dataSource: "EHR system data, scheduling databases, staff records",
    method: "Process mining, queueing theory, real-time dashboard development",
    result: "Reduced average wait time by 40% and optimized staff scheduling.",
    metrics: [
      { label: "Wait Time", value: "-40%", color: "text-emerald-400" },
      { label: "Patient Satisfaction", value: "+28%", color: "text-cyan-400" },
      { label: "Staff Efficiency", value: "+35%", color: "text-blue-400" },
    ],
    image: "/placeholder.svg",
    tags: ["Power BI", "SQL", "Healthcare"],
  },
  {
    id: "3",
    title: "Supply Chain Predictive Analytics",
    client: "GlobalLogistics Inc.",
    category: "AI/ML",
    problem: "Inventory stockouts and overstock costing millions annually.",
    dataSource: "SAP ERP, warehouse management system, supplier data",
    method: "Time series forecasting, LSTM neural networks, demand planning models",
    result: "Achieved 94% demand forecast accuracy, reducing waste by $2.3M annually.",
    metrics: [
      { label: "Forecast Accuracy", value: "94%", color: "text-emerald-400" },
      { label: "Waste Reduction", value: "$2.3M", color: "text-cyan-400" },
      { label: "Stockout Rate", value: "-67%", color: "text-blue-400" },
    ],
    image: "/placeholder.svg",
    tags: ["Python", "TensorFlow", "Supply Chain"],
  },
  {
    id: "4",
    title: "Financial Risk Assessment Platform",
    client: "FinanceFirst Bank",
    category: "Dashboards",
    problem: "Manual risk assessment processes causing delays and inconsistent evaluations.",
    dataSource: "Transaction data, credit bureau data, market feeds",
    method: "ML classification models, real-time scoring engine, interactive dashboards",
    result: "Automated 80% of risk assessments with higher accuracy than manual process.",
    metrics: [
      { label: "Automation Rate", value: "80%", color: "text-emerald-400" },
      { label: "Processing Time", value: "-75%", color: "text-cyan-400" },
      { label: "Accuracy", value: "+22%", color: "text-blue-400" },
    ],
    image: "/placeholder.svg",
    tags: ["Python", "React", "Finance"],
  },
  {
    id: "5",
    title: "Marketing Campaign Attribution",
    client: "BrandBoost Agency",
    category: "Analysis",
    problem: "Unable to determine which marketing channels drive actual conversions.",
    dataSource: "Google Ads, Meta Ads, CRM, website analytics",
    method: "Multi-touch attribution modeling, Markov chain analysis",
    result: "Reallocated $500K budget to high-performing channels, increasing ROI by 56%.",
    metrics: [
      { label: "ROI Increase", value: "+56%", color: "text-emerald-400" },
      { label: "Budget Saved", value: "$200K", color: "text-cyan-400" },
      { label: "Lead Quality", value: "+38%", color: "text-blue-400" },
    ],
    image: "/placeholder.svg",
    tags: ["Python", "Tableau", "Marketing"],
  },
  {
    id: "6",
    title: "Real Estate Market Predictor",
    client: "PropInvest Group",
    category: "AI/ML",
    problem: "Lack of data-driven insights for property investment decisions.",
    dataSource: "MLS listings, census data, economic indicators, satellite imagery",
    method: "Gradient boosting models, geospatial analysis, price prediction algorithms",
    result: "Built a prediction tool with 89% accuracy for property value forecasting.",
    metrics: [
      { label: "Prediction Accuracy", value: "89%", color: "text-emerald-400" },
      { label: "Investment ROI", value: "+41%", color: "text-cyan-400" },
      { label: "Analysis Speed", value: "10x", color: "text-blue-400" },
    ],
    image: "/placeholder.svg",
    tags: ["Python", "GIS", "Real Estate"],
  },
];

export const portfolioCategories = ["All", "Analysis", "Dashboards", "AI/ML", "Visualization"];
