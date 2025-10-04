import React, { useState, useRef, useEffect } from 'react';
import { WidgetProps, WidgetEvent, LLMRequest, LLMResponse } from '../types';
import './ChatWidget.css';

export interface ChatWidgetConfig {
  id: string;
  title?: string;
  placeholder?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  height?: string;
  showTyping?: boolean;
  avatar?: {
    user?: string;
    assistant?: string;
  };
  welcomeMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

export interface ChatWidgetData {
  messages?: ChatMessage[];
  sessionId?: string;
  context?: Record<string, any>;
}

export interface ChatWidgetProps extends WidgetProps {
  config: ChatWidgetConfig;
  data?: ChatWidgetData;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  config,
  data,
  onEvent,
  analytics
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(
    data?.messages || (config.welcomeMessage ? [{
      id: 'welcome',
      role: 'assistant',
      content: config.welcomeMessage,
      timestamp: new Date()
    }] : [])
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    if (config.showTyping) {
      setIsTyping(true);
    }

    // Track message sent
    analytics?.track('chat_message_sent', {
      widget_id: config.id,
      message_length: input.length,
      session_id: data?.sessionId
    });

    try {
      const llmRequest: LLMRequest = {
        prompt: input.trim(),
        model: config.model || 'gpt-3.5-turbo',
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1000,
        stream: config.stream || false
      };

      // Emit event for LLM processing
      const event: WidgetEvent = {
        type: 'llm_request',
        widgetId: config.id,
        data: {
          request: llmRequest,
          context: data?.context,
          sessionId: data?.sessionId,
          messageHistory: messages.slice(-5) // Last 5 messages for context
        }
      };

      onEvent?.(event);

      // Simulate API call (in real implementation, this would be handled by the parent)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I received your message: "${input.trim()}". This is a demo response from the Chat Widget. In a real implementation, this would be connected to the SuperfastLLMEngine.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Track response received
      analytics?.track('chat_response_received', {
        widget_id: config.id,
        response_length: assistantMessage.content.length,
        session_id: data?.sessionId
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      analytics?.track('chat_error', {
        widget_id: config.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const formatMessage = (content: string) => {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  };

  useEffect(() => {
    // Track widget impression
    analytics?.track('chat_widget_impression', {
      widget_id: config.id,
      initial_message_count: messages.length
    });
  }, []);

  return (
    <div 
      className={`chat-widget chat-widget--${config.theme || 'dark'}`}
      style={{ height: config.height || '500px' }}
      data-widget-id={config.id}
    >
      {config.title && (
        <div className="chat-widget__header">
          <h3 className="chat-widget__title">{config.title}</h3>
        </div>
      )}

      <div className="chat-widget__messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message chat-message--${message.role}`}
          >
            {config.avatar && (
              <div className="chat-message__avatar">
                {message.role === 'user' ? (
                  config.avatar.user ? (
                    <img src={config.avatar.user} alt="User" />
                  ) : (
                    <div className="chat-message__avatar-default">U</div>
                  )
                ) : (
                  config.avatar.assistant ? (
                    <img src={config.avatar.assistant} alt="Assistant" />
                  ) : (
                    <div className="chat-message__avatar-default">🤖</div>
                  )
                )}
              </div>
            )}
            
            <div className="chat-message__content">
              <div className="chat-message__bubble">
                <div 
                  className="chat-message__text"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(message.content) 
                  }}
                />
                <div className="chat-message__timestamp">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message__content">
              <div className="chat-message__bubble">
                <div className="chat-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-widget__input-form" onSubmit={handleSubmit}>
        <div className="chat-widget__input-container">
          <textarea
            ref={inputRef}
            className="chat-widget__input"
            placeholder={config.placeholder || "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            rows={1}
          />
          <button
            type="submit"
            className="chat-widget__send-button"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <div className="chat-widget__loading-spinner" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWidget;
