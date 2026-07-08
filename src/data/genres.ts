import type { Genre } from '../types/domain'

export const GENRES: Genre[] = [
  {
    id: 'romantic',
    label: 'Romantic',
    emoji: '🌹',
    description: 'A scenic spot, a beautiful dinner, and something sweet to finish.',
    sequences: {
      2: ['food-fine-dining', 'drinks-bar'],
      3: ['scenic', 'food-fine-dining', 'dessert'],
      4: ['scenic', 'food-fine-dining', 'dessert', 'drinks-bar'],
    },
  },
  {
    id: 'foodie',
    label: 'Foodie',
    emoji: '🍜',
    description: 'A crawl built around the best bites in town.',
    sequences: {
      2: ['food-casual', 'dessert'],
      3: ['coffee', 'food-casual', 'dessert'],
      4: ['coffee', 'food-casual', 'dessert', 'drinks-bar'],
    },
  },
  {
    id: 'adventure',
    label: 'Adventure & Outdoors',
    emoji: '🥾',
    description: 'Get moving outside, then refuel.',
    sequences: {
      2: ['outdoor-activity', 'food-casual'],
      3: ['outdoor-activity', 'adventure-activity', 'food-casual'],
      4: ['coffee', 'outdoor-activity', 'adventure-activity', 'food-casual'],
    },
  },
  {
    id: 'culture',
    label: 'Culture & Arts',
    emoji: '🎨',
    description: 'Museums, galleries and a show, with good food between.',
    sequences: {
      2: ['culture', 'food-casual'],
      3: ['culture', 'coffee', 'food-casual'],
      4: ['culture', 'coffee', 'entertainment', 'food-casual'],
    },
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    emoji: '🍸',
    description: 'Dinner first, then bars and a late-night spot.',
    sequences: {
      2: ['food-casual', 'nightlife'],
      3: ['food-casual', 'drinks-bar', 'nightlife'],
      4: ['food-casual', 'drinks-bar', 'drinks-bar', 'nightlife'],
    },
  },
  {
    id: 'chill',
    label: 'Chill & Relax',
    emoji: '🧘',
    description: 'Low-key, unhurried, easy on the schedule.',
    sequences: {
      2: ['coffee', 'relax'],
      3: ['coffee', 'relax', 'food-casual'],
      4: ['coffee', 'relax', 'food-casual', 'dessert'],
    },
  },
]

export function getGenre(id: string): Genre {
  const genre = GENRES.find((g) => g.id === id)
  if (!genre) throw new Error(`Unknown genre: ${id}`)
  return genre
}

/** Picks the closest available sequence length to the requested stop count. */
export function getSequence(genre: Genre, stopCount: number): import('../types/domain').StopCategory[] {
  if (genre.sequences[stopCount]) return genre.sequences[stopCount]
  const available = Object.keys(genre.sequences).map(Number).sort((a, b) => a - b)
  const closest = available.reduce((best, n) =>
    Math.abs(n - stopCount) < Math.abs(best - stopCount) ? n : best
  )
  return genre.sequences[closest]
}

export const CATEGORY_LABELS: Record<string, string> = {
  scenic: 'Scenic spot',
  culture: 'Museum / gallery',
  entertainment: 'Show / entertainment',
  'food-casual': 'Casual bite',
  'food-fine-dining': 'Fine dining',
  coffee: 'Coffee',
  dessert: 'Dessert',
  'drinks-bar': 'Drinks',
  nightlife: 'Nightlife',
  'outdoor-activity': 'Outdoor activity',
  'adventure-activity': 'Adventure activity',
  relax: 'Relax',
}

/** Roughly how long a visit to each category tends to take, in minutes. */
export const CATEGORY_DURATION_MINUTES: Record<string, number> = {
  scenic: 45,
  culture: 75,
  entertainment: 120,
  'food-casual': 60,
  'food-fine-dining': 90,
  coffee: 30,
  dessert: 30,
  'drinks-bar': 60,
  nightlife: 90,
  'outdoor-activity': 90,
  'adventure-activity': 120,
  relax: 60,
}
