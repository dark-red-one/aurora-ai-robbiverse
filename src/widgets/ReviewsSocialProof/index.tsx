import React, { useState, useEffect } from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './ReviewsSocialProof.css';

export interface Review {
  id: string;
  author: {
    name: string;
    avatar?: string;
    title?: string;
    company?: string;
    verified?: boolean;
  };
  rating: number;
  title?: string;
  content: string;
  date: Date;
  helpful?: number;
  verified?: boolean;
  source?: string;
  tags?: string[];
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
}

export interface SocialProofMetric {
  id: string;
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  highlight?: boolean;
}

export interface ReviewsSocialProofConfig {
  id: string;
  title?: string;
  subtitle?: string;
  variant?: 'reviews' | 'testimonials' | 'social-proof' | 'combined';
  theme?: 'light' | 'dark' | 'branded';
  showRatings?: boolean;
  showAvatars?: boolean;
  showDates?: boolean;
  showSource?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  maxReviews?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  showMetrics?: boolean;
  allowHelpful?: boolean;
}

export interface ReviewsSocialProofData {
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: Record<number, number>;
  socialProofMetrics?: SocialProofMetric[];
  verifiedPurchases?: number;
}

export interface ReviewsSocialProofProps extends WidgetProps {
  config: ReviewsSocialProofConfig;
  data: ReviewsSocialProofData;
}

