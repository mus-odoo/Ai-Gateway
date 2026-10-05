import {
  GenerateRequest,
  GenerateResponse,
  CostEstimate,
} from '../types';
import { BaseProvider, ProviderError } from './base.provider';

interface MiniMaxConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  groupId?: string;  // MiniMax يحتاج GroupId في بعض الحالات
}

/**
 * أسعار MiniMax (تقديرية)
 */
const MINIMAX_PRICING: Record<string, { input: number; output: number }> = {
  'MiniMax-M3.1-Flash-Preview': { input: 0.0000002, output: 0.0000008 },
  'MiniMax-M3': { input: 0.00000045, output: 0.0000018 },
  'MiniMax-M2.7': { input: 0.0000003, output: 0.0000012 },
};

export class MiniMaxProvider extends BaseProvider {
  readonly name = 'minimax';
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(config: MiniMaxConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.minimax.chat/v1';
    this.defaultModel = config.defaultModel || 'MiniMax-M3.1-Flash-Preview';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // MiniMax لا يوفر /models دائماً، لذا نستخدم فحصاً بسيطاً
      // يمكن تحسينه لاحقاً باستدعاء فعلي
      return !!this.apiKey;
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

    const body: Record<string, unknown> = {
      model,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7,
    };

    // إضافة عمق التفكير إن وُجد
    if (request.thinkingDepth) {
      body.thinking = { type: 'enabled', depth: request.thinkingDepth };
    }

    const response = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const latencyMs = Date.now() - startTime;
    const usage = {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
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

  private selectModel(request: GenerateRequest): string {
    // التفكير العميق يحتاج النموذج الأقوى
    if (request.thinkingDepth === 'max' || request.thinkingDepth === 'xhigh') {
      return 'MiniMax-M3';
    }
    return this.defaultModel;
  }

  private calculateCost(
    model: string,
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
  ): number {
    const pricing =
      MINIMAX_PRICING[model] || MINIMAX_PRICING['MiniMax-M3.1-Flash-Preview'];
    return (
      usage.prompt_tokens * pricing.input +
      usage.completion_tokens * pricing.output
    );
  }
}