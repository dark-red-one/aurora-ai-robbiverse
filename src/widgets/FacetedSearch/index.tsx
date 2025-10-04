import React, { useState, useEffect, useMemo } from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './FacetedSearch.css';

export interface SearchFacet {
  id: string;
  name: string;
  type: 'checkbox' | 'range' | 'select' | 'radio' | 'tags';
  options?: Array<{
    value: string;
    label: string;
    count?: number;
  }>;
  min?: number;
  max?: number;
  step?: number;
  multiple?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  image?: string;
  url?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  rating?: number;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface FacetedSearchConfig {
  id: string;
  title?: string;
  placeholder?: string;
  facets: SearchFacet[];
  layout?: 'sidebar' | 'top' | 'modal';
  resultLayout?: 'grid' | 'list' | 'table';
  itemsPerPage?: number;
  showFilters?: boolean;
  showSort?: boolean;
  showSearch?: boolean;
  enableTypeahead?: boolean;
  theme?: 'light' | 'dark' | 'branded';
  sortOptions?: Array<{
    value: string;
    label: string;
  }>;
}

export interface FacetedSearchData {
  results: SearchResult[];
  totalCount: number;
  facetCounts?: Record<string, Record<string, number>>;
  suggestions?: string[];
  popularQueries?: string[];
}

export interface FacetedSearchProps extends WidgetProps {
  config: FacetedSearchConfig;
  data: FacetedSearchData;
}

const FacetedSearch: React.FC<FacetedSearchProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const [query, setQuery] = useState('');
  const [selectedFacets, setSelectedFacets] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(config.showFilters !== false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    title,
    placeholder = 'Search...',
    facets,
    layout = 'sidebar',
    resultLayout = 'grid',
    itemsPerPage = 12,
    showSort = true,
    showSearch = true,
    enableTypeahead = true,
    theme = 'light',
    sortOptions = [
      { value: 'relevance', label: 'Relevance' },
      { value: 'price_low', label: 'Price: Low to High' },
      { value: 'price_high', label: 'Price: High to Low' },
      { value: 'rating', label: 'Rating' },
      { value: 'newest', label: 'Newest' }
    ]
  } = config;

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = data.results;

