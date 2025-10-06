import React, { useState, useEffect, useRef } from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './FunnelFlow.css';

export interface FunnelStage {
  id: string;
  name: string;
  value: number;
  percentage?: number;
  dropoff?: number;
  conversionRate?: number;
  color?: string;
  icon?: string;
  metadata?: {
    avgTime?: string;
    topSources?: string[];
    commonExits?: string[];
  };
}

export interface FunnelFlowConfig {
  id: string;
  title?: string;
  orientation?: 'vertical' | 'horizontal';
  style?: 'classic' | 'modern' | 'minimal';
  showValues?: boolean;
  showPercentages?: boolean;
  showDropoff?: boolean;
  showConversionRates?: boolean;
  animateOnLoad?: boolean;
  interactive?: boolean;
  theme?: 'light' | 'dark' | 'branded';
  colorScheme?: 'gradient' | 'solid' | 'status';
}

export interface FunnelFlowData {
  stages: FunnelStage[];
  totalEntries?: number;
  totalConversions?: number;
  overallConversionRate?: number;
  period?: string;
  lastUpdated?: Date;
  metadata?: {
    currency?: string;
    avgRevenue?: number;
    totalRevenue?: number;
  };
}

interface FunnelFlowProps extends WidgetProps {
  config: FunnelFlowConfig;
  data: FunnelFlowData;
}

