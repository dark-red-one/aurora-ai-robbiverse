import React, { useState, useEffect } from 'react';
import { WidgetProps, WidgetEvent, PricingRequest, PricingResponse } from '../types';
import './PricingPlans.css';

export interface PricingFeature {
  id: string;
  name: string;
  description?: string;
  included: boolean;
  highlight?: boolean;
  tooltip?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  interval: 'month' | 'year' | 'one-time';
  features: PricingFeature[];
  popular?: boolean;
  recommended?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  badge?: string;
  limits?: Record<string, string | number>;
  trial?: {
    enabled: boolean;
    duration: number;
    unit: 'days' | 'weeks';
  };
}

export interface PricingPlansConfig {
  id: string;
  title?: string;
  subtitle?: string;
  plans: PricingPlan[];
  billingToggle?: boolean;
  theme?: 'light' | 'dark' | 'branded';
  layout?: 'cards' | 'table' | 'comparison';
  showFeatureComparison?: boolean;
  enableDynamicPricing?: boolean;
  faqSection?: Array<{
    question: string;
    answer: string;
  }>;
  moneyBackGuarantee?: {
    enabled: boolean;
    duration: number;
    unit: 'days';
  };
}

export interface PricingPlansData {
  dynamicPricing?: Record<string, PricingResponse>;
  userPlan?: string;
  discounts?: Record<string, number>;
  analytics?: {
    planViews?: Record<string, number>;
    conversions?: Record<string, number>;
  };
}

export interface PricingPlansProps extends WidgetProps {
  config: PricingPlansConfig;
  data?: PricingPlansData;
}

