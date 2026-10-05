import { BaseProvider } from './base.provider';
import { GenerateRequest, GenerateResponse, CostEstimate } from '../types';

/**
 * مزود وهمي للاختبار المحلي بدون تكلفة.
 * يعيد ردوداً ثابتة بناءً على نوع المهمة.
 */
export class MockProvider extends BaseProvider {
  readonly name = 'mock';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    // محاكاة تأخير واقعي
    await new Promise((resolve) => setTimeout(resolve, 300));

    const content = this.generateMockContent(request);

    return {
      content,
      provider: this.name,
      model: 'mock-model',
      tokensUsed: {
        input: Math.ceil(request.prompt.length / 4),
        output: Math.ceil(content.length / 4),
        total: Math.ceil((request.prompt.length + content.length) / 4),
      },
      estimatedCost: 0,
      latencyMs: Date.now() - startTime,
    };
  }

  async estimateCost(_request: GenerateRequest): Promise<CostEstimate> {
    return { estimatedCostUsd: 0, estimatedTokens: 0 };
  }

  private generateMockContent(request: GenerateRequest): string {
    const platform = (request.context?.platform as string) || 'unknown';

    const responses: Record<string, string> = {
      risk_analysis:
        `[رد تجريبي] بناءً على البيانات المقدمة، يبدو أن خطر عدم حضور المريض مرتفع نسبياً. ` +
        `يُنصح بالتواصل المباشر قبل الموعد بـ 24 ساعة. (المنصة: ${platform})`,

      summarization:
        `[رد تجريبي] الملخص: إدارة الوقت وتنظيم الأولويات أساسيان لتوازن المدرب. ` +
        `الأدوات الرقمية تساهم في رفع الإنتاجية.`,

      content_generation:
        `[رد تجريبي] محتوى مقترح للدورة التدريبية. يتم توليد هذا الرد من Mock Provider.`,

      default: `[رد تجريبي] تم استلام الطلب بنجاح. نوع المهمة: ${request.taskType}.`,
    };

    return responses[request.taskType] || responses.default;
  }
}