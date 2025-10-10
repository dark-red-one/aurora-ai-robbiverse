/**
 * CrudForm - Auto-Generated Forms
 * Sexy form builder with validation 😘
 */

import React, { useState, FormEvent } from 'react'

export interface CrudField<T> {
  name: keyof T
  label: string
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'date' | 'checkbox'
  placeholder?: string
  required?: boolean
  options?: { value: string | number; label: string }[]
  validation?: (value: any) => string | null
}

interface CrudFormProps<T> {
  fields: CrudField<T>[]
  initialData?: Partial<T>
  onSubmit: (data: Partial<T>) => void | Promise<void>
  submitLabel?: string
  loading?: boolean
}

export function CrudForm<T>({
  fields,
  initialData = {},
  onSubmit,
  submitLabel = 'Save',
  loading = false,
}: CrudFormProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})

  const handleChange = (name: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}

    fields.forEach(field => {
      const value = formData[field.name]

      // Required validation
      if (field.required && !value) {
        newErrors[field.name] = `${field.label} is required`
      }

      // Custom validation
      if (field.validation && value) {
        const error = field.validation(value)
        if (error) {
          newErrors[field.name] = error
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={String(field.name)} className="space-y-2">
          <label className="block text-sm font-medium text-robbie-light">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>

          {field.type === 'textarea' ? (
            <textarea
              value={String(formData[field.name] || '')}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-4 py-2 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light placeholder:text-robbie-light/40 focus:border-robbie-accent focus:ring-2 focus:ring-robbie-accent/20 transition-all"
              rows={4}
            />
          ) : field.type === 'select' ? (
            <select
              value={String(formData[field.name] || '')}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full px-4 py-2 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light focus:border-robbie-accent focus:ring-2 focus:ring-robbie-accent/20 transition-all"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(opt => (
                <option key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'checkbox' ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData[field.name])}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="w-5 h-5 rounded border-robbie-accent/30 bg-robbie-darker/50 text-robbie-accent focus:ring-2 focus:ring-robbie-accent/20"
              />
              <span className="text-sm text-robbie-light/80">{field.placeholder}</span>
            </label>
          ) : (
            <input
              type={field.type}
              value={String(formData[field.name] || '')}
              onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-4 py-2 bg-robbie-darker/50 border border-robbie-accent/30 rounded-lg text-robbie-light placeholder:text-robbie-light/40 focus:border-robbie-accent focus:ring-2 focus:ring-robbie-accent/20 transition-all"
            />
          )}

          {errors[field.name] && (
            <p className="text-sm text-red-400">{errors[field.name]}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-robbie-accent to-pink-500 text-white font-semibold hover:shadow-lg hover:shadow-robbie-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  )
}

export default CrudForm


