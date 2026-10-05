import { AIProvider } from './base.provider';
import { OpenAIProvider } from './openai.provider';
import { MiniMaxProvider } from './minimax.provider';

export interface ProviderFactoryConfig {
  openai?: {
    apiKey: string;
    baseUrl?: string;
    enabled?: boolean;
  };
  minimax?: {
    apiKey: string;
    baseUrl?: string;
    enabled?: boolean;
  };
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
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL,
      enabled: process.env.OPENAI_ENABLED !== 'false',
    },
    minimax: {
      apiKey: process.env.MINIMAX_API_KEY || '',
      baseUrl: process.env.MINIMAX_BASE_URL,
      enabled: process.env.MINIMAX_ENABLED !== 'false',
    },
  });
}