    // Apply text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply facet filters
    Object.entries(selectedFacets).forEach(([facetId, value]) => {
      const facet = facets.find(f => f.id === facetId);
      if (!facet || !value) return;

      switch (facet.type) {
        case 'checkbox':
        case 'tags':
          if (Array.isArray(value) && value.length > 0) {
            filtered = filtered.filter(item => {
              const itemValue = item.metadata?.[facetId] || item.category;
              return Array.isArray(itemValue) 
                ? itemValue.some(v => value.includes(v))
                : value.includes(itemValue);
            });
          }
          break;
        case 'range':
          if (value.min !== undefined || value.max !== undefined) {
            filtered = filtered.filter(item => {
              const itemValue = item.metadata?.[facetId] || item.price || 0;
              return (value.min === undefined || itemValue >= value.min) &&
                     (value.max === undefined || itemValue <= value.max);
            });
          }
          break;
        case 'select':
        case 'radio':
          if (value) {
            filtered = filtered.filter(item => {
              const itemValue = item.metadata?.[facetId] || item.category;
              return itemValue === value;
            });
          }
          break;
      }
    });

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.metadata?.createdAt || 0).getTime() - new Date(a.metadata?.createdAt || 0).getTime());
        break;
      default:
        // Keep original order for relevance
        break;
    }

    return filtered;
  }, [data.results, query, selectedFacets, sortBy, facets]);

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setCurrentPage(1);

    analytics?.track('faceted_search_query', {
      widget_id: config.id,
      query: searchQuery,
      facet_count: Object.keys(selectedFacets).length,
      result_count: filteredResults.length
    });

    onEvent?.({
      type: 'search_performed',
      widgetId: config.id,
      data: { query: searchQuery, facets: selectedFacets }
    });
  };

  const handleFacetChange = (facetId: string, value: any) => {
    setSelectedFacets(prev => ({
      ...prev,
      [facetId]: value
    }));
    setCurrentPage(1);

    analytics?.track('facet_filter_applied', {
      widget_id: config.id,
      facet_id: facetId,
      facet_value: value,
      result_count: filteredResults.length
    });
  };

  const handleResultClick = (result: SearchResult, index: number) => {
    analytics?.track('search_result_click', {
      widget_id: config.id,
      result_id: result.id,
      result_title: result.title,
      position: index,
      page: currentPage,
      query,
      facets: selectedFacets
    });

    onEvent?.({
      type: 'result_clicked',
      widgetId: config.id,
      data: { resultId: result.id, position: index, query, facets: selectedFacets }
    });

    if (result.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderFacet = (facet: SearchFacet) => {
    const currentValue = selectedFacets[facet.id];

    switch (facet.type) {
      case 'checkbox':
      case 'tags':
        return (
          <div key={facet.id} className="faceted-search__facet">
            <h4 className="faceted-search__facet-title">{facet.name}</h4>
            <div className="faceted-search__facet-options">
              {facet.options?.map((option) => (
                <label key={option.value} className="faceted-search__checkbox">
                  <input
                    type="checkbox"
                    checked={Array.isArray(currentValue) ? currentValue.includes(option.value) : false}
                    onChange={(e) => {
                      const newValue = Array.isArray(currentValue) ? [...currentValue] : [];
                      if (e.target.checked) {
                        newValue.push(option.value);
                      } else {
                        const index = newValue.indexOf(option.value);
                        if (index > -1) newValue.splice(index, 1);
                      }
                      handleFacetChange(facet.id, newValue);
                    }}
                  />
                  <span className="faceted-search__checkbox-label">
                    {option.label}
                    {option.count && (
                      <span className="faceted-search__option-count">({option.count})</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'range':
        return (
          <div key={facet.id} className="faceted-search__facet">
            <h4 className="faceted-search__facet-title">{facet.name}</h4>
            <div className="faceted-search__range">
              <input
                type="number"
                placeholder="Min"
                value={currentValue?.min || ''}
                onChange={(e) => handleFacetChange(facet.id, {
                  ...currentValue,
                  min: e.target.value ? Number(e.target.value) : undefined
                })}
                min={facet.min}
                max={facet.max}
                step={facet.step}
                className="faceted-search__range-input"
              />
              <span className="faceted-search__range-separator">to</span>
              <input
                type="number"
                placeholder="Max"
                value={currentValue?.max || ''}
                onChange={(e) => handleFacetChange(facet.id, {
                  ...currentValue,
                  max: e.target.value ? Number(e.target.value) : undefined
                })}
                min={facet.min}
                max={facet.max}
                step={facet.step}
                className="faceted-search__range-input"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={facet.id} className="faceted-search__facet">
            <h4 className="faceted-search__facet-title">{facet.name}</h4>
            <select
              value={currentValue || ''}
              onChange={(e) => handleFacetChange(facet.id, e.target.value || undefined)}
              className="faceted-search__select"
            >
              <option value="">All {facet.name}</option>
              {facet.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.count && ` (${option.count})`}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const renderResult = (result: SearchResult, index: number) => (
    <div
      key={result.id}
      className={`faceted-search__result faceted-search__result--${resultLayout}`}
      onClick={() => handleResultClick(result, index)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleResultClick(result, index);
        }
      }}
    >
      {result.image && (
        <div className="faceted-search__result-image">
          <img src={result.image} alt={result.title} />
        </div>
      )}
      
      <div className="faceted-search__result-content">
        <h3 className="faceted-search__result-title">{result.title}</h3>
        
        {result.description && (
          <p className="faceted-search__result-description">{result.description}</p>
        )}

        {result.category && (
          <span className="faceted-search__result-category">{result.category}</span>
        )}

        {result.rating && (
          <div className="faceted-search__result-rating">
            <div className="faceted-search__stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`faceted-search__star ${
                    i < Math.floor(result.rating!) ? 'faceted-search__star--filled' : ''
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="faceted-search__rating-value">({result.rating})</span>
          </div>
        )}

        {result.price && (
          <div className="faceted-search__result-price">
            {result.originalPrice && (
              <span className="faceted-search__original-price">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: result.currency || 'USD'
                }).format(result.originalPrice)}
              </span>
            )}
            <span className="faceted-search__current-price">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: result.currency || 'USD'
              }).format(result.price)}
            </span>
          </div>
        )}

        {result.tags && result.tags.length > 0 && (
          <div className="faceted-search__result-tags">
            {result.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="faceted-search__result-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Track impression
  useEffect(() => {
    analytics?.track('faceted_search_impression', {
      widget_id: config.id,
      total_results: data.totalCount,
      facet_count: facets.length,
      layout,
      theme
    });
  }, []);

  return (
    <div className={`faceted-search faceted-search--${layout} faceted-search--${theme}`} data-widget-id={config.id}>
      {title && (
        <div className="faceted-search__header">
          <h2 className="faceted-search__title">{title}</h2>
        </div>
      )}

      {showSearch && (
        <div className="faceted-search__search-bar">
          <div className="faceted-search__search-input-container">
            <input
              type="text"
              className="faceted-search__search-input"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(query);
                }
              }}
            />
            <button
              className="faceted-search__search-button"
              onClick={() => handleSearch(query)}
            >
              🔍
            </button>
          </div>

          {enableTypeahead && data.suggestions && data.suggestions.length > 0 && query && (
            <div className="faceted-search__suggestions">
              {data.suggestions.slice(0, 5).map((suggestion) => (
                <button
                  key={suggestion}
                  className="faceted-search__suggestion"
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="faceted-search__body">
        {/* Filters Sidebar/Top */}
        {showFilters && facets.length > 0 && (
          <div className="faceted-search__filters">
            <div className="faceted-search__filters-header">
              <h3 className="faceted-search__filters-title">Filters</h3>
              <button
                className="faceted-search__filters-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide' : 'Show'}
              </button>
            </div>

            {showFilters && (
              <div className="faceted-search__filters-content">
                {facets.map(renderFacet)}
                
                {Object.keys(selectedFacets).length > 0 && (
                  <button
                    className="faceted-search__clear-filters"
                    onClick={() => {
                      setSelectedFacets({});
                      setCurrentPage(1);
                      analytics?.track('faceted_search_filters_cleared', {
                        widget_id: config.id
                      });
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <div className="faceted-search__results">
          <div className="faceted-search__results-header">
            <div className="faceted-search__results-count">
              {filteredResults.length} of {data.totalCount} results
              {query && ` for "${query}"`}
            </div>

            {showSort && (
              <div className="faceted-search__sort">
                <label className="faceted-search__sort-label">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="faceted-search__sort-select"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="faceted-search__loading">
              <div className="faceted-search__loading-spinner"></div>
              <p>Searching...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="faceted-search__no-results">
              <div className="faceted-search__no-results-icon">🔍</div>
              <h3 className="faceted-search__no-results-title">No results found</h3>
              <p className="faceted-search__no-results-text">
                Try adjusting your search or filters
              </p>
              {data.popularQueries && data.popularQueries.length > 0 && (
                <div className="faceted-search__popular-queries">
                  <p>Popular searches:</p>
                  <div className="faceted-search__popular-list">
                    {data.popularQueries.slice(0, 3).map((popularQuery) => (
                      <button
                        key={popularQuery}
                        className="faceted-search__popular-query"
                        onClick={() => {
                          setQuery(popularQuery);
                          handleSearch(popularQuery);
                        }}
                      >
                        {popularQuery}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={`faceted-search__results-grid faceted-search__results-grid--${resultLayout}`}>
                {paginatedResults.map((result, index) => renderResult(result, index))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="faceted-search__pagination">
                  <button
                    className="faceted-search__page-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>

                  <div className="faceted-search__page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          className={`faceted-search__page-number ${
                            pageNum === currentPage ? 'faceted-search__page-number--active' : ''
                          }`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="faceted-search__page-btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacetedSearch;
