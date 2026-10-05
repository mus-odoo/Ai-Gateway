import { CostRecord } from '../types';

/**
 * يتتبع التكلفة عبر المنصات والمهام
 */
export class CostTracker {
  private records: CostRecord[] = [];

  record(record: CostRecord): void {
    this.records.push(record);
  }

  /**
   * التكلفة الإجمالية
   */
  getTotalCost(): number {
    return this.records.reduce((sum, r) => sum + r.cost, 0);
  }

  /**
   * التكلفة حسب المنصة
   */
  getCostByPlatform(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const record of this.records) {
      result[record.platform] = (result[record.platform] || 0) + record.cost;
    }
    return result;
  }

  /**
   * التكلفة حسب المزود
   */
  getCostByProvider(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const record of this.records) {
      result[record.provider] = (result[record.provider] || 0) + record.cost;
    }
    return result;
  }

  /**
   * التكلفة حسب نوع المهمة
   */
  getCostByTaskType(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const record of this.records) {
      result[record.taskType] = (result[record.taskType] || 0) + record.cost;
    }
    return result;
  }

  /**
   * إرجاع كل السجلات
   */
  getAllRecords(): CostRecord[] {
    return [...this.records];
  }

  reset(): void {
    this.records = [];
  }
}