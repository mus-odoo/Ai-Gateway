import { AIProvider, ProviderError } from '../providers/base.provider';
import { GenerateRequest, GenerateResponse } from '../types';
import { Logger } from '../observability/logger';

/**
 * ينفذ الطلب مع محاولة مزودين متعددين عند الفشل
 */
export class FallbackManager {
  private readonly logger: Logger;

  constructor(private readonly providers: Map<string, AIProvider>) {
    this.logger = new Logger('fallback');
  }

  /**
   * حاول مع المزود الأساسي، ثم الاحتياط
   */
  async executeWithFallback(
    providerNames: string[],
    request: GenerateRequest,
  ): Promise<GenerateResponse> {
    const errors: Array<{ provider: string; error: Error }> = [];

    for (const providerName of providerNames) {
      const provider = this.providers.get(providerName);

      if (!provider) {
        this.logger.warn('Provider not found', { provider: providerName });
        continue;
      }

      if (!provider.supportsTask(request.taskType)) {
        this.logger.debug('Provider does not support task', {
          provider: providerName,
          taskType: request.taskType,
        });
        continue;
      }

      try {
        this.logger.info('Attempting generation', {
          provider: providerName,
          taskType: request.taskType,
        });

        const response = await provider.generate(request);

        this.logger.info('Generation succeeded', {
          provider: providerName,
          latencyMs: response.latencyMs,
        });

        return response;
      } catch (error) {
        const err = error as Error;
        errors.push({ provider: providerName, error: err });

        this.logger.warn('Provider failed, trying next', {
          provider: providerName,
          error: err.message,
          retryable: error instanceof ProviderError ? error.retryable : false,
        });

        // إذا كان الخطأ غير قابل لإعادة المحاولة (مثل خطأ في الطلب نفسه)،
        // لا فائدة من تجربة مزود آخر
        if (error instanceof ProviderError && !error.retryable) {
          throw error;
        }
      }
    }

    // كل المزودين فشلوا
    const errorMessages = errors.map((e) => `${e.provider}: ${e.error.message}`).join('; ');
    throw new Error(`All providers failed: ${errorMessages}`);
  }
}