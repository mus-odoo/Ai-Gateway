// ============================================
// AI Gateway - Basic Usage Example
// ============================================
// يوضح هذا الملف كيف تستخدم المنصات بوابة الذكاء
// ============================================

import 'dotenv/config';
import {
  AIGateway,
  createProvidersFromEnv,
  defaultRoutingRules,
} from '../src';
import process from 'process';

async function main() {
  console.log('==========================================');
  console.log('AI Gateway - Basic Usage Test');
  console.log('==========================================\n');

  // --------------------------------------------
  // 1. تهيئة البوابة
  // --------------------------------------------
  console.log('[1] Initializing AI Gateway...\n');

  const gateway = new AIGateway({
    providers: createProvidersFromEnv(),
    routingRules: defaultRoutingRules,
    costLimits: {
      globalMonthlyLimitUsd: Number(
        process.env.AI_GATEWAY_MONTHLY_LIMIT_GLOBAL || 500,
      ),
      platformLimits: {
        'edrak-academy': Number(
          process.env.AI_GATEWAY_MONTHLY_LIMIT_EDRAK_ACADEMY || 300,
        ),
      },
    },
    logLevel: 'info',
  });

  console.log('✓ Gateway initialized\n');

  // --------------------------------------------
  // 2. اختبار: توليد محتوى (EdrakAcademy)
  // --------------------------------------------
  console.log('[2] Testing content_generation for EdrakAcademy...\n');

  try {
    const response = await gateway.generate({
      taskType: 'content_generation',
      prompt:
        'اكتب وصفاً تعريفياً موجزاً لدورة تدريبية بعنوان "إدارة الوقت للمدربين المحترفين".',
      systemPrompt: 'أنت مساعد كتابة محتوى تعليمي. أجب بالعربية.',
      dataSensitivity: 'internal',
      maxTokens: 500,
      temperature: 0.7,
      context: { platform: 'edrak-academy' },
    });

    console.log('✓ Response received');
    console.log('Provider:', response.provider);
    console.log('Model:', response.model);
    console.log('Cost (USD): $' + response.estimatedCost.toFixed(6));
    console.log('Latency:', response.latencyMs + 'ms');
    console.log('\n--- Content ---');
    console.log(response.content);
    console.log('\n');
  } catch (error) {
    console.error('✗ Request failed:', (error as Error).message);
  }

  // --------------------------------------------
  // 3. اختبار: تلخيص (EdrakAcademy)
  // --------------------------------------------
  console.log('[3] Testing summarization for EdrakAcademy...\n');

  try {
    const response = await gateway.generate({
      taskType: 'summarization',
      prompt:
        'لخص النص التالي في جملتين: "إدارة الوقت من أهم مهارات المدربين. تنظيم الجدول وتحديد الأولويات يحقق التوازن بين العمل والحياة. الأدوات الرقمية توفر وقتاً كبيراً."',
      systemPrompt: 'أنت مساعد كتابة محتوى تعليمي. أجب بالعربية.',
      dataSensitivity: 'internal',
      maxTokens: 200,
      context: { platform: 'edrak-academy' },
    });

    console.log('✓ Response received');
    console.log('Provider:', response.provider);
    console.log('Cost (USD): $' + response.estimatedCost.toFixed(6));
    console.log('\n--- Content ---');
    console.log(response.content);
    console.log('\n');
  } catch (error) {
    console.error('✗ Request failed:', (error as Error).message);
  }

  // --------------------------------------------
  // 4. تقرير التكلفة
  // --------------------------------------------
  console.log('[4] Cost Reports\n');

  const reports = gateway.getCostReports();

  console.log('--- Total ---');
  console.log('Total Cost (USD): $' + reports.total.toFixed(6));
  console.log('');

  console.log('--- By Platform ---');
  for (const [platform, cost] of Object.entries(reports.byPlatform)) {
    console.log(`${platform}: $${(cost as number).toFixed(6)}`);
  }
  console.log('');

  console.log('--- By Provider ---');
  for (const [provider, cost] of Object.entries(reports.byProvider)) {
    console.log(`${provider}: $${(cost as number).toFixed(6)}`);
  }
  console.log('');

  console.log('--- By Task Type ---');
  for (const [task, cost] of Object.entries(reports.byTaskType)) {
    console.log(`${task}: $${(cost as number).toFixed(6)}`);
  }
  console.log('');

  // --------------------------------------------
  // 5. الميزانية المتبقية
  // --------------------------------------------
  console.log('[5] Remaining Budget\n');

  console.log(
    'Global: $' + gateway.getRemainingBudget().toFixed(2) + ' remaining',
  );
  console.log(
    'EdrakAcademy: $' +
      gateway.getRemainingBudget('edrak-academy').toFixed(2) +
      ' remaining',
  );
  console.log('');

  console.log('==========================================');
  console.log('Test Complete');
  console.log('==========================================');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});