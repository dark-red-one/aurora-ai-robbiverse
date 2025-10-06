import React, { useState } from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './ComparisonTable.css';

export interface ComparisonFeature {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface ComparisonProduct {
  id: string;
  name: string;
  price?: string;
  badge?: string;
  badgeColor?: string;
  features: Record<string, boolean | string | number>;
  ctaText?: string;
  ctaUrl?: string;
  highlighted?: boolean;
}

export interface ComparisonTableConfig {
  id: string;
  title?: string;
  subtitle?: string;
  features: ComparisonFeature[];
  products: ComparisonProduct[];
  showCategories?: boolean;
  stickyHeader?: boolean;
  theme?: 'light' | 'dark' | 'branded';
  checkIcon?: string;
  crossIcon?: string;
}

interface ComparisonTableProps extends WidgetProps {
  config: ComparisonTableConfig;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  config,
  onEvent,
  analytics,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    config.products.map(p => p.id)
  );

  const checkIcon = config.checkIcon || '✓';
  const crossIcon = config.crossIcon || '✗';

  const categories = config.showCategories
    ? Array.from(new Set(config.features.map(f => f.category).filter(Boolean)))
    : [];

  const handleCTAClick = (product: ComparisonProduct) => {
    onEvent?.({
      type: 'cta_clicked',
      widget: 'comparison_table',
      data: { product_id: product.id, product_name: product.name },
    });
    analytics?.track({
      event: 'comparison_cta_clicked',
      product_id: product.id,
      product_name: product.name,
    });
    if (product.ctaUrl) window.open(product.ctaUrl, '_blank');
  };

  const renderFeatureValue = (value: boolean | string | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <span className="feature-check">{checkIcon}</span>
      ) : (
        <span className="feature-cross">{crossIcon}</span>
      );
    }
    return <span className="feature-text">{value}</span>;
  };

  return (
    <div className={`comparison-table-widget theme-${config.theme || 'light'}`}>
      {config.title && (
        <div className="widget-header">
          <h2 className="widget-title">{config.title}</h2>
          {config.subtitle && <p className="widget-subtitle">{config.subtitle}</p>}
        </div>
      )}

      <div className="table-wrapper">
        <table className={`comparison-table ${config.stickyHeader ? 'sticky-header' : ''}`}>
          <thead>
            <tr>
              <th className="feature-column">Features</th>
              {config.products.map(product => (
                <th key={product.id} className={`product-column ${product.highlighted ? 'highlighted' : ''}`}>
                  {product.badge && (
                    <span className="product-badge" style={{ background: product.badgeColor }}>
                      {product.badge}
                    </span>
                  )}
                  <div className="product-name">{product.name}</div>
                  {product.price && <div className="product-price">{product.price}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.length > 0
              ? categories.map(category => (
                  <React.Fragment key={category}>
                    <tr className="category-row">
                      <td colSpan={config.products.length + 1} className="category-name">
                        {category}
                      </td>
                    </tr>
                    {config.features
                      .filter(f => f.category === category)
                      .map(feature => (
                        <tr key={feature.id} className="feature-row">
                          <td className="feature-cell">
                            <span className="feature-name">{feature.name}</span>
                            {feature.description && (
                              <span className="feature-desc">{feature.description}</span>
                            )}
                          </td>
                          {config.products.map(product => (
                            <td key={product.id} className={`value-cell ${product.highlighted ? 'highlighted' : ''}`}>
                              {renderFeatureValue(product.features[feature.id])}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </React.Fragment>
                ))
              : config.features.map(feature => (
                  <tr key={feature.id} className="feature-row">
                    <td className="feature-cell">
                      <span className="feature-name">{feature.name}</span>
                      {feature.description && (
                        <span className="feature-desc">{feature.description}</span>
                      )}
                    </td>
                    {config.products.map(product => (
                      <td key={product.id} className={`value-cell ${product.highlighted ? 'highlighted' : ''}`}>
                        {renderFeatureValue(product.features[feature.id])}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
          <tfoot>
            <tr>
              <td></td>
              {config.products.map(product => (
                <td key={product.id} className={`cta-cell ${product.highlighted ? 'highlighted' : ''}`}>
                  {product.ctaText && (
                    <button className="cta-button" onClick={() => handleCTAClick(product)}>
                      {product.ctaText}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;

