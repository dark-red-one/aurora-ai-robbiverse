# TestPilot Production Codebase - Complete Analysis

**Repository:** <https://github.com/sidetoolco/testpilot>  
**Cloned:** October 9, 2025  
**Location:** `/archive/testpilot-production-code/testpilot/`  
**Status:** ✅ Complete Production Application ($289K Revenue)

---

## Executive Summary

This is the **complete production codebase** for TestPilot CPG - a modern React application that generated $289,961.09 in revenue across 40 companies and 34 tests. The codebase demonstrates enterprise-grade architecture with sophisticated features for shopper testing, AI insights, and competitive analysis.

**Key Achievements:**

- 73.5% test completion rate
- 25 AI insights generated
- 1,000+ shopper sessions tracked
- Multi-tenant architecture
- Real-time analytics
- PDF report generation

---

## Tech Stack Analysis

### **Frontend Framework**

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations

### **State Management & Data**

- **Zustand** for state management
- **TanStack Query (React Query)** for server state
- **Supabase** for backend/database
- **React Table** for data tables

### **Payment & Integration**

- **Stripe** for payments (`@stripe/react-stripe-js`)
- **Google reCAPTCHA** for security
- **Socket.io** for real-time features
- **OpenAI** for AI insights

### **Data Visualization**

- **Chart.js** + **React Chart.js 2**
- **D3.js** for advanced visualizations
- **React PDF** for report generation
- **HTML2PDF.js** for client-side PDFs

### **Development Tools**

- **ESLint** + **Prettier** for code quality
- **TypeScript** for type safety
- **Sentry** for error monitoring
- **OpenReplay** for session replay

---

## Project Structure

```
testpilot/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Shared components
│   │   ├── companies/      # Company management
│   │   ├── layout/         # Layout components
│   │   ├── settings/       # Settings UI
│   │   ├── test-setup/     # Test configuration
│   │   ├── testers-session/# Session tracking
│   │   ├── ui/            # Base UI components
│   │   └── users/         # User management
│   ├── features/           # Feature-specific logic
│   │   ├── amazon/        # Amazon integration
│   │   ├── auth/          # Authentication
│   │   ├── credits/       # Credit system
│   │   ├── products/      # Product management
│   │   ├── tests/         # Test management
│   │   └── walmart/       # Walmart integration
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   ├── store/             # Zustand stores
│   ├── styles/            # Global styles
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utility functions
├── supabase/              # Supabase configuration
│   ├── config.toml        # Supabase settings
│   └── functions/         # Edge functions
├── public/                # Static assets
├── .env.example          # Environment variables
├── package.json          # Dependencies
├── vercel.json           # Vercel deployment
└── README.md             # Documentation
```

---

## Key Dependencies Analysis

### **Core Framework**

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "~5.5.0",
  "vite": "^5.1.4"
}
```

### **Backend Integration**

```json
{
  "@supabase/supabase-js": "^2.39.3",
  "@tanstack/react-query": "^5.24.1",
  "axios": "^1.9.0"
}
```

### **Payment Processing**

```json
{
  "@stripe/react-stripe-js": "^3.7.0",
  "@stripe/stripe-js": "^7.4.0"
}
```

### **Data Visualization**

```json
{
  "chart.js": "^4.4.1",
  "react-chartjs-2": "^5.2.0",
  "d3": "^7.9.0",
  "@react-pdf/renderer": "^4.3.0"
}
```

### **AI Integration**

```json
{
  "openai": "^4.28.0"
}
```

### **State Management**

```json
{
  "zustand": "^4.5.1"
}
```

### **Form Handling & Validation**

```json
{
  "zod": "^3.22.4"
}
```

---

## Feature Architecture

### **1. Authentication System**

**Location:** `src/features/auth/`

- Supabase Auth integration
- JWT token management
- Role-based access control
- Company-based multi-tenancy

### **2. Test Management**

**Location:** `src/features/tests/`

- A/B/C test configuration
- Test variant management
- Demographic targeting
- Survey question builder
- Test lifecycle management

### **3. Product Catalog**

**Location:** `src/features/products/`

- Product management
- Image handling
- Pricing configuration
- Competitor assignment

### **4. E-commerce Integration**

**Location:** `src/features/amazon/` & `src/features/walmart/`

- Amazon product API
- Walmart product API
- Competitor product discovery
- Price comparison

### **5. Credit System**

**Location:** `src/features/credits/`

- Credit balance tracking
- Stripe payment integration
- Usage monitoring
- Billing management

### **6. Session Tracking**

**Location:** `src/components/testers-session/`

- Shopper session management
- Real-time tracking
- Engagement metrics
- Completion monitoring

---

## Database Integration

### **Supabase Configuration**

**File:** `supabase/config.toml`

- PostgreSQL database
- Real-time subscriptions
- Row Level Security (RLS)
- Edge functions

### **Environment Variables**

**File:** `.env.example`

```bash
VITE_SUPABASE_URL=           # Supabase project URL
VITE_SUPABASE_ANON_KEY=      # Public anon key
VITE_STRIPE_PUBLISHABLE_KEY= # Stripe public key
VITE_RECAPTCHA_SITE_KEY=     # Google reCAPTCHA
```

---

## Deployment Architecture

### **Vercel Configuration**

**File:** `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    },
    {
      "source": "/webhook-test/:path*",
      "destination": "https://sidetool.app.n8n.cloud/:path*"
    }
  ]
}
```

**Key Features:**

- SPA routing with history fallback
- Webhook integration with n8n automation
- Serverless deployment
- Global CDN

### **Build Configuration**

**File:** `vite.config.ts`

- TypeScript compilation
- React plugin
- Tailwind CSS processing
- Environment variable injection

---

## Component Architecture

### **UI Components**

**Location:** `src/components/ui/`

- Base design system
- Reusable components
- Tailwind CSS integration
- Accessibility features

### **Feature Components**

**Location:** `src/components/[feature]/`

- Feature-specific UI
- Business logic integration
- State management
- API integration

### **Layout Components**

**Location:** `src/components/layout/`

- Page layouts
- Navigation
- Sidebars
- Responsive design

---

## State Management

### **Zustand Stores**

**Location:** `src/store/`

- Global state management
- Type-safe stores
- Persistence
- DevTools integration

### **React Query**

- Server state caching
- Background refetching
- Optimistic updates
- Error handling

---

## AI Integration

### **OpenAI Integration**

**Dependency:** `openai: ^4.28.0`

- AI insights generation
- Natural language processing
- Competitive analysis
- Report generation

### **AI Features**

- Automated test insights
- Purchase driver analysis
- Competitive positioning
- Recommendation engine

---

## Security Features

### **Authentication**

- JWT-based auth via Supabase
- Role-based access control
- Session management
- Password reset

### **Security Tools**

- Google reCAPTCHA integration
- Sentry error monitoring
- Input validation with Zod
- Environment variable protection

---

## Performance Optimizations

### **Code Splitting**

- Vite-based bundling
- Dynamic imports
- Route-based splitting
- Component lazy loading

### **Caching Strategy**

- React Query caching
- Supabase real-time
- Local storage persistence
- CDN optimization

---

## Monitoring & Analytics

### **Error Tracking**

- Sentry integration
- Error boundary components
- Performance monitoring
- User session tracking

### **Analytics**

- OpenReplay session replay
- User behavior tracking
- Performance metrics
- Business intelligence

---

## Development Workflow

### **Code Quality**

```json
{
  "eslint": "^8.57.1",
  "prettier": "^3.5.3",
  "@typescript-eslint/eslint-plugin": "^7.18.0"
}
```

### **Scripts**

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "lint": "eslint .",
  "format": "prettier --write"
}
```

---

## Key Insights for HeyShopper

### **1. Proven Architecture**

- React + TypeScript + Vite stack works
- Supabase provides excellent backend
- Zustand + React Query for state management
- Stripe integration is solid

### **2. Feature Patterns**

- Feature-based folder structure
- Component composition
- Custom hooks for business logic
- Type-safe API integration

### **3. AI Integration**

- OpenAI integration for insights
- PDF generation for reports
- Real-time data processing
- Automated analysis

### **4. Scalability Features**

- Multi-tenant architecture
- Real-time subscriptions
- Caching strategies
- Error monitoring

### **5. Revenue Model**

- Credit-based billing
- Stripe payment processing
- Usage tracking
- Subscription management

---

## Clone Instructions

```bash
# Clone the repository
git clone git@github.com:sidetoolco/testpilot.git
cd testpilot

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and Stripe keys

# Start development server
npm run dev
```

---

## Integration with Robbieverse

### **Current State**

- Complete production codebase cloned
- Schema matches our database documentation
- Architecture patterns identified
- Dependencies analyzed

### **Next Steps**

1. **Analyze specific features** (AI insights, payment flow)
2. **Extract reusable patterns** for HeyShopper
3. **Identify integration points** with Robbie AI
4. **Plan migration strategy** for improvements

### **HeyShopper Blueprint**

This codebase provides the **perfect foundation** for HeyShopper:

- Copy the proven architecture
- Replace Prolific with own shopper panel
- Integrate Robbie AI for enhanced insights
- Use same payment and analytics patterns

---

## Conclusion

The TestPilot production codebase is a **sophisticated, enterprise-grade application** that successfully generated $289K in revenue. It demonstrates:

- **Modern React architecture** with TypeScript
- **Scalable backend** with Supabase
- **AI-powered insights** with OpenAI
- **Professional payment processing** with Stripe
- **Real-time analytics** and monitoring
- **Multi-tenant SaaS** architecture

This serves as an **excellent blueprint** for building HeyShopper and demonstrates that the shopper testing market is viable and profitable.

---

**Document Status:** ✅ Complete  
**Repository:** Successfully cloned and analyzed  
**Purpose:** Blueprint for HeyShopper development  
**Revenue Validation:** $289,961.09 proven business model
