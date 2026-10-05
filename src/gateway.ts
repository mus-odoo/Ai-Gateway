import { AIProvider } from './providers/base.provider';
import { GenerateRequest, GenerateResponse, CostLimits, RoutingRules } from './types';
import { TaskRouter } from './routing/task-router';
import { CostGuard } from './governance/cost-guard';
import { CostTracker } from './observability/cost-tracker';
import { FallbackManager } from './resilience/fallback';
import { Logger } from './observability/logger';

export interface AIGatewayConfig {
  providers: AIProvider[];
  routingRules: RoutingRules;
  costLimits: CostLimits;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export class AIGateway {
  private readonly providers: Map<string, AIProvider>;
  private readonly router: TaskRouter;
  private readonly costGuard: CostGuard;
  private readonly costTracker: CostTracker;
  private readonly fallbackManager: FallbackManager;
  private readonly logger: Logger;

  constructor(config: AIGatewayConfig) {
    this.providers = new Map(config.providers.map((p) => [p.name, p]));
    this.router = new TaskRouter(config.routingRules);
    this.costGuard = new CostGuard(config.costLimits);
    this.costTracker = new CostTracker();
    this.fallbackManager = new FallbackManager(this.providers);
    this.logger = new Logger('ai-gateway', config.logLevel || 'info');
  }

  /**
   * توليد استجابة من المزود المناسب
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const platform = (request.context?.platform as string) || 'unknown';

    // 1. تحديد المزودين بترتيب الأولوية
    const providersOrder = this.router.routeWithFallbacks(request);

    // 2. تقدير التكلفة للتحقق
    const estimatedCost = await this.estimateCost(request, providersOrder[0]);

    // 3. التحقق من حدود التكلفة
    if (!this.costGuard.canProceed(estimatedCost.estimatedCostUsd, platform)) {
      throw new Error(
        `Cost limit exceeded for platform "${platform}". ` +
        `Remaining budget: $${this.costGuard.getRemainingBudget(platform).toFixed(2)}`,
      );
    }

    // 4. التنفيذ مع الاحتياط
    const response = await this.fallbackManager.executeWithFallback(
      providersOrder,
      request,
    );

    // 5. تسجيل التكلفة
    const costRecord = {
      platform,
      taskType: request.taskType,
      provider: response.provider,
      cost: response.estimatedCost,
      tokens: response.tokensUsed.total,
      timestamp: new Date(),
    };

    this.costTracker.record(costRecord);
    this.costGuard.record(costRecord);

    return response;
  }

  /**
   * تقدير التكلفة باستخدام مزود محدد
   */
  private async estimateCost(
    request: GenerateRequest,
    providerName: string,
  ): Promise<{ estimatedCostUsd: number; estimatedTokens: number }> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      // إذا لم يوجد المزود، أرجع تقديراً متحفظاً
      return { estimatedCostUsd: 0.01, estimatedTokens: 1000 };
    }
    return provider.estimateCost(request);
  }

  /**
   * إرجاع تقارير التكلفة
   */
  getCostReports() {
    return {
      total: this.costTracker.getTotalCost(),
      byPlatform: this.costTracker.getCostByPlatform(),
      byProvider: this.costTracker.getCostByProvider(),
      byTaskType: this.costTracker.getCostByTaskType(),
    };
  }

  /**
   * الميزانية المتبقية
   */
  getRemainingBudget(platform?: string): number {
    return this.costGuard.getRemainingBudget(platform);
  }
}