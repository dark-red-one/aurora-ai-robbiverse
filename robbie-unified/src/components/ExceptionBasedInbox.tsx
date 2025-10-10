import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  urgency: number;
  timestamp: Date;
  channel: 'email' | 'slack' | 'sms';
  category: 'urgent' | 'touch-ready' | 'normal';
}

export const ExceptionBasedInbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'touch-ready' | 'normal'>('all');
  const [showNormal, setShowNormal] = useState(false);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/inbox');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleReply = (messageId: string) => {
    console.log('Reply to:', messageId);
  };

  const handleSnooze = async (messageId: string) => {
    try {
      await fetch(`/api/inbox/${messageId}/snooze`, { method: 'POST' });
      setMessages(messages.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Failed to snooze:', error);
    }
  };

  const handleArchive = async (messageId: string) => {
    try {
      await fetch(`/api/inbox/${messageId}/archive`, { method: 'POST' });
      setMessages(messages.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return '📧';
      case 'slack': return '💬';
      case 'sms': return '📱';
      default: return '📨';
    }
  };

  const urgentMessages = messages.filter(m => m.category === 'urgent');
  const touchReadyMessages = messages.filter(m => m.category === 'touch-ready');
  const normalMessages = messages.filter(m => m.category === 'normal');

  const filteredMessages = filter === 'all' ? messages : messages.filter(m => m.category === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">📬 Inbox</h2>
          <p className="text-gray-400 text-sm mt-1">Exception-based - only what needs attention</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All', count: messages.length },
            { id: 'urgent', label: 'Urgent', count: urgentMessages.length },
            { id: 'touch-ready', label: 'Touch-Ready', count: touchReadyMessages.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Urgent Section */}
      {urgentMessages.length > 0 && (filter === 'all' || filter === 'urgent') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-red-400">🔴 URGENT ({urgentMessages.length})</h3>
          </div>
          <div className="space-y-2">
            {urgentMessages.map((msg, index) => (
              <MessageCard
                key={msg.id}
                message={msg}
                onReply={handleReply}
                onSnooze={handleSnooze}
                onArchive={handleArchive}
                index={index}
                variant="urgent"
              />
            ))}
          </div>
        </div>
      )}

      {/* Touch-Ready Section */}
      {touchReadyMessages.length > 0 && (filter === 'all' || filter === 'touch-ready') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-blue-400">💡 TOUCH-READY ({touchReadyMessages.length})</h3>
          </div>
          <div className="space-y-2">
            {touchReadyMessages.map((msg, index) => (
              <MessageCard
                key={msg.id}
                message={msg}
                onReply={handleReply}
                onSnooze={handleSnooze}
                onArchive={handleArchive}
                index={index}
                variant="touch-ready"
              />
            ))}
          </div>
        </div>
      )}

      {/* Normal Section (Collapsed by default) */}
      {normalMessages.length > 0 && filter === 'all' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowNormal(!showNormal)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm">
              {showNormal ? '▼' : '▶'} NORMAL ({normalMessages.length} messages)
            </span>
          </button>
          <AnimatePresence>
            {showNormal && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2"
              >
                {normalMessages.map((msg, index) => (
                  <MessageCard
                    key={msg.id}
                    message={msg}
                    onReply={handleReply}
                    onSnooze={handleSnooze}
                    onArchive={handleArchive}
                    index={index}
                    variant="normal"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {filteredMessages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Inbox Zero!</h3>
          <p className="text-gray-500">All caught up. Great job!</p>
        </div>
      )}
    </div>
  );
};

const MessageCard: React.FC<{
  message: Message;
  onReply: (id: string) => void;
  onSnooze: (id: string) => void;
  onArchive: (id: string) => void;
  index: number;
  variant: 'urgent' | 'touch-ready' | 'normal';
}> = ({ message, onReply, onSnooze, onArchive, index, variant }) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'urgent': return 'border-red-500/50 hover:border-red-500';
      case 'touch-ready': return 'border-blue-500/50 hover:border-blue-500';
      default: return 'border-gray-700 hover:border-gray-600';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return '📧';
      case 'slack': return '💬';
      case 'sms': return '📱';
      default: return '📨';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-gray-800/50 backdrop-blur-sm rounded-lg border ${getBorderColor()} p-4 transition-colors cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-2xl">{getChannelIcon(message.channel)}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white">{message.from}</h4>
              {variant === 'urgent' && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                  URGENT
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{message.subject}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-3 line-clamp-2">{message.preview}</p>

      <div className="flex gap-2">
        <button
          onClick={() => onReply(message.id)}
          className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded text-sm transition-colors"
        >
          💬 Reply
        </button>
        <button
          onClick={() => onSnooze(message.id)}
          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded text-sm transition-colors"
        >
          ⏰ Snooze
        </button>
        <button
          onClick={() => onArchive(message.id)}
          className="px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 border border-gray-500/30 rounded text-sm transition-colors"
        >
          ✓ Archive
        </button>
      </div>
    </motion.div>
  );
};

export default ExceptionBasedInbox;






