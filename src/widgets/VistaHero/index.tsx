import React from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './VistaHero.css';

export interface VistaHeroConfig {
  id: string;
  title: string;
  subtitle?: string;
  ctaText: string;
  ctaUrl?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  variant?: 'default' | 'centered' | 'left-aligned' | 'minimal';
  theme?: 'light' | 'dark' | 'gradient';
  overlay?: boolean;
  height?: 'small' | 'medium' | 'large' | 'fullscreen';
}

export interface VistaHeroData {
  backgroundAssets?: {
    image?: string;
    video?: string;
    alt?: string;
  };
  analytics?: {
    impressions?: number;
    clicks?: number;
    conversionRate?: number;
  };
}

export interface VistaHeroProps extends WidgetProps {
  config: VistaHeroConfig;
  data?: VistaHeroData;
}

const VistaHero: React.FC<VistaHeroProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const {
    title,
    subtitle,
    ctaText,
    ctaUrl,
    backgroundImage,
    backgroundVideo,
    variant = 'default',
    theme = 'dark',
    overlay = true,
    height = 'large'
  } = config;

  const handleCTAClick = () => {
    const event: WidgetEvent = {
      type: 'cta_click',
      widgetId: config.id,
      data: {
        ctaText,
        ctaUrl,
        timestamp: new Date().toISOString()
      }
    };
    
    onEvent?.(event);
    analytics?.track('vista_hero_cta_click', {
      widget_id: config.id,
      cta_text: ctaText,
      variant,
      theme
    });

    if (ctaUrl) {
      window.open(ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const backgroundStyle = React.useMemo(() => {
    const style: React.CSSProperties = {};
    
    if (backgroundImage || data?.backgroundAssets?.image) {
      style.backgroundImage = `url(${backgroundImage || data?.backgroundAssets?.image})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      style.backgroundRepeat = 'no-repeat';
    }
    
    return style;
  }, [backgroundImage, data?.backgroundAssets?.image]);

  React.useEffect(() => {
    // Track impression
    analytics?.track('vista_hero_impression', {
      widget_id: config.id,
      variant,
      theme,
      has_background: !!(backgroundImage || backgroundVideo || data?.backgroundAssets?.image)
    });
  }, [config.id, variant, theme, backgroundImage, backgroundVideo, data?.backgroundAssets, analytics]);

  return (
    <section 
      className={`vista-hero vista-hero--${variant} vista-hero--${theme} vista-hero--${height}`}
      style={backgroundStyle}
      data-widget-id={config.id}
    >
      {(backgroundVideo || data?.backgroundAssets?.video) && (
        <video 
          className="vista-hero__background-video"
          autoPlay 
          muted 
          loop 
          playsInline
          aria-hidden="true"
        >
          <source src={backgroundVideo || data?.backgroundAssets?.video} type="video/mp4" />
        </video>
      )}
      
      {overlay && <div className="vista-hero__overlay" />}
      
      <div className="vista-hero__container">
        <div className="vista-hero__content">
          <h1 className="vista-hero__title">
            {title}
          </h1>
          
          {subtitle && (
            <p className="vista-hero__subtitle">
              {subtitle}
            </p>
          )}
          
          <div className="vista-hero__actions">
            <button
              className="vista-hero__cta"
              onClick={handleCTAClick}
              type="button"
            >
              {ctaText}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VistaHero;
