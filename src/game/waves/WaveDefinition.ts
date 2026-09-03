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
    rewardGold: 40,
    rewardScore: 60,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 8,
        intervalSeconds: 1.2,
        startDelaySeconds: 0,
      },
    ],
  },
  {
    waveNumber: 2,
    description: 'Scout Reinforcements - A larger formation of basic infantry',
    rewardGold: 50,
    rewardScore: 90,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 10,
        intervalSeconds: 1.0,
        startDelaySeconds: 0,
      },
    ],
  },
  {
    waveNumber: 3,
    description: 'Swift Striders - Fast runners attempt to dash through defenses',
    rewardGold: 60,
    rewardScore: 130,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 6,
        intervalSeconds: 0.8,
        startDelaySeconds: 0,
      },
      {
        creepType: 'fast',
        count: 6,
        intervalSeconds: 0.6,
        startDelaySeconds: 4.5,
      },
    ],
  },
  {
    waveNumber: 4,
    description: 'Armored Recon - Heavy armor enters the field alongside infantry',
    rewardGold: 75,
    rewardScore: 180,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 8,
        intervalSeconds: 0.8,
        startDelaySeconds: 0,
      },
      {
        creepType: 'tank',
        count: 3,
        intervalSeconds: 2.0,
        startDelaySeconds: 6.0,
      },
    ],
  },
  {
    waveNumber: 5,
    description: 'Rapid Blitz - Coordinated sprint units rush the lanes',
    rewardGold: 90,
    rewardScore: 240,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 8,
        intervalSeconds: 0.7,
        startDelaySeconds: 0,
      },
      {
        creepType: 'fast',
        count: 10,
        intervalSeconds: 0.5,
        startDelaySeconds: 5.0,
      },
    ],
  },
  {
    waveNumber: 6,
    description: 'Iron Brigade - Heavily armored vanguard escorted by infantry',
    rewardGold: 110,
    rewardScore: 320,
    spawnGroups: [
      {
        creepType: 'basic',
        count: 10,
        intervalSeconds: 0.6,
        startDelaySeconds: 0,
      },
      {
        creepType: 'tank',
        count: 4,
        intervalSeconds: 1.6,
        startDelaySeconds: 6.0,
      },
      {
        creepType: 'basic',
        count: 6,
        intervalSeconds: 0.5,
        startDelaySeconds: 13.0,
      },
    ],
  },
  {
    waveNumber: 7,
    description: 'Swarm Incursion - High-density swarms of fast raiders',
    rewardGold: 130,
    rewardScore: 420,
    spawnGroups: [
      {
        creepType: 'fast',
        count: 14,
        intervalSeconds: 0.4,
        startDelaySeconds: 0,
      },
      {
        creepType: 'basic',
        count: 12,
        intervalSeconds: 0.5,
        startDelaySeconds: 5.0,
      },
      {
        creepType: 'fast',
        count: 8,
        intervalSeconds: 0.35,
        startDelaySeconds: 11.0,
      },
    ],
  },
  {
    waveNumber: 8,
    description: 'Combined Arms Assault - Coordinated force of tanks, runners, and infantry',
    rewardGold: 150,
    rewardScore: 550,
    spawnGroups: [
      {
        creepType: 'tank',
        count: 5,
        intervalSeconds: 1.5,
        startDelaySeconds: 0,
      },
      {
        creepType: 'fast',
        count: 12,
        intervalSeconds: 0.4,
        startDelaySeconds: 6.0,
      },
      {
        creepType: 'basic',
        count: 14,
        intervalSeconds: 0.45,
        startDelaySeconds: 11.0,
      },
      {
        creepType: 'tank',
        count: 4,
        intervalSeconds: 1.3,
        startDelaySeconds: 17.0,
      },
    ],
  },
  {
    waveNumber: 9,
    description: 'Vanguard of the Colossus - Elite battalion paving the path for the titan',
    rewardGold: 180,
    rewardScore: 700,
    spawnGroups: [
      {
        creepType: 'tank',
        count: 6,
        intervalSeconds: 1.2,
        startDelaySeconds: 0,
      },
      {
        creepType: 'fast',
        count: 16,
        intervalSeconds: 0.35,
        startDelaySeconds: 7.0,
      },
      {
        creepType: 'basic',
        count: 16,
        intervalSeconds: 0.4,
        startDelaySeconds: 12.0,
      },
      {
        creepType: 'tank',
        count: 6,
        intervalSeconds: 1.1,
        startDelaySeconds: 18.0,
      },
    ],
  },
  {
    waveNumber: 10,
    description: "The Titan's Siege - The Colossus leads an all-out assault",
    rewardGold: 250,
    rewardScore: 1200,
    spawnGroups: [
      {
        creepType: 'tank',
        count: 6,
        intervalSeconds: 1.3,
        startDelaySeconds: 0,
      },
      {
        creepType: 'boss',
        count: 1,
        intervalSeconds: 1.0,
        startDelaySeconds: 7.5,
      },
      {
        creepType: 'fast',
        count: 16,
        intervalSeconds: 0.35,
        startDelaySeconds: 10.0,
      },
      {
        creepType: 'basic',
        count: 14,
        intervalSeconds: 0.4,
        startDelaySeconds: 15.0,
      },
      {
        creepType: 'tank',
        count: 6,
        intervalSeconds: 1.2,
        startDelaySeconds: 21.0,
      },
    ],
  },
];
