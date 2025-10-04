import React, { useState, useEffect, useRef } from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './SpotlightCarousel.css';

export interface SpotlightItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  badge?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  category?: string;
  rating?: number;
  metadata?: Record<string, any>;
}

export interface SpotlightCarouselConfig {
  id: string;
  title?: string;
  subtitle?: string;
  items: SpotlightItem[];
  variant?: 'cards' | 'tiles' | 'deals' | 'minimal';
  theme?: 'light' | 'dark' | 'branded';
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  itemsPerView?: number;
  itemsPerScroll?: number;
  centerMode?: boolean;
  infinite?: boolean;
  showPrices?: boolean;
  showRatings?: boolean;
  showBadges?: boolean;
}

export interface SpotlightCarouselData {
  dynamicItems?: SpotlightItem[];
  analytics?: {
    impressions?: Record<string, number>;
    clicks?: Record<string, number>;
    topItems?: string[];
  };
}

export interface SpotlightCarouselProps extends WidgetProps {
  config: SpotlightCarouselConfig;
  data?: SpotlightCarouselData;
}

const SpotlightCarousel: React.FC<SpotlightCarouselProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(config.autoplay || false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout>();

  const {
    title,
    subtitle,
    items,
    variant = 'cards',
    theme = 'light',
    autoplayInterval = 5000,
    showDots = true,
    showArrows = true,
    itemsPerView = 3,
    itemsPerScroll = 1,
    centerMode = false,
    infinite = true,
    showPrices = false,
    showRatings = false,
    showBadges = true
  } = config;

  const allItems = [...items, ...(data?.dynamicItems || [])];
  const totalItems = allItems.length;

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(price);
  };

  const handleItemClick = (item: SpotlightItem, index: number) => {
    const event: WidgetEvent = {
      type: 'spotlight_item_click',
      widgetId: config.id,
      data: {
        itemId: item.id,
        itemTitle: item.title,
        index,
        variant,
        timestamp: new Date().toISOString()
      }
    };

    onEvent?.(event);
    analytics?.track('spotlight_item_click', {
      widget_id: config.id,
      item_id: item.id,
      item_title: item.title,
      variant,
      position: index,
      has_price: !!item.price
    });

    if (item.link) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  };

  const goToSlide = (index: number) => {
    if (infinite) {
      setCurrentIndex(index);
    } else {
      setCurrentIndex(Math.max(0, Math.min(index, totalItems - itemsPerView)));
    }
  };

  const nextSlide = () => {
    if (infinite) {
      setCurrentIndex((prev) => (prev + itemsPerScroll) % totalItems);
    } else {
      setCurrentIndex((prev) => 
        Math.min(prev + itemsPerScroll, totalItems - itemsPerView)
      );
    }
  };

  const prevSlide = () => {
    if (infinite) {
      setCurrentIndex((prev) => 
        prev - itemsPerScroll < 0 
          ? totalItems - itemsPerScroll 
          : prev - itemsPerScroll
      );
    } else {
      setCurrentIndex((prev) => Math.max(0, prev - itemsPerScroll));
    }
  };

  // Autoplay functionality
  useEffect(() => {
    if (isAutoplaying && totalItems > itemsPerView) {
      autoplayRef.current = setInterval(() => {
        nextSlide();
      }, autoplayInterval);

      return () => {
        if (autoplayRef.current) {
          clearInterval(autoplayRef.current);
        }
      };
    }
  }, [isAutoplaying, currentIndex, totalItems, itemsPerView, autoplayInterval]);

  // Pause autoplay on hover
  const handleMouseEnter = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (isAutoplaying && totalItems > itemsPerView) {
      autoplayRef.current = setInterval(() => {
        nextSlide();
      }, autoplayInterval);
    }
  };

  // Touch/drag functionality
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setDragStart(clientX);
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const offset = clientX - dragStart;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Determine if we should slide based on drag distance
    const threshold = 50;
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    
    setDragOffset(0);
    
    // Resume autoplay if it was active
    if (isAutoplaying && totalItems > itemsPerView) {
      autoplayRef.current = setInterval(() => {
        nextSlide();
      }, autoplayInterval);
    }
  };

  // Track impression
  useEffect(() => {
    analytics?.track('spotlight_carousel_impression', {
      widget_id: config.id,
      variant,
      theme,
      item_count: totalItems,
      items_per_view: itemsPerView,
      has_autoplay: isAutoplaying
    });
  }, []);

  // Track visible items
  useEffect(() => {
    const visibleItems = allItems.slice(currentIndex, currentIndex + itemsPerView);
    visibleItems.forEach((item, index) => {
      analytics?.track('spotlight_item_impression', {
        widget_id: config.id,
        item_id: item.id,
        position: currentIndex + index,
        variant
      });
    });
  }, [currentIndex]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="spotlight-carousel__star spotlight-carousel__star--full">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="spotlight-carousel__star spotlight-carousel__star--half">★</span>);
      } else {
        stars.push(<span key={i} className="spotlight-carousel__star">☆</span>);
      }
    }

    return stars;
  };

  const renderItem = (item: SpotlightItem, index: number) => (
    <div
      key={item.id}
      className={`spotlight-carousel__item spotlight-carousel__item--${variant}`}
      onClick={() => handleItemClick(item, index)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleItemClick(item, index);
        }
      }}
    >
      {item.image && (
        <div className="spotlight-carousel__item-image">
          <img src={item.image} alt={item.title} />
          {showBadges && item.badge && (
            <div className="spotlight-carousel__item-badge">{item.badge}</div>
          )}
        </div>
      )}
      
      <div className="spotlight-carousel__item-content">
        <h3 className="spotlight-carousel__item-title">{item.title}</h3>
        
        {item.description && (
          <p className="spotlight-carousel__item-description">{item.description}</p>
        )}

        {item.category && (
          <span className="spotlight-carousel__item-category">{item.category}</span>
        )}

        {showRatings && item.rating && (
          <div className="spotlight-carousel__item-rating">
            <div className="spotlight-carousel__stars">
              {renderStars(item.rating)}
            </div>
            <span className="spotlight-carousel__rating-value">({item.rating})</span>
          </div>
        )}

        {showPrices && item.price && (
          <div className="spotlight-carousel__item-price">
            {item.originalPrice && (
              <span className="spotlight-carousel__original-price">
                {formatPrice(item.originalPrice, item.currency)}
              </span>
            )}
            <span className="spotlight-carousel__current-price">
              {formatPrice(item.price, item.currency)}
            </span>
            {item.originalPrice && (
              <span className="spotlight-carousel__discount">
                {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% off
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const getTransformStyle = () => {
    const slideWidth = 100 / itemsPerView;
    const translateX = -(currentIndex * slideWidth) + (dragOffset / (carouselRef.current?.offsetWidth || 1)) * 100;
    return {
      transform: `translateX(${translateX}%)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease'
    };
  };

  if (totalItems === 0) {
    return (
      <div className={`spotlight-carousel spotlight-carousel--${variant} spotlight-carousel--${theme} spotlight-carousel--empty`}>
        <div className="spotlight-carousel__empty">
          <p>No items to display</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`spotlight-carousel spotlight-carousel--${variant} spotlight-carousel--${theme}`}
      data-widget-id={config.id}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {(title || subtitle) && (
        <div className="spotlight-carousel__header">
          {title && (
            <h2 className="spotlight-carousel__title">{title}</h2>
          )}
          {subtitle && (
            <p className="spotlight-carousel__subtitle">{subtitle}</p>
          )}
        </div>
      )}

      <div className="spotlight-carousel__container">
        {showArrows && totalItems > itemsPerView && (
          <button
            className="spotlight-carousel__arrow spotlight-carousel__arrow--prev"
            onClick={prevSlide}
            disabled={!infinite && currentIndex === 0}
            aria-label="Previous items"
          >
            ‹
          </button>
        )}

        <div 
          className="spotlight-carousel__viewport"
          ref={carouselRef}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onMouseMove={(e) => handleDragMove(e.clientX)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
          onTouchEnd={handleDragEnd}
        >
          <div 
            className="spotlight-carousel__track"
            style={getTransformStyle()}
          >
            {allItems.map((item, index) => renderItem(item, index))}
          </div>
        </div>

        {showArrows && totalItems > itemsPerView && (
          <button
            className="spotlight-carousel__arrow spotlight-carousel__arrow--next"
            onClick={nextSlide}
            disabled={!infinite && currentIndex >= totalItems - itemsPerView}
            aria-label="Next items"
          >
            ›
          </button>
        )}
      </div>

      {showDots && totalItems > itemsPerView && (
        <div className="spotlight-carousel__dots">
          {Array.from({ length: Math.ceil(totalItems / itemsPerView) }).map((_, index) => (
            <button
              key={index}
              className={`spotlight-carousel__dot ${
                Math.floor(currentIndex / itemsPerView) === index ? 'spotlight-carousel__dot--active' : ''
              }`}
              onClick={() => goToSlide(index * itemsPerView)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {isAutoplaying && (
        <div className="spotlight-carousel__autoplay-controls">
          <button
            className="spotlight-carousel__autoplay-toggle"
            onClick={() => setIsAutoplaying(false)}
            aria-label="Pause autoplay"
          >
            ⏸️
          </button>
        </div>
      )}
    </div>
  );
};

export default SpotlightCarousel;