const PricingPlans: React.FC<PricingPlansProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const {
    title,
    subtitle,
    plans,
    billingToggle = true,
    theme = 'light',
    layout = 'cards',
    showFeatureComparison = false,
    enableDynamicPricing = false,
    faqSection = [],
    moneyBackGuarantee
  } = config;

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const getEffectivePrice = (plan: PricingPlan) => {
    // Apply dynamic pricing if available
    if (enableDynamicPricing && data?.dynamicPricing?.[plan.id]) {
      return data.dynamicPricing[plan.id].price;
    }

    // Apply billing interval discount for yearly
    if (billingInterval === 'yearly' && plan.interval === 'month') {
      return plan.price * 12 * 0.8; // 20% yearly discount
    }

    return plan.price;
  };

  const handlePlanSelect = (plan: PricingPlan) => {
    setSelectedPlan(plan.id);

    const event: WidgetEvent = {
      type: 'plan_selected',
      widgetId: config.id,
      data: {
        planId: plan.id,
        planName: plan.name,
        price: getEffectivePrice(plan),
        interval: billingInterval,
        timestamp: new Date().toISOString()
      }
    };

    onEvent?.(event);
    analytics?.track('pricing_plan_selected', {
      widget_id: config.id,
      plan_id: plan.id,
      plan_name: plan.name,
      price: getEffectivePrice(plan),
      billing_interval: billingInterval,
      is_popular: plan.popular,
      is_recommended: plan.recommended
    });

    if (plan.ctaUrl) {
      window.open(plan.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBillingToggle = (interval: 'monthly' | 'yearly') => {
    setBillingInterval(interval);
    analytics?.track('pricing_billing_toggle', {
      widget_id: config.id,
      selected_interval: interval
    });
  };

  const handleFAQToggle = (questionId: string) => {
    setExpandedFAQ(expandedFAQ === questionId ? null : questionId);
    analytics?.track('pricing_faq_expanded', {
      widget_id: config.id,
      question_id: questionId
    });
  };

  // Track impression
  useEffect(() => {
    analytics?.track('pricing_plans_impression', {
      widget_id: config.id,
      plan_count: plans.length,
      layout,
      theme,
      has_billing_toggle: billingToggle,
      has_dynamic_pricing: enableDynamicPricing
    });
  }, []);

  // Track plan views
  useEffect(() => {
    plans.forEach((plan) => {
      analytics?.track('pricing_plan_viewed', {
        widget_id: config.id,
        plan_id: plan.id,
        plan_name: plan.name,
        billing_interval: billingInterval
      });
    });
  }, [billingInterval]);

  const renderPlanCard = (plan: PricingPlan) => {
    const effectivePrice = getEffectivePrice(plan);
    const isCurrentPlan = data?.userPlan === plan.id;
    const savings = plan.originalPrice ? plan.originalPrice - effectivePrice : 0;

    return (
      <div
        key={plan.id}
        className={`pricing-plan ${plan.popular ? 'pricing-plan--popular' : ''} ${
          plan.recommended ? 'pricing-plan--recommended' : ''
        } ${isCurrentPlan ? 'pricing-plan--current' : ''}`}
      >
        {plan.popular && (
          <div className="pricing-plan__badge pricing-plan__badge--popular">
            Most Popular
          </div>
        )}
        
        {plan.recommended && (
          <div className="pricing-plan__badge pricing-plan__badge--recommended">
            Recommended
          </div>
        )}

        {plan.badge && (
          <div className="pricing-plan__badge pricing-plan__badge--custom">
            {plan.badge}
          </div>
        )}

        <div className="pricing-plan__header">
          <h3 className="pricing-plan__name">{plan.name}</h3>
          {plan.description && (
            <p className="pricing-plan__description">{plan.description}</p>
          )}
        </div>

        <div className="pricing-plan__pricing">
          <div className="pricing-plan__price">
            {plan.originalPrice && savings > 0 && (
              <span className="pricing-plan__original-price">
                {formatPrice(plan.originalPrice, plan.currency)}
              </span>
            )}
            <span className="pricing-plan__current-price">
              {formatPrice(effectivePrice, plan.currency)}
            </span>
            <span className="pricing-plan__interval">
              /{billingInterval === 'yearly' ? 'year' : plan.interval}
            </span>
          </div>

          {billingInterval === 'yearly' && plan.interval === 'month' && (
            <div className="pricing-plan__savings">
              Save {formatPrice(plan.price * 12 * 0.2, plan.currency)} per year
            </div>
          )}

          {plan.trial?.enabled && (
            <div className="pricing-plan__trial">
              {plan.trial.duration} {plan.trial.unit} free trial
            </div>
          )}
        </div>

        <div className="pricing-plan__features">
          {plan.features.map((feature) => (
            <div
              key={feature.id}
              className={`pricing-plan__feature ${
                feature.highlight ? 'pricing-plan__feature--highlight' : ''
              }`}
              title={feature.tooltip}
            >
              <span className={`pricing-plan__feature-icon ${
                feature.included ? 'pricing-plan__feature-icon--included' : 'pricing-plan__feature-icon--excluded'
              }`}>
                {feature.included ? '✓' : '✗'}
              </span>
              <span className="pricing-plan__feature-text">{feature.name}</span>
            </div>
          ))}

          {plan.limits && Object.keys(plan.limits).length > 0 && (
            <div className="pricing-plan__limits">
              {Object.entries(plan.limits).map(([key, value]) => (
                <div key={key} className="pricing-plan__limit">
                  <strong>{value}</strong> {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pricing-plan__footer">
          <button
            className={`pricing-plan__cta ${isCurrentPlan ? 'pricing-plan__cta--current' : ''}`}
            onClick={() => handlePlanSelect(plan)}
            disabled={isCurrentPlan}
          >
            {isCurrentPlan ? 'Current Plan' : plan.ctaText || 'Get Started'}
          </button>

          {moneyBackGuarantee?.enabled && (
            <div className="pricing-plan__guarantee">
              💯 {moneyBackGuarantee.duration}-day money-back guarantee
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`pricing-plans pricing-plans--${layout} pricing-plans--${theme}`} data-widget-id={config.id}>
      <div className="pricing-plans__container">
        {(title || subtitle) && (
          <div className="pricing-plans__header">
            {title && (
              <h2 className="pricing-plans__title">{title}</h2>
            )}
            {subtitle && (
              <p className="pricing-plans__subtitle">{subtitle}</p>
            )}
          </div>
        )}

        {billingToggle && (
          <div className="pricing-plans__billing-toggle">
            <div className="pricing-plans__toggle">
              <button
                className={`pricing-plans__toggle-option ${
                  billingInterval === 'monthly' ? 'pricing-plans__toggle-option--active' : ''
                }`}
                onClick={() => handleBillingToggle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`pricing-plans__toggle-option ${
                  billingInterval === 'yearly' ? 'pricing-plans__toggle-option--active' : ''
                }`}
                onClick={() => handleBillingToggle('yearly')}
              >
                Yearly
                <span className="pricing-plans__savings-badge">Save 20%</span>
              </button>
            </div>
          </div>
        )}

        <div className="pricing-plans__grid">
          {plans.map(renderPlanCard)}
        </div>

        {faqSection.length > 0 && (
          <div className="pricing-plans__faq">
            <div className="pricing-plans__faq-header">
              <h3 className="pricing-plans__faq-title">Frequently Asked Questions</h3>
              <button
                className="pricing-plans__faq-toggle"
                onClick={() => setShowFAQ(!showFAQ)}
              >
                {showFAQ ? 'Hide FAQ' : 'Show FAQ'}
              </button>
            </div>

            {showFAQ && (
              <div className="pricing-plans__faq-list">
                {faqSection.map((faq, index) => (
                  <div key={index} className="pricing-plans__faq-item">
                    <button
                      className={`pricing-plans__faq-question ${
                        expandedFAQ === `faq-${index}` ? 'pricing-plans__faq-question--expanded' : ''
                      }`}
                      onClick={() => handleFAQToggle(`faq-${index}`)}
                    >
                      {faq.question}
                      <span className="pricing-plans__faq-icon">
                        {expandedFAQ === `faq-${index}` ? '−' : '+'}
                      </span>
                    </button>
                    {expandedFAQ === `faq-${index}` && (
                      <div className="pricing-plans__faq-answer">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPlans;
