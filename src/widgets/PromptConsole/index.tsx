import React, { useState } from 'react';
import { WidgetProps } from '../types';
import './PromptConsole.css';

export interface PromptConsoleConfig {
  id: string;
  title?: string;
  apiEndpoint?: string;
  models?: string[];
  theme?: 'light' | 'dark';
  showSettings?: boolean;
}

interface PromptConsoleProps extends WidgetProps {
  config: PromptConsoleConfig;
}

export const PromptConsole: React.FC<PromptConsoleProps> = ({ config, onEvent, analytics }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [selectedModel, setSelectedModel] = useState(config.models?.[0] || 'gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    analytics?.track({ event: 'prompt_submitted', model: selectedModel, prompt_length: prompt.length });
    
    try {
      if (config.apiEndpoint) {
        const res = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, model: selectedModel, temperature }),
        });
        const data = await res.json();
        setResponse(data.response || data.text || 'No response');
      } else {
        setResponse('Mock response: This is a demo. Configure apiEndpoint to connect to a real LLM.');
      }
      
      onEvent?.({ type: 'prompt_executed', widget: 'prompt_console', data: { prompt, model: selectedModel } });
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`prompt-console-widget theme-${config.theme || 'light'}`}>
      {config.title && <h2 className="console-title">{config.title}</h2>}
      
      {config.showSettings && (
        <div className="console-settings">
          <div className="setting-group">
            <label>Model:</label>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {config.models?.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          <div className="setting-group">
            <label>Temperature: {temperature}</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
          </div>
        </div>
      )}
      
      <div className="console-input">
        <textarea
          className="prompt-input"
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
        />
        <button className="submit-button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Execute'}
        </button>
      </div>
      
      {response && (
        <div className="console-output">
          <h3>Response:</h3>
          <pre className="response-text">{response}</pre>
        </div>
      )}
    </div>
  );
};

export default PromptConsole;

