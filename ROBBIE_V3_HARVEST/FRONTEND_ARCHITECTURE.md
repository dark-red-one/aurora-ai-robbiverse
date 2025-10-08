# RobbieVerse Frontend Architecture

## Overview
The RobbieVerse frontend is built entirely on React, ensuring consistency, maintainability, and a unified developer experience across all web interfaces.

## Architecture Principles

### 1. **React-First Approach**
- All web interfaces are React applications
- Consistent component library across all pages
- Shared state management and routing
- Unified design system and theming

### 2. **Progressive Enhancement**
- Core functionality works without JavaScript
- Enhanced with React for rich interactions
- Graceful degradation for older browsers
- Mobile-first responsive design

### 3. **Component-Driven Development**
- Reusable components across all pages
- Atomic design methodology
- Design system consistency
- Easy maintenance and updates

## Frontend Stack

### **Core Technologies**
- **React 18** - UI library with hooks and concurrent features
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### **State Management**
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching
- **Context API** - Component-level state sharing

### **UI Components**
- **Shadcn/ui** - Base component library
- **Custom RobbieVerse components** - Town-specific components
- **Design system** - Consistent theming and tokens

## Application Structure

### **1. Main RobbieVerse App (SPA)**
```
src/
├── components/           # Reusable components
│   ├── Chat/            # Chat interface
│   ├── Inbox/           # Citizen inbox
│   ├── Town/            # Town management
│   ├── DesignSystem/    # Design system components
│   └── Common/          # Shared components
├── pages/               # Page components
│   ├── HomePage.jsx
│   ├── InboxPage.jsx
│   ├── NotesPage.jsx
│   └── TeamPage.jsx
├── hooks/               # Custom React hooks
├── services/            # API services
├── utils/               # Utility functions
└── styles/              # Global styles
```

### **2. Town Homepages (React Components)**
```jsx
// Each town gets its own React component
const AuroraHomePage = () => (
  <div className="aurora-theme">
    <TownHeader town="Aurora" />
    <TownStatus />
    <CitizenPortal />
  </div>
);

const ExpansionHomePage = () => (
  <div className="expansion-theme">
    <TownHeader town="Expansion" />
    <TownStatus />
    <CitizenPortal />
  </div>
);

const TestPilotHomePage = () => (
  <div className="testpilot-theme">
    <TownHeader town="TestPilot" />
    <TownStatus />
    <CitizenPortal />
  </div>
);
```

### **3. Static Pages (Pre-rendered React)**
```jsx
// Marketing pages as React components
const PricingPage = () => (
  <div className="pricing-page">
    <PricingHeader />
    <PricingCards />
    <FAQ />
    <CTASection />
  </div>
);

const AboutPage = () => (
  <div className="about-page">
    <AboutHero />
    <TeamSection />
    <MissionSection />
  </div>
);
```

## Component Architecture

### **1. Atomic Design System**
```jsx
// Atoms
const Button = ({ variant, size, children, ...props }) => (
  <button className={`btn btn-${variant} btn-${size}`} {...props}>
    {children}
  </button>
);

// Molecules
const SearchBox = ({ onSearch, placeholder }) => (
  <div className="search-box">
    <Input placeholder={placeholder} />
    <Button variant="primary" onClick={onSearch}>
      Search
    </Button>
  </div>
);

// Organisms
const CitizenInbox = ({ citizenId, townId }) => (
  <div className="citizen-inbox">
    <InboxHeader />
    <MessageList citizenId={citizenId} townId={townId} />
    <MessageCompose />
  </div>
);
```

### **2. Town-Specific Theming**
```jsx
// Theme provider for each town
const TownThemeProvider = ({ town, children }) => {
  const theme = getTownTheme(town);
  
  return (
    <ThemeProvider theme={theme}>
      <div className={`town-${town.toLowerCase()}`}>
        {children}
      </div>
    </ThemeProvider>
  );
};

// Usage
<TownThemeProvider town="Aurora">
  <AuroraHomePage />
</TownThemeProvider>
```

## Routing Strategy

### **1. Main App Routing**
```jsx
// App.jsx
const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chat" element={<ChatInterface />} />
      <Route path="/inbox" element={<InboxPage />} />
      <Route path="/notes" element={<NotesPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/growth" element={<GrowthPage />} />
      <Route path="/testpilot" element={<TestPilotHomePage />} />
    </Routes>
  </Router>
);
```

