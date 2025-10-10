import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TouchReadyItem {
  id: string;
  contact: {
    name: string;
    company: string;
    avatar?: string;
  };
  draft: string;
  rationale: string;
  channel: 'email' | 'linkedin' | 'slack' | 'phone';
  confidence: number;
  context: string[];
}

export const TouchReadyQueue: React.FC = () => {
  const [items, setItems] = useState<TouchReadyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTouchReadyItems();
    const interval = setInterval(fetchTouchReadyItems, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchTouchReadyItems = async () => {
    try {
      const response = await fetch('/api/touch-ready');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch touch-ready items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (itemId: string) => {
    try {
      await fetch(`/api/touch-ready/${itemId}/approve`, { method: 'POST' });
      setItems(items.filter(i => i.id !== itemId));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleEdit = (itemId: string) => {
    // Open compose modal with draft
    console.log('Edit:', itemId);
  };

  const handleSkip = async (itemId: string) => {
    try {
      await fetch(`/api/touch-ready/${itemId}/skip`, { method: 'POST' });
      setItems(items.filter(i => i.id !== itemId));
    } catch (error) {
      console.error('Failed to skip:', error);
    }
  };

  const handleNotRelevant = async (itemId: string) => {
    try {
      await fetch(`/api/touch-ready/${itemId}/not-relevant`, { method: 'POST' });
      setItems(items.filter(i => i.id !== itemId));
    } catch (error) {
      console.error('Failed to mark not relevant:', error);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return '📧';
      case 'linkedin': return '💼';
      case 'slack': return '💬';
      case 'phone': return '📱';
      default: return '📨';
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'linkedin': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'slack': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'phone': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">All Caught Up!</h3>
        <p className="text-gray-500">No touch-ready opportunities right now. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">💡 Touch-Ready Queue</h2>
          <p className="text-gray-400 text-sm mt-1">AI-drafted follow-ups ready to send</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">{items.length} opportunities</span>
          <button
            onClick={fetchTouchReadyItems}
            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-5 hover:border-purple-500/50 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {item.contact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.contact.name}</h3>
                  <p className="text-sm text-gray-400">{item.contact.company}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs ${getChannelColor(item.channel)}`}>
                <span>{getChannelIcon(item.channel)}</span>
                <span className="capitalize">{item.channel}</span>
              </div>
            </div>

            {/* Draft Message */}
            <div className="bg-gray-900/50 rounded p-4 mb-4">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Draft Message:</div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{item.draft}</p>
            </div>

            {/* Rationale */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Why Now:</div>
              <p className="text-gray-400 text-sm">{item.rationale}</p>
            </div>

            {/* Context Tags */}
            {item.context && item.context.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {item.context.map((ctx, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-purple-500/10 text-purple-300 rounded">
                    {ctx}
                  </span>
                ))}
              </div>
            )}

            {/* Confidence Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Confidence:</span>
                <span className="text-gray-300">{Math.round(item.confidence * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${item.confidence * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(item.id)}
                className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg font-medium transition-colors"
              >
                ✅ Approve & Send
              </button>
              <button
                onClick={() => handleEdit(item.id)}
                className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg font-medium transition-colors"
              >
                ✏️ Edit Draft
              </button>
              <button
                onClick={() => handleSkip(item.id)}
                className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border border-gray-500/30 rounded-lg font-medium transition-colors"
              >
                ⏭️ Skip
              </button>
              <button
                onClick={() => handleNotRelevant(item.id)}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-medium transition-colors"
              >
                ❌
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TouchReadyQueue;






