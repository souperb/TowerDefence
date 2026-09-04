import { TowerType, UpgradePath } from './TowerComponents';

export const MAX_TOWER_TIER = 3;

export interface TowerTierStats {
  tier: number;
  path?: UpgradePath;
  name?: string;
  description?: string;
  damage: number;
  range: number;
  fireRate: number; // Attacks per second
  splashRadius: number;
  upgradeCost: number; // Cost to upgrade FROM this tier to the next tier (0 if at max tier)
}

export interface TowerPathDefinition {
  pathId: UpgradePath;
  name: string;
  description: string;
  tiers: Record<number, TowerTierStats>;
}

export interface TowerUpgradeTree {
  base: TowerTierStats;
  path1: TowerPathDefinition;
  path2: TowerPathDefinition;
}

export const TOWER_UPGRADE_TREES: Record<TowerType, TowerUpgradeTree> = {
  archer: {
    base: {
      tier: 1,
      name: 'Energy Lance',
      description: 'Guild Energy Lance. Fires accelerated hard-light needles with precision.',
      damage: 20,
      range: 125,
      fireRate: 1.35,
      splashRadius: 0,
      upgradeCost: 75,
    },
    path1: {
      pathId: 'path1',
      name: 'Sharpshooter',
      description: 'Long-range precision with amplified single-target damage.',
      tiers: {
        1: {
          tier: 1,
          path: 'path1',
          name: 'Energy Lance',
          description: 'Base hard-light needle projector.',
          damage: 20,
          range: 125,
          fireRate: 1.35,
          splashRadius: 0,
          upgradeCost: 75,
        },
        2: {
          tier: 2,
          path: 'path1',
          name: 'Marksman Spire',
          description: 'Extended range focusing lenses with amplified dart velocity.',
          damage: 35,
          range: 145,
          fireRate: 1.65,
          splashRadius: 0,
          upgradeCost: 150,
        },
        3: {
          tier: 3,
          path: 'path1',
          name: 'Grand Sharpshooter',
          description: 'High-caliber relic sniper system with supreme single-target range and damage.',
          damage: 55,
          range: 165,
          fireRate: 2.1,
          splashRadius: 0,
          upgradeCost: 0,
        },
      },
    },
    path2: {
      pathId: 'path2',
      name: 'Rapid Fire',
      description: 'High-cadence pulse barrage delivering continuous rapid DPS.',
      tiers: {
        1: {
          tier: 1,
          path: 'path2',
          name: 'Energy Lance',
          description: 'Base hard-light needle projector.',
          damage: 20,
          range: 125,
          fireRate: 1.35,
          splashRadius: 0,
          upgradeCost: 75,
        },
        2: {
          tier: 2,
          path: 'path2',
          name: 'Twin Needle',
          description: 'Dual-barrel harmonic accelerator delivering blistering rapid fire.',
          damage: 25,
          range: 130,
          fireRate: 2.4,
          splashRadius: 0,
          upgradeCost: 150,
        },
        3: {
          tier: 3,
          path: 'path2',
          name: 'Storm Repeater',
          description: 'Continuous beam pulse barrage overwhelming creep swarms with high DPS.',
          damage: 38,
          range: 140,
          fireRate: 3.6,
          splashRadius: 0,
          upgradeCost: 0,
        },
      },
    },
  },
  cannon: {
    base: {
      tier: 1,
      name: 'Plasma Mortar',
      description: 'Alchemical Ordnance Battery. Discharges heavy decaying-matter plasma mortars.',
      damage: 40,
      range: 100,
      fireRate: 0.6,
      splashRadius: 42,
      upgradeCost: 120,
    },
    path1: {
      pathId: 'path1',
      name: 'Heavy Siege',
      description: 'Devastating concentrated shock damage and armor cracking.',
      tiers: {
        1: {
          tier: 1,
          path: 'path1',
          name: 'Plasma Mortar',
          description: 'Base decaying-matter plasma mortar.',
          damage: 40,
          range: 100,
          fireRate: 0.6,
          splashRadius: 42,
          upgradeCost: 120,
        },
        2: {
          tier: 2,
          path: 'path1',
          name: 'Siege Mortar',
          description: 'Dense plasma warhead dealing devastating concentrated shock damage.',
          damage: 70,
          range: 115,
          fireRate: 0.7,
          splashRadius: 52,
          upgradeCost: 200,
        },
        3: {
          tier: 3,
          path: 'path1',
          name: 'Dreadnought Battery',
          description: 'Colossal siege ordnance pulverizing heavy targets with supreme impact.',
          damage: 110,
          range: 130,
          fireRate: 0.8,
          splashRadius: 62,
          upgradeCost: 0,
        },
      },
    },
    path2: {
      pathId: 'path2',
      name: 'Cluster Shrapnel',
      description: 'Expansive blast radius and faster area-of-effect barrage.',
      tiers: {
        1: {
          tier: 1,
          path: 'path2',
          name: 'Plasma Mortar',
          description: 'Base decaying-matter plasma mortar.',
          damage: 40,
          range: 100,
          fireRate: 0.6,
          splashRadius: 42,
          upgradeCost: 120,
        },
        2: {
          tier: 2,
          path: 'path2',
          name: 'Shrapnel Mortar',
          description: 'Wide-area submunition dispersal detonating over large creep clusters.',
          damage: 50,
          range: 110,
          fireRate: 0.95,
          splashRadius: 68,
          upgradeCost: 200,
        },
        3: {
          tier: 3,
          path: 'path2',
          name: 'Cluster Battery',
          description: 'Rapid-firing fragmentation battery covering massive blast zones.',
          damage: 80,
          range: 125,
          fireRate: 1.25,
          splashRadius: 88,
          upgradeCost: 0,
        },
      },
    },
  },
  mage: {
    base: {
      tier: 1,
      name: 'Void Pylon',
      description: 'Arcane Void Pylon. Concentrates stellar radiation into disintegrating beams.',
      damage: 75,
      range: 140,
      fireRate: 0.85,
      splashRadius: 0,
      upgradeCost: 160,
    },
    path1: {
      pathId: 'path1',
      name: 'Disintegration',
      description: 'Single-target annihilation with extreme range and raw beam power.',
      tiers: {
        1: {
          tier: 1,
          path: 'path1',
          name: 'Void Pylon',
          description: 'Base stellar radiation focus crystal.',
          damage: 75,
          range: 140,
          fireRate: 0.85,
          splashRadius: 0,
          upgradeCost: 160,
        },
        2: {
          tier: 2,
          path: 'path1',
          name: 'Focusing Spire',
          description: 'High-intensity coherent beam melting armor and elite creeps.',
          damage: 135,
          range: 160,
          fireRate: 1.05,
          splashRadius: 0,
          upgradeCost: 280,
        },
        3: {
          tier: 3,
          path: 'path1',
          name: 'Disintegration Core',
          description: 'Pure cosmic annihilation beam incinerating highest priority targets.',
          damage: 220,
          range: 180,
          fireRate: 1.25,
          splashRadius: 0,
          upgradeCost: 0,
        },
      },
    },
    path2: {
      pathId: 'path2',
      name: 'Pulsar Nova',
      description: 'Arcane area bursts with faster pulsing and splash shockwaves.',
      tiers: {
        1: {
          tier: 1,
          path: 'path2',
          name: 'Void Pylon',
          description: 'Base stellar radiation focus crystal.',
          damage: 75,
          range: 140,
          fireRate: 0.85,
          splashRadius: 0,
          upgradeCost: 160,
        },
        2: {
          tier: 2,
          path: 'path2',
          name: 'Pulsar Obelisk',
          description: 'Unstable eldritch discharge pulsing with splash damage on impact.',
          damage: 95,
          range: 145,
          fireRate: 1.35,
          splashRadius: 36,
          upgradeCost: 280,
        },
        3: {
          tier: 3,
          path: 'path2',
          name: 'Cosmic Nova',
          description: 'Cataclysmic astral resonance blasting area shockwaves at high speed.',
          damage: 150,
          range: 160,
          fireRate: 1.75,
          splashRadius: 56,
          upgradeCost: 0,
        },
      },
    },
  },
};

