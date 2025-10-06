import React, { useState } from 'react';
import { WidgetProps } from '../types';
import './OnboardingTours.css';

export interface TourStep {
  id: string;
  title: string;
  content: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

export interface OnboardingToursConfig {
  id: string;
  steps: TourStep[];
  theme?: 'light' | 'dark';
  showProgress?: boolean;
  autoStart?: boolean;
}

interface OnboardingToursProps extends WidgetProps {
  config: OnboardingToursConfig;
}

export const OnboardingTours: React.FC<OnboardingToursProps> = ({ config, onEvent, analytics }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(config.autoStart || false);

  const handleNext = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      analytics?.track({ event: 'tour_step_completed', step: currentStep + 1 });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    analytics?.track({ event: 'tour_skipped', step: currentStep + 1 });
    setIsActive(false);
    onEvent?.({ type: 'tour_skipped', widget: 'onboarding_tours', data: { step: currentStep } });
  };

  const handleComplete = () => {
    analytics?.track({ event: 'tour_completed', total_steps: config.steps.length });
    setIsActive(false);
    onEvent?.({ type: 'tour_completed', widget: 'onboarding_tours', data: { steps_completed: config.steps.length } });
  };

  if (!isActive) {
    return (
      <button className="tour-trigger" onClick={() => setIsActive(true)}>
        Start Tour
      </button>
    );
  }

  const step = config.steps[currentStep];
  const progress = ((currentStep + 1) / config.steps.length) * 100;

  return (
    <>
      <div className="tour-overlay" onClick={handleSkip} />
      <div className={`onboarding-tours-widget theme-${config.theme || 'light'} position-${step.position || 'bottom'}`}>
        {config.showProgress && (
          <div className="tour-progress">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <span className="progress-text">
              Step {currentStep + 1} of {config.steps.length}
            </span>
          </div>
        )}

        <div className="tour-content">
          <h3 className="tour-title">{step.title}</h3>
          <p className="tour-description">{step.content}</p>
          {step.action && <p className="tour-action">👉 {step.action}</p>}
        </div>

        <div className="tour-actions">
          <button className="tour-btn tour-skip" onClick={handleSkip}>
            Skip Tour
          </button>
          <div className="tour-navigation">
            {currentStep > 0 && (
              <button className="tour-btn tour-prev" onClick={handlePrevious}>
                Previous
              </button>
            )}
            <button className="tour-btn tour-next" onClick={handleNext}>
              {currentStep < config.steps.length - 1 ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTours;

