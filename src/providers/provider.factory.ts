import { AIProvider } from './base.provider';
import { OpenAIProvider } from './openai.provider';
import { MiniMaxProvider } from './minimax.provider';
import { MockProvider } from './mock.provider';
const env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};


export interface ProviderFactoryConfig {
  openai?: { apiKey: string; baseUrl?: string; enabled?: boolean };
  minimax?: { apiKey: string; baseUrl?: string; enabled?: boolean };
  mock?: { enabled?: boolean };  // ← جديد
}


/**
 * بناء المزودين من إعدادات
 */
export function createProviders(config: ProviderFactoryConfig): AIProvider[] {
  const providers: AIProvider[] = [];

  if (config.openai?.enabled !== false && config.openai?.apiKey) {
    providers.push(
      new OpenAIProvider({
        apiKey: config.openai.apiKey,
        baseUrl: config.openai.baseUrl,
      }),
    );
  }

  if (config.minimax?.enabled !== false && config.minimax?.apiKey) {
    providers.push(
      new MiniMaxProvider({
        apiKey: config.minimax.apiKey,
        baseUrl: config.minimax.baseUrl,
      }),
    );
  }
  if (config.mock?.enabled !== false) {
    providers.push(new MockProvider());
  }

  if (providers.length === 0) {
    throw new Error('No AI providers configured. Please check your environment variables.');
  }

  return providers;
}

/**
 * بناء المزودين من متغيرات البيئة مباشرة
 */
export function createProvidersFromEnv(): AIProvider[] {
  return createProviders({
    mock: {
      enabled: env.MOCK_ENABLED === 'true',
    },
    openai: {
      apiKey: env.OPENAI_API_KEY || '',
      baseUrl: env.OPENAI_BASE_URL,
      enabled: env.OPENAI_ENABLED !== 'false',
    },
    minimax: {
      apiKey: env.MINIMAX_API_KEY || '',
      baseUrl: env.MINIMAX_BASE_URL,
      enabled: env.MINIMAX_ENABLED !== 'false',
    },
  });
}