export const FunnelFlow: React.FC<FunnelFlowProps> = ({
  config,
  data,
  onEvent,
  analytics,
}) => {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Track widget view
    analytics?.track({
      event: 'widget_viewed',
      widget: 'funnel_flow',
      config_id: config.id,
    });

    // Calculate percentages and dropoff rates
    const processedStages = calculateFunnelMetrics(data.stages);
    setStages(processedStages);
  }, [data.stages]);

  const calculateFunnelMetrics = (rawStages: FunnelStage[]): FunnelStage[] => {
    if (!rawStages || rawStages.length === 0) return [];

    const firstStageValue = rawStages[0].value;

    return rawStages.map((stage, index) => {
      const percentage = (stage.value / firstStageValue) * 100;
      
      let dropoff = 0;
      let conversionRate = 0;
      
      if (index > 0) {
        const previousValue = rawStages[index - 1].value;
        dropoff = previousValue - stage.value;
        conversionRate = (stage.value / previousValue) * 100;
      }

      return {
        ...stage,
        percentage,
        dropoff: index > 0 ? dropoff : undefined,
        conversionRate: index > 0 ? conversionRate : undefined,
      };
    });
  };

  const handleStageClick = (stage: FunnelStage) => {
    if (!config.interactive) return;

    setSelectedStage(selectedStage === stage.id ? null : stage.id);

    onEvent?.({
      type: 'stage_clicked',
      widget: 'funnel_flow',
      data: {
        stage_id: stage.id,
        stage_name: stage.name,
        value: stage.value,
        percentage: stage.percentage,
      },
    });

    analytics?.track({
      event: 'funnel_stage_clicked',
      stage_id: stage.id,
      stage_name: stage.name,
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStageWidth = (stage: FunnelStage): number => {
    return stage.percentage || 100;
  };

  const getStageColor = (stage: FunnelStage, index: number): string => {
    if (stage.color) return stage.color;

    if (config.colorScheme === 'gradient') {
      const hue = 200 - (index * 30);
      return `hsl(${hue}, 70%, 50%)`;
    }

    if (config.colorScheme === 'status') {
      if (stage.conversionRate && stage.conversionRate < 50) return '#ef4444';
      if (stage.conversionRate && stage.conversionRate < 75) return '#f59e0b';
      return '#10b981';
    }

    return '#3b82f6';
  };

  const renderStage = (stage: FunnelStage, index: number) => {
    const isSelected = selectedStage === stage.id;
    const width = getStageWidth(stage);
    const color = getStageColor(stage, index);

    const stageClass = `
      funnel-stage
      ${config.interactive ? 'interactive' : ''}
      ${isSelected ? 'selected' : ''}
      ${config.animateOnLoad ? 'animate-in' : ''}
      style-${config.style || 'classic'}
    `.trim();

    return (
      <div
        key={stage.id}
        className={stageClass}
        onClick={() => handleStageClick(stage)}
        style={{
          animationDelay: config.animateOnLoad ? `${index * 0.1}s` : '0s',
        }}
      >
        <div
          className="stage-bar"
          style={{
            width: `${width}%`,
            backgroundColor: color,
          }}
        >
          <div className="stage-content">
            <div className="stage-header">
              {stage.icon && <span className="stage-icon">{stage.icon}</span>}
              <span className="stage-name">{stage.name}</span>
            </div>

            <div className="stage-metrics">
              {config.showValues && (
                <span className="stage-value">{formatNumber(stage.value)}</span>
              )}
              {config.showPercentages && stage.percentage !== undefined && (
                <span className="stage-percentage">{stage.percentage.toFixed(1)}%</span>
              )}
            </div>
          </div>
        </div>

        {config.showDropoff && stage.dropoff !== undefined && stage.dropoff > 0 && (
          <div className="stage-dropoff">
            <span className="dropoff-icon">↓</span>
            <span className="dropoff-value">{formatNumber(stage.dropoff)} dropped</span>
          </div>
        )}

        {config.showConversionRates && stage.conversionRate !== undefined && (
          <div className="stage-conversion">
            <span className="conversion-label">Conversion:</span>
            <span className="conversion-value">{stage.conversionRate.toFixed(1)}%</span>
          </div>
        )}

        {isSelected && stage.metadata && (
          <div className="stage-details">
            {stage.metadata.avgTime && (
              <div className="detail-item">
                <span className="detail-label">Avg Time:</span>
                <span className="detail-value">{stage.metadata.avgTime}</span>
              </div>
            )}
            {stage.metadata.topSources && stage.metadata.topSources.length > 0 && (
              <div className="detail-item">
                <span className="detail-label">Top Sources:</span>
                <span className="detail-value">{stage.metadata.topSources.join(', ')}</span>
              </div>
            )}
            {stage.metadata.commonExits && stage.metadata.commonExits.length > 0 && (
              <div className="detail-item">
                <span className="detail-label">Common Exits:</span>
                <span className="detail-value">{stage.metadata.commonExits.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSummary = () => {
    if (!data.overallConversionRate && !data.totalConversions) return null;

    return (
      <div className="funnel-summary">
        {data.totalEntries && (
          <div className="summary-item">
            <span className="summary-label">Total Entries:</span>
            <span className="summary-value">{formatNumber(data.totalEntries)}</span>
          </div>
        )}
        {data.totalConversions && (
          <div className="summary-item">
            <span className="summary-label">Conversions:</span>
            <span className="summary-value">{formatNumber(data.totalConversions)}</span>
          </div>
        )}
        {data.overallConversionRate && (
          <div className="summary-item highlight">
            <span className="summary-label">Overall Rate:</span>
            <span className="summary-value">{data.overallConversionRate.toFixed(2)}%</span>
          </div>
        )}
        {data.metadata?.totalRevenue && (
          <div className="summary-item">
            <span className="summary-label">Total Revenue:</span>
            <span className="summary-value">
              {data.metadata.currency || '$'}{formatNumber(data.metadata.totalRevenue)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`funnel-flow-widget theme-${config.theme || 'light'} orientation-${config.orientation || 'vertical'}`}
      data-widget-id={config.id}
    >
      {config.title && (
        <div className="widget-header">
          <h2 className="widget-title">{config.title}</h2>
          {data.period && <span className="period-label">{data.period}</span>}
        </div>
      )}

      <div className="funnel-container">
        {stages.map((stage, index) => renderStage(stage, index))}
      </div>

      {renderSummary()}

      {data.lastUpdated && (
        <div className="widget-footer">
          <span className="last-updated">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default FunnelFlow;

