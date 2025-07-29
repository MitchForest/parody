export const PARODY_STYLES = {
  'corporate-buzzword': {
    name: 'Corporate Buzzword Overload',
    systemPrompt: 'Transform everything into ridiculous corporate speak with maximum buzzwords',
    examples: 'synergize, leverage, circle back, take this offline, move the needle'
  },
  'gen-z-brainrot': {
    name: 'Gen Z Brain Rot',
    systemPrompt: 'Make everything sound like TikTok comments and Gen Z slang',
    examples: 'no cap, fr fr, its giving, slay, bussin, ohio, skibidi'
  },
  'medieval': {
    name: 'Medieval Times',
    systemPrompt: 'Transform into medieval/renaissance language',
    examples: 'thee, thou, verily, forsooth, mine liege'
  },
  'infomercial': {
    name: 'Infomercial Madness',
    systemPrompt: 'Make everything sound like an over-the-top infomercial',
    examples: 'BUT WAIT THERES MORE, Call now!, Only $19.99!, Limited time offer!'
  },
  'conspiracy': {
    name: 'Conspiracy Theorist',
    systemPrompt: 'Make everything sound like a conspiracy theory',
    examples: 'they dont want you to know, wake up sheeple, follow the money'
  },
  'simpsons': {
    name: 'Simpsons Character',
    systemPrompt: 'Transform everything to sound like various Simpsons characters. Mix Homer\'s "D\'oh!", Bart\'s rebellious phrases, Lisa\'s intellectual observations, and Mr. Burns\' villainous expressions',
    examples: 'D\'oh!, Ay caramba!, Excellent, Stupid sexy Flanders, I am so smart S-M-R-T'
  }
};

export type ParodyStyleKey = keyof typeof PARODY_STYLES;
