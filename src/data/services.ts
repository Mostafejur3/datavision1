export interface ServicePackage {
  name: string;
  price: number;
  deliverables: string[];
  deliveryDays: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  featured: boolean;
  active?: boolean;
  orderInstructions?: string;
  packages: {
    basic: ServicePackage;
    standard: ServicePackage;
    premium: ServicePackage;
  };
}

export const services: Service[] = [
  {
    id: "data-analysis",
    title: "Data Analysis",
    description: "Comprehensive data analysis to uncover patterns, trends, and actionable insights from your datasets.",
    icon: "BarChart3",
    category: "Analysis",
    featured: true,
    packages: {
      basic: { name: "Basic", price: 299, deliverables: ["Data cleaning", "Basic analysis", "Summary report"], deliveryDays: 3 },
      standard: { name: "Standard", price: 599, deliverables: ["Data cleaning", "Advanced analysis", "Detailed report", "Visualizations"], deliveryDays: 5 },
      premium: { name: "Premium", price: 999, deliverables: ["Full analysis suite", "Interactive dashboard", "Strategy recommendations", "30-day support"], deliveryDays: 7 },
    },
  },
  {
    id: "data-visualization",
    title: "Data Visualization",
    description: "Transform complex data into stunning, intuitive visual stories that drive decision-making.",
    icon: "PieChart",
    category: "Visualization",
    featured: true,
    packages: {
      basic: { name: "Basic", price: 199, deliverables: ["5 charts", "Static report"], deliveryDays: 2 },
      standard: { name: "Standard", price: 449, deliverables: ["10 charts", "Interactive visuals", "Presentation deck"], deliveryDays: 4 },
      premium: { name: "Premium", price: 799, deliverables: ["Unlimited charts", "Interactive dashboard", "Custom branding", "Revisions"], deliveryDays: 6 },
    },
  },
  {
    id: "power-bi-dashboard",
    title: "Power BI Dashboard",
    description: "Custom Power BI dashboards with real-time data connections and interactive filtering.",
    icon: "LayoutDashboard",
    category: "Dashboards",
    featured: true,
    packages: {
      basic: { name: "Basic", price: 499, deliverables: ["1 dashboard page", "5 visuals", "Data connection"], deliveryDays: 4 },
      standard: { name: "Standard", price: 899, deliverables: ["3 dashboard pages", "12 visuals", "DAX measures", "Filters"], deliveryDays: 7 },
      premium: { name: "Premium", price: 1499, deliverables: ["Unlimited pages", "Custom theme", "Row-level security", "Training session"], deliveryDays: 10 },
    },
  },
  {
    id: "excel-automation",
    title: "Excel Automation",
    description: "Automate repetitive Excel tasks with VBA macros, Power Query, and advanced formulas.",
    icon: "FileSpreadsheet",
    category: "Automation",
    featured: false,
    packages: {
      basic: { name: "Basic", price: 149, deliverables: ["Basic formulas", "Data formatting", "1 macro"], deliveryDays: 2 },
      standard: { name: "Standard", price: 349, deliverables: ["Advanced formulas", "Power Query", "3 macros", "Documentation"], deliveryDays: 4 },
      premium: { name: "Premium", price: 649, deliverables: ["Full automation suite", "VBA dashboard", "User guide", "Support"], deliveryDays: 6 },
    },
  },
  {
    id: "python-analysis",
    title: "Python Data Analysis",
    description: "Advanced statistical analysis and data processing using Python, Pandas, and NumPy.",
    icon: "Code2",
    category: "Analysis",
    featured: true,
    packages: {
      basic: { name: "Basic", price: 399, deliverables: ["Data processing", "Basic statistics", "Jupyter notebook"], deliveryDays: 3 },
      standard: { name: "Standard", price: 699, deliverables: ["Advanced statistics", "Predictive models", "Visualizations", "Clean code"], deliveryDays: 5 },
      premium: { name: "Premium", price: 1199, deliverables: ["Full pipeline", "ML models", "API integration", "Documentation"], deliveryDays: 8 },
    },
  },
  {
    id: "machine-learning",
    title: "Machine Learning Models",
    description: "Build and deploy custom ML models for prediction, classification, and recommendation systems.",
    icon: "Brain",
    category: "AI/ML",
    featured: true,
    packages: {
      basic: { name: "Basic", price: 799, deliverables: ["Data prep", "1 model", "Performance report"], deliveryDays: 7 },
      standard: { name: "Standard", price: 1499, deliverables: ["Multiple models", "Hyperparameter tuning", "Deployment guide"], deliveryDays: 12 },
      premium: { name: "Premium", price: 2499, deliverables: ["End-to-end pipeline", "API deployment", "Monitoring", "3-month support"], deliveryDays: 18 },
    },
  },
  {
    id: "data-cleaning",
    title: "Data Cleaning",
    description: "Professional data cleaning, deduplication, and standardization for reliable analysis.",
    icon: "Sparkles",
    category: "Data Prep",
    featured: false,
    packages: {
      basic: { name: "Basic", price: 99, deliverables: ["Remove duplicates", "Fix formatting", "Basic validation"], deliveryDays: 1 },
      standard: { name: "Standard", price: 249, deliverables: ["Advanced cleaning", "Standardization", "Quality report"], deliveryDays: 3 },
      premium: { name: "Premium", price: 449, deliverables: ["Full ETL pipeline", "Automated cleaning", "Documentation"], deliveryDays: 5 },
    },
  },
  {
    id: "business-intelligence",
    title: "Business Intelligence",
    description: "End-to-end BI solutions that transform raw data into strategic business insights.",
    icon: "TrendingUp",
    category: "Strategy",
    featured: false,
    packages: {
      basic: { name: "Basic", price: 599, deliverables: ["KPI dashboard", "Data audit", "Insights report"], deliveryDays: 5 },
      standard: { name: "Standard", price: 1099, deliverables: ["Full BI solution", "Multiple dashboards", "Strategy deck"], deliveryDays: 8 },
      premium: { name: "Premium", price: 1899, deliverables: ["Enterprise BI", "Data warehouse design", "Training", "Quarterly reviews"], deliveryDays: 14 },
    },
  },
  {
    id: "market-research",
    title: "Market Research Analysis",
    description: "Data-driven market research with competitor analysis and trend forecasting.",
    icon: "Search",
    category: "Strategy",
    featured: false,
    packages: {
      basic: { name: "Basic", price: 349, deliverables: ["Market overview", "Competitor list", "Summary report"], deliveryDays: 4 },
      standard: { name: "Standard", price: 699, deliverables: ["Deep analysis", "SWOT analysis", "Trend report", "Recommendations"], deliveryDays: 7 },
      premium: { name: "Premium", price: 1299, deliverables: ["Full research", "Forecasting models", "Strategy plan", "Presentation"], deliveryDays: 12 },
    },
  },
  {
    id: "dashboard-development",
    title: "Dashboard Development",
    description: "Custom web-based dashboards with real-time data visualization and interactive features.",
    icon: "Monitor",
    category: "Dashboards",
    featured: false,
    packages: {
      basic: { name: "Basic", price: 699, deliverables: ["Single page dashboard", "5 widgets", "Responsive design"], deliveryDays: 5 },
      standard: { name: "Standard", price: 1299, deliverables: ["Multi-page dashboard", "Filters", "Export feature", "Mobile-ready"], deliveryDays: 10 },
      premium: { name: "Premium", price: 2199, deliverables: ["Full platform", "Real-time data", "User auth", "Custom API"], deliveryDays: 18 },
    },
  },
];

export const serviceCategories = ["All", "Analysis", "Visualization", "Dashboards", "Automation", "AI/ML", "Data Prep", "Strategy"];
