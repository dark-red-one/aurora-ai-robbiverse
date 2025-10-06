import React, { useState } from 'react';
import { WidgetProps } from '../types';
import './SmartForms.css';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: RegExp;
}

export interface SmartFormsConfig {
  id: string;
  title?: string;
  subtitle?: string;
  fields: FormField[];
  submitText?: string;
  apiEndpoint?: string;
  theme?: 'light' | 'dark';
  layout?: 'single' | 'two-column';
}

interface SmartFormsProps extends WidgetProps {
  config: SmartFormsConfig;
}

export const SmartForms: React.FC<SmartFormsProps> = ({ config, onEvent, analytics }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    config.fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
      if (field.validation && formData[field.id] && !field.validation.test(formData[field.id])) {
        newErrors[field.id] = `Invalid ${field.label.toLowerCase()}`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus('loading');
    analytics?.track({ event: 'form_submitted', form_id: config.id });

    try {
      if (config.apiEndpoint) {
        await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setStatus('success');
      onEvent?.({ type: 'form_submitted', widget: 'smart_forms', data: formData });
      setFormData({});
    } catch (error) {
      setStatus('error');
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.id,
      required: field.required,
      className: 'form-input',
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={4}
          />
        );
      case 'select':
        return (
          <select
            {...commonProps}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <input
            {...commonProps}
            type="checkbox"
            checked={formData[field.id] || false}
            onChange={(e) => handleChange(field.id, e.target.checked)}
          />
        );
      default:
        return (
          <input
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.id] || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
          />
        );
    }
  };

  return (
    <div className={`smart-forms-widget theme-${config.theme || 'light'}`}>
      {config.title && <h2 className="form-title">{config.title}</h2>}
      {config.subtitle && <p className="form-subtitle">{config.subtitle}</p>}

      <form className={`smart-form layout-${config.layout || 'single'}`} onSubmit={handleSubmit}>
        {config.fields.map(field => (
          <div key={field.id} className={`form-field ${field.type === 'checkbox' ? 'checkbox-field' : ''}`}>
            <label htmlFor={field.id} className="form-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {renderField(field)}
            {errors[field.id] && <span className="form-error">{errors[field.id]}</span>}
          </div>
        ))}

        <button type="submit" className="form-submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Submitting...' : config.submitText || 'Submit'}
        </button>

        {status === 'success' && <p className="form-message success">✓ Form submitted successfully!</p>}
        {status === 'error' && <p className="form-message error">✗ Submission failed. Please try again.</p>}
      </form>
    </div>
  );
};

export default SmartForms;