/**
 * Backward-compatible mapping for TOWER_UPGRADE_DEFINITIONS (defaults to Path 1).
 */
export const TOWER_UPGRADE_DEFINITIONS: Record<TowerType, Record<number, TowerTierStats>> = {
  archer: TOWER_UPGRADE_TREES.archer.path1.tiers,
  cannon: TOWER_UPGRADE_TREES.cannon.path1.tiers,
  mage: TOWER_UPGRADE_TREES.mage.path1.tiers,
};

/**
 * Returns the upgrade tree for a specific tower archetype.
 */
export function getTowerUpgradeTree(type: TowerType): TowerUpgradeTree {
  const tree = TOWER_UPGRADE_TREES[type];
  if (!tree) {
    throw new Error(`Unknown tower type for upgrade tree: ${type}`);
  }
  return tree;
}

/**
 * Returns the path definition for a specific tower type and path.
 */
export function getTowerUpgradePathInfo(type: TowerType, path: UpgradePath): TowerPathDefinition {
  const tree = getTowerUpgradeTree(type);
  return tree[path];
}

/**
 * Returns both upgrade paths for a tower type.
 */
export function getTowerUpgradePaths(type: TowerType): { path1: TowerPathDefinition; path2: TowerPathDefinition } {
  const tree = getTowerUpgradeTree(type);
  return {
    path1: tree.path1,
    path2: tree.path2,
  };
}

/**
 * Returns the stat definitions for a specific tower type, tier, and optional upgrade path.
 */
export function getTowerTierStats(
  type: TowerType,
  tier: number,
  path: UpgradePath = 'path1'
): TowerTierStats {
  const tree = getTowerUpgradeTree(type);
  if (tier < 1 || tier > MAX_TOWER_TIER) {
    throw new Error(`Invalid tier ${tier} for tower type ${type}`);
  }
  if (tier === 1) {
    return { ...tree.base };
  }
  const pathDef = tree[path];
  if (!pathDef) {
    throw new Error(`Invalid upgrade path ${path} for tower type ${type}`);
  }
  const stats = pathDef.tiers[tier];
  if (!stats) {
    throw new Error(`Invalid tier ${tier} for path ${path} of tower type ${type}`);
  }
  return { ...stats };
}

/**
 * Returns the gold cost to upgrade a tower from its current tier to the next tier along a path,
 * or null if the tower is already at maximum tier.
 */
export function getUpgradeCost(
  type: TowerType,
  currentTier: number,
  path: UpgradePath = 'path1'
): number | null {
  if (currentTier < 1 || currentTier >= MAX_TOWER_TIER) {
    return null;
  }
  if (currentTier === 1) {
    const tree = getTowerUpgradeTree(type);
    return tree.base.upgradeCost;
  }
  const currentStats = getTowerTierStats(type, currentTier, path);
  return currentStats.upgradeCost > 0 ? currentStats.upgradeCost : null;
}

/**
 * Returns the stats for the next tier of a given tower type along a path,
 * or null if already at maximum tier.
 */
export function getNextTierStats(
  type: TowerType,
  currentTier: number,
  path: UpgradePath = 'path1'
): TowerTierStats | null {
  if (currentTier < 1 || currentTier >= MAX_TOWER_TIER) {
    return null;
  }
  return getTowerTierStats(type, currentTier + 1, path);
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
