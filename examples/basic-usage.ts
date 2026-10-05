import 'dotenv/config';
import { AIGateway, createProvidersFromEnv, defaultRoutingRules } from '../src';

async function main() {
  const gateway = new AIGateway({
    providers: createProvidersFromEnv(),
    routingRules: defaultRoutingRules,
    costLimits: {
      globalMonthlyLimitUsd: 1000,
      platformLimits: {
        edrak: 500,
        farah: 250,
        'alhamd-academy': 250,
      },
    },
  });

  const response = await gateway.generate({
    taskType: 'risk_analysis',
    prompt: 'حلل خطر عدم حضور المريض أحمد للعيادة غداً',
    systemPrompt: 'أنت محلل مخاطر تشغيلية في منصة صحية.',
    dataSensitivity: 'confidential',
    maxTokens: 1024,
    context: { platform: 'edrak' },
  });

  console.log('Provider:', response.provider);
  console.log('Model:', response.model);
  console.log('Content:', response.content);
  console.log('Cost:', response.estimatedCost);

  console.log('\nCost Reports:', gateway.getCostReports());
}

main().catch(console.error);