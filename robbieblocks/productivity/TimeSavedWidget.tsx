import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TimeSavedData {
  today: number;
  week: number;
  month: number;
  breakdown: {
    action: string;
    count: number;
    timePerAction: number;
    totalTime: number;
  }[];
}

export const TimeSavedWidget: React.FC = () => {
  const [data, setData] = useState<TimeSavedData>({
    today: 0,
    week: 0,
    month: 0,
    breakdown: []
  });
  const [view, setView] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchTimeSavedData();
    const interval = setInterval(fetchTimeSavedData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchTimeSavedData = async () => {
    try {
      const response = await fetch('/api/time-saved');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch time-saved data:', error);
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getCurrentValue = () => {
    switch (view) {
      case 'today': return data.today;
      case 'week': return data.week;
      case 'month': return data.month;
      default: return data.today;
    }
  };

  const getValueColor = (minutes: number) => {
    if (minutes >= 120) return 'text-green-400'; // 2+ hours
    if (minutes >= 60) return 'text-blue-400';   // 1+ hour
    return 'text-purple-400';                     // < 1 hour
  };

  const currentValue = getCurrentValue();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            ⏰ Time Saved
          </h3>
          <p className="text-xs text-gray-400 mt-1">by Robbie's automation</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-1 bg-gray-700/50 rounded-lg p-1">
          {['today', 'week', 'month'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                view === v
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Value */}
      <div className="text-center mb-6">
        <motion.div
          key={currentValue}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-6xl font-bold mb-2 ${getValueColor(currentValue)}`}
        >
          {formatTime(currentValue)}
        </motion.div>
        <div className="text-sm text-gray-400">
          {view === 'today' && 'saved today'}
          {view === 'week' && 'saved this week'}
          {view === 'month' && 'saved this month'}
        </div>
      </div>

      {/* Breakdown */}
      {data.breakdown && data.breakdown.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-3">Breakdown:</div>
          {data.breakdown.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 bg-gray-700/30 rounded"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">{item.action}</span>
                <span className="text-xs text-gray-500">×{item.count}</span>
              </div>
              <div className="text-sm font-medium text-gray-300">
                {formatTime(item.totalTime)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Value Proposition */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          {currentValue >= 120 && (
            <span className="text-green-400">
              💰 That's ${Math.round((currentValue / 60) * 200)}/hour in exec time saved!
            </span>
          )}
          {currentValue >= 60 && currentValue < 120 && (
            <span className="text-blue-400">
              🎯 Keep it up! You're crushing it!
            </span>
          )}
          {currentValue < 60 && (
            <span className="text-purple-400">
              ⚡ Every minute counts!
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TimeSavedWidget;

