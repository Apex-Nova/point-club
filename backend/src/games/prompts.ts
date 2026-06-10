// Drawing prompt banks organised by category

export const BATTLE_PROMPTS = [
  // Animals
  'A cat riding a skateboard', 'Dragon riding a bicycle', 'Penguin astronaut',
  'Dog playing guitar', 'Shark eating spaghetti', 'Elephant painting a selfie',
  'Bear running a coffee shop', 'Owl solving a math problem',
  // Fantasy
  'Wizard at a fast-food drive-through', 'Knight texting on a smartphone',
  'Unicorn at the gym', 'Mermaid doing yoga', 'Goblin using a laptop',
  'Vampire grocery shopping', 'Fairy playing video games',
  // Tech & Modern
  'Robot learning to cook', 'AI confused by a meme', 'Alien discovering pizza',
  'Time traveler seeing the internet for the first time', 'Cave person with a smartphone',
  // Abstract / Funny
  'Dreams vs reality', 'Monday morning mood', 'The last slice of pizza',
  'A cloud having an existential crisis', 'Two suns arguing about who is brighter',
  'Gravity taking a day off', 'Colors explaining themselves to a blind person',
  // Nature
  'A tree commuting to work', 'Mountains gossiping', 'Ocean having a garage sale',
  'The moon asking the sun on a date', 'A snowflake with identity issues',
  // Sci-Fi
  'Mars colony first Starbucks', 'Black hole as a vacuum cleaner',
  'Teleportation gone wrong', 'Robot uprising but they just want better wages',
  // Food
  'Pizza delivery to the moon', 'Ice cream cone in a sauna',
  'Sushi fighting back', 'Burrito building a rocket',
];

export const GUESS_PROMPTS = [
  // Easy
  'house', 'cat', 'sun', 'tree', 'car', 'fish', 'book', 'shoe', 'phone', 'apple',
  'rainbow', 'cloud', 'star', 'moon', 'flower', 'butterfly', 'pizza', 'cake',
  // Medium
  'lighthouse', 'volcano', 'submarine', 'tornado', 'cactus', 'igloo', 'compass',
  'telescope', 'hammock', 'porcupine', 'kangaroo', 'accordion', 'chopsticks',
  // Hard
  'procrastination', 'quantum physics', 'nostalgia', 'claustrophobia', 'wifi signal',
  'déjà vu', 'zero gravity', 'parallel universe', 'internet', 'democracy',
];

export const STORY_STARTERS = [
  'A mysterious door appears in the middle of the forest…',
  'The last human on Earth found a note that read…',
  'When the scientist pressed the button, nothing happened—then everything changed.',
  'The city woke up to find all its clocks stopped at exactly 3:00 AM.',
  'She opened the package and found a tiny door inside.',
  'The dragon had been asleep for a thousand years when the alarm clock went off.',
];

export const CHALLENGE_PROMPTS: { prompt: string; theme: string; difficulty: 'easy'|'medium'|'hard'|'expert' }[] = [
  { prompt: 'Draw your dream city', theme: 'Architecture', difficulty: 'medium' },
  { prompt: 'Future transportation', theme: 'Sci-Fi', difficulty: 'medium' },
  { prompt: 'A cute monster', theme: 'Fantasy', difficulty: 'easy' },
  { prompt: 'Cyberpunk pet', theme: 'Cyberpunk', difficulty: 'medium' },
  { prompt: 'Life in 2100', theme: 'Future', difficulty: 'hard' },
  { prompt: 'Underwater market', theme: 'Fantasy', difficulty: 'medium' },
  { prompt: 'Self-portrait as a robot', theme: 'Tech', difficulty: 'medium' },
  { prompt: 'The last forest', theme: 'Nature', difficulty: 'hard' },
  { prompt: 'A day in space', theme: 'Sci-Fi', difficulty: 'easy' },
  { prompt: 'Magical bakery', theme: 'Fantasy', difficulty: 'easy' },
  { prompt: 'Emotion without a name', theme: 'Abstract', difficulty: 'expert' },
  { prompt: 'City of bridges', theme: 'Architecture', difficulty: 'hard' },
  { prompt: 'Creature from another dimension', theme: 'Sci-Fi', difficulty: 'medium' },
  { prompt: 'Retro video game character', theme: 'Gaming', difficulty: 'easy' },
  { prompt: 'Map of a fictional world', theme: 'Fantasy', difficulty: 'hard' },
  { prompt: 'Music as a visual', theme: 'Abstract', difficulty: 'expert' },
  { prompt: 'Haunted coffee shop', theme: 'Horror', difficulty: 'medium' },
  { prompt: 'Giant robot in a small town', theme: 'Sci-Fi', difficulty: 'medium' },
  { prompt: 'Lost ancient technology', theme: 'History', difficulty: 'hard' },
  { prompt: 'Feeling of Monday morning', theme: 'Abstract', difficulty: 'easy' },
];

export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getTodaysChallenge() {
  // Deterministic by day-of-year so everyone gets the same challenge
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return CHALLENGE_PROMPTS[dayOfYear % CHALLENGE_PROMPTS.length];
}
