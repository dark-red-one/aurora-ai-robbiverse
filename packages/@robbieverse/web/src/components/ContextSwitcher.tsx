/**
 * Context Switcher - Multi-Context Management UI
 * Allows users to switch between TestPilot, Aurora Town, Presidential privileges, etc.
 */

import React, { useState, useEffect } from 'react';

interface Context {
  type: 'town' | 'company' | 'role';
  id: string;
  name: string;
  displayName: string;
  permissions: Record<string, boolean>;
  isActive?: boolean;
}

interface ActiveContext extends Context {
  switchedAt: string;
}

interface ContextSwitcherProps {
  userId: string;
  sessionId?: string;
  onContextChange?: (context: ActiveContext) => void;
}

export function ContextSwitcher({ 
  userId, 
  sessionId = 'default',
  onContextChange 
}: ContextSwitcherProps) {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's available contexts
  useEffect(() => {
    fetchContexts();
    fetchCurrentContext();
  }, [userId]);

  async function fetchContexts() {
    try {
      const response = await fetch(`/api/contexts/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch contexts');
      const data = await response.json();
      setContexts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contexts');
    }
  }

  async function fetchCurrentContext() {
    try {
      setLoading(true);
      const response = await fetch(`/api/contexts/current/${userId}?session_id=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch current context');
      const data = await response.json();
      setActiveContext(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load current context');
      setLoading(false);
    }
  }

  async function switchTo(context: Context) {
    try {
      const response = await fetch('/api/contexts/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          context_type: context.type,
          context_id: context.id,
          session_id: sessionId
        })
      });

      if (!response.ok) throw new Error('Failed to switch context');
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh current context
        await fetchCurrentContext();
        setIsOpen(false);
        
        // Notify parent component
        if (onContextChange && activeContext) {
          onContextChange(activeContext);
        }
        
        // Reload page data with new context
        window.location.reload();
      } else {
        setError(result.error || 'Failed to switch context');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch context');
    }
  }

  function getContextIcon(type: string, id: string): string {
    if (id === 'president') return '👑';
    if (type === 'town') return '🏛️';
    if (type === 'company') return '🏢';
    if (type === 'role') return '🎭';
    return '📍';
  }

  function getContextColor(type: string, id: string): string {
    if (id === 'president') return 'bg-gradient-to-r from-yellow-400 to-amber-600';
    if (type === 'town') return 'bg-blue-600';
    if (type === 'company') return 'bg-purple-600';
    if (type === 'role') return 'bg-pink-600';
    return 'bg-gray-600';
  }

  if (loading) {
    return (
      <div className="flex items-center px-4 py-2 text-sm text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span className="ml-2">Loading contexts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-sm text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Current Context Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          transition-all duration-200 text-white font-medium
          ${activeContext ? getContextColor(activeContext.type, activeContext.id) : 'bg-gray-700'}
          hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        `}
      >
        <span className="text-lg">
          {activeContext && getContextIcon(activeContext.type, activeContext.id)}
        </span>
        <span className="text-sm">
          {activeContext?.displayName || 'Select Context'}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
          <div className="p-2">
            <div className="text-xs text-gray-400 font-semibold uppercase px-3 py-2">
              Switch Context
            </div>
            
            {contexts.map((context) => {
              const isActive = activeContext?.id === context.id && activeContext?.type === context.type;
              
              return (
                <button
                  key={`${context.type}-${context.id}`}
                  onClick={() => switchTo(context)}
                  disabled={isActive}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md
                    transition-all duration-150 text-left
                    ${isActive 
                      ? 'bg-gray-700 cursor-default' 
                      : 'hover:bg-gray-700 cursor-pointer'
                    }
                  `}
                >
                  <span className="text-xl">
                    {getContextIcon(context.type, context.id)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {context.displayName}
                      </span>
                      {isActive && (
                        <span className="text-xs text-green-400 font-semibold">✓ Active</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {context.type}
                    </div>
                  </div>
                  {context.id === 'president' && (
                    <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded font-bold">
                      ALL ACCESS
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Current Context Info */}
          {activeContext && (
            <div className="border-t border-gray-700 p-3 bg-gray-900">
              <div className="text-xs text-gray-400 mb-1">Current Permissions:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(activeContext.permissions).map(([key, value]) => (
                  value && (
                    <span 
                      key={key}
                      className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded"
                    >
                      {key.replace(/_/g, ' ')}
                    </span>
                  )
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Switched: {new Date(activeContext.switchedAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default ContextSwitcher;

