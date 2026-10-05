import { GenerateRequest, RoutingRules } from '../types';

/**
 * يقرر أي مزود يستخدم لكل طلب
 */
export class TaskRouter {
  constructor(private readonly rules: RoutingRules) {}

  /**
   * اختيار المزود الأساسي للطلب
   */
  route(request: GenerateRequest): string {
    const platform = request.context?.platform as string | undefined;

    // 1. إذا كانت البيانات حساسة، احترم قواعد الحساسية أولاً
    const allowedForSensitivity = this.rules.sensitivityRules[request.dataSensitivity];

    // 2. إذا كانت هناك قاعدة خاصة بالمنصة
    if (platform && this.rules.platformRules[platform]) {
      const platformRule = this.rules.platformRules[platform];

      // تحقق من أن المزود المفضل مسموح به لهذه الحساسية
      if (allowedForSensitivity.includes(platformRule.preferredProvider)) {
        return platformRule.preferredProvider;
      }

      // وإلا، استخدم الاحتياطي
      if (allowedForSensitivity.includes(platformRule.fallbackProvider)) {
        return platformRule.fallbackProvider;
      }
    }

    // 3. القاعدة الافتراضية حسب نوع المهمة
    const defaultProvider = this.rules.defaultProvider[request.taskType];

    // تحقق من أن المزود الافتراضي مسموح لهذه الحساسية
    if (allowedForSensitivity.includes(defaultProvider)) {
      return defaultProvider;
    }

    // 4. أي مزود مسموح بهذه الحساسية
    if (allowedForSensitivity.length > 0) {
      return allowedForSensitivity[0];
    }

    throw new Error(
      `No provider allowed for sensitivity level: ${request.dataSensitivity}`,
    );
  }

  /**
   * إرجاع قائمة المزودين بترتيب الأولوية (للاحتياط)
   */
  routeWithFallbacks(request: GenerateRequest): string[] {
    const primary = this.route(request);
    const platform = request.context?.platform as string | undefined;
    const allowed = this.rules.sensitivityRules[request.dataSensitivity];

    const ordered = [primary];

    // أضف الاحتياطي الخاص بالمنصة
    if (platform && this.rules.platformRules[platform]) {
      const fallback = this.rules.platformRules[platform].fallbackProvider;
      if (!ordered.includes(fallback) && allowed.includes(fallback)) {
        ordered.push(fallback);
      }
    }

    // أضف باقي المزودين المسموحين
    for (const provider of allowed) {
      if (!ordered.includes(provider)) {
        ordered.push(provider);
      }
    }

    return ordered;
  }
}