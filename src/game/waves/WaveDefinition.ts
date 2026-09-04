import { CreepType } from '../creeps/CreepComponents';

export interface SpawnGroup {
  creepType: CreepType;
  count: number;
  intervalSeconds: number;
  startDelaySeconds?: number;
}

export interface WaveDefinition {
  waveNumber: number;
  spawnGroups: SpawnGroup[];
  rewardGold?: number;
  rewardScore?: number;
  description?: string;
}

/**
 * Computes the total number of creeps in a wave.
 */
export function getTotalCreepsInWave(wave: WaveDefinition): number {
  return wave.spawnGroups.reduce((acc, group) => acc + group.count, 0);
}

/**
 * Computes the estimated active spawn duration (in seconds) for a wave.
 */
export function getWaveDurationSeconds(wave: WaveDefinition): number {
  let maxTime = 0;
  for (const group of wave.spawnGroups) {
    const delay = group.startDelaySeconds ?? 0;
    const duration = delay + (group.count > 0 ? (group.count - 1) * group.intervalSeconds : 0);
    if (duration > maxTime) {
      maxTime = duration;
    }
  }
  return maxTime;
}

/**
 * Standard balanced starter waves for level maps.
 * Designed with a gentle early ramp-up and progressive late-game challenge across 10 waves.
 */
export const DEFAULT_WAVES: WaveDefinition[] = [
  {
    waveNumber: 1,
    description: 'Scout Vanguard - A scouting party tests the perimeter',
    rewardGold: 25,
    rewardScore: 60,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 6,
        intervalSeconds: 1.4,
        startDelaySeconds: 0,
      },
    ],
  },
  {
    waveNumber: 2,
    description: 'Scout Reinforcements - A larger formation of basic infantry',
    rewardGold: 30,
    rewardScore: 90,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 8,
        intervalSeconds: 1.2,
        startDelaySeconds: 0,
      },
      {
        creepType: 'fast',
        count: 3,
        intervalSeconds: 0.9,
        startDelaySeconds: 6.0,
      },
    ],
  },
  {
    waveNumber: 3,
    description: 'Swift Striders - Fast runners attempt to dash through defenses',
    rewardGold: 35,
    rewardScore: 130,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 8,
        intervalSeconds: 1.0,
        startDelaySeconds: 0,
      },
      {
        creepType: 'fast',
        count: 5,
        intervalSeconds: 0.8,
        startDelaySeconds: 5.0,
      },
    ],
  },
  {
    waveNumber: 4,
    description: 'Armored Recon - Heavy armor enters the field alongside infantry',
    rewardGold: 45,
    rewardScore: 180,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 10,
        intervalSeconds: 0.9,
        startDelaySeconds: 0,
      },
      {
        creepType: 'tank',
        count: 2,
        intervalSeconds: 2.5,
        startDelaySeconds: 6.0,
      },
    ],
  },
  {
    waveNumber: 5,
    description: 'Rapid Blitz - Coordinated sprint units rush the lanes',
    rewardGold: 55,
    rewardScore: 240,
    spawnGroups: [
      {
        creepType: 'fast',
        count: 8,
        intervalSeconds: 0.75,
        startDelaySeconds: 0,
      },
      {
        creepType: 'basic',
        count: 8,
        intervalSeconds: 0.9,
        startDelaySeconds: 4.0,
      },
      {
        creepType: 'tank',
        count: 2,
        intervalSeconds: 2.2,
        startDelaySeconds: 9.0,
      },
    ],
  },
  {
    waveNumber: 6,
    description: 'Iron Brigade - Heavily armored vanguard escorted by infantry',
    rewardGold: 65,
    rewardScore: 320,
    spawnGroups: [
      {
        creepType: 'tank',
        count: 3,
        intervalSeconds: 2.0,
        startDelaySeconds: 0,
      },
      {
        creepType: 'basic',
        count: 10,
        intervalSeconds: 0.8,
        startDelaySeconds: 4.0,
      },
      {
        creepType: 'fast',
        count: 6,
        intervalSeconds: 0.7,
        startDelaySeconds: 9.0,
      },
    ],
  },
  {
    waveNumber: 7,
    description: 'Assault Cohort - Armored strike force and swift flankers',
    rewardGold: 80,
    rewardScore: 420,
    spawnGroups: [
      {
        creepType: 'tank',
        count: 4,
        intervalSeconds: 1.8,
        startDelaySeconds: 0,
      },
      {
        creepType: 'fast',
        count: 10,
        intervalSeconds: 0.6,
        startDelaySeconds: 4.0,
      },
      {
        creepType: 'basic',
        count: 10,
        intervalSeconds: 0.7,
        startDelaySeconds: 9.0,
      },
    ],
  },
  {
    waveNumber: 8,
    description: 'Siege Column - Heavy armored battalion advancing with speed support',
    rewardGold: 95,
    rewardScore: 550,
    spawnGroups: [
      {
        creepType: 'tank',
        count: 5,
        intervalSeconds: 1.6,
        startDelaySeconds: 0,
      },
      {
        creepType: 'fast',
        count: 12,
        intervalSeconds: 0.55,
        startDelaySeconds: 4.0,
      },
      {
        creepType: 'basic',
        count: 12,
        intervalSeconds: 0.65,
        startDelaySeconds: 9.0,
      },
      {
        creepType: 'tank',
        count: 3,
        intervalSeconds: 1.6,
        startDelaySeconds: 15.0,
      },
    ],
  },
  {
    waveNumber: 9,
    description: 'Colossus Vanguard - Pre-boss heavy formation',
    rewardGold: 110,
    rewardScore: 700,
    spawnGroups: [
      {
        creepType: 'tank',
        count: 6,
        intervalSeconds: 1.5,
        startDelaySeconds: 0,
      },
      {
        creepType: 'fast',
        count: 14,
        intervalSeconds: 0.5,
        startDelaySeconds: 4.0,
      },
      {
        creepType: 'basic',
        count: 14,
        intervalSeconds: 0.6,
        startDelaySeconds: 9.0,
      },
      {
        creepType: 'tank',
        count: 4,
        intervalSeconds: 1.4,
        startDelaySeconds: 15.0,
      },
    ],
  },
  {
    waveNumber: 10,
    description: 'Titan Awakening - Sovereign Boss Titan and armored escort',
    rewardGold: 150,
    rewardScore: 1000,
    spawnGroups: [
      {
        creepType: 'tank',
        count: 4,
        intervalSeconds: 1.8,
        startDelaySeconds: 0,
      },
      {
        creepType: 'boss',
        count: 1,
        intervalSeconds: 1.0,
        startDelaySeconds: 5.0,
      },
      {
        creepType: 'fast',
        count: 12,
        intervalSeconds: 0.5,
        startDelaySeconds: 8.0,
      },
      {
        creepType: 'basic',
        count: 12,
        intervalSeconds: 0.6,
        startDelaySeconds: 13.0,
      },
      {
        creepType: 'tank',
        count: 4,
        intervalSeconds: 1.5,
        startDelaySeconds: 18.0,
      },
    ],
  },
];
