import { TowerType } from './TowerComponents';

export * from './TowerUpgradeDefinitions';

export interface TowerDefinition {
  type: TowerType;
  name: string;
  shopName?: string;
  description: string;
  icon: string;
  spriteId: string;
  baseCost: number;
  range: number;
  fireRate: number; // Attacks per second
  damage: number;
  splashRadius: number; // 0 for single-target
  projectileSpeed: number; // Pixels per second
  color: string;
}

export const TOWER_ICONS: Record<TowerType, string> = {
  archer: `<svg viewBox="0 0 32 32" width="28" height="28" class="tower-icon-svg" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="28" height="28" rx="3" fill="#090d16" stroke="#0e7490" stroke-width="1.5"/>
  <rect x="4" y="4" width="2" height="2" fill="#d97706"/>
  <rect x="26" y="4" width="2" height="2" fill="#d97706"/>
  <rect x="4" y="26" width="2" height="2" fill="#d97706"/>
  <rect x="26" y="26" width="2" height="2" fill="#d97706"/>
  <rect x="11" y="8" width="10" height="15" rx="1" fill="#1e293b"/>
  <line x1="9" y1="23" x2="9" y2="7" stroke="#38bdf8" stroke-width="1.5"/>
  <line x1="23" y1="23" x2="23" y2="7" stroke="#38bdf8" stroke-width="1.5"/>
  <circle cx="16" cy="14" r="4.5" fill="#38bdf8" opacity="0.3"/>
  <circle cx="16" cy="14" r="3" fill="#67e8f9"/>
  <circle cx="16" cy="14" r="1.2" fill="#ffffff"/>
  <polygon points="16,3.5 13.5,8 18.5,8" fill="#38bdf8"/>
  <circle cx="16" cy="27" r="1.2" fill="#fbbf24"/>
</svg>`,
  cannon: `<svg viewBox="0 0 32 32" width="28" height="28" class="tower-icon-svg" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="28" height="28" rx="3" fill="#090d16" stroke="#78350f" stroke-width="1.5"/>
  <rect x="4" y="4" width="2" height="2" fill="#d97706"/>
  <rect x="26" y="4" width="2" height="2" fill="#d97706"/>
  <rect x="4" y="26" width="2" height="2" fill="#d97706"/>
  <rect x="26" y="26" width="2" height="2" fill="#d97706"/>
  <circle cx="16" cy="16" r="10.5" fill="#27272a" stroke="#d97706" stroke-width="2"/>
  <circle cx="16" cy="16" r="7" fill="#f97316" opacity="0.3"/>
  <circle cx="16" cy="16" r="5" fill="#f97316"/>
  <circle cx="16" cy="16" r="2" fill="#fff7ed"/>
  <circle cx="16" cy="27" r="1.2" fill="#fbbf24"/>
</svg>`,
  mage: `<svg viewBox="0 0 32 32" width="28" height="28" class="tower-icon-svg" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="28" height="28" rx="3" fill="#090d16" stroke="#581c87" stroke-width="1.5"/>
  <rect x="4" y="4" width="2" height="2" fill="#d97706"/>
  <rect x="26" y="4" width="2" height="2" fill="#d97706"/>
  <rect x="4" y="26" width="2" height="2" fill="#d97706"/>
  <rect x="26" y="26" width="2" height="2" fill="#d97706"/>
  <polygon points="16,4.5 25.5,16 16,27.5 6.5,16" fill="#180d2b" stroke="#c084fc" stroke-width="1.2"/>
  <circle cx="16" cy="16" r="6" fill="#a855f7" opacity="0.3"/>
  <circle cx="16" cy="16" r="3.8" fill="#a855f7"/>
  <circle cx="16" cy="16" r="1.5" fill="#ffffff"/>
  <circle cx="16" cy="27" r="1.2" fill="#fbbf24"/>
</svg>`,
};

export const TOWER_CATALOG: Record<TowerType, TowerDefinition> = {
  archer: {
    type: 'archer',
    name: 'Archer Tower',
    shopName: 'Energy Lance',
    description: 'Guild Energy Lance. Fires hyper-accelerated hard-light needles and relic darts with extreme velocity.',
    icon: TOWER_ICONS.archer,
    spriteId: 'tower_archer',
    baseCost: 100,
    range: 125,
    fireRate: 1.35,
    damage: 20,
    splashRadius: 0,
    projectileSpeed: 340,
    color: '#38bdf8', // Relic Cyan / Hard Light
  },
  cannon: {
    type: 'cannon',
    name: 'Cannon Tower',
    shopName: 'Plasma Mortar',
    description: 'Alchemical Ordnance Battery. Discharges heavy decaying-matter plasma mortars that detonate with massive shockwaves.',
    icon: TOWER_ICONS.cannon,
    spriteId: 'tower_cannon',
    baseCost: 150,
    range: 100,
    fireRate: 0.6,
    damage: 40,
    splashRadius: 42,
    projectileSpeed: 200,
    color: '#f97316', // Smoldering Amber / Plasma
  },
  mage: {
    type: 'mage',
    name: 'Mage Tower',
    shopName: 'Void Pylon',
    description: 'Arcane Void Pylon. Concentrates lost stellar radiation through focusing crystals into lethal disintegrating beams.',
    icon: TOWER_ICONS.mage,
    spriteId: 'tower_mage',
    baseCost: 200,
    range: 140,
    fireRate: 0.85,
    damage: 75,
    splashRadius: 0,
    projectileSpeed: 260,
    color: '#a855f7', // Eldritch Amethyst / Thaumaturgic Violet
  },
};

/**
 * Retrieves the catalog definition for a specific tower type.
 */
export function getTowerDefinition(type: TowerType): TowerDefinition {
  const def = TOWER_CATALOG[type];
  if (!def) {
    throw new Error(`Unknown tower archetype: ${type}`);
  }
  return def;
}

/**
 * Returns an array of all available tower definitions.
 */
export function getAllTowerDefinitions(): TowerDefinition[] {
  return Object.values(TOWER_CATALOG);
}
