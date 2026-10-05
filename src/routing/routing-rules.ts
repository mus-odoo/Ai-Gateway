import { RoutingRules } from '../types';

export const defaultRoutingRules: RoutingRules = {
  defaultProvider: {
    risk_analysis: 'openai',
    content_generation: 'minimax',
    summarization: 'minimax',
    classification: 'minimax',
    code_generation: 'openai',
    translation: 'minimax',
    recommendation: 'openai',
    data_extraction: 'minimax',
    training_content: 'minimax',
    islamic_content_analysis: 'openai',
  },

  sensitivityRules: {
    public: ['openai', 'minimax', 'mock'],
    internal: ['openai', 'minimax', 'mock'],
    confidential: ['openai', 'minimax', 'mock'],
    sensitive: ['openai'],
    sovereign: ['openai'],
  },

  platformRules: {
    edrak: {
      preferredProvider: 'openai',
      fallbackProvider: 'minimax',
      monthlyBudgetUsd: 700,
    },
    'edrak-academy': {
      preferredProvider: 'minimax',
      fallbackProvider: 'openai',
      monthlyBudgetUsd: 300,
    },
  },
};