### **2. Town-Specific Routing**
```jsx
// Each town can have its own routes
const TownRoutes = ({ town }) => (
  <Routes>
    <Route path={`/${town}`} element={<TownHomePage town={town} />} />
    <Route path={`/${town}/citizens`} element={<CitizensPage town={town} />} />
    <Route path={`/${town}/mayor`} element={<MayorDashboard town={town} />} />
  </Routes>
);
```

## State Management

### **1. Global State (Zustand)**
```jsx
// stores/authStore.js
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false })
}));

// stores/townStore.js
const useTownStore = create((set) => ({
  currentTown: null,
  towns: [],
  setCurrentTown: (town) => set({ currentTown: town }),
  addTown: (town) => set((state) => ({ towns: [...state.towns, town] }))
}));
```

### **2. Server State (React Query)**
```jsx
// hooks/useProspects.js
const useProspects = (townId) => {
  return useQuery({
    queryKey: ['prospects', townId],
    queryFn: () => fetchProspects(townId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// hooks/useMessages.js
const useMessages = (citizenId, townId) => {
  return useQuery({
    queryKey: ['messages', citizenId, townId],
    queryFn: () => fetchMessages(citizenId, townId),
    refetchInterval: 30000, // 30 seconds
  });
};
```

## Design System Integration

### **1. Design Tokens**
```css
/* design-tokens.css */
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Typography */
  --font-family-sans: 'Inter', sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}
```

### **2. Component Variants**
```jsx
// Button component with variants
const Button = ({ variant = 'primary', size = 'md', ...props }) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost'
  };
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    />
  );
};
```

## Performance Optimization

### **1. Code Splitting**
```jsx
// Lazy load pages
const InboxPage = lazy(() => import('./pages/InboxPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));

// Lazy load components
const ChatInterface = lazy(() => import('./components/Chat/ChatInterface'));
const CitizenInbox = lazy(() => import('./components/Inbox/CitizenInbox'));
```

### **2. Memoization**
```jsx
// Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => processItem(item));
  }, [data]);
  
  return <div>{processedData}</div>;
});

// Memoize callbacks
const ParentComponent = () => {
  const handleClick = useCallback((id) => {
    // Handle click
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
};
```

### **3. Virtual Scrolling**
```jsx
// For large lists
import { FixedSizeList as List } from 'react-window';

const MessageList = ({ messages }) => (
  <List
    height={600}
    itemCount={messages.length}
    itemSize={80}
    itemData={messages}
  >
    {MessageItem}
  </List>
);
```

## Build and Deployment

### **1. Vite Configuration**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

### **2. Environment Configuration**
```javascript
// .env.development
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_DEBUG=true

// .env.production
VITE_API_BASE_URL=https://api.askrobbie.ai
VITE_WS_URL=wss://api.askrobbie.ai
VITE_DEBUG=false
```

## Testing Strategy

### **1. Unit Tests (Jest + React Testing Library)**
```jsx
// Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### **2. Integration Tests (Cypress)**
```javascript
// cypress/integration/inbox.spec.js
describe('Citizen Inbox', () => {
  it('should display messages', () => {
    cy.visit('/inbox');
    cy.get('[data-testid="message-list"]').should('be.visible');
    cy.get('[data-testid="message-item"]').should('have.length.greaterThan', 0);
  });
  
  it('should send new message', () => {
    cy.visit('/inbox');
    cy.get('[data-testid="compose-button"]').click();
    cy.get('[data-testid="message-input"]').type('Hello world');
    cy.get('[data-testid="send-button"]').click();
    cy.get('[data-testid="message-item"]').should('contain', 'Hello world');
  });
});
```

## Accessibility

### **1. ARIA Labels and Roles**
```jsx
const AccessibleButton = ({ children, ...props }) => (
  <button
    role="button"
    aria-label={props['aria-label'] || children}
    {...props}
  >
    {children}
  </button>
);
```

### **2. Keyboard Navigation**
```jsx
const KeyboardNavigableList = ({ items, onSelect }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        onSelect(items[focusedIndex]);
        break;
    }
  };
  
  return (
    <div onKeyDown={handleKeyDown} tabIndex={0}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className={index === focusedIndex ? 'focused' : ''}
          onClick={() => onSelect(item)}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
};
```

## Conclusion

The RobbieVerse frontend is built entirely on React, providing:

- **Consistency** - All pages use the same component library
- **Maintainability** - Shared code and patterns
- **Performance** - Optimized React patterns and build tools
- **Accessibility** - Built-in accessibility features
- **Scalability** - Component-driven architecture

This approach ensures that every web interface in the RobbieVerse ecosystem feels cohesive and provides a unified user experience while maintaining the flexibility to customize for different towns and use cases.













