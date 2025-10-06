import React, { useState, useEffect } from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './ROICalculator.css';

export interface ROIInput {
  id: string;
  label: string;
  type: 'number' | 'currency' | 'percentage' | 'select';
  defaultValue?: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string | number; label: string }>;
  tooltip?: string;
  prefix?: string;
  suffix?: string;
}

export interface ROIMetric {
  id: string;
  label: string;
  value: number | string;
  type: 'currency' | 'percentage' | 'number' | 'time';
  highlight?: boolean;
  description?: string;
  color?: string;
}

export interface ROICalculatorConfig {
  id: string;
  title?: string;
  subtitle?: string;
  inputs: ROIInput[];
  calculationFormula?: string;
  showChart?: boolean;
  chartType?: 'bar' | 'line' | 'pie';
  theme?: 'light' | 'dark' | 'branded';
  ctaText?: string;
  ctaUrl?: string;
  showBreakdown?: boolean;
  currency?: string;
  timeframe?: string;
}

export interface ROICalculatorData {
  presetScenarios?: Array<{
    name: string;
    values: Record<string, number>;
  }>;
  industryBenchmarks?: Record<string, number>;
  metadata?: {
    lastUpdated?: Date;
    source?: string;
  };
}

interface ROICalculatorProps extends WidgetProps {
  config: ROICalculatorConfig;
  data?: ROICalculatorData;
}

