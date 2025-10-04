import React, { useState, useEffect } from 'react';
import { WidgetProps, WidgetEvent } from '../types';
import './SentinelGate.css';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin?: Date;
}

export interface SentinelGateConfig {
  id: string;
  mode: 'login' | 'signup' | 'reset' | 'mfa' | 'profile';
  title?: string;
  subtitle?: string;
  logo?: string;
  theme?: 'light' | 'dark' | 'branded';
  enableMFA?: boolean;
  enableSSO?: boolean;
  ssoProviders?: Array<{
    id: string;
    name: string;
    icon?: string;
    url: string;
  }>;
  requiredFields?: string[];
  passwordRequirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
  };
  redirectUrl?: string;
  allowSignup?: boolean;
}

export interface SentinelGateData {
  user?: AuthUser;
  sessionToken?: string;
  csrfToken?: string;
  mfaRequired?: boolean;
  mfaQrCode?: string;
}

export interface SentinelGateProps extends WidgetProps {
  config: SentinelGateConfig;
  data?: SentinelGateData;
}

const SentinelGate: React.FC<SentinelGateProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const [mode, setMode] = useState(config.mode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    mfaCode: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    title,
    subtitle,
    logo,
    theme = 'light',
    enableMFA = true,
    enableSSO = true,
    ssoProviders = [],
    passwordRequirements = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false
    },
    allowSignup = true
  } = config;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string[] => {
    const issues: string[] = [];
    
    if (password.length < (passwordRequirements.minLength || 8)) {
      issues.push(`At least ${passwordRequirements.minLength || 8} characters`);
    }
    
    if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      issues.push('One uppercase letter');
    }
    
    if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      issues.push('One lowercase letter');
    }
    
    if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
      issues.push('One number');
    }
    
    if (passwordRequirements.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('One special character');
    }
    
    return issues;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (mode === 'login' || mode === 'signup') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (mode === 'signup') {
        const passwordIssues = validatePassword(formData.password);
        if (passwordIssues.length > 0) {
          newErrors.password = `Password must have: ${passwordIssues.join(', ')}`;
        }
      }
    }

    if (mode === 'signup') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (mode === 'mfa' && !formData.mfaCode) {
      newErrors.mfaCode = 'Authentication code is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Emit auth event
    const event: WidgetEvent = {
      type: `auth_${mode}`,
      widgetId: config.id,
      data: {
        email: formData.email,
        mode,
        timestamp: new Date().toISOString(),
        ...(mode === 'signup' && { name: formData.name }),
        ...(mode === 'mfa' && { mfaCode: formData.mfaCode })
      }
    };

    onEvent?.(event);

    // Analytics
    analytics?.track(`sentinel_gate_${mode}`, {
      widget_id: config.id,
      email_domain: formData.email.split('@')[1],
      has_mfa: mode === 'mfa',
      theme
    });

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (mode === 'login' && enableMFA && !data?.user?.mfaEnabled) {
        setMode('mfa');
        analytics?.track('mfa_challenge_presented', {
          widget_id: config.id,
          email: formData.email
        });
      } else {
        // Success - emit success event
        onEvent?.({
          type: 'auth_success',
          widgetId: config.id,
          data: {
            mode,
            user: {
              email: formData.email,
              name: formData.name || 'User'
            }
          }
        });

        if (config.redirectUrl) {
          window.location.href = config.redirectUrl;
        }
      }
    } catch (error) {
      setErrors({ general: 'Authentication failed. Please try again.' });
      
      analytics?.track('sentinel_gate_error', {
        widget_id: config.id,
        mode,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = (provider: any) => {
    analytics?.track('sso_login_attempt', {
      widget_id: config.id,
      provider: provider.id,
      provider_name: provider.name
    });

    onEvent?.({
      type: 'sso_login',
      widgetId: config.id,
      data: { provider: provider.id }
    });

    window.location.href = provider.url;
  };

  // Track impression
  useEffect(() => {
    analytics?.track('sentinel_gate_impression', {
      widget_id: config.id,
      mode,
      theme,
      has_sso: ssoProviders.length > 0,
      mfa_enabled: enableMFA
    });
  }, [mode]);

  const renderModeContent = () => {
    switch (mode) {
      case 'login':
        return (
          <>
            <div className="sentinel-gate__form-group">
              <label className="sentinel-gate__label">Email</label>
              <input
                type="email"
                className={`sentinel-gate__input ${errors.email ? 'sentinel-gate__input--error' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <span className="sentinel-gate__error">{errors.email}</span>
              )}
            </div>

            <div className="sentinel-gate__form-group">
              <label className="sentinel-gate__label">Password</label>
              <div className="sentinel-gate__password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`sentinel-gate__input ${errors.password ? 'sentinel-gate__input--error' : ''}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="sentinel-gate__password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <span className="sentinel-gate__error">{errors.password}</span>
              )}
            </div>

            <div className="sentinel-gate__form-actions">
              <button
                type="button"
                className="sentinel-gate__link"
                onClick={() => setMode('reset')}
              >
                Forgot password?
              </button>
            </div>
          </>
        );

      case 'signup':
        return (
          <>
            <div className="sentinel-gate__form-group">
              <label className="sentinel-gate__label">Full Name</label>
              <input
                type="text"
                className={`sentinel-gate__input ${errors.name ? 'sentinel-gate__input--error' : ''}`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isLoading}
                autoComplete="name"
              />
              {errors.name && (
                <span className="sentinel-gate__error">{errors.name}</span>
              )}
            </div>

            <div className="sentinel-gate__form-group">
              <label className="sentinel-gate__label">Email</label>
              <input
                type="email"
                className={`sentinel-gate__input ${errors.email ? 'sentinel-gate__input--error' : ''}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <span className="sentinel-gate__error">{errors.email}</span>
              )}
            </div>

            <div className="sentinel-gate__form-group">
              <label className="sentinel-gate__label">Password</label>
              <div className="sentinel-gate__password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`sentinel-gate__input ${errors.password ? 'sentinel-gate__input--error' : ''}`}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="sentinel-gate__password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <span className="sentinel-gate__error">{errors.password}</span>
              )}
            </div>

            <div className="sentinel-gate__form-group">
              <label className="sentinel-gate__label">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`sentinel-gate__input ${errors.confirmPassword ? 'sentinel-gate__input--error' : ''}`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="sentinel-gate__error">{errors.confirmPassword}</span>
              )}
            </div>
          </>
        );

      case 'reset':
        return (
          <div className="sentinel-gate__form-group">
            <label className="sentinel-gate__label">Email</label>
            <input
              type="email"
              className={`sentinel-gate__input ${errors.email ? 'sentinel-gate__input--error' : ''}`}
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && (
              <span className="sentinel-gate__error">{errors.email}</span>
            )}
            <p className="sentinel-gate__help-text">
              We'll send you a link to reset your password.
            </p>
          </div>
        );

      case 'mfa':
        return (
          <>
            <div className="sentinel-gate__mfa-info">
              <div className="sentinel-gate__mfa-icon">🔐</div>
              <p className="sentinel-gate__mfa-text">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="sentinel-gate__form-group">
              <label className="sentinel-gate__label">Authentication Code</label>
              <input
                type="text"
                className={`sentinel-gate__input sentinel-gate__input--center ${errors.mfaCode ? 'sentinel-gate__input--error' : ''}`}
                placeholder="000000"
                value={formData.mfaCode}
                onChange={(e) => handleInputChange('mfaCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isLoading}
                maxLength={6}
                autoComplete="one-time-code"
              />
              {errors.mfaCode && (
                <span className="sentinel-gate__error">{errors.mfaCode}</span>
              )}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getSubmitText = () => {
    if (isLoading) return 'Processing...';
    
    switch (mode) {
      case 'login': return 'Sign In';
      case 'signup': return 'Create Account';
      case 'reset': return 'Send Reset Link';
      case 'mfa': return 'Verify Code';
      default: return 'Submit';
    }
  };

  return (
    <div className={`sentinel-gate sentinel-gate--${theme}`} data-widget-id={config.id}>
      <div className="sentinel-gate__container">
        {logo && (
          <div className="sentinel-gate__logo">
            <img src={logo} alt="Logo" />
          </div>
        )}

        <div className="sentinel-gate__header">
          {title && (
            <h2 className="sentinel-gate__title">{title}</h2>
          )}
          {subtitle && (
            <p className="sentinel-gate__subtitle">{subtitle}</p>
          )}
        </div>

        {errors.general && (
          <div className="sentinel-gate__alert sentinel-gate__alert--error">
            {errors.general}
          </div>
        )}

        <form className="sentinel-gate__form" onSubmit={handleSubmit}>
          {renderModeContent()}

          <button
            type="submit"
            className="sentinel-gate__submit"
            disabled={isLoading}
          >
            {getSubmitText()}
          </button>
        </form>

        {/* SSO Options */}
        {enableSSO && ssoProviders.length > 0 && mode !== 'mfa' && (
          <div className="sentinel-gate__sso">
            <div className="sentinel-gate__divider">
              <span>or continue with</span>
            </div>
            <div className="sentinel-gate__sso-buttons">
              {ssoProviders.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  className="sentinel-gate__sso-button"
                  onClick={() => handleSSOLogin(provider)}
                  disabled={isLoading}
                >
                  {provider.icon && <span className="sentinel-gate__sso-icon">{provider.icon}</span>}
                  {provider.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode Switching */}
        <div className="sentinel-gate__footer">
          {mode === 'login' && allowSignup && (
            <p className="sentinel-gate__switch">
              Don't have an account?{' '}
              <button
                type="button"
                className="sentinel-gate__link"
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </p>
          )}
          
          {mode === 'signup' && (
            <p className="sentinel-gate__switch">
              Already have an account?{' '}
              <button
                type="button"
                className="sentinel-gate__link"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </p>
          )}

          {(mode === 'reset' || mode === 'mfa') && (
            <p className="sentinel-gate__switch">
              <button
                type="button"
                className="sentinel-gate__link"
                onClick={() => setMode('login')}
              >
                ← Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentinelGate;
