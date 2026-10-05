import { RoutingRules } from '../types';

/**
 * القواعد الافتراضية للتوجيه
 * يمكن لكل منصة تخصيصها
 */
export const defaultRoutingRules: RoutingRules = {
  /**
   * المزود الافتراضي لكل نوع مهمة
   */
  defaultProvider: {
    risk_analysis: 'openai',              // دقة عالية
    content_generation: 'minimax',        // حجم كبير
    summarization: 'minimax',             // مهمة بسيطة
    classification: 'minimax',            // مهمة بسيطة
    code_generation: 'openai',            // جودة عالية
    translation: 'minimax',               // حجم كبير
    recommendation: 'openai',             // تحتاج تفكير
    data_extraction: 'minimax',           // مهمة بسيطة
    training_content: 'minimax',          // حجم كبير
    islamic_content_analysis: 'openai',   // دقة عالية
  },

  /**
   * المزودون المسموحون حسب حساسية البيانات
   */
  sensitivityRules: {
    public: ['openai', 'minimax'],
    internal: ['openai', 'minimax'],
    confidential: ['openai', 'minimax'],
    sensitive: ['openai'],       // OpenAI فقط للبيانات الحساسة
    sovereign: ['openai'],       // أو مزود محلي
  },

  /**
   * قواعد خاصة بكل منصة
   */
  platformRules: {
    edrak: {
      preferredProvider: 'openai',
      fallbackProvider: 'minimax',
      monthlyBudgetUsd: 2000,
    },
    farah: {
      preferredProvider: 'minimax',
      fallbackProvider: 'openai',
      monthlyBudgetUsd: 500,
    },
    'alhamd-academy': {
      preferredProvider: 'minimax',
      fallbackProvider: 'openai',
      monthlyBudgetUsd: 500,
    },
  },
};