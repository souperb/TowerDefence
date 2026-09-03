import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../../src/core/ecs/World';
import { EventBus } from '../../src/core/events/EngineEvents';
import { EconomyManager } from '../../src/game/economy/EconomyManager';
import {
  TOWER_COMPONENT,
  TowerComponent,
} from '../../src/game/towers/TowerComponents';
import { TowerFactory } from '../../src/game/towers/TowerFactory';
import {
  MAX_TOWER_TIER,
  getTowerTierStats,
  getUpgradeCost,
  getNextTierStats,
  canUpgradeTier,
  getMaxTier,
} from '../../src/game/towers/TowerUpgradeDefinitions';
import {
  TowerUpgradeSystem,
} from '../../src/game/systems/TowerUpgradeSystem';
import { getTowerDefinition } from '../../src/game/towers/TowerCatalog';

describe('Tower Upgrade Definitions & Stat Progressions (TASK-07-02)', () => {
  it('should define max tier as 3', () => {
    expect(MAX_TOWER_TIER).toBe(3);
    expect(getMaxTier()).toBe(3);
  });

  it('should have 3-tier stat progressions for Archer Tower with increasing stats', () => {
    const t1 = getTowerTierStats('archer', 1);
    const t2 = getTowerTierStats('archer', 2);
    const t3 = getTowerTierStats('archer', 3);

    expect(t1.tier).toBe(1);
    expect(t1.damage).toBe(15);
    expect(t1.range).toBe(120);
    expect(t1.fireRate).toBe(1.2);
    expect(t1.upgradeCost).toBe(75);

    expect(t2.tier).toBe(2);
    expect(t2.damage).toBeGreaterThan(t1.damage);
    expect(t2.range).toBeGreaterThan(t1.range);
    expect(t2.fireRate).toBeGreaterThan(t1.fireRate);
    expect(t2.upgradeCost).toBe(150);

    expect(t3.tier).toBe(3);
    expect(t3.damage).toBeGreaterThan(t2.damage);
    expect(t3.range).toBeGreaterThan(t2.range);
    expect(t3.fireRate).toBeGreaterThan(t2.fireRate);
    expect(t3.upgradeCost).toBe(0); // Max tier
  });

  it('should have 3-tier stat progressions for Cannon Tower with increasing splash & damage', () => {
    const t1 = getTowerTierStats('cannon', 1);
    const t2 = getTowerTierStats('cannon', 2);
    const t3 = getTowerTierStats('cannon', 3);

    expect(t1.damage).toBe(45);
    expect(t1.splashRadius).toBe(48);
    expect(t1.upgradeCost).toBe(120);

    expect(t2.damage).toBe(80);
    expect(t2.splashRadius).toBe(60);
    expect(t2.upgradeCost).toBe(200);

    expect(t3.damage).toBe(140);
    expect(t3.splashRadius).toBe(75);
    expect(t3.upgradeCost).toBe(0);
  });

  it('should have 3-tier stat progressions for Mage Tower with high damage and range', () => {
    const t1 = getTowerTierStats('mage', 1);
    const t2 = getTowerTierStats('mage', 2);
    const t3 = getTowerTierStats('mage', 3);

    expect(t1.damage).toBe(60);
    expect(t1.range).toBe(140);
    expect(t1.upgradeCost).toBe(160);

    expect(t2.damage).toBe(110);
    expect(t2.range).toBe(160);
    expect(t2.upgradeCost).toBe(280);

    expect(t3.damage).toBe(190);
    expect(t3.range).toBe(180);
    expect(t3.upgradeCost).toBe(0);
  });

  it('should return correct upgrade costs and null for max tier', () => {
    expect(getUpgradeCost('archer', 1)).toBe(75);
    expect(getUpgradeCost('archer', 2)).toBe(150);
    expect(getUpgradeCost('archer', 3)).toBeNull();

    expect(getNextTierStats('archer', 1)?.tier).toBe(2);
    expect(getNextTierStats('archer', 2)?.tier).toBe(3);
    expect(getNextTierStats('archer', 3)).toBeNull();

    expect(canUpgradeTier(1)).toBe(true);
    expect(canUpgradeTier(2)).toBe(true);
    expect(canUpgradeTier(3)).toBe(false);
  });

  it('should throw error for invalid tier or unknown tower type', () => {
    expect(() => getTowerTierStats('archer', 0)).toThrow();
    expect(() => getTowerTierStats('archer', 4)).toThrow();
    expect(() => getTowerTierStats('invalid' as any, 1)).toThrow();
  });
});

