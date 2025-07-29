import { ModelConfig } from '@/types'

export const AI_MODELS: ModelConfig[] = [
  {
    id: 'replicate',
    name: 'Replicate Vision',
    description: 'Fast and accurate website parody generation',
    estimatedTime: 15,
    cost: 0.05,
    available: true,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Advanced multimodal AI with creative flair',
    estimatedTime: 8,
    cost: 0.02,
    available: true,
  },
  {
    id: 'anthropic',
    name: 'Claude Vision',
    description: 'Thoughtful and detailed parody analysis',
    estimatedTime: 12,
    cost: 0.08,
    available: true,
  },
]

export const PROMPT_TEMPLATES = [
  {
    id: 'funny',
    name: 'Make it Funny',
    prompt: 'Transform this website into a hilarious parody version. Keep the same layout and structure but make all the text content absurdly funny and over-the-top.',
  },
  {
    id: 'corporate',
    name: 'Corporate Buzzwords',
    prompt: 'Rewrite this website using as many corporate buzzwords and business jargon as possible. Make it sound like the most corporate thing ever.',
  },
  {
    id: 'genz',
    name: 'Gen Z Style',
    prompt: 'Convert this website to speak like Gen Z with lots of slang, emoji, and internet culture references. Make it extremely chronically online.',
  },
  {
    id: 'pirate',
    name: 'Pirate Theme',
    prompt: 'Transform this website into a pirate-themed version. Replace all text with pirate speak and nautical terminology.',
  },
  {
    id: 'medieval',
    name: 'Medieval Times',
    prompt: 'Rewrite this website as if it were from medieval times, using ye olde English and references to kingdoms, quests, and chivalry.',
  },
  {
    id: 'custom',
    name: 'Custom Prompt',
    prompt: '',
  },
]
