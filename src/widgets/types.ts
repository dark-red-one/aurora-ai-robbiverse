// RobbieBlocks Widget System - Core Types
export interface WidgetConfig {
  id: string;
  variant?: string;
  styling?: ThemeConfig;
  permissions?: string[];
}

export interface WidgetEvent {
  type: string;
  widgetId: string;
  data?: Record<string, any>;
  timestamp?: string;
}

export interface AnalyticsTracker {
  track: (event: string, properties?: Record<string, any>) => void;
  identify?: (userId: string, traits?: Record<string, any>) => void;
  page?: (name?: string, properties?: Record<string, any>) => void;
}

export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  mode?: 'light' | 'dark' | 'auto';
}

export interface WidgetProps {
  config: WidgetConfig;
  data?: any;
  onEvent?: (event: WidgetEvent) => void;
  analytics?: AnalyticsTracker;
  className?: string;
  style?: React.CSSProperties;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Engine Integration Types
export interface LLMRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface PricingRequest {
  productId: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface PricingResponse {
  price: number;
  currency: string;
  discount?: number;
  priceId?: string;
  expires?: string;
}

// Widget State Management
export interface WidgetState {
  loading: boolean;
  error?: string;
  data?: any;
}

// Common UI Props
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'url' | 'tel';
}

// Site-specific types
export interface SiteConfig {
  name: string;
  domain: string;
  theme: ThemeConfig;
  widgets: string[];
  routes: RouteConfig[];
}

export interface RouteConfig {
  path: string;
  component: string;
  widgets: WidgetInstance[];
  meta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface WidgetInstance {
  id: string;
  type: string;
  config: WidgetConfig;
  position: number;
  visible: boolean;
}
