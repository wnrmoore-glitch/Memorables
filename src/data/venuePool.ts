import type { OpeningPeriod, StopCategory } from '../types/domain'

export interface VenueTemplate {
  name: string
  category: StopCategory
  description: string
  ratingBase: number // 3.5 - 5.0
  priceLevel: 1 | 2 | 3 | 4
  hasWebsite: boolean
  hours: OpeningPeriod[]
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

function dailyHours(open: string, close: string, days: number[] = ALL_DAYS): OpeningPeriod[] {
  return days.map((day) => ({ day, open, close }))
}

/** Mon-Sun with a different Monday closure, common for restaurants. */
function closedMondayHours(open: string, close: string): OpeningPeriod[] {
  return dailyHours(open, close, [0, 2, 3, 4, 5, 6])
}

export const VENUE_POOL: VenueTemplate[] = [
  // scenic
  { name: 'Overlook Point', category: 'scenic', description: 'A viewpoint with sweeping views over the city.', ratingBase: 4.6, priceLevel: 1, hasWebsite: false, hours: dailyHours('06:00', '22:00') },
  { name: 'Riverside Promenade', category: 'scenic', description: 'A quiet waterfront walk, popular at sunset.', ratingBase: 4.4, priceLevel: 1, hasWebsite: false, hours: dailyHours('00:00', '23:59') },
  { name: 'Botanical Terrace Gardens', category: 'scenic', description: 'Manicured gardens with a small pond and gazebo.', ratingBase: 4.5, priceLevel: 1, hasWebsite: true, hours: dailyHours('09:00', '19:00') },
  { name: 'Old Town Rooftop', category: 'scenic', description: 'Rooftop terrace with panoramic skyline views.', ratingBase: 4.3, priceLevel: 2, hasWebsite: true, hours: dailyHours('12:00', '23:00') },
  { name: 'Harbor Lighthouse Walk', category: 'scenic', description: 'A scenic stroll out to a historic lighthouse.', ratingBase: 4.5, priceLevel: 1, hasWebsite: false, hours: dailyHours('07:00', '20:00') },

  // culture
  { name: 'The Modern Gallery', category: 'culture', description: 'Contemporary art across three floors.', ratingBase: 4.5, priceLevel: 2, hasWebsite: true, hours: dailyHours('10:00', '18:00', [0, 2, 3, 4, 5, 6]) },
  { name: 'City History Museum', category: 'culture', description: 'Exhibits tracing the city from its founding to today.', ratingBase: 4.4, priceLevel: 1, hasWebsite: true, hours: dailyHours('09:00', '17:00', [0, 2, 3, 4, 5, 6]) },
  { name: 'Artisan Craft Museum', category: 'culture', description: 'Hands-on exhibits celebrating local craftspeople.', ratingBase: 4.2, priceLevel: 2, hasWebsite: true, hours: dailyHours('10:00', '18:00') },
  { name: 'Independent Photography Space', category: 'culture', description: 'Rotating photography exhibitions in a converted warehouse.', ratingBase: 4.3, priceLevel: 1, hasWebsite: true, hours: dailyHours('11:00', '19:00', [1, 2, 3, 4, 5, 6]) },
  { name: 'Sculpture Garden Museum', category: 'culture', description: 'Outdoor sculpture collection alongside an indoor gallery.', ratingBase: 4.6, priceLevel: 2, hasWebsite: true, hours: dailyHours('09:00', '17:00') },

  // entertainment
  { name: 'The Regal Playhouse', category: 'entertainment', description: 'Small theatre staging plays and live comedy.', ratingBase: 4.5, priceLevel: 3, hasWebsite: true, hours: dailyHours('18:00', '23:00', [0, 3, 4, 5, 6]) },
  { name: 'Midnight Jazz Club', category: 'entertainment', description: 'Live jazz sets nightly in an intimate basement room.', ratingBase: 4.7, priceLevel: 3, hasWebsite: true, hours: dailyHours('19:00', '01:00') },
  { name: 'Starlight Cinema', category: 'entertainment', description: 'Independent cinema with a curated repertory schedule.', ratingBase: 4.3, priceLevel: 2, hasWebsite: true, hours: dailyHours('12:00', '23:30') },
  { name: 'The Comedy Cellar Room', category: 'entertainment', description: 'Stand-up comedy showcases most nights of the week.', ratingBase: 4.4, priceLevel: 2, hasWebsite: true, hours: dailyHours('19:30', '23:30', [1, 2, 3, 4, 5, 6]) },

  // food-casual
  { name: 'Corner Noodle House', category: 'food-casual', description: 'Hand-pulled noodles and a lively open kitchen.', ratingBase: 4.4, priceLevel: 2, hasWebsite: true, hours: dailyHours('11:00', '22:00') },
  { name: 'The Taco Yard', category: 'food-casual', description: 'Casual outdoor taco counter with a full bar.', ratingBase: 4.3, priceLevel: 1, hasWebsite: true, hours: dailyHours('11:00', '23:00') },
  { name: 'Basil & Bone Trattoria', category: 'food-casual', description: 'Relaxed neighbourhood Italian with wood-fired pizza.', ratingBase: 4.5, priceLevel: 2, hasWebsite: true, hours: dailyHours('11:30', '22:00') },
  { name: 'Smokehouse Kitchen', category: 'food-casual', description: 'Slow-smoked barbecue served on butcher paper.', ratingBase: 4.4, priceLevel: 2, hasWebsite: true, hours: closedMondayHours('11:00', '21:30') },
  { name: 'The Green Bowl', category: 'food-casual', description: 'Build-your-own grain bowls and fresh juices.', ratingBase: 4.2, priceLevel: 1, hasWebsite: true, hours: dailyHours('08:00', '20:00') },
  { name: 'Dockside Fish Shack', category: 'food-casual', description: 'Casual seafood spot right on the water.', ratingBase: 4.5, priceLevel: 2, hasWebsite: true, hours: dailyHours('11:30', '21:30') },

  // food-fine-dining
  { name: 'Lumen', category: 'food-fine-dining', description: 'Candlelit tasting menus with a seasonal focus.', ratingBase: 4.8, priceLevel: 4, hasWebsite: true, hours: closedMondayHours('17:30', '22:00') },
  { name: 'Sable & Vine', category: 'food-fine-dining', description: 'Elegant modern French, extensive wine list.', ratingBase: 4.7, priceLevel: 4, hasWebsite: true, hours: closedMondayHours('17:00', '22:30') },
  { name: "Marchetti's", category: 'food-fine-dining', description: 'Refined Italian in a warm, low-lit dining room.', ratingBase: 4.6, priceLevel: 3, hasWebsite: true, hours: dailyHours('17:00', '22:00') },
  { name: 'The Gilded Fork', category: 'food-fine-dining', description: 'Contemporary fine dining with a chef\'s counter.', ratingBase: 4.7, priceLevel: 4, hasWebsite: true, hours: closedMondayHours('18:00', '22:30') },
  { name: 'Ember & Oak', category: 'food-fine-dining', description: 'Open-fire cooking, intimate booths, dressy crowd.', ratingBase: 4.6, priceLevel: 3, hasWebsite: true, hours: dailyHours('17:30', '22:00') },

  // coffee
  { name: 'Third Wave Roasters', category: 'coffee', description: 'Single-origin pour-overs and house-made pastries.', ratingBase: 4.5, priceLevel: 1, hasWebsite: true, hours: dailyHours('07:00', '18:00') },
  { name: 'The Reading Room Café', category: 'coffee', description: 'Bookshop café, quiet corners, good espresso.', ratingBase: 4.4, priceLevel: 1, hasWebsite: true, hours: dailyHours('08:00', '19:00') },
  { name: 'Sunlit Espresso Bar', category: 'coffee', description: 'Bright corner café known for its oat-milk cortado.', ratingBase: 4.3, priceLevel: 1, hasWebsite: false, hours: dailyHours('06:30', '17:00') },
  { name: 'Milk & Bean', category: 'coffee', description: 'Cosy, plant-filled café with board games on hand.', ratingBase: 4.2, priceLevel: 1, hasWebsite: true, hours: dailyHours('07:30', '18:30') },

  // dessert
  { name: 'Velvet Scoop Creamery', category: 'dessert', description: 'Small-batch ice cream with rotating seasonal flavours.', ratingBase: 4.6, priceLevel: 1, hasWebsite: false, hours: dailyHours('12:00', '22:00') },
  { name: 'The Patisserie Room', category: 'dessert', description: 'French pastries and delicate tarts.', ratingBase: 4.5, priceLevel: 2, hasWebsite: true, hours: dailyHours('09:00', '20:00') },
  { name: 'Cocoa & Co.', category: 'dessert', description: 'Decadent chocolate desserts and hot cocoa flights.', ratingBase: 4.4, priceLevel: 2, hasWebsite: true, hours: dailyHours('11:00', '22:00') },
  { name: 'Sugar & Salt Bakehouse', category: 'dessert', description: 'Late-night bakery famous for its stuffed cookies.', ratingBase: 4.5, priceLevel: 1, hasWebsite: true, hours: dailyHours('10:00', '23:00') },

  // drinks-bar
  { name: 'The Velvet Curtain', category: 'drinks-bar', description: 'Speakeasy-style cocktail bar with a hidden entrance.', ratingBase: 4.7, priceLevel: 3, hasWebsite: true, hours: dailyHours('18:00', '02:00') },
  { name: 'Barrel & Bone Wine Bar', category: 'drinks-bar', description: 'Natural wines and a rotating small-plates menu.', ratingBase: 4.5, priceLevel: 3, hasWebsite: true, hours: dailyHours('16:00', '00:00') },
  { name: 'The Copper Still', category: 'drinks-bar', description: 'Craft cocktails made with house-infused spirits.', ratingBase: 4.6, priceLevel: 2, hasWebsite: true, hours: dailyHours('17:00', '01:00') },
  { name: 'Rooftop & Rye', category: 'drinks-bar', description: 'Whisky bar with an open-air rooftop section.', ratingBase: 4.4, priceLevel: 3, hasWebsite: true, hours: dailyHours('16:00', '00:30') },

  // nightlife
  { name: 'Nocturne', category: 'nightlife', description: 'Late-night club with resident DJs and a big dance floor.', ratingBase: 4.3, priceLevel: 3, hasWebsite: true, hours: dailyHours('22:00', '04:00', [3, 4, 5, 6]) },
  { name: 'The Neon Room', category: 'nightlife', description: 'Retro arcade bar with karaoke rooms upstairs.', ratingBase: 4.4, priceLevel: 2, hasWebsite: true, hours: dailyHours('20:00', '02:00') },
  { name: 'Underground Social', category: 'nightlife', description: 'Basement club known for its late-night live sets.', ratingBase: 4.2, priceLevel: 3, hasWebsite: true, hours: dailyHours('21:00', '03:00', [3, 4, 5, 6]) },

  // outdoor-activity
  { name: 'Riverside Kayak Rentals', category: 'outdoor-activity', description: 'Guided and self-paddle kayak rentals along the river.', ratingBase: 4.5, priceLevel: 2, hasWebsite: true, hours: dailyHours('09:00', '18:00') },
  { name: 'Summit Trailhead Park', category: 'outdoor-activity', description: 'Popular hiking trail with a lookout at the top.', ratingBase: 4.6, priceLevel: 1, hasWebsite: false, hours: dailyHours('06:00', '20:00') },
  { name: 'City Bike Tours', category: 'outdoor-activity', description: 'Guided cycling tours through the city\'s best neighbourhoods.', ratingBase: 4.5, priceLevel: 2, hasWebsite: true, hours: dailyHours('09:00', '17:00') },
  { name: 'Lakeside Paddleboard Co.', category: 'outdoor-activity', description: 'Stand-up paddleboard rentals and beginner lessons.', ratingBase: 4.4, priceLevel: 2, hasWebsite: true, hours: dailyHours('08:00', '19:00') },

  // adventure-activity
  { name: 'Vertical Edge Climbing Gym', category: 'adventure-activity', description: 'Indoor bouldering and rope climbing for all levels.', ratingBase: 4.6, priceLevel: 2, hasWebsite: true, hours: dailyHours('10:00', '22:00') },
  { name: 'Canopy Zipline Adventure', category: 'adventure-activity', description: 'Multi-line zipline course through the treetops.', ratingBase: 4.7, priceLevel: 3, hasWebsite: true, hours: dailyHours('09:00', '17:00') },
  { name: 'Escape the Vault', category: 'adventure-activity', description: 'Themed escape rooms for groups of two to eight.', ratingBase: 4.6, priceLevel: 2, hasWebsite: true, hours: dailyHours('10:00', '22:00') },
  { name: 'Whitewater Rafting Co.', category: 'adventure-activity', description: 'Half-day guided rafting trips down the rapids.', ratingBase: 4.7, priceLevel: 3, hasWebsite: true, hours: dailyHours('08:00', '16:00') },

  // relax
  { name: 'Still Water Spa', category: 'relax', description: 'Massage, sauna and a quiet relaxation lounge.', ratingBase: 4.7, priceLevel: 3, hasWebsite: true, hours: dailyHours('09:00', '20:00') },
  { name: 'The Tea Garden', category: 'relax', description: 'Traditional tea house with a small koi pond.', ratingBase: 4.5, priceLevel: 2, hasWebsite: true, hours: dailyHours('10:00', '19:00') },
  { name: 'Sunset Yoga Deck', category: 'relax', description: 'Open-air yoga studio overlooking the water.', ratingBase: 4.6, priceLevel: 2, hasWebsite: true, hours: dailyHours('07:00', '19:00') },
  { name: 'Float & Restore Wellness', category: 'relax', description: 'Sensory-deprivation float tanks and infrared saunas.', ratingBase: 4.5, priceLevel: 3, hasWebsite: true, hours: dailyHours('09:00', '21:00') },
]
