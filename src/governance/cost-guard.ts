import { CostLimits, CostRecord } from '../types';

/**
 * يحمي من تجاوز حدود التكلفة
 */
export class CostGuard {
  private records: CostRecord[] = [];

  constructor(private readonly limits: CostLimits) {}

  /**
   * هل يمكن المضي في العملية؟
   */
  canProceed(estimatedCost: number, platform?: string): boolean {
    // 1. تحقق من الحد العام
    const globalSpent = this.getMonthlySpent();
    if (globalSpent + estimatedCost > this.limits.globalMonthlyLimitUsd) {
      return false;
    }

    // 2. تحقق من الحد الخاص بالمنصة
    if (platform && this.limits.platformLimits[platform]) {
      const platformSpent = this.getMonthlySpent(platform);
      if (platformSpent + estimatedCost > this.limits.platformLimits[platform]) {
        return false;
      }
    }

    return true;
  }

  /**
   * تسجيل عملية
   */
  record(record: CostRecord): void {
    this.records.push(record);
  }

  /**
   * المبلغ المُنفق هذا الشهر
   */
  getMonthlySpent(platform?: string): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.records
      .filter((r) => r.timestamp >= monthStart)
      .filter((r) => !platform || r.platform === platform)
      .reduce((sum, r) => sum + r.cost, 0);
  }

  /**
   * الميزانية المتبقية
   */
  getRemainingBudget(platform?: string): number {
    const limit = platform
      ? this.limits.platformLimits[platform] || 0
      : this.limits.globalMonthlyLimitUsd;

    return limit - this.getMonthlySpent(platform);
  }

  /**
   * إعادة تعيين السجلات (للاختبارات)
   */
  reset(): void {
    this.records = [];
  }
}