/**
 * useAutoLog - Automatically log state changes
 * Wraps useState with intelligent logging
 */
import { useState, useEffect, useRef } from 'react'
import { logState } from '../utils/robbieLogger'

/**
 * Drop-in replacement for useState that automatically logs changes
 */
export function useAutoLog<T>(
  initialValue: T,
  componentName: string,
  propertyName: string
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue)
  const prevValueRef = useRef<T>(initialValue)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip logging on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Log if value changed
    if (value !== prevValueRef.current) {
      logState.change(componentName, propertyName, prevValueRef.current, value)
      prevValueRef.current = value
    }
  }, [value, componentName, propertyName])

  return [value, setValue]
}

/**
 * Automatically log all state changes in an object
 */
export function useAutoLogObject<T extends Record<string, any>>(
  initialState: T,
  componentName: string
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState)
  const prevStateRef = useRef<T>(initialState)

  const updateState = (updates: Partial<T>) => {
    setState((prev) => {
      const next = { ...prev, ...updates }
      
      // Log each changed property
      Object.keys(updates).forEach((key) => {
        if (prev[key] !== updates[key]) {
          logState.change(componentName, key, prev[key], updates[key])
        }
      })

      return next
    })
  }

  return [state, updateState]
}

