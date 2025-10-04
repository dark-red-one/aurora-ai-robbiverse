import React from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './Specsheet.css';

export interface SpecsheetFeature {
  id: string;
  title: string;
  description: string;
  icon?: string;
  badge?: string;
  proofPoints?: string[];
  link?: {
    url: string;
    text: string;
  };
}

export interface SpecsheetConfig {
  id: string;
  title?: string;
  subtitle?: string;
  features: SpecsheetFeature[];
  layout?: 'grid' | 'list' | 'cards' | 'comparison';
  columns?: 1 | 2 | 3 | 4;
  theme?: 'light' | 'dark' | 'branded';
  showIcons?: boolean;
  showBadges?: boolean;
  showProofPoints?: boolean;
  ctaText?: string;
  ctaUrl?: string;
}

export interface SpecsheetData {
  analytics?: {
    views?: number;
    interactions?: number;
    topFeatures?: string[];
  };
  dynamicFeatures?: SpecsheetFeature[];
}

export interface SpecsheetProps extends WidgetProps {
  config: SpecsheetConfig;
  data?: SpecsheetData;
}

const Specsheet: React.FC<SpecsheetProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const {
    title,
    subtitle,
    features,
    layout = 'grid',
    columns = 3,
    theme = 'light',
    showIcons = true,
    showBadges = true,
    showProofPoints = true,
    ctaText,
    ctaUrl
  } = config;

  const allFeatures = [...features, ...(data?.dynamicFeatures || [])];

  const handleFeatureClick = (feature: SpecsheetFeature) => {
    const event: WidgetEvent = {
      type: 'feature_click',
      widgetId: config.id,
      data: {
        featureId: feature.id,
        featureTitle: feature.title,
        timestamp: new Date().toISOString()
      }
    };

    onEvent?.(event);
    analytics?.track('specsheet_feature_click', {
      widget_id: config.id,
      feature_id: feature.id,
      feature_title: feature.title,
      layout,
      theme
    });

    if (feature.link?.url) {
      window.open(feature.link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCTAClick = () => {
    const event: WidgetEvent = {
      type: 'specsheet_cta_click',
      widgetId: config.id,
      data: {
        ctaText,
        ctaUrl,
        timestamp: new Date().toISOString()
      }
    };

    onEvent?.(event);
    analytics?.track('specsheet_cta_click', {
      widget_id: config.id,
      cta_text: ctaText,
      feature_count: allFeatures.length
    });

    if (ctaUrl) {
      window.open(ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  React.useEffect(() => {
    // Track impression
    analytics?.track('specsheet_impression', {
      widget_id: config.id,
      layout,
      theme,
      feature_count: allFeatures.length,
      has_cta: !!ctaText
    });
  }, [config.id, layout, theme, allFeatures.length, ctaText, analytics]);

  const renderFeature = (feature: SpecsheetFeature) => (
    <div
      key={feature.id}
      className={`specsheet__feature ${feature.link ? 'specsheet__feature--clickable' : ''}`}
      onClick={() => feature.link && handleFeatureClick(feature)}
      role={feature.link ? 'button' : undefined}
      tabIndex={feature.link ? 0 : undefined}
      onKeyPress={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && feature.link) {
          e.preventDefault();
          handleFeatureClick(feature);
        }
      }}
    >
      <div className="specsheet__feature-header">
        {showIcons && feature.icon && (
          <div className="specsheet__feature-icon">
            {feature.icon.startsWith('http') ? (
              <img src={feature.icon} alt="" />
            ) : (
              <span>{feature.icon}</span>
            )}
          </div>
        )}
        
        <div className="specsheet__feature-title-group">
          <h3 className="specsheet__feature-title">{feature.title}</h3>
          {showBadges && feature.badge && (
            <span className="specsheet__feature-badge">{feature.badge}</span>
          )}
        </div>
      </div>

      <p className="specsheet__feature-description">{feature.description}</p>

      {showProofPoints && feature.proofPoints && feature.proofPoints.length > 0 && (
        <ul className="specsheet__proof-points">
          {feature.proofPoints.map((point, index) => (
            <li key={index} className="specsheet__proof-point">
              <span className="specsheet__proof-point-icon">✓</span>
              {point}
            </li>
          ))}
        </ul>
      )}

      {feature.link && (
        <div className="specsheet__feature-link">
          <span className="specsheet__feature-link-text">
            {feature.link.text}
          </span>
          <span className="specsheet__feature-link-arrow">→</span>
        </div>
      )}
    </div>
  );

  return (
    <section 
      className={`specsheet specsheet--${layout} specsheet--${theme}`}
      data-widget-id={config.id}
      style={{
        '--specsheet-columns': layout === 'grid' ? columns : 1
      } as React.CSSProperties}
    >
      {(title || subtitle) && (
        <div className="specsheet__header">
          {title && (
            <h2 className="specsheet__title">{title}</h2>
          )}
          {subtitle && (
            <p className="specsheet__subtitle">{subtitle}</p>
          )}
        </div>
      )}

      <div className="specsheet__features">
        {allFeatures.map(renderFeature)}
      </div>

      {ctaText && (
        <div className="specsheet__footer">
          <button
            className="specsheet__cta"
            onClick={handleCTAClick}
            type="button"
          >
            {ctaText}
          </button>
        </div>
      )}
    </section>
  );
};

export default Specsheet;
