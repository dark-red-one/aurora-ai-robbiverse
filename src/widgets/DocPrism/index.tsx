import React, { useState, useEffect, useRef } from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './DocPrism.css';

export interface DocSection {
  id: string;
  title: string;
  content: string;
  level: number; // 1-6 for h1-h6
  startLine?: number;
  endLine?: number;
  highlights?: Array<{
    text: string;
    type: 'keyword' | 'important' | 'warning' | 'code';
    tooltip?: string;
  }>;
}

export interface DocPrismConfig {
  id: string;
  title?: string;
  documentUrl?: string;
  content?: string;
  theme?: 'light' | 'dark' | 'branded';
  showToc?: boolean;
  showSearch?: boolean;
  showLineNumbers?: boolean;
  enableHighlights?: boolean;
  enableAnnotations?: boolean;
  maxHeight?: string;
  language?: string; // for syntax highlighting
  readOnly?: boolean;
}

export interface DocPrismData {
  sections?: DocSection[];
  metadata?: {
    author?: string;
    lastModified?: Date;
    version?: string;
    tags?: string[];
  };
  relatedDocs?: Array<{
    id: string;
    title: string;
    url: string;
    type: string;
  }>;
  analytics?: {
    views?: number;
    avgReadTime?: number;
    popularSections?: string[];
  };
}

export interface DocPrismProps extends WidgetProps {
  config: DocPrismConfig;
  data?: DocPrismData;
}

