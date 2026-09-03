import { TowerType } from './TowerComponents';

export const MAX_TOWER_TIER = 3;

export interface TowerTierStats {
  tier: number;
  damage: number;
  range: number;
  fireRate: number; // Attacks per second
  splashRadius: number;
  upgradeCost: number; // Cost to upgrade FROM this tier to the next tier (0 if at max tier)
}

export const TOWER_UPGRADE_DEFINITIONS: Record<TowerType, Record<number, TowerTierStats>> = {
  archer: {
    1: {
      tier: 1,
      damage: 15,
      range: 120,
      fireRate: 1.2,
      splashRadius: 0,
      upgradeCost: 75,
    },
    2: {
      tier: 2,
      damage: 25,
      range: 140,
      fireRate: 1.5,
      splashRadius: 0,
      upgradeCost: 150,
    },
    3: {
      tier: 3,
      damage: 40,
      range: 160,
      fireRate: 2.0,
      splashRadius: 0,
      upgradeCost: 0,
    },
  },
  cannon: {
    1: {
      tier: 1,
      damage: 45,
      range: 100,
      fireRate: 0.6,
      splashRadius: 48,
      upgradeCost: 120,
    },
    2: {
      tier: 2,
      damage: 80,
      range: 115,
      fireRate: 0.75,
      splashRadius: 60,
      upgradeCost: 200,
    },
    3: {
      tier: 3,
      damage: 140,
      range: 130,
      fireRate: 0.9,
      splashRadius: 75,
      upgradeCost: 0,
    },
  },
  mage: {
    1: {
      tier: 1,
      damage: 60,
      range: 140,
      fireRate: 0.8,
      splashRadius: 0,
      upgradeCost: 160,
    },
    2: {
      tier: 2,
      damage: 110,
      range: 160,
      fireRate: 1.0,
      splashRadius: 0,
      upgradeCost: 280,
    },
    3: {
      tier: 3,
      damage: 190,
      range: 180,
      fireRate: 1.2,
      splashRadius: 0,
      upgradeCost: 0,
    },
  },
};

/**
 * Returns the stat definitions for a specific tower type and tier.
 */
export function getTowerTierStats(type: TowerType, tier: number): TowerTierStats {
  const towerDef = TOWER_UPGRADE_DEFINITIONS[type];
  if (!towerDef) {
    throw new Error(`Unknown tower type for upgrade stats: ${type}`);
  }
  const stats = towerDef[tier];
  if (!stats) {
    throw new Error(`Invalid tier ${tier} for tower type ${type}`);
  }
  return { ...stats };
}

/**
 * Returns the gold cost to upgrade a tower from its current tier to the next tier,
 * or null if the tower is already at maximum tier.
 */
export function getUpgradeCost(type: TowerType, currentTier: number): number | null {
  if (currentTier < 1 || currentTier >= MAX_TOWER_TIER) {
    return null;
  }
  const currentStats = getTowerTierStats(type, currentTier);
  return currentStats.upgradeCost > 0 ? currentStats.upgradeCost : null;
}

/**
 * Returns the stats for the next tier of a given tower type,
 * or null if already at maximum tier.
 */
export function getNextTierStats(type: TowerType, currentTier: number): TowerTierStats | null {
  if (currentTier < 1 || currentTier >= MAX_TOWER_TIER) {
    return null;
  }
  return getTowerTierStats(type, currentTier + 1);
}

/**
 * Checks whether a tower tier is eligible for upgrading.
 */
export function canUpgradeTier(currentTier: number): boolean {
  return currentTier >= 1 && currentTier < MAX_TOWER_TIER;
}

/**
 * Returns the maximum upgrade tier.
 */
export function getMaxTier(_type?: TowerType): number {
  return MAX_TOWER_TIER;
}
