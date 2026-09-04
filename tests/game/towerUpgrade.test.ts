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
  getTowerUpgradeTree,
  getTowerUpgradePaths,
  getTowerUpgradePathInfo,
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

  it('should provide two distinct upgrade paths for each tower type', () => {
    for (const type of ['archer', 'cannon', 'mage'] as const) {
      const tree = getTowerUpgradeTree(type);
      expect(tree.base).toBeDefined();
      expect(tree.path1).toBeDefined();
      expect(tree.path2).toBeDefined();
      expect(tree.path1.name).toBeTruthy();
      expect(tree.path2.name).toBeTruthy();
      expect(tree.path1.name).not.toBe(tree.path2.name);

      const paths = getTowerUpgradePaths(type);
      expect(paths.path1.pathId).toBe('path1');
      expect(paths.path2.pathId).toBe('path2');

      const p1Info = getTowerUpgradePathInfo(type, 'path1');
      const p2Info = getTowerUpgradePathInfo(type, 'path2');
      expect(p1Info.pathId).toBe('path1');
      expect(p2Info.pathId).toBe('path2');
    }
  });

  it('should have 3-tier stat progressions for Archer Tower along Path 1 and Path 2', () => {
    // Base & Path 1
    const t1 = getTowerTierStats('archer', 1);
    const p1_t2 = getTowerTierStats('archer', 2, 'path1');
    const p1_t3 = getTowerTierStats('archer', 3, 'path1');

    expect(t1.tier).toBe(1);
    expect(t1.damage).toBe(20);
    expect(t1.range).toBe(125);
    expect(t1.fireRate).toBe(1.35);
    expect(t1.upgradeCost).toBe(75);

    expect(p1_t2.tier).toBe(2);
    expect(p1_t2.damage).toBe(35);
    expect(p1_t2.range).toBe(145);
    expect(p1_t2.fireRate).toBe(1.65);
    expect(p1_t2.upgradeCost).toBe(150);

    expect(p1_t3.tier).toBe(3);
    expect(p1_t3.damage).toBe(55);
    expect(p1_t3.range).toBe(165);
    expect(p1_t3.fireRate).toBe(2.1);
    expect(p1_t3.upgradeCost).toBe(0);

    // Path 2 (Rapid Fire specialization)
    const p2_t2 = getTowerTierStats('archer', 2, 'path2');
    const p2_t3 = getTowerTierStats('archer', 3, 'path2');

    expect(p2_t2.tier).toBe(2);
    expect(p2_t2.damage).toBe(25);
    expect(p2_t2.range).toBe(130);
    expect(p2_t2.fireRate).toBe(2.4); // higher fire rate than path 1
    expect(p2_t2.upgradeCost).toBe(150);

    expect(p2_t3.tier).toBe(3);
    expect(p2_t3.damage).toBe(38);
    expect(p2_t3.fireRate).toBe(3.6); // very high fire rate
    expect(p2_t3.upgradeCost).toBe(0);
  });

  it('should have 3-tier stat progressions for Cannon Tower along Path 1 (Heavy) and Path 2 (Cluster)', () => {
    const t1 = getTowerTierStats('cannon', 1);
    const p1_t2 = getTowerTierStats('cannon', 2, 'path1');
    const p1_t3 = getTowerTierStats('cannon', 3, 'path1');

    expect(t1.damage).toBe(40);
    expect(t1.splashRadius).toBe(42);
    expect(t1.upgradeCost).toBe(120);

    expect(p1_t2.damage).toBe(70);
    expect(p1_t2.splashRadius).toBe(52);
    expect(p1_t2.upgradeCost).toBe(200);

    expect(p1_t3.damage).toBe(110);
    expect(p1_t3.splashRadius).toBe(62);
    expect(p1_t3.upgradeCost).toBe(0);

    // Path 2 (Cluster Shrapnel specialization)
    const p2_t2 = getTowerTierStats('cannon', 2, 'path2');
    const p2_t3 = getTowerTierStats('cannon', 3, 'path2');

    expect(p2_t2.damage).toBe(50);
    expect(p2_t2.splashRadius).toBe(68); // wider splash than path 1
    expect(p2_t2.fireRate).toBe(0.95); // faster fire rate

    expect(p2_t3.damage).toBe(80);
    expect(p2_t3.splashRadius).toBe(88); // massive splash
    expect(p2_t3.fireRate).toBe(1.25);
  });

  it('should have 3-tier stat progressions for Mage Tower along Path 1 (Beam) and Path 2 (Nova)', () => {
    const t1 = getTowerTierStats('mage', 1);
    const p1_t2 = getTowerTierStats('mage', 2, 'path1');
    const p1_t3 = getTowerTierStats('mage', 3, 'path1');

    expect(t1.damage).toBe(75);
    expect(t1.range).toBe(140);
    expect(t1.fireRate).toBe(0.85);
    expect(t1.upgradeCost).toBe(160);

    expect(p1_t2.damage).toBe(135);
    expect(p1_t2.range).toBe(160);
    expect(p1_t2.upgradeCost).toBe(280);

    expect(p1_t3.damage).toBe(220);
    expect(p1_t3.range).toBe(180);
    expect(p1_t3.upgradeCost).toBe(0);

    // Path 2 (Pulsar Nova specialization)
    const p2_t2 = getTowerTierStats('mage', 2, 'path2');
    const p2_t3 = getTowerTierStats('mage', 3, 'path2');

    expect(p2_t2.damage).toBe(95);
    expect(p2_t2.splashRadius).toBe(36); // gained splash
    expect(p2_t2.fireRate).toBe(1.35);

    expect(p2_t3.damage).toBe(150);
    expect(p2_t3.splashRadius).toBe(56);
    expect(p2_t3.fireRate).toBe(1.75);
  });

  it('should return correct upgrade costs and null for max tier across paths', () => {
    expect(getUpgradeCost('archer', 1)).toBe(75);
    expect(getUpgradeCost('archer', 2, 'path1')).toBe(150);
    expect(getUpgradeCost('archer', 2, 'path2')).toBe(150);
    expect(getUpgradeCost('archer', 3, 'path1')).toBeNull();
    expect(getUpgradeCost('archer', 3, 'path2')).toBeNull();

    expect(getNextTierStats('archer', 1, 'path1')?.tier).toBe(2);
    expect(getNextTierStats('archer', 1, 'path2')?.tier).toBe(2);
    expect(getNextTierStats('archer', 2, 'path1')?.tier).toBe(3);
    expect(getNextTierStats('archer', 2, 'path2')?.tier).toBe(3);
    expect(getNextTierStats('archer', 3, 'path1')).toBeNull();
    expect(getNextTierStats('archer', 3, 'path2')).toBeNull();

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
      expect(data.upgradePath).toBe('path1');
      expect(data.upgradeCost).toBe(upgradeCost);
      expect(data.damage).toBe(35);
      expect(data.range).toBe(145);
      expect(data.fireRate).toBe(1.65);
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
    expect(tower.upgradePath).toBe('path1');
    expect(tower.damage).toBe(35);
    expect(tower.range).toBe(145);
    expect(tower.fireRate).toBe(1.65);
    expect(tower.totalInvestedCost).toBe(getTowerDefinition('archer').baseCost + upgradeCost);
  });

  it('should successfully upgrade a tower along Path 2 and enforce path locking', () => {
    const towerEntity = TowerFactory.createTower(world, 'archer', 3, 3);
    const initialGold = economy.getGold(); // 500

    // Upgrade along Path 2 from Tier 1 -> Tier 2
    const successP2 = upgradeSystem.upgradeTower(world, towerEntity, 'path2');
    expect(successP2).toBe(true);
    expect(economy.getGold()).toBe(initialGold - 75);

    const tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    expect(tower.tier).toBe(2);
    expect(tower.upgradePath).toBe('path2');
    expect(tower.damage).toBe(25);
    expect(tower.fireRate).toBe(2.4);

    // Attempting to upgrade Path 1 on a Path 2 tower should fail with path_locked
    const checkOppositePath = upgradeSystem.canUpgradeTower(world, towerEntity, 'path1');
    expect(checkOppositePath.valid).toBe(false);
    expect(checkOppositePath.reason).toBe('path_locked');

    const rejectOpposite = upgradeSystem.upgradeTower(world, towerEntity, 'path1');
    expect(rejectOpposite).toBe(false);

    // Upgrading Path 2 to Tier 3 succeeds
    const successP2_T3 = upgradeSystem.upgradeTower(world, towerEntity, 'path2');
    expect(successP2_T3).toBe(true);
    expect(tower.tier).toBe(3);
    expect(tower.upgradePath).toBe('path2');
    expect(tower.damage).toBe(38);
    expect(tower.fireRate).toBe(3.6);
  });

  it('should successfully upgrade through all tiers up to Tier 3', () => {
    const towerEntity = TowerFactory.createTower(world, 'cannon', 1, 1);
    const baseCost = getTowerDefinition('cannon').baseCost; // 150

    // Upgrade 1 -> 2
    const costT1toT2 = getUpgradeCost('cannon', 1)!; // 120
    expect(upgradeSystem.upgradeTower(world, towerEntity)).toBe(true);

    let tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    expect(tower.tier).toBe(2);
    expect(tower.damage).toBe(70);
    expect(tower.splashRadius).toBe(52);
    expect(tower.totalInvestedCost).toBe(baseCost + costT1toT2);

    // Upgrade 2 -> 3
    const costT2toT3 = getUpgradeCost('cannon', 2)!; // 200
    expect(upgradeSystem.upgradeTower(world, towerEntity)).toBe(true);

    tower = world.getComponent<TowerComponent>(towerEntity, TOWER_COMPONENT)!;
    expect(tower.tier).toBe(3);
    expect(tower.damage).toBe(110);
    expect(tower.splashRadius).toBe(62);
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
    expect(tower.damage).toBe(75);
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
