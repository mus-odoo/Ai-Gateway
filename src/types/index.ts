// ============================================
// الأنواع الأساسية لطبقة التجريد
// ============================================

/**
 * أنواع المهام المدعومة
 * كل منصة تستخدم هذه الأنواع لتحديد نوع العملية
 */
export type TaskType =
  | 'risk_analysis'           // تحليل المخاطر (إدراك)
  | 'content_generation'      // توليد المحتوى
  | 'summarization'           // التلخيص
  | 'classification'          // التصنيف
  | 'code_generation'         // توليد الكود
  | 'translation'             // الترجمة
  | 'recommendation'          // التوصيات
  | 'data_extraction'         // استخراج البيانات
  | 'training_content'        // محتوى تدريبي (فرح)
  | 'islamic_content_analysis'; // تحليل المحتوى الإسلامي (الحمد)

/**
 * مستويات حساسية البيانات
 */
export type DataSensitivity =
  | 'public'        // عام
  | 'internal'      // داخلي
  | 'confidential'  // سري
  | 'sensitive'     // حساس
  | 'sovereign';    // سيادي

/**
 * عمق التفكير (لنماذج MiniMax)
 */
export type ThinkingDepth = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

/**
 * طلب التوليد
 */
export interface GenerateRequest {
  taskType: TaskType;
  prompt: string;
  systemPrompt?: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
  thinkingDepth?: ThinkingDepth;
  dataSensitivity: DataSensitivity;
  requiresZeroRetention?: boolean;
}

/**
 * استجابة التوليد
 */
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

/**
 * تقدير التكلفة
 */
export interface CostEstimate {
  estimatedCostUsd: number;
  estimatedTokens: number;
}

/**
 * قواعد التوجيه
 */
export interface RoutingRules {
  defaultProvider: Record<TaskType, string>;
  sensitivityRules: Record<DataSensitivity, string[]>;
  platformRules: Record<string, PlatformRule>;
}

export interface PlatformRule {
  preferredProvider: string;
  fallbackProvider: string;
  monthlyBudgetUsd: number;
}

/**
 * حدود التكلفة
 */
export interface CostLimits {
  globalMonthlyLimitUsd: number;
  platformLimits: Record<string, number>;
}

/**
 * سجل التكلفة
 */
export interface CostRecord {
  platform: string;
  taskType: TaskType;
  provider: string;
  cost: number;
  tokens: number;
  timestamp: Date;
}