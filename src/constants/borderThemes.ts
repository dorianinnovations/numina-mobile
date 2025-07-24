/**
 * 🎨 Border Theme Definitions
 * 
 * Centralized theme definitions to avoid circular dependencies.
 * This file contains all border theme configurations and types.
 */

export interface BorderTheme {
  id: string;
  name: string;
  emoji: string;
  description: string;
  colors: string[];
}

export const BORDER_THEMES: BorderTheme[] = [
  {
    id: 'electric_neon',
    name: 'Electric Neon',
    emoji: '⚡',
    description: 'Bright cyan → Electric purple → Neon green',
    colors: [
      'rgba(0, 255, 255, 0.8)',   // Bright Cyan
      'rgba(138, 43, 226, 0.6)',  // Electric Purple
      'rgba(57, 255, 20, 0.4)',   // Neon Green
      'transparent'
    ]
  },
  {
    id: 'sunset_warm',
    name: 'Sunset Warm',
    emoji: '🔥',
    description: 'Golden yellow → Coral pink → Soft orange',
    colors: [
      'rgba(255, 215, 0, 0.8)',   // Golden Yellow
      'rgba(255, 127, 80, 0.6)',  // Coral Pink
      'rgba(255, 165, 0, 0.4)',   // Soft Orange
      'transparent'
    ]
  },
  {
    id: 'ocean_vibes',
    name: 'Ocean Vibes',
    emoji: '🌊',
    description: 'Aqua blue → Teal → Seafoam green',
    colors: [
      'rgba(0, 255, 255, 0.7)',   // Aqua Blue
      'rgba(0, 128, 128, 0.5)',   // Teal
      'rgba(95, 158, 160, 0.3)',  // Seafoam Green
      'transparent'
    ]
  },
  {
    id: 'soft_pastels',
    name: 'Soft Pastels',
    emoji: '🌸',
    description: 'Baby pink → Lavender → Mint green',
    colors: [
      'rgba(255, 182, 193, 0.6)',  // Baby Pink
      'rgba(230, 230, 250, 0.4)',  // Lavender
      'rgba(152, 251, 152, 0.2)',  // Mint Green
      'transparent'
    ]
  },
  {
    id: 'aurora_borealis',
    name: 'Aurora Borealis',
    emoji: '🌅',
    description: 'Bright blue → Magenta → Electric green',
    colors: [
      'rgba(30, 144, 255, 0.8)',   // Bright Blue
      'rgba(255, 20, 147, 0.6)',   // Magenta
      'rgba(50, 205, 50, 0.4)',    // Electric Green
      'transparent'
    ]
  },
  {
    id: 'cherry_blossom',
    name: 'Cherry Blossom',
    emoji: '🍑',
    description: 'Rose gold → Blush pink → Peach',
    colors: [
      'rgba(183, 110, 121, 0.7)',  // Rose Gold
      'rgba(255, 192, 203, 0.5)',  // Blush Pink
      'rgba(255, 218, 185, 0.3)',  // Peach
      'transparent'
    ]
  },
  {
    id: 'jewel_tones',
    name: 'Jewel Tones',
    emoji: '💎',
    description: 'Sapphire blue → Amethyst purple → Emerald green',
    colors: [
      'rgba(15, 82, 186, 0.8)',    // Sapphire Blue
      'rgba(153, 102, 204, 0.6)',  // Amethyst Purple
      'rgba(80, 200, 120, 0.4)',   // Emerald Green
      'transparent'
    ]
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    emoji: '🌙',
    description: 'Silver blue → Pearl white → Ice blue',
    colors: [
      'rgba(176, 196, 222, 0.6)',  // Silver Blue
      'rgba(255, 255, 255, 0.4)',  // Pearl White
      'rgba(175, 238, 238, 0.2)',  // Ice Blue
      'transparent'
    ]
  },
  
  // Premium themes
  {
    id: 'pure_white',
    name: 'Pure White',
    emoji: '⚪',
    description: 'Bright white → Pearl → Crystal clear',
    colors: [
      'rgba(255, 255, 255, 0.9)',  // Bright White
      'rgba(248, 248, 255, 0.7)',  // Ghost White
      'rgba(245, 245, 245, 0.5)',  // White Smoke
      'transparent'
    ]
  },
  {
    id: 'liquid_gold',
    name: 'Liquid Gold',
    emoji: '🏆',
    description: 'Pure gold → Champagne → Golden honey',
    colors: [
      'rgba(255, 215, 0, 0.9)',    // Pure Gold
      'rgba(247, 231, 206, 0.7)',  // Champagne
      'rgba(255, 193, 37, 0.5)',   // Golden Honey
      'transparent'
    ]
  },
  {
    id: 'platinum_shine',
    name: 'Platinum Shine',
    emoji: '💎',
    description: 'Platinum silver → Chrome → Mirror finish',
    colors: [
      'rgba(229, 228, 226, 0.9)',  // Platinum
      'rgba(192, 192, 192, 0.7)',  // Silver
      'rgba(211, 211, 211, 0.5)',  // Light Gray
      'transparent'
    ]
  },
  {
    id: 'royal_purple',
    name: 'Royal Purple',
    emoji: '👑',
    description: 'Deep royal → Amethyst → Lavender mist',
    colors: [
      'rgba(102, 51, 153, 0.9)',   // Royal Purple
      'rgba(147, 112, 219, 0.7)',  // Medium Slate Blue
      'rgba(221, 160, 221, 0.5)',  // Plum
      'transparent'
    ]
  },
  {
    id: 'emerald_luxury',
    name: 'Emerald Luxury',
    emoji: '💚',
    description: 'Deep emerald → Jade → Mint crystal',
    colors: [
      'rgba(0, 100, 0, 0.9)',      // Dark Green
      'rgba(64, 224, 208, 0.7)',   // Turquoise
      'rgba(152, 251, 152, 0.5)',  // Pale Green
      'transparent'
    ]
  },
  {
    id: 'rose_gold_elite',
    name: 'Rose Gold Elite',
    emoji: '🌹',
    description: 'Rose gold → Blush copper → Pink champagne',
    colors: [
      'rgba(183, 110, 121, 0.9)',  // Rose Gold
      'rgba(218, 165, 32, 0.7)',   // Goldenrod
      'rgba(255, 192, 203, 0.5)',  // Pink
      'transparent'
    ]
  },
  {
    id: 'cosmic_nebula',
    name: 'Cosmic Nebula',
    emoji: '🌌',
    description: 'Deep space → Stellar purple → Cosmic blue',
    colors: [
      'rgba(25, 25, 112, 0.9)',    // Midnight Blue
      'rgba(138, 43, 226, 0.7)',   // Blue Violet
      'rgba(72, 61, 139, 0.5)',    // Dark Slate Blue
      'transparent'
    ]
  },
  {
    id: 'fire_opal',
    name: 'Fire Opal',
    emoji: '🔥',
    description: 'Fiery orange → Ruby red → Golden flame',
    colors: [
      'rgba(255, 69, 0, 0.9)',     // Red Orange
      'rgba(220, 20, 60, 0.7)',    // Crimson
      'rgba(255, 140, 0, 0.5)',    // Dark Orange
      'transparent'
    ]
  }
];