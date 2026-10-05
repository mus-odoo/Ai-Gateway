// ============================================
// AI Gateway - نقطة الدخول الرئيسية
// ============================================

// المنسق الرئيسي
export { AIGateway } from './gateway';
export type { AIGatewayConfig } from './gateway';

// المزودون
export { MockProvider } from './providers/mock.provider';
export { OpenAIProvider } from './providers/openai.provider';
export { MiniMaxProvider } from './providers/minimax.provider';
export { BaseProvider, ProviderError } from './providers/base.provider';
export type { AIProvider } from './providers/base.provider';
export { createProviders, createProvidersFromEnv } from './providers/provider.factory';

// قواعد التوجيه
export { defaultRoutingRules } from './routing/routing-rules';
export { TaskRouter } from './routing/task-router';

// الحوكمة
export { CostGuard } from './governance/cost-guard';

// المرونة
export { FallbackManager } from './resilience/fallback';

// الرؤية
export { Logger } from './observability/logger';
export { CostTracker } from './observability/cost-tracker';

// الأنواع
export type {
  TaskType,
  DataSensitivity,
  ThinkingDepth,
  GenerateRequest,
  GenerateResponse,
  CostEstimate,
  RoutingRules,
  PlatformRule,
  CostLimits,
  CostRecord,
} from './types';