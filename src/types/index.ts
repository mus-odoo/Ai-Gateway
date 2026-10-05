export interface GenerateRequest {
  taskType: TaskType;
  prompt: string;
  systemPrompt?: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  thinkingDepth?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  dataSensitivity: 'public' | 'internal' | 'confidential' | 'sensitive' | 'sovereign';
  requiresZeroRetention?: boolean;
}

export interface GenerateResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  estimatedCost: number;
  latencyMs: number;
  confidence?: number;
}

export type TaskType =
  | 'risk_analysis'
  | 'content_generation'
  | 'summarization'
  | 'classification'
  | 'code_generation'
  | 'translation'
  | 'recommendation'
  | 'data_extraction'
  | 'training_content'
  | 'islamic_content_analysis';