const DocPrism: React.FC<DocPrismProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState(config.content || '');
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const {
    title,
    documentUrl,
    theme = 'light',
    showToc = true,
    showSearch = true,
    showLineNumbers = false,
    enableHighlights = true,
    enableAnnotations = true,
    maxHeight = '600px',
    language = 'markdown',
    readOnly = true
  } = config;

  const sections = data?.sections || [];

  // Parse content into sections if not provided
  const parsedSections = React.useMemo(() => {
    if (sections.length > 0) return sections;
    
    if (!content) return [];

    const lines = content.split('\n');
    const parsed: DocSection[] = [];
    let currentSection: DocSection | null = null;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.endLine = lineNumber - 1;
          parsed.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          id: `section-${parsed.length + 1}`,
          title: headerMatch[2],
          content: '',
          level: headerMatch[1].length,
          startLine: lineNumber
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    // Add final section
    if (currentSection) {
      currentSection.endLine = lineNumber;
      parsed.push(currentSection);
    }

    return parsed;
  }, [content, sections]);

  // Search functionality
  const filteredSections = React.useMemo(() => {
    if (!searchQuery.trim()) return parsedSections;
    
    const query = searchQuery.toLowerCase();
    return parsedSections.filter(section =>
      section.title.toLowerCase().includes(query) ||
      section.content.toLowerCase().includes(query)
    );
  }, [parsedSections, searchQuery]);

  // Load document from URL
  useEffect(() => {
    if (documentUrl && !config.content) {
      setIsLoading(true);
      
      // Simulate loading document
      setTimeout(() => {
        setContent(`# Document Title\n\nThis is a sample document loaded from ${documentUrl}\n\n## Section 1\n\nContent goes here...\n\n## Section 2\n\nMore content...`);
        setIsLoading(false);
      }, 1000);
    }
  }, [documentUrl, config.content]);

  // Handle section click
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    analytics?.track('doc_section_viewed', {
      widget_id: config.id,
      section_id: sectionId,
      document_url: documentUrl
    });

    onEvent?.({
      type: 'section_viewed',
      widgetId: config.id,
      data: { sectionId, documentUrl }
    });
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      analytics?.track('doc_search', {
        widget_id: config.id,
        search_query: query,
        results_count: filteredSections.length
      });
    }
  };

  // Highlight search terms in content
  const highlightSearchTerms = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="doc-prism__search-highlight">$1</mark>');
  };

  // Format content with syntax highlighting (basic)
  const formatContent = (content: string) => {
    let formatted = content;
    
    if (enableHighlights) {
      // Basic markdown formatting
      formatted = formatted
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }
    
    if (searchQuery) {
      formatted = highlightSearchTerms(formatted, searchQuery);
    }
    
    return formatted;
  };

  // Track impression
  useEffect(() => {
    analytics?.track('doc_prism_impression', {
      widget_id: config.id,
      document_url: documentUrl,
      has_toc: showToc,
      has_search: showSearch,
      section_count: parsedSections.length,
      theme
    });
  }, []);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const container = contentRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
      
      if (scrollPercentage > 25 && scrollPercentage < 30) {
        analytics?.track('doc_reading_progress', {
          widget_id: config.id,
          progress: 25,
          document_url: documentUrl
        });
      } else if (scrollPercentage > 75 && scrollPercentage < 80) {
        analytics?.track('doc_reading_progress', {
          widget_id: config.id,
          progress: 75,
          document_url: documentUrl
        });
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={`doc-prism doc-prism--${theme} doc-prism--loading`}>
        <div className="doc-prism__loading">
          <div className="doc-prism__loading-spinner"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`doc-prism doc-prism--${theme}`} data-widget-id={config.id}>
      <div className="doc-prism__container">
        {/* Header */}
        <div className="doc-prism__header">
          {title && (
            <h2 className="doc-prism__title">{title}</h2>
          )}
          
          {data?.metadata && (
            <div className="doc-prism__metadata">
              {data.metadata.author && (
                <span className="doc-prism__author">By {data.metadata.author}</span>
              )}
              {data.metadata.lastModified && (
                <span className="doc-prism__date">
                  Updated {data.metadata.lastModified.toLocaleDateString()}
                </span>
              )}
              {data.metadata.version && (
                <span className="doc-prism__version">v{data.metadata.version}</span>
              )}
            </div>
          )}

          {showSearch && (
            <div className="doc-prism__search">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search document..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="doc-prism__search-input"
              />
              <div className="doc-prism__search-icon">🔍</div>
            </div>
          )}
        </div>

        <div className="doc-prism__body">
          {/* Table of Contents */}
          {showToc && parsedSections.length > 0 && (
            <div className="doc-prism__sidebar">
              <div className="doc-prism__toc">
                <h3 className="doc-prism__toc-title">Contents</h3>
                <nav className="doc-prism__toc-nav">
                  {parsedSections.map((section) => (
                    <button
                      key={section.id}
                      className={`doc-prism__toc-item doc-prism__toc-item--level-${section.level} ${
                        activeSection === section.id ? 'doc-prism__toc-item--active' : ''
                      }`}
                      onClick={() => handleSectionClick(section.id)}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Related Documents */}
              {data?.relatedDocs && data.relatedDocs.length > 0 && (
                <div className="doc-prism__related">
                  <h3 className="doc-prism__related-title">Related</h3>
                  <div className="doc-prism__related-list">
                    {data.relatedDocs.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        className="doc-prism__related-item"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="doc-prism__related-type">{doc.type}</span>
                        <span className="doc-prism__related-title">{doc.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div 
            className="doc-prism__content"
            ref={contentRef}
            style={{ maxHeight }}
          >
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <div
                  key={section.id}
                  id={`section-${section.id}`}
                  className="doc-prism__section"
                >
                  <div className={`doc-prism__section-header doc-prism__section-header--level-${section.level}`}>
                    <h3 className="doc-prism__section-title">{section.title}</h3>
                    {showLineNumbers && section.startLine && (
                      <span className="doc-prism__line-numbers">
                        Lines {section.startLine}-{section.endLine}
                      </span>
                    )}
                  </div>
                  <div 
                    className="doc-prism__section-content"
                    dangerouslySetInnerHTML={{
                      __html: formatContent(section.content)
                    }}
                  />
                </div>
              ))
            ) : content ? (
              <div 
                className="doc-prism__raw-content"
                dangerouslySetInnerHTML={{
                  __html: formatContent(content)
                }}
              />
            ) : (
              <div className="doc-prism__empty">
                <p>No content available</p>
              </div>
            )}

            {searchQuery && filteredSections.length === 0 && (
              <div className="doc-prism__no-results">
                <p>No results found for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="doc-prism__clear-search"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Footer */}
        {data?.analytics && (
          <div className="doc-prism__footer">
            <div className="doc-prism__stats">
              {data.analytics.views && (
                <span className="doc-prism__stat">
                  👁️ {data.analytics.views.toLocaleString()} views
                </span>
              )}
              {data.analytics.avgReadTime && (
                <span className="doc-prism__stat">
                  ⏱️ {data.analytics.avgReadTime} min read
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocPrism;
