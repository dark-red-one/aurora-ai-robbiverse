import React, { useState } from 'react';
import { WidgetProps } from '../types';
import './IntegrationConnectors.css';

export interface Integration {
  id: string;
  name: string;
  logo?: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  description?: string;
  oauthUrl?: string;
}

export interface IntegrationConnectorsConfig {
  id: string;
  title?: string;
  integrations: Integration[];
  theme?: 'light' | 'dark';
  layout?: 'grid' | 'list';
}

interface IntegrationConnectorsProps extends WidgetProps {
  config: IntegrationConnectorsConfig;
}

export const IntegrationConnectors: React.FC<IntegrationConnectorsProps> = ({ config, onEvent, analytics }) => {
  const [integrations, setIntegrations] = useState<Integration[]>(config.integrations);

  const handleConnect = (integration: Integration) => {
    analytics?.track({ event: 'integration_connect_clicked', integration_id: integration.id });
    onEvent?.({ type: 'integration_connect', widget: 'integration_connectors', data: { integration_id: integration.id } });
    
    if (integration.oauthUrl) {
      window.open(integration.oauthUrl, '_blank', 'width=600,height=700');
    } else {
      // Simulate connection
      setIntegrations(prev => prev.map(i => 
        i.id === integration.id ? { ...i, status: 'connected', lastSync: new Date().toISOString() } : i
      ));
    }
  };

  const handleDisconnect = (integration: Integration) => {
    analytics?.track({ event: 'integration_disconnect_clicked', integration_id: integration.id });
    setIntegrations(prev => prev.map(i => 
      i.id === integration.id ? { ...i, status: 'disconnected', lastSync: undefined } : i
    ));
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  return (
    <div className={`integration-connectors-widget theme-${config.theme || 'light'}`}>
      {config.title && <h2 className="widget-title">{config.title}</h2>}
      
      <div className={`integrations-container layout-${config.layout || 'grid'}`}>
        {integrations.map(integration => (
          <div key={integration.id} className="integration-card">
            <div className="integration-header">
              {integration.logo && <img src={integration.logo} alt={integration.name} className="integration-logo" />}
              <div className="integration-info">
                <h3 className="integration-name">{integration.name}</h3>
                <span 
                  className="integration-status" 
                  style={{ color: getStatusColor(integration.status) }}
                >
                  ● {integration.status}
                </span>
              </div>
            </div>
            
            {integration.description && (
              <p className="integration-description">{integration.description}</p>
            )}
            
            {integration.lastSync && (
              <p className="integration-sync">Last synced: {new Date(integration.lastSync).toLocaleString()}</p>
            )}
            
            <div className="integration-actions">
              {integration.status === 'connected' ? (
                <button 
                  className="btn-disconnect" 
                  onClick={() => handleDisconnect(integration)}
                >
                  Disconnect
                </button>
              ) : (
                <button 
                  className="btn-connect" 
                  onClick={() => handleConnect(integration)}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationConnectors;

