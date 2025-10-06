import React, { useState } from 'react';
import { WidgetProps } from '../types';
import './Subscribe.css';

export interface SubscribeConfig {
  id: string;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  theme?: 'light' | 'dark';
  layout?: 'inline' | 'stacked';
  showPrivacy?: boolean;
  apiEndpoint?: string;
}

interface SubscribeProps extends WidgetProps {
  config: SubscribeConfig;
}

export const Subscribe: React.FC<SubscribeProps> = ({ config, onEvent, analytics }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      if (config.apiEndpoint) {
        await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      }
      
      setStatus('success');
      onEvent?.({ type: 'subscribe', widget: 'subscribe', data: { email } });
      analytics?.track({ event: 'newsletter_subscribed', email });
      setEmail('');
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className={`subscribe-widget theme-${config.theme || 'light'} layout-${config.layout || 'inline'}`}>
      {config.title && <h3 className="subscribe-title">{config.title}</h3>}
      {config.subtitle && <p className="subscribe-subtitle">{config.subtitle}</p>}
      
      <form className="subscribe-form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="subscribe-input"
          placeholder={config.placeholder || 'Enter your email'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="subscribe-button" disabled={status === 'loading'}>
          {status === 'loading' ? 'Subscribing...' : config.buttonText || 'Subscribe'}
        </button>
      </form>
      
      {status === 'success' && <p className="subscribe-message success">✓ Subscribed successfully!</p>}
      {status === 'error' && <p className="subscribe-message error">✗ Something went wrong. Try again.</p>}
      {config.showPrivacy && <p className="subscribe-privacy">We respect your privacy. Unsubscribe anytime.</p>}
    </div>
  );
};

export default Subscribe;

