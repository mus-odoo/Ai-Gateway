import {
  GenerateRequest,
  GenerateResponse,
  CostEstimate,
  TaskType,
} from '../types';

/**
 * الواجهة التي يجب أن ينفذها كل مزود
 */
export interface AIProvider {
  /** اسم المزود للتعريف */
  readonly name: string;

  /** هل المزود جاهز للاستخدام؟ */
  isAvailable(): Promise<boolean>;

  /** الدالة الأساسية لتوليد الاستجابة */
  generate(request: GenerateRequest): Promise<GenerateResponse>;

  /** تقدير التكلفة قبل التنفيذ */
  estimateCost(request: GenerateRequest): Promise<CostEstimate>;

  /** هل يدعم هذا المزود نوع المهمة؟ */
  supportsTask(taskType: TaskType): boolean;
}

/**
 * خطأ موحد من أي مزود
 */
export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly code: string,
    message: string,
    public readonly retryable: boolean = false,
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'ProviderError';
  }
}

/**
 * فئة أساسية اختيارية تساعد المزودين
 */
export abstract class BaseProvider implements AIProvider {
  abstract readonly name: string;

  abstract isAvailable(): Promise<boolean>;
  abstract generate(request: GenerateRequest): Promise<GenerateResponse>;
  abstract estimateCost(request: GenerateRequest): Promise<CostEstimate>;

  supportsTask(_taskType: TaskType): boolean {
    // افتراضياً، المزود يدعم كل المهام
    return true;
  }

  /** تقدير تقريبي للرموز من النص */
  protected estimateTokens(text: string): number {
    // تقدير تقريبي: كل 4 أحرف = رمز واحد
    return Math.ceil(text.length / 4);
  }
}