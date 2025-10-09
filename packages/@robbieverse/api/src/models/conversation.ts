export interface Conversation {
  id: string;
  user_id: string;
  session_id: string;
  timestamp: Date;
  context_type: 'code' | 'chat' | 'strategy' | 'business';
  title?: string;
  summary?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  embedding?: number[];
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CodeBlock {
  id: string;
  file_path: string;
  content: string;
  language: string;
  embedding: number[];
  tags: string[];
  session_id: string;
  conversation_id?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface LearnedPattern {
  id: string;
  pattern_type: 'api_convention' | 'component_pattern' | 'error_handling' | 'architecture';
  example: string;
  frequency: number;
  last_used: Date;
  embedding: number[];
  user_id: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  source_type: 'conversation' | 'code_block' | 'pattern';
  metadata?: Record<string, any>;
}

