import React from 'react';
import { WidgetProps } from '../types';
import './CompliancePanel.css';

export interface ComplianceBadge {
  id: string;
  name: string;
  logo?: string;
  status: 'certified' | 'pending' | 'expired';
  expiryDate?: string;
  certificateUrl?: string;
}

export interface CompliancePanelConfig {
  id: string;
  title?: string;
  badges: ComplianceBadge[];
  policies?: { name: string; url: string }[];
  theme?: 'light' | 'dark';
  layout?: 'grid' | 'horizontal';
}

interface CompliancePanelProps extends WidgetProps {
  config: CompliancePanelConfig;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({ config, onEvent, analytics }) => {
  const handleBadgeClick = (badge: ComplianceBadge) => {
    analytics?.track({ event: 'compliance_badge_clicked', badge_id: badge.id });
    onEvent?.({ type: 'compliance_badge_clicked', widget: 'compliance_panel', data: { badge_id: badge.id } });
    if (badge.certificateUrl) window.open(badge.certificateUrl, '_blank');
  };

  const handlePolicyClick = (policy: { name: string; url: string }) => {
    analytics?.track({ event: 'policy_clicked', policy_name: policy.name });
    window.open(policy.url, '_blank');
  };

  const getStatusColor = (status: ComplianceBadge['status']) => {
    switch (status) {
      case 'certified': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'expired': return '#ef4444';
    }
  };

  return (
    <div className={`compliance-panel-widget theme-${config.theme || 'light'}`}>
      {config.title && <h2 className="widget-title">{config.title}</h2>}
      
      <div className={`badges-container layout-${config.layout || 'grid'}`}>
        {config.badges.map(badge => (
          <div 
            key={badge.id} 
            className="compliance-badge"
            onClick={() => handleBadgeClick(badge)}
          >
            {badge.logo && <img src={badge.logo} alt={badge.name} className="badge-logo" />}
            <div className="badge-info">
              <h3 className="badge-name">{badge.name}</h3>
              <span 
                className="badge-status" 
                style={{ color: getStatusColor(badge.status) }}
              >
                ● {badge.status}
              </span>
              {badge.expiryDate && (
                <p className="badge-expiry">Expires: {new Date(badge.expiryDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {config.policies && config.policies.length > 0 && (
        <div className="policies-section">
          <h3 className="policies-title">Policies & Documentation</h3>
          <div className="policies-list">
            {config.policies.map((policy, idx) => (
              <button 
                key={idx} 
                className="policy-link"
                onClick={() => handlePolicyClick(policy)}
              >
                {policy.name} →
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompliancePanel;