describe('TowerUpgradeSystem (TASK-07-02)', () => {
  let world: World;
  let economy: EconomyManager;
  let eventBus: EventBus;
  let upgradeSystem: TowerUpgradeSystem;

  beforeEach(() => {
    world = new World();
    eventBus = new EventBus();
    economy = new EconomyManager(500, eventBus);
    upgradeSystem = new TowerUpgradeSystem({ world, economy, eventBus });
    world.addSystem(upgradeSystem);
  });

  it('should successfully upgrade an Archer Tower from Tier 1 to Tier 2', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 2, 3);
    const initialGold = economy.getGold(); // 500
    const upgradeCost = getUpgradeCost('archer', 1)!; // 75

    let eventFired = false;
    eventBus.on('TOWER_UPGRADED', (data) => {
      eventFired = true;
      expect(data.entity).toBe(towerEntity);
      expect(data.towerType).toBe('archer');
      expect(data.newTier).toBe(2);
      expect(data.previousTier).toBe(1);
      expect(data.upgradeCost).toBe(upgradeCost);
      expect(data.damage).toBe(25);
      expect(data.range).toBe(140);
      expect(data.fireRate).toBe(1.5);
      expect(data.gridX).toBe(2);
      expect(data.gridY).toBe(3);
    });

    const success = upgradeSystem.upgradeTower(world, towerEntity);
    expect(success).toBe(true);
    expect(eventFired).toBe(true);

    // Economy deducted
    expect(economy.getGold()).toBe(initialGold - upgradeCost);

    // Tower component updated
    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    expect(tower.tier).toBe(2);
    expect(tower.damage).toBe(25);
    expect(tower.range).toBe(140);
    expect(tower.fireRate).toBe(1.5);
    expect(tower.totalInvestedCost).toBe(getTowerDefinition('archer').baseCost + upgradeCost);
  });

  it('should successfully upgrade through all tiers up to Tier 3', () => {
    const towerEntity = TowerFactory.createTower(world, 'cannon', 1, 1);
    const baseCost = getTowerDefinition('cannon').baseCost; // 150

    // Upgrade 1 -> 2
    const costT1toT2 = getUpgradeCost('cannon', 1)!; // 120
    expect(upgradeSystem.upgradeTower(world, towerEntity)).toBe(true);

    let tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    expect(tower.tier).toBe(2);
    expect(tower.damage).toBe(80);
    expect(tower.splashRadius).toBe(60);
    expect(tower.totalInvestedCost).toBe(baseCost + costT1toT2);

    // Upgrade 2 -> 3
    const costT2toT3 = getUpgradeCost('cannon', 2)!; // 200
    expect(upgradeSystem.upgradeTower(world, towerEntity)).toBe(true);

    tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    expect(tower.tier).toBe(3);
    expect(tower.damage).toBe(140);
    expect(tower.splashRadius).toBe(75);
    expect(tower.totalInvestedCost).toBe(baseCost + costT1toT2 + costT2toT3);

    // Attempting upgrade on Tier 3 should fail
    const canUpgradeMax = upgradeSystem.canUpgradeTower(world, towerEntity);
    expect(canUpgradeMax.valid).toBe(false);
    expect(canUpgradeMax.reason).toBe('max_tier');

    let rejectedReason: string | null = null;
    upgradeSystem.onUpgradeRejected((_entity, reason) => {
      rejectedReason = reason;
    });

    expect(upgradeSystem.upgradeTower(world, towerEntity)).toBe(false);
    expect(rejectedReason).toBe('max_tier');
    expect(tower.tier).toBe(3);
  });

  it('should reject upgrade when player has insufficient gold without modifying tower or balance', () => {
    const towerEntity = TowerFactory.createTower(world, 'mage', 4, 4);
    economy.setGold(50); // Mage upgrade 1->2 costs 160

    const validation = upgradeSystem.canUpgradeTower(world, towerEntity);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('insufficient_gold');
    expect(validation.cost).toBe(160);

    let rejectedReason: string | null = null;
    upgradeSystem.onUpgradeRejected((_entity, reason) => {
      rejectedReason = reason;
    });

    const success = upgradeSystem.upgradeTower(world, towerEntity);
    expect(success).toBe(false);
    expect(rejectedReason).toBe('insufficient_gold');
    expect(economy.getGold()).toBe(50);

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    expect(tower.tier).toBe(1);
    expect(tower.damage).toBe(60);
  });

  it('should reject upgrade on invalid/dead entities', () => {
    const deadEntity = 9999 as any;
    expect(upgradeSystem.canUpgradeTower(world, deadEntity).valid).toBe(false);
    expect(upgradeSystem.upgradeTower(world, deadEntity)).toBe(false);

    const nonTowerEntity = world.createEntity();
    expect(upgradeSystem.canUpgradeTower(world, nonTowerEntity).valid).toBe(false);
    expect(upgradeSystem.upgradeTower(world, nonTowerEntity)).toBe(false);
  });

  it('should notify local callbacks on successful upgrade', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 0, 0);
    let notifiedEntity: any = null;
    let notifiedCost = 0;

    upgradeSystem.onTowerUpgraded((entity, _tower, cost) => {
      notifiedEntity = entity;
      notifiedCost = cost;
    });

    upgradeSystem.upgradeTower(world, towerEntity);
    expect(notifiedEntity).toBe(towerEntity);
    expect(notifiedCost).toBe(75);
  });
});