const ReviewsSocialProof: React.FC<ReviewsSocialProofProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [helpfulClicks, setHelpfulClicks] = useState<Record<string, boolean>>({});

  const {
    title,
    subtitle,
    variant = 'reviews',
    theme = 'light',
    showRatings = true,
    showAvatars = true,
    showDates = true,
    showSource = false,
    enableFiltering = true,
    enableSorting = true,
    maxReviews = 6,
    autoplay = false,
    autoplayInterval = 5000,
    showMetrics = true,
    allowHelpful = true
  } = config;

  // Filter and sort reviews
  const processedReviews = useMemo(() => {
    let filtered = data.reviews;

    // Filter by rating
    if (filterRating) {
      filtered = filtered.filter(review => review.rating === filterRating);
    }

    // Sort reviews
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        filtered.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        break;
    }

    return showAllReviews ? filtered : filtered.slice(0, maxReviews);
  }, [data.reviews, filterRating, sortBy, showAllReviews, maxReviews]);

  // Autoplay for testimonials
  useEffect(() => {
    if (autoplay && variant === 'testimonials' && processedReviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentReviewIndex(prev => (prev + 1) % processedReviews.length);
      }, autoplayInterval);

      return () => clearInterval(interval);
    }
  }, [autoplay, variant, processedReviews.length, autoplayInterval]);

  const renderStars = (rating: number, size: 'small' | 'medium' | 'large' = 'medium') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`reviews-social-proof__star reviews-social-proof__star--${size} ${
            i <= rating ? 'reviews-social-proof__star--filled' : ''
          }`}
        >
          ★
        </span>
      );
    }
    return <div className="reviews-social-proof__stars">{stars}</div>;
  };

  const handleHelpfulClick = (reviewId: string) => {
    if (helpfulClicks[reviewId]) return; // Already clicked

    setHelpfulClicks(prev => ({ ...prev, [reviewId]: true }));

    analytics?.track('review_helpful_clicked', {
      widget_id: config.id,
      review_id: reviewId
    });

    onEvent?.({
      type: 'review_helpful',
      widgetId: config.id,
      data: { reviewId }
    });
  };

  const renderReview = (review: Review, index: number) => (
    <div key={review.id} className="reviews-social-proof__review">
      <div className="reviews-social-proof__review-header">
        {showAvatars && (
          <div className="reviews-social-proof__avatar">
            {review.author.avatar ? (
              <img src={review.author.avatar} alt={review.author.name} />
            ) : (
              <div className="reviews-social-proof__avatar-placeholder">
                {review.author.name.charAt(0).toUpperCase()}
              </div>
            )}
            {review.author.verified && (
              <div className="reviews-social-proof__verified-badge">✓</div>
            )}
          </div>
        )}

        <div className="reviews-social-proof__review-meta">
          <div className="reviews-social-proof__author-info">
            <h4 className="reviews-social-proof__author-name">{review.author.name}</h4>
            {review.author.title && review.author.company && (
              <p className="reviews-social-proof__author-title">
                {review.author.title} at {review.author.company}
              </p>
            )}
          </div>

          {showRatings && (
            <div className="reviews-social-proof__rating">
              {renderStars(review.rating, 'small')}
            </div>
          )}
        </div>

        {showDates && (
          <div className="reviews-social-proof__date">
            {review.date.toLocaleDateString()}
          </div>
        )}
      </div>

      {review.title && (
        <h5 className="reviews-social-proof__review-title">{review.title}</h5>
      )}

      <div className="reviews-social-proof__review-content">
        {review.content}
      </div>

      {review.media && review.media.length > 0 && (
        <div className="reviews-social-proof__media">
          {review.media.slice(0, 3).map((media, mediaIndex) => (
            <div key={mediaIndex} className="reviews-social-proof__media-item">
              {media.type === 'image' ? (
                <img src={media.url} alt="Review media" />
              ) : (
                <video src={media.url} poster={media.thumbnail} controls />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="reviews-social-proof__review-footer">
        {showSource && review.source && (
          <span className="reviews-social-proof__source">via {review.source}</span>
        )}

        {allowHelpful && (
          <button
            className={`reviews-social-proof__helpful ${
              helpfulClicks[review.id] ? 'reviews-social-proof__helpful--clicked' : ''
            }`}
            onClick={() => handleHelpfulClick(review.id)}
            disabled={helpfulClicks[review.id]}
          >
            👍 Helpful {review.helpful ? `(${review.helpful})` : ''}
          </button>
        )}

        {review.tags && review.tags.length > 0 && (
          <div className="reviews-social-proof__tags">
            {review.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="reviews-social-proof__tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSocialProofMetrics = () => {
    if (!showMetrics || !data.socialProofMetrics) return null;

    return (
      <div className="reviews-social-proof__metrics">
        {data.socialProofMetrics.map((metric) => (
          <div
            key={metric.id}
            className={`reviews-social-proof__metric ${
              metric.highlight ? 'reviews-social-proof__metric--highlight' : ''
            }`}
          >
            {metric.icon && (
              <div className="reviews-social-proof__metric-icon">{metric.icon}</div>
            )}
            <div className="reviews-social-proof__metric-content">
              <div className="reviews-social-proof__metric-value">
                {metric.value}
                {metric.trend && (
                  <span className={`reviews-social-proof__trend reviews-social-proof__trend--${metric.trend}`}>
                    {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                  </span>
                )}
              </div>
              <div className="reviews-social-proof__metric-label">{metric.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!data.ratingDistribution) return null;

    const maxCount = Math.max(...Object.values(data.ratingDistribution));

    return (
      <div className="reviews-social-proof__rating-distribution">
        <h4 className="reviews-social-proof__distribution-title">Rating Breakdown</h4>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = data.ratingDistribution![rating] || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={rating} className="reviews-social-proof__distribution-row">
              <span className="reviews-social-proof__distribution-rating">
                {rating} ★
              </span>
              <div className="reviews-social-proof__distribution-bar">
                <div
                  className="reviews-social-proof__distribution-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="reviews-social-proof__distribution-count">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Track impression
  useEffect(() => {
    analytics?.track('reviews_social_proof_impression', {
      widget_id: config.id,
      variant,
      theme,
      review_count: data.reviews.length,
      average_rating: data.averageRating,
      has_metrics: !!data.socialProofMetrics
    });
  }, []);

  return (
    <div className={`reviews-social-proof reviews-social-proof--${variant} reviews-social-proof--${theme}`} data-widget-id={config.id}>
      <div className="reviews-social-proof__container">
        {(title || subtitle) && (
          <div className="reviews-social-proof__header">
            {title && (
              <h2 className="reviews-social-proof__title">{title}</h2>
            )}
            {subtitle && (
              <p className="reviews-social-proof__subtitle">{subtitle}</p>
            )}
          </div>
        )}

        {/* Overall Rating Summary */}
        {data.averageRating && data.totalReviews && (
          <div className="reviews-social-proof__summary">
            <div className="reviews-social-proof__overall-rating">
              <div className="reviews-social-proof__rating-score">
                {data.averageRating.toFixed(1)}
              </div>
              {renderStars(Math.round(data.averageRating), 'large')}
              <div className="reviews-social-proof__rating-text">
                Based on {data.totalReviews.toLocaleString()} reviews
              </div>
            </div>
            {renderRatingDistribution()}
          </div>
        )}

        {/* Social Proof Metrics */}
        {renderSocialProofMetrics()}

        {/* Filters and Sort */}
        {(enableFiltering || enableSorting) && data.reviews.length > 0 && (
          <div className="reviews-social-proof__controls">
            {enableFiltering && (
              <div className="reviews-social-proof__filters">
                <select
                  value={filterRating || ''}
                  onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                  className="reviews-social-proof__filter-select"
                >
                  <option value="">All ratings</option>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} stars
                    </option>
                  ))}
                </select>
              </div>
            )}

            {enableSorting && (
              <div className="reviews-social-proof__sort">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="reviews-social-proof__sort-select"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                  {allowHelpful && <option value="helpful">Most helpful</option>}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Reviews Display */}
        <div className={`reviews-social-proof__reviews reviews-social-proof__reviews--${variant}`}>
          {variant === 'testimonials' && processedReviews.length > 0 ? (
            // Carousel mode for testimonials
            <div className="reviews-social-proof__testimonial-carousel">
              {renderReview(processedReviews[currentReviewIndex], currentReviewIndex)}
              
              {processedReviews.length > 1 && (
                <div className="reviews-social-proof__carousel-controls">
                  <button
                    className="reviews-social-proof__carousel-btn"
                    onClick={() => setCurrentReviewIndex(prev => 
                      prev === 0 ? processedReviews.length - 1 : prev - 1
                    )}
                  >
                    ←
                  </button>
                  <div className="reviews-social-proof__carousel-dots">
                    {processedReviews.map((_, index) => (
                      <button
                        key={index}
                        className={`reviews-social-proof__carousel-dot ${
                          index === currentReviewIndex ? 'reviews-social-proof__carousel-dot--active' : ''
                        }`}
                        onClick={() => setCurrentReviewIndex(index)}
                      />
                    ))}
                  </div>
                  <button
                    className="reviews-social-proof__carousel-btn"
                    onClick={() => setCurrentReviewIndex(prev => 
                      (prev + 1) % processedReviews.length
                    )}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Grid/list mode for reviews
            <div className="reviews-social-proof__grid">
              {processedReviews.map((review, index) => renderReview(review, index))}
            </div>
          )}

          {/* Show More Button */}
          {!showAllReviews && data.reviews.length > maxReviews && (
            <div className="reviews-social-proof__show-more">
              <button
                className="reviews-social-proof__show-more-btn"
                onClick={() => {
                  setShowAllReviews(true);
                  analytics?.track('reviews_show_more_clicked', {
                    widget_id: config.id,
                    current_count: maxReviews,
                    total_count: data.reviews.length
                  });
                }}
              >
                Show all {data.reviews.length} reviews
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {processedReviews.length === 0 && (
          <div className="reviews-social-proof__empty">
            <div className="reviews-social-proof__empty-icon">💬</div>
            <h3 className="reviews-social-proof__empty-title">No reviews yet</h3>
            <p className="reviews-social-proof__empty-text">
              Be the first to share your experience!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsSocialProof;
