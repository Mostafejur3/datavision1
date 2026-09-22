import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Server, Shield, CreditCard, MessageSquare, Users, Settings, BarChart3, Image, Star, Globe, Database, Rocket, FileText, ChevronRight, ArrowLeft, Package, Palette, Link2, Terminal } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    id: "overview",
    icon: BookOpen,
    title: "Platform Overview",
    content: `
**DataVision** is a full-stack data analytics and consulting platform built with modern web technologies. It provides a complete business management solution including:

- **Public Website** — Professional landing page, services catalog, portfolio showcase, blog, and contact form
- **Client Dashboard** — Order tracking, messaging, invoice management, and review submission
- **Admin Dashboard** — Full business management with orders, services, payments, clients, messages, reviews, site settings, and more
- **Authentication** — Secure email-based signup/login with role-based access control (Admin, Moderator, User)
- **Real-time Updates** — Live notifications for new orders, messages, and invoice changes

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| State | React Query, localStorage caching |
| Charts | Recharts |
    `
  },
  {
    id: "getting-started",
    icon: Rocket,
    title: "Deployment & Setup Guide",
    content: `
### Option A: Publish on Lovable (Quick)
1. Click **Publish** (top-right of editor) → get a \`.lovable.app\` subdomain
2. For custom domains: **Project Settings → Domains** → add DNS records

---

### Option B: Deploy to cPanel (Self-Hosted) — Step by Step

#### 1. Prerequisites
- cPanel hosting with **Node.js** support or a static-file-capable plan
- A **MySQL** or **PostgreSQL** database created via cPanel → MySQL/PostgreSQL Databases
- **phpMyAdmin** (MySQL) or **pgAdmin** (PostgreSQL) access
- **Git** and **Node.js 18+** installed locally

#### 2. Clone & Build Locally
\`\`\`bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
\`\`\`

Before building, update the environment to point to your own backend:
- Create a \`.env.production\` file:
\`\`\`
VITE_SUPABASE_URL=https://your-api-endpoint.com
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
\`\`\`
> If you're replacing the backend entirely with your own REST API, you'll need to adapt \`src/integrations/supabase/client.ts\` to point to your server.

Then build:
\`\`\`bash
npm run build
\`\`\`
This creates a \`dist/\` folder with all static files.

#### 3. Upload to cPanel
1. Open **cPanel → File Manager**
2. Navigate to \`public_html\` (or your subdomain folder)
3. Upload everything inside \`dist/\` to that folder
4. Make sure \`index.html\` is at the root of \`public_html\`

#### 4. Configure .htaccess for SPA Routing
Create \`.htaccess\` in \`public_html\`:
\`\`\`apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
\`\`\`

#### 5. Set Up the Database
1. In cPanel → **MySQL Databases** → Create a new database and user
2. Grant **ALL PRIVILEGES** to that user on the database
3. Open **phpMyAdmin** → Select your database
4. Go to Admin Dashboard → **Site Settings → DB Export** → Download **Schema SQL**
5. In phpMyAdmin → **Import** tab → Upload the schema SQL file → Click **Go**
6. If migrating existing data, also download & import the **Data Backup** file

#### 6. Create Your Admin Account
After importing the schema:
1. Register a new account on your deployed site (\`/auth\`)
2. In phpMyAdmin, find the \`profiles\` table → copy your user \`id\`
3. In the \`user_roles\` table, insert a row:
   - \`id\`: any UUID (e.g., generate at uuidgenerator.net)
   - \`user_id\`: your profile ID from step 2
   - \`role\`: \`admin\`
4. Now login at \`/adminboard\`

#### 7. Backend API Setup
The current app uses Supabase Edge Functions for:
- **Authentication** (signup, login, sessions)
- **Database queries** (all CRUD operations)
- **File uploads** (message attachments)
- **Manager creation** (server-side account creation)

To fully self-host, you'll need to replace these with your own REST API. Options:
- **PHP API** on cPanel (most common)
- **Node.js API** via cPanel Node.js selector
- **External API** hosted elsewhere (e.g., Railway, Render)

Your API must handle:
| Endpoint | Purpose |
|----------|---------|
| \`POST /auth/signup\` | User registration |
| \`POST /auth/login\` | Authentication |
| \`GET/POST /orders\` | Order CRUD |
| \`GET/POST /messages\` | Messaging |
| \`GET/POST /invoices\` | Invoice management |
| \`GET/POST /reviews\` | Review management |
| \`GET/POST /profiles\` | User profiles |
| \`GET/PUT /site_config\` | Site settings |
| \`GET/POST /managers\` | Manager recruitment |
| \`POST /contact\` | Guest contact form |

#### 8. SSL Certificate
1. cPanel → **SSL/TLS** → Install a free **Let's Encrypt** certificate
2. Or use **Cloudflare** for free SSL + CDN

#### 9. Final Checklist
- [ ] All \`dist/\` files uploaded to \`public_html\`
- [ ] \`.htaccess\` configured for SPA routing
- [ ] Database created and schema imported
- [ ] Admin role assigned in \`user_roles\` table
- [ ] SSL certificate active
- [ ] Environment variables pointing to your API
- [ ] Test: Homepage loads, auth works, admin dashboard accessible
    `
  },
  {
    id: "public-pages",
    icon: Globe,
    title: "Public Website Features",
    content: `
### Homepage (\`/\`)
- **Hero Section** — Animated headline with badge, stats counter, and dual CTA buttons
- **Featured Services** — Top 3 services with clickable cards linking to detail pages
- **Portfolio Showcase** — Client results with project cards
- **Testimonials** — Approved client reviews carousel
- **Process Steps** — 4-step methodology with icons
- **CTA Section** — Final conversion section with action buttons

### Services Page (\`/services\`)
- Category-based filtering (categories managed from admin)
- Service cards with pricing tiers (Basic, Standard, Premium)
- Click to view full service detail page

### Service Detail (\`/services/:id\`)
- Full service description with media gallery
- Package comparison table with deliverables
- Order button (redirects to auth if not logged in)

### Portfolio (\`/portfolio\`)
- Grid layout of completed projects
- Managed entirely from admin dashboard

### Contact (\`/contact\`)
- Contact form (name, email, subject, message)
- Works for both logged-in users and guests
- Guest messages are processed via Edge Function and appear in admin messages

### Blog (\`/blog\`)
- Blog post listing with featured images
- Individual blog post pages (\`/blog/:id\`)

### About (\`/about\`)
- Company information page
- Customizable title and subtitle from site settings
    `
  },
  {
    id: "auth",
    icon: Shield,
    title: "Authentication System",
    content: `
### User Registration (\`/auth\`)
- Email + password signup with full name
- Email verification required before login (unless auto-confirm enabled)
- Automatic profile creation via database trigger

### Login
- Email + password authentication
- Session-based with JWT tokens
- Persistent sessions across browser tabs

### Role-Based Access
| Role | Access |
|------|--------|
| **User** | Client dashboard, own orders/messages/invoices |
| **Moderator** | Extended permissions (customizable) |
| **Admin** | Full admin dashboard, all data management |

### Admin Login (\`/adminboard\`)
- Same credentials as regular auth
- Automatically checks for admin role
- Redirects non-admin users

### Security Features
- Row-Level Security (RLS) on all database tables
- Server-side role verification via \`has_role()\` function
- SECURITY DEFINER functions prevent recursive RLS checks
- No sensitive data exposed to client
    `
  },
  {
    id: "client-dashboard",
    icon: Users,
    title: "Client Dashboard",
    content: `
### Overview Tab
- Quick stats: total orders, pending, completed, total spent
- Recent orders list with status indicators

### Orders Tab
- Full order history with status tracking
- Status flow: Pending → In Progress → Completed → Delivered
- Requirements submission during order placement
- Real-time status updates

### Messages Tab
- Chat-style messaging with admin
- File attachment support (uploaded to secure storage)
- Invoice viewing and payment within chat
- Service link messages from admin
- Real-time message delivery

### Invoices Tab
- View all invoices sent by admin
- Invoice details: service, package, amount, payment method, due date
- Payment link integration
- Status tracking: Pending → In Review → Paid

### Reviews Tab
- Submit reviews for completed orders
- Star rating (1-5) with text review
- Reviews require admin approval before public display
    `
  },
  {
    id: "admin-overview",
    icon: BarChart3,
    title: "Admin Dashboard — Overview",
    content: `
### Analytics Dashboard
- **Time Range Filters** — 7D, 30D, 90D, 1Y, All
- **Key Metrics** — Revenue, orders, clients, avg order value, messages, reviews, services, portfolio, invoices
- **Revenue Chart** — Area chart showing revenue over time
- **Order Distribution** — Pie chart by status
- **Client Growth** — Line chart with cumulative + new clients
- **Revenue by Package** — Bar chart comparing Basic/Standard/Premium
- **Rating Distribution** — Bar chart of review ratings
- **Message Activity** — Sent vs received over time
- **Revenue by Service** — Horizontal bar chart
- **Top Clients** — Ranked by total revenue
- **Recent Orders** — Latest 10 orders with status
    `
  },
  {
    id: "admin-orders",
    icon: Package,
    title: "Admin — Order Management",
    content: `
### Features
- **Search & Filter** — By order number, client name, service title, status
- **Order Cards** — Expandable with full details
- **Status Management** — Via 3-dot menu:
  - Mark Pending / Start Progress / Complete / Deliver / Reject
- **Admin Notes** — Internal notes per order (not visible to clients)
- **Message Client** — Quick link to message the order's client
- **Delete Orders** — With confirmation dialog
- **Real-time Updates** — New orders appear instantly with notification badge
- **New Order Indicator** — Amber pulse dot for pending orders
    `
  },
  {
    id: "admin-services",
    icon: Settings,
    title: "Admin — Service Management",
    content: `
### Service CRUD
- **Add/Edit Services** — Title, description, category, order instructions
- **Package Pricing** — Basic, Standard, Premium with individual prices, delivery days, deliverables
- **Media Upload** — Multiple images per service (up to 10)
- **Featured Toggle** — Mark services as featured for homepage
- **Active/Inactive** — Toggle service visibility

### Category Management
- Add custom categories
- Delete unused categories (prevents deletion if services assigned)
- Categories sync to public Services page filter
    `
  },
  {
    id: "admin-payments",
    icon: CreditCard,
    title: "Admin — Payment Management",
    content: `
### All Invoices Tab
- **Summary Cards** — Total invoices, paid amount, pending amount, overdue amount
- **Search & Filter** — By invoice number, client, service, status
- **Full Table** — Invoice #, client info, service, package, amount, method, status, dates
- **Status Actions** — Mark Paid, Mark Overdue, Cancel
- **Payment Link** — Direct link to external payment page
- **Running Total** — Sum of filtered invoices

### Payment Methods Tab
Configure multiple payment methods:
| Method | Fields |
|--------|--------|
| **Stripe** | Publishable Key, Secret Key |
| **PayPal** | Client ID |
| **Bank Transfer** | Bank Name, Account Holder, Account Number |
| **Mobile Banking** | bKash Number, Nagad Number |
| **Cryptocurrency** | BTC Wallet, ETH Wallet, USDT TRC-20, USDT ERC-20, Network, Instructions |
| **Manual** | Custom payment instructions |

### Invoice Creation (via Messages)
- Select service and package (auto-fills price)
- Custom service name option
- Description, amount, payment method, due date, payment link, internal notes
- Live invoice preview before sending
- Sent as a rich message card in chat
    `
  },
  {
    id: "admin-messages",
    icon: MessageSquare,
    title: "Admin — Messaging System",
    content: `
### Chat Interface
- **Conversation List** — All client threads with unread badges
- **Search Chats** — Filter by client name or ID
- **Real-time Messages** — Instant delivery with optimistic UI
- **Rich Message Types**:
  - Text messages
  - File attachments (auto-uploaded to secure storage)
  - Invoice cards (with status controls)
  - Service link cards

### Compose
- New chat with any registered client
- Client search by name, email, or ID

### Admin Actions in Chat
- 📎 Attach files
- 💳 Create & send invoices
- 🔗 Send service recommendation links

### Contact Form Integration
- Guest messages from /contact page appear in admin messages
- Guest profiles auto-created via Edge Function
    `
  },
  {
    id: "admin-clients",
    icon: Users,
    title: "Admin — Client Management",
    content: `
### Client Table
- **Search** — By name, email, company, or client ID
- **Client Details** — ID, name, email, phone, company
- **Order Stats** — Total orders, total spent per client
- **Quick Actions** — Message client directly

### Client IDs
- Auto-generated UUID, displayed as short 8-char code
- Used for internal reference and search
    `
  },
  {
    id: "admin-reviews",
    icon: Star,
    title: "Admin — Review Management",
    content: `
### Review Moderation
- **Approve/Reject** — Toggle review visibility on public site
- **Status Indicators** — Approved (green), Pending (amber), Rejected (red)
- **Review Details** — Service, rating, title, body text

### Manual Reviews
- Add testimonials manually (for external/offline clients)
- Fields: Reviewer name, role, company, service, rating, review text
- Auto-approved upon creation
    `
  },
  {
    id: "admin-portfolio",
    icon: Image,
    title: "Admin — Portfolio Management",
    content: `
### Portfolio Items
- Add/edit/delete portfolio projects
- Media uploads for project showcases
- Displayed on public Portfolio page
    `
  },
  {
    id: "admin-social",
    icon: Link2,
    title: "Admin — Social Links",
    content: `
### Supported Platforms
- Fiverr, WhatsApp, LinkedIn, Facebook, Instagram, YouTube
- Add/remove custom platforms (e.g., TikTok, Behance)
- Enter full profile/page URLs
- Links displayed in site footer and contact areas
    `
  },
  {
    id: "admin-recruitment",
    icon: Shield,
    title: "Admin — Recruitment & Access",
    content: `
### Manager Recruitment
Create team members with controlled access to the admin dashboard.

| Field | Description |
|-------|-------------|
| **Role/Title** | Custom role label (Manager, Moderator, Support, etc.) |
| **Name** | Full name of the team member |
| **Email** | Login email (used for authentication) |
| **Phone** | Optional contact number |
| **Password** | Initial login password (min 6 characters) |

### Permission System
Each manager gets granular, per-section access toggles:
- Overview, Orders, Services, Portfolio, Reviews, Payments
- Clients, Messages, Trash Bin, Social Links, Site Settings, Recruitment

### Management Actions
- **Enable All / Disable All** — Bulk toggle permissions
- **Activate / Deactivate** — Temporarily revoke access without deleting
- **Edit** — Update name, phone, role, and permissions
- **Remove** — Deactivate and revoke role

### How It Works
- New recruits get a \`moderator\` role in the auth system
- Account creation happens server-side (admin stays logged in)
- Managers log in via the same \`/adminboard\` URL
    `
  },
  {
    id: "admin-settings",
    icon: Palette,
    title: "Admin — Site Settings",
    content: `
### Setting Categories

| Tab | What You Can Edit |
|-----|-------------------|
| **General** | Site name, tagline, footer text |
| **Hero** | Badge text, title, highlight, subtitle, CTA buttons |
| **Stats** | Add/edit/remove homepage stat counters |
| **Sections** | All section titles and subtitles |
| **Process** | 4-step process titles and descriptions |
| **Colors** | Primary and accent colors (HSL format) |
| **Contact** | Email, phone, WhatsApp, address |
| **Delete Buttons** | Toggle delete button visibility per section |
| **Database** | Switch between built-in and external DB |
| **DB Export** | Download schema SQL, data backup, or full export |

### Maintenance Mode
- Toggle to hide site from public visitors
- Confirmation dialog prevents accidental activation

### Database Export
- **Schema SQL** — Table structures for migration
- **Data Backup** — All records as INSERT statements
- **Full Export** — Schema + data combined
- Compatible with MySQL, PostgreSQL, MariaDB
    `
  },
  {
    id: "database",
    icon: Database,
    title: "Database Schema",
    content: `
### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **profiles** | User information | id, full_name, email, phone, company |
| **user_roles** | Role assignments | user_id, role (admin/moderator/user) |
| **orders** | Service orders | user_id, service_title, package_name, price, status |
| **messages** | Chat messages | sender_id, receiver_id, body, is_from_admin, message_type |
| **invoices** | Payment invoices | client_id, amount, payment_method, status, due_date |
| **reviews** | Client reviews | user_id, service_title, rating, body, status |
| **managers** | Recruited team members | user_id, name, email, role, permissions (JSON), is_active |
| **site_config** | Site configuration | config_key, config_data (JSON) |

### Database Functions
- \`handle_new_user()\` — Auto-creates profile on signup (trigger)
- \`has_role(user_id, role)\` — Checks user role (SECURITY DEFINER)
- \`assign_admin_role(user_id)\` — Grants admin role

### Edge Functions
- \`create-manager\` — Creates manager auth account server-side (preserves admin session)
- \`contact-message\` — Processes guest contact form submissions
- \`test-db-connection\` — Tests external database connectivity

### Row-Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Admins have full access to all data
- Public read access only for approved reviews and site config

### Storage
- **message-attachments** bucket — Public bucket for chat file uploads
    `
  },
  {
    id: "edge-functions",
    icon: Terminal,
    title: "Edge Functions",
    content: `
### contact-message
- **Purpose**: Handles guest contact form submissions
- **Flow**: Receives name, email, subject, message → Creates/finds guest profile → Inserts message into messages table
- **Auth**: No JWT required (public endpoint)
- **CORS**: Enabled for all origins

### test-db-connection
- **Purpose**: Tests external database connections
- **Flow**: Receives DB credentials → Attempts connection → Returns success/failure
- **Used by**: Admin Dashboard → Site Settings → Database tab
    `
  },
];

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("overview");
  const currentSection = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-foreground text-sm sm:text-base">DataVision Documentation</h1>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Complete Platform Guide & Reference</p>
              </div>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">v1.0</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border/50 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto p-4">
          <nav className="space-y-0.5">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeSection === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <s.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-card/90 backdrop-blur-xl p-2 overflow-x-auto flex gap-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[9px] font-medium transition-colors ${activeSection === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              <s.icon className="w-3.5 h-3.5" />
              <span>{s.title.split(" — ").pop()?.slice(0, 8) || s.title.slice(0, 8)}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <currentSection.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">{currentSection.title}</h2>
            </div>

            <div className="prose prose-sm max-w-none
              prose-headings:font-heading prose-headings:text-foreground prose-headings:font-semibold
              prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-strong:text-foreground prose-strong:font-semibold
              prose-li:text-muted-foreground
              prose-table:text-sm
              prose-th:text-foreground prose-th:font-semibold prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:border-b prose-th:border-border
              prose-td:px-3 prose-td:py-2 prose-td:text-muted-foreground prose-td:border-b prose-td:border-border/30
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            ">
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(currentSection.content) }} />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
              {sections.findIndex(s => s.id === activeSection) > 0 ? (
                <button onClick={() => setActiveSection(sections[sections.findIndex(s => s.id === activeSection) - 1].id)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  {sections[sections.findIndex(s => s.id === activeSection) - 1].title}
                </button>
              ) : <div />}
              {sections.findIndex(s => s.id === activeSection) < sections.length - 1 ? (
                <button onClick={() => setActiveSection(sections[sections.findIndex(s => s.id === activeSection) + 1].id)} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                  {sections[sections.findIndex(s => s.id === activeSection) + 1].title}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : <div />}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// Simple markdown to HTML converter
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => c.trim().match(/^-+$/))) return '<tr class="border-separator"></tr>';
      const tag = cells.every(c => c.trim().match(/^\*\*/)) ? 'th' : 'td';
      return `<tr>${cells.map(c => `<${tag}>${c.trim().replace(/\*\*/g, '')}</${tag}>`).join('')}</tr>`;
    })
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => {
      const rows = match.split('\n').filter(r => r.trim() && !r.includes('border-separator'));
      return `<table><thead>${rows[0]}</thead><tbody>${rows.slice(1).join('\n')}</tbody></table>`;
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^(?!<[hultpo])([\w\[*].+)$/gm, '<p>$1</p>')
    .replace(/\n\n/g, '\n');
}
