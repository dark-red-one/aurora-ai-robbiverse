import React, { useState } from 'react';
import { WidgetProps } from '../types';
import './Navigation.css';

export interface NavItem {
  id: string;
  label: string;
  url?: string;
  children?: NavItem[];
  icon?: string;
}

export interface NavigationConfig {
  id: string;
  items: NavItem[];
  layout?: 'horizontal' | 'vertical' | 'sidebar';
  theme?: 'light' | 'dark';
  sticky?: boolean;
  showBreadcrumbs?: boolean;
  currentPath?: string;
}

interface NavigationProps extends WidgetProps {
  config: NavigationConfig;
}

export const Navigation: React.FC<NavigationProps> = ({ config, onEvent, analytics }) => {
  const [activeItem, setActiveItem] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleNavClick = (item: NavItem) => {
    setActiveItem(item.id);
    onEvent?.({ type: 'nav_clicked', widget: 'navigation', data: { item_id: item.id, url: item.url } });
    analytics?.track({ event: 'navigation_clicked', item_id: item.id, label: item.label });
    if (item.url) window.location.href = item.url;
  };

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavItem = (item: NavItem, level: number = 0) => (
    <div key={item.id} className={`nav-item level-${level}`}>
      <div 
        className={`nav-link ${activeItem === item.id ? 'active' : ''}`}
        onClick={() => handleNavClick(item)}
      >
        {item.icon && <span className="nav-icon">{item.icon}</span>}
        <span className="nav-label">{item.label}</span>
        {item.children && (
          <button 
            className="nav-expand" 
            onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
          >
            {expandedItems.has(item.id) ? '▼' : '▶'}
          </button>
        )}
      </div>
      {item.children && expandedItems.has(item.id) && (
        <div className="nav-children">
          {item.children.map(child => renderNavItem(child, level + 1))}
        </div>
      )}
    </div>
  );

  const renderBreadcrumbs = () => {
    if (!config.showBreadcrumbs || !config.currentPath) return null;
    const paths = config.currentPath.split('/').filter(Boolean);
    return (
      <div className="breadcrumbs">
        <span className="breadcrumb-item">Home</span>
        {paths.map((path, idx) => (
          <React.Fragment key={idx}>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item">{path}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <nav className={`navigation-widget layout-${config.layout || 'horizontal'} theme-${config.theme || 'light'} ${config.sticky ? 'sticky' : ''}`}>
      {renderBreadcrumbs()}
      <div className="nav-items">
        {config.items.map(item => renderNavItem(item))}
      </div>
    </nav>
  );
};

export default Navigation;

