import React, { useState, useEffect } from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './BeaconTiles.css';

export interface BeaconTile {
  id: string;
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number; // Percentage change
  changeType?: 'increase' | 'decrease' | 'neutral';
  trend?: Array<number>; // Sparkline data
  icon?: string;
  color?: string;
  unit?: string;
  prefix?: string; // e.g., "$", "€"
  suffix?: string; // e.g., "%", "K", "M"
  target?: number;
  status?: 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
  clickable?: boolean;
  metadata?: Record<string, any>;
}

export interface BeaconTilesConfig {
  id: string;
  title?: string;
  layout?: 'grid' | 'flex' | 'masonry';
  columns?: number; // Grid columns (responsive)
  gap?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark' | 'branded';
  showTrends?: boolean;
  showChanges?: boolean;
  showTargets?: boolean;
  animateOnLoad?: boolean;
  refreshInterval?: number; // Auto-refresh in seconds
  compactMode?: boolean;
}

export interface BeaconTilesData {
  tiles: BeaconTile[];
  lastUpdated?: Date;
  metadata?: {
    period?: string;
    comparison?: string;
    dataSource?: string;
  };
}

interface BeaconTilesProps extends WidgetProps {
  config: BeaconTilesConfig;
  data: BeaconTilesData;
}

export const BeaconTiles: React.FC<BeaconTilesProps> = ({
  config,
  data,
  onEvent,
  analytics,
}) => {
  const [tiles, setTiles] = useState<BeaconTile[]>(data.tiles || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Track widget view
    analytics?.track({
      event: 'widget_viewed',
      widget: 'beacon_tiles',
      config_id: config.id,
    });

    // Setup auto-refresh if configured
    if (config.refreshInterval && config.refreshInterval > 0) {
      const interval = setInterval(() => {
        handleRefresh();
      }, config.refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [config.refreshInterval]);

  useEffect(() => {
    setTiles(data.tiles || []);
  }, [data.tiles]);

  const handleRefresh = () => {
    setIsLoading(true);
    onEvent?.({
      type: 'refresh',
      widget: 'beacon_tiles',
      data: { config_id: config.id },
    });
    
    analytics?.track({
      event: 'beacon_tiles_refreshed',
      config_id: config.id,
    });

    // Simulate loading state
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleTileClick = (tile: BeaconTile) => {
    if (!tile.clickable) return;

    onEvent?.({
      type: 'tile_clicked',
      widget: 'beacon_tiles',
      data: {
        tile_id: tile.id,
        title: tile.title,
        value: tile.value,
      },
    });

    analytics?.track({
      event: 'beacon_tile_clicked',
      tile_id: tile.id,
      tile_title: tile.title,
    });
  };

  const formatValue = (tile: BeaconTile): string => {
    const { value, prefix = '', suffix = '' } = tile;
    return `${prefix}${value}${suffix}`;
  };

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return '↑';
      case 'decrease':
        return '↓';
      default:
        return '→';
    }
  };

  const getChangeClass = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'change-positive';
      case 'decrease':
        return 'change-negative';
      default:
        return 'change-neutral';
    }
  };

  const renderSparkline = (trend: number[]) => {
    if (!trend || trend.length === 0) return null;

    const max = Math.max(...trend);
    const min = Math.min(...trend);
    const range = max - min || 1;
    
    const points = trend.map((value, index) => {
      const x = (index / (trend.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    );
  };

  const renderTile = (tile: BeaconTile) => {
    const tileClass = `
      beacon-tile
      ${tile.status ? `status-${tile.status}` : ''}
      ${tile.clickable ? 'clickable' : ''}
      ${tile.loading ? 'loading' : ''}
      ${config.compactMode ? 'compact' : ''}
      ${config.animateOnLoad ? 'animate-in' : ''}
    `.trim();

    return (
      <div
        key={tile.id}
        className={tileClass}
        onClick={() => handleTileClick(tile)}
        style={{ borderColor: tile.color }}
      >
        <div className="tile-header">
          {tile.icon && <span className="tile-icon">{tile.icon}</span>}
          <h3 className="tile-title">{tile.title}</h3>
        </div>

        <div className="tile-body">
          <div className="tile-value">{formatValue(tile)}</div>

          {config.showChanges && tile.change !== undefined && (
            <div className={`tile-change ${getChangeClass(tile.changeType)}`}>
              <span className="change-icon">{getChangeIcon(tile.changeType)}</span>
              <span className="change-value">{Math.abs(tile.change)}%</span>
            </div>
          )}

          {config.showTrends && tile.trend && (
            <div className="tile-trend">
              {renderSparkline(tile.trend)}
            </div>
          )}

          {config.showTargets && tile.target !== undefined && (
            <div className="tile-target">
              <div className="target-label">Target: {tile.target}{tile.suffix}</div>
              <div className="target-progress">
                <div
                  className="target-bar"
                  style={{
                    width: `${Math.min((Number(tile.value) / tile.target) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {tile.loading && (
          <div className="tile-loading">
            <div className="loading-spinner" />
          </div>
        )}
      </div>
    );
  };

  const gridStyle = {
    gridTemplateColumns: config.columns
      ? `repeat(${config.columns}, 1fr)`
      : 'repeat(auto-fit, minmax(250px, 1fr))',
  };

  return (
    <div
      className={`beacon-tiles-widget theme-${config.theme || 'light'}`}
      data-widget-id={config.id}
    >
      {config.title && (
        <div className="widget-header">
          <h2 className="widget-title">{config.title}</h2>
          {data.lastUpdated && (
            <span className="last-updated">
              Updated {new Date(data.lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      <div
        className={`tiles-container layout-${config.layout || 'grid'} gap-${config.gap || 'medium'}`}
        style={config.layout === 'grid' ? gridStyle : undefined}
      >
        {tiles.map(renderTile)}
      </div>

      {isLoading && (
        <div className="widget-loading">
          <div className="loading-overlay">
            <div className="loading-spinner large" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BeaconTiles;