export const ROICalculator: React.FC<ROICalculatorProps> = ({
  config,
  data,
  onEvent,
  analytics,
}) => {
  const [inputValues, setInputValues] = useState<Record<string, number>>({});
  const [results, setResults] = useState<ROIMetric[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');

  useEffect(() => {
    // Initialize with default values
    const defaults: Record<string, number> = {};
    config.inputs.forEach(input => {
      if (input.defaultValue !== undefined) {
        defaults[input.id] = typeof input.defaultValue === 'number' 
          ? input.defaultValue 
          : parseFloat(input.defaultValue);
      }
    });
    setInputValues(defaults);

    analytics?.track({
      event: 'widget_viewed',
      widget: 'roi_calculator',
      config_id: config.id,
    });
  }, [config.inputs]);

  useEffect(() => {
    // Recalculate when inputs change
    calculateROI();
  }, [inputValues]);

  const calculateROI = () => {
    // Example ROI calculation logic
    const currentCost = inputValues['current_cost'] || 0;
    const proposedCost = inputValues['proposed_cost'] || 0;
    const efficiency = inputValues['efficiency_gain'] || 0;
    const timeframe = inputValues['timeframe'] || 12;

    const monthlySavings = (currentCost - proposedCost) * (efficiency / 100);
    const annualSavings = monthlySavings * 12;
    const totalSavings = monthlySavings * timeframe;
    const roi = proposedCost > 0 ? ((totalSavings - proposedCost) / proposedCost) * 100 : 0;
    const paybackMonths = proposedCost > 0 ? proposedCost / monthlySavings : 0;

    const calculatedResults: ROIMetric[] = [
      {
        id: 'monthly_savings',
        label: 'Monthly Savings',
        value: monthlySavings,
        type: 'currency',
        description: 'Estimated monthly cost reduction',
      },
      {
        id: 'annual_savings',
        label: 'Annual Savings',
        value: annualSavings,
        type: 'currency',
        description: 'Projected savings over 12 months',
      },
      {
        id: 'total_savings',
        label: `Total Savings (${timeframe} months)`,
        value: totalSavings,
        type: 'currency',
        highlight: true,
        description: `Total savings over ${timeframe} month period`,
        color: '#10b981',
      },
      {
        id: 'roi',
        label: 'Return on Investment',
        value: roi,
        type: 'percentage',
        highlight: true,
        description: 'ROI percentage over timeframe',
        color: roi > 100 ? '#10b981' : '#f59e0b',
      },
      {
        id: 'payback',
        label: 'Payback Period',
        value: paybackMonths,
        type: 'time',
        description: 'Months to recover investment',
      },
    ];

    setResults(calculatedResults);
  };

  const handleInputChange = (inputId: string, value: number) => {
    setInputValues(prev => ({
      ...prev,
      [inputId]: value,
    }));

    analytics?.track({
      event: 'roi_input_changed',
      input_id: inputId,
      value,
    });
  };

  const handleScenarioSelect = (scenarioName: string) => {
    const scenario = data?.presetScenarios?.find(s => s.name === scenarioName);
    if (scenario) {
      setInputValues(scenario.values);
      setSelectedScenario(scenarioName);

      analytics?.track({
        event: 'roi_scenario_selected',
        scenario: scenarioName,
      });
    }
  };

  const handleCTAClick = () => {
    onEvent?.({
      type: 'cta_clicked',
      widget: 'roi_calculator',
      data: {
        inputs: inputValues,
        results: results,
      },
    });

    analytics?.track({
      event: 'roi_cta_clicked',
      inputs: inputValues,
      results: results.map(r => ({ id: r.id, value: r.value })),
    });

    if (config.ctaUrl) {
      window.open(config.ctaUrl, '_blank');
    }
  };

  const formatValue = (metric: ROIMetric): string => {
    const value = typeof metric.value === 'number' ? metric.value : parseFloat(metric.value);
    
    switch (metric.type) {
      case 'currency':
        return `${config.currency || '$'}${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${value.toFixed(1)} months`;
      default:
        return value.toLocaleString();
    }
  };

  const renderInput = (input: ROIInput) => {
    const value = inputValues[input.id] || input.defaultValue || 0;

    return (
      <div key={input.id} className="roi-input-group">
        <label className="input-label">
          {input.label}
          {input.tooltip && (
            <span className="input-tooltip" title={input.tooltip}>ⓘ</span>
          )}
        </label>

        {input.type === 'select' ? (
          <select
            className="input-field"
            value={value}
            onChange={(e) => handleInputChange(input.id, parseFloat(e.target.value))}
          >
            {input.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="input-wrapper">
            {input.prefix && <span className="input-prefix">{input.prefix}</span>}
            <input
              type="number"
              className="input-field"
              value={value}
              min={input.min}
              max={input.max}
              step={input.step || 1}
              onChange={(e) => handleInputChange(input.id, parseFloat(e.target.value) || 0)}
            />
            {input.suffix && <span className="input-suffix">{input.suffix}</span>}
          </div>
        )}
      </div>
    );
  };

  const renderResult = (metric: ROIMetric) => {
    const resultClass = `
      roi-result
      ${metric.highlight ? 'highlight' : ''}
      ${metric.type}
    `.trim();

    return (
      <div key={metric.id} className={resultClass} style={{ borderColor: metric.color }}>
        <div className="result-label">{metric.label}</div>
        <div className="result-value" style={{ color: metric.color }}>
          {formatValue(metric)}
        </div>
        {metric.description && (
          <div className="result-description">{metric.description}</div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`roi-calculator-widget theme-${config.theme || 'light'}`}
      data-widget-id={config.id}
    >
      <div className="calculator-header">
        {config.title && <h2 className="calculator-title">{config.title}</h2>}
        {config.subtitle && <p className="calculator-subtitle">{config.subtitle}</p>}
      </div>

      {data?.presetScenarios && data.presetScenarios.length > 0 && (
        <div className="scenarios-section">
          <label className="scenarios-label">Quick Scenarios:</label>
          <div className="scenarios-buttons">
            {data.presetScenarios.map(scenario => (
              <button
                key={scenario.name}
                className={`scenario-button ${selectedScenario === scenario.name ? 'active' : ''}`}
                onClick={() => handleScenarioSelect(scenario.name)}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="calculator-body">
        <div className="inputs-section">
          <h3 className="section-title">Your Information</h3>
          <div className="inputs-grid">
            {config.inputs.map(renderInput)}
          </div>
        </div>

        <div className="results-section">
          <h3 className="section-title">Your ROI Projection</h3>
          <div className="results-grid">
            {results.map(renderResult)}
          </div>
        </div>
      </div>

      {config.ctaText && (
        <div className="calculator-footer">
          <button className="cta-button" onClick={handleCTAClick}>
            {config.ctaText}
          </button>
        </div>
      )}

      {config.timeframe && (
        <div className="calculator-note">
          <small>* Calculations based on {config.timeframe} timeframe</small>
        </div>
      )}
    </div>
  );
};

export default ROICalculator;

