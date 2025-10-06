import React, { useState } from 'react';
import { WidgetProps } from '../types';
import './WorkflowRunner.css';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
}

export interface WorkflowConfig {
  id: string;
  title?: string;
  steps: WorkflowStep[];
  autoStart?: boolean;
  theme?: 'light' | 'dark';
}

interface WorkflowRunnerProps extends WidgetProps {
  config: WorkflowConfig;
}

export const WorkflowRunner: React.FC<WorkflowRunnerProps> = ({ config, onEvent, analytics }) => {
  const [steps, setSteps] = useState<WorkflowStep[]>(config.steps);
  const [isRunning, setIsRunning] = useState(false);

  const runWorkflow = async () => {
    setIsRunning(true);
    analytics?.track({ event: 'workflow_started', workflow_id: config.id });
    
    for (let i = 0; i < steps.length; i++) {
      setSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'running' } : s
      ));
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSteps(prev => prev.map((s, idx) => 
        idx === i ? { ...s, status: 'completed' } : s
      ));
    }
    
    setIsRunning(false);
    onEvent?.({ type: 'workflow_completed', widget: 'workflow_runner', data: { workflow_id: config.id } });
    analytics?.track({ event: 'workflow_completed', workflow_id: config.id });
  };

  return (
    <div className={`workflow-runner-widget theme-${config.theme || 'light'}`}>
      {config.title && <h3 className="workflow-title">{config.title}</h3>}
      
      <div className="workflow-steps">
        {steps.map((step, index) => (
          <div key={step.id} className={`workflow-step status-${step.status}`}>
            <div className="step-indicator">
              {step.status === 'completed' && '✓'}
              {step.status === 'running' && '⟳'}
              {step.status === 'failed' && '✗'}
              {step.status === 'pending' && index + 1}
            </div>
            <div className="step-content">
              <div className="step-name">{step.name}</div>
              <div className="step-status">{step.status}</div>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        className="workflow-button" 
        onClick={runWorkflow} 
        disabled={isRunning}
      >
        {isRunning ? 'Running...' : 'Run Workflow'}
      </button>
    </div>
  );
};

export default WorkflowRunner;

