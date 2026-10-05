import {
  GenerateRequest,
  GenerateResponse,
  CostEstimate,
} from '../types';
import { BaseProvider, ProviderError } from './base.provider';

interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

/**
 * أسعار OpenAI (تقديرية - يجب تحديثها دورياً)
 * السعر لكل رمز واحد بالدولار
 */
const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-6-astra-mini': { input: 0.0000005, output: 0.000002 },
  'gpt-6-astra': { input: 0.0000025, output: 0.00001 },
  'gpt-6.1-sol': { input: 0.000003, output: 0.000012 },
};

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(config: OpenAIConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.defaultModel = config.defaultModel || 'gpt-6-astra';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();
    const model = this.selectModel(request);

    const messages: Array<{ role: string; content: string }> = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProviderError(
        this.name,
        `HTTP_${response.status}`,
        errorText,
        response.status >= 500 || response.status === 429,
      );
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    const latencyMs = Date.now() - startTime;
    const usage = data.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    return {
      content: data.choices[0]?.message?.content || '',
      provider: this.name,
      model,
      tokensUsed: {
        input: usage.prompt_tokens,
        output: usage.completion_tokens,
        total: usage.total_tokens,
      },
      estimatedCost: this.calculateCost(model, usage),
      latencyMs,
    };
  }

  async estimateCost(request: GenerateRequest): Promise<CostEstimate> {
    const inputTokens = this.estimateTokens(request.prompt + (request.systemPrompt || ''));
    const outputTokens = request.maxTokens || 4096;
    const totalTokens = inputTokens + outputTokens;

    const model = this.selectModel(request);
    const cost = this.calculateCost(model, {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: totalTokens,
    });

    return { estimatedCostUsd: cost, estimatedTokens: totalTokens };
  }

  /**
   * اختيار النموذج بناءً على المهمة وحساسية البيانات
   */
  private selectModel(request: GenerateRequest): string {
    // البيانات السيادية تحتاج النموذج الأكثر أماناً
    if (request.dataSensitivity === 'sovereign' || request.requiresZeroRetention) {
      return 'gpt-6.1-sol';
    }

    // توليد الكود يحتاج النموذج الأقوى
    if (request.taskType === 'code_generation' || request.taskType === 'risk_analysis') {
      return 'gpt-6.1-sol';
    }

    // المهام البسيطة تستخدم النموذج الأخف
    if (
      request.taskType === 'summarization' ||
      request.taskType === 'translation' ||
      request.taskType === 'classification'
    ) {
      return 'gpt-6-astra-mini';
    }

    return this.defaultModel;
  }

  private calculateCost(
    model: string,
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
  ): number {
    const pricing = OPENAI_PRICING[model] || OPENAI_PRICING['gpt-6-astra'];
    return (
      usage.prompt_tokens * pricing.input +
      usage.completion_tokens * pricing.output
    );
  }
}