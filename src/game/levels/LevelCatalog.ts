import { LevelDefinition, gridWaypointsToWorld } from './LevelDefinition';
import { WaveDefinition } from '../waves/WaveDefinition';

// ==========================================
// Level 1: Emerald Plains (Difficulty: 1 / 5)
// ==========================================
const LEVEL_1_TILES = [
  '##############################',
  '#PPPP........................#',
  '#...P........................#',
  '#...P........................#',
  '#...PPPPPPPPPP...............#',
  '#............P...............#',
  '#............P...............#',
  '#............PPPPPPPPPP......#',
  '#.....................P......#',
  '#..##.................P......#',
  '#..##.................P......#',
  '#.....................PPPPPP.#',
  '#..........................P.#',
  '#..........................P.#',
  '#..........................P.#',
  '#..........................P.#',
  '#..........................P.#',
  '#..........................P.#',
  '#..........................P.#',
  '###########################P##',
];

const LEVEL_1_WAYPOINTS = [
  { x: 1, y: 1 },
  { x: 4, y: 1 },
  { x: 4, y: 4 },
  { x: 13, y: 4 },
  { x: 13, y: 7 },
  { x: 22, y: 7 },
  { x: 22, y: 11 },
  { x: 27, y: 11 },
  { x: 27, y: 19 },
];

const LEVEL_1_WAVES: WaveDefinition[] = [
  {
    waveNumber: 1,
    description: 'Ascidian Recon - Abhuman scavengers scouting the necropolis',
    rewardGold: 40,
    rewardScore: 60,
    spawnGroups: [
      { creepType: 'basic', count: 12, intervalSeconds: 0.5, startDelaySeconds: 0 },
      { creepType: 'fast', count: 10, intervalSeconds: 0.35, startDelaySeconds: 2.5 },
    ],
  },
  {
    waveNumber: 2,
    description: 'Scavenger Cohort - Reinforced biomechanical neophytes',
    rewardGold: 50,
    rewardScore: 90,
    spawnGroups: [
      { creepType: 'basic', count: 10, intervalSeconds: 0.6, startDelaySeconds: 0 },
      { creepType: 'fast', count: 6, intervalSeconds: 0.4, startDelaySeconds: 3.0 },
    ],
  },
  {
    waveNumber: 3,
    description: 'Alzabo Striders - Swift four-limbed predators on the prowl',
    rewardGold: 60,
    rewardScore: 130,
    spawnGroups: [
      { creepType: 'basic', count: 6, intervalSeconds: 0.8, startDelaySeconds: 0 },
      { creepType: 'fast', count: 6, intervalSeconds: 0.5, startDelaySeconds: 4.5 },
    ],
  },
  {
    waveNumber: 4,
    description: 'Cacogen Patrol - Heavy armored mutant vanguard',
    rewardGold: 75,
    rewardScore: 180,
    spawnGroups: [
      { creepType: 'basic', count: 8, intervalSeconds: 0.8, startDelaySeconds: 0 },
      { creepType: 'tank', count: 3, intervalSeconds: 2.0, startDelaySeconds: 5.5 },
    ],
  },
  {
    waveNumber: 5,
    description: 'Predator Rush - Pack of hyper-accelerated Alzabo beasts',
    rewardGold: 90,
    rewardScore: 240,
    spawnGroups: [
      { creepType: 'basic', count: 8, intervalSeconds: 0.7, startDelaySeconds: 0 },
      { creepType: 'fast', count: 10, intervalSeconds: 0.45, startDelaySeconds: 4.5 },
    ],
  },
  {
    waveNumber: 6,
    description: 'Necropolis Garrison - Chthonic war machines and swarm assault',
    rewardGold: 140,
    rewardScore: 400,
    spawnGroups: [
      { creepType: 'tank', count: 4, intervalSeconds: 1.6, startDelaySeconds: 0 },
      { creepType: 'basic', count: 12, intervalSeconds: 0.5, startDelaySeconds: 5.0 },
      { creepType: 'fast', count: 8, intervalSeconds: 0.4, startDelaySeconds: 10.0 },
    ],
  },
];

// ==========================================
// Level 2: Sunbaked Dunes (Difficulty: 2 / 5)
// ==========================================
const LEVEL_2_TILES = [
  '##############################',
  '#............................#',
  '#............................#',
  'PPPPPPPPPP...................#',
  '#........P........PPPPPPPPP..#',
  '#........P........P......P...#',
  '#...##...P........P......P...#',
  '#...##...P........P......P...#',
  '#..PPPPPPP........P......P...#',
  '#..P..............P......P...#',
  '#..P..............P......P...#',
  '#..P..............P......P...#',
  '#..P.......##.....P......P...#',
  '#..P.......##.....P......P...#',
  '#..PPPPPPPPPPPPPPPP......P...#',
  '#........................P...#',
  '#........................P...#',
  '#........................P...#',
  '#........................P...#',
  '##########################P###',
];

const LEVEL_2_WAYPOINTS = [
  { x: 0, y: 3 },
  { x: 9, y: 3 },
  { x: 9, y: 8 },
  { x: 3, y: 8 },
  { x: 3, y: 14 },
  { x: 18, y: 14 },
  { x: 18, y: 4 },
  { x: 26, y: 4 },
  { x: 26, y: 19 },
];

const LEVEL_2_WAVES: WaveDefinition[] = [
  {
    waveNumber: 1,
    description: 'Salt Waste Vanguard - Acclimated desert ascidians',
    rewardGold: 45,
    rewardScore: 70,
    spawnGroups: [
      { creepType: 'basic', count: 8, intervalSeconds: 1.2, startDelaySeconds: 0 },
    ],
  },
  {
    waveNumber: 2,
    description: 'Dune Alzabo - Fast predatory beasts across the sands',
    rewardGold: 55,
    rewardScore: 100,
    spawnGroups: [
      { creepType: 'basic', count: 6, intervalSeconds: 1.0, startDelaySeconds: 0 },
      { creepType: 'fast', count: 6, intervalSeconds: 0.6, startDelaySeconds: 5.0 },
    ],
  },
  {
    waveNumber: 3,
    description: 'Sand Crawlers - Armored chthonic automata emerging from dunes',
    rewardGold: 70,
    rewardScore: 150,
    spawnGroups: [
      { creepType: 'basic', count: 8, intervalSeconds: 0.8, startDelaySeconds: 0 },
      { creepType: 'tank', count: 3, intervalSeconds: 2.0, startDelaySeconds: 6.0 },
    ],
  },
  {
    waveNumber: 4,
    description: 'Dust Storm Blitz - Rapid flanking hunting packs',
    rewardGold: 85,
    rewardScore: 220,
    spawnGroups: [
      { creepType: 'fast', count: 12, intervalSeconds: 0.45, startDelaySeconds: 0 },
      { creepType: 'basic', count: 8, intervalSeconds: 0.7, startDelaySeconds: 5.0 },
    ],
  },
  {
    waveNumber: 5,
    description: 'Titanium Caravan - Armored siege beasts escorted by scavengers',
    rewardGold: 100,
    rewardScore: 300,
    spawnGroups: [
      { creepType: 'basic', count: 10, intervalSeconds: 0.6, startDelaySeconds: 0 },
      { creepType: 'tank', count: 4, intervalSeconds: 1.7, startDelaySeconds: 5.5 },
      { creepType: 'fast', count: 6, intervalSeconds: 0.5, startDelaySeconds: 12.0 },
    ],
  },
  {
    waveNumber: 6,
    description: 'Mirage Swarm - Dense coordinated raider assault',
    rewardGold: 120,
    rewardScore: 400,
    spawnGroups: [
      { creepType: 'fast', count: 14, intervalSeconds: 0.4, startDelaySeconds: 0 },
      { creepType: 'tank', count: 4, intervalSeconds: 1.5, startDelaySeconds: 5.5 },
      { creepType: 'basic', count: 10, intervalSeconds: 0.5, startDelaySeconds: 11.0 },
    ],
  },
  {
    waveNumber: 7,
    description: 'Sovereign of Nessus - Ancient Colossus Titan arisen from red sands',
    rewardGold: 160,
    rewardScore: 600,
    spawnGroups: [
      { creepType: 'tank', count: 4, intervalSeconds: 1.5, startDelaySeconds: 0 },
      { creepType: 'boss', count: 1, intervalSeconds: 1.0, startDelaySeconds: 6.0 },
      { creepType: 'fast', count: 12, intervalSeconds: 0.4, startDelaySeconds: 9.0 },
      { creepType: 'basic', count: 10, intervalSeconds: 0.5, startDelaySeconds: 14.0 },
    ],
  },
];

// ==========================================
// Level 3: Crag Canyon (Difficulty: 3 / 5)
// ==========================================
const LEVEL_3_TILES = [
  '#P############################',
  '#P...........................#',
  '#P..........PPPPPPPPPPP......#',
  '#P..........P.........P......#',
  '#P..........P.........P......#',
  '#P...##.....P.........P......#',
  '#PPPPPPPPPPPP.........P......#',
  '#.....................P......#',
  '#.....................P......#',
  '#.....................P......#',
  '#.......PPPPPPPPPPPPPPP......#',
  '#.......P....................#',
  '#.......P.....##.............#',
  '#.......P.....##.............#',
  '#.......P....................#',
  '#.......P....................#',
  '#.......PPPPPPPPPPPPPPPPPPPPP#',
  '#...........................P#',
  '#...........................P#',
  '############################P#',
];

const LEVEL_3_WAYPOINTS = [
  { x: 1, y: 0 },
  { x: 1, y: 6 },
  { x: 12, y: 6 },
  { x: 12, y: 2 },
  { x: 22, y: 2 },
  { x: 22, y: 10 },
  { x: 8, y: 10 },
  { x: 8, y: 16 },
  { x: 28, y: 16 },
  { x: 28, y: 19 },
];

const LEVEL_3_WAVES: WaveDefinition[] = [
  {
    waveNumber: 1,
    description: 'Gorge Infiltrators - Fast-moving canyon stalkers in the red dust',
    rewardGold: 50,
    rewardScore: 80,
    spawnGroups: [
      { creepType: 'basic', count: 8, intervalSeconds: 1.0, startDelaySeconds: 0 },
      { creepType: 'fast', count: 4, intervalSeconds: 0.6, startDelaySeconds: 6.0 },
    ],
  },
  {
    waveNumber: 2,
    description: 'Thrax Raiders - Rapid strike squads penetrating the narrows',
    rewardGold: 65,
    rewardScore: 120,
    spawnGroups: [
      { creepType: 'fast', count: 10, intervalSeconds: 0.5, startDelaySeconds: 0 },
      { creepType: 'basic', count: 8, intervalSeconds: 0.7, startDelaySeconds: 5.0 },
    ],
  },
  {
    waveNumber: 3,
    description: 'Chthonic Rams - Heavy armored automata grinding through rock',
    rewardGold: 80,
    rewardScore: 180,
    spawnGroups: [
      { creepType: 'tank', count: 3, intervalSeconds: 1.8, startDelaySeconds: 0 },
      { creepType: 'basic', count: 10, intervalSeconds: 0.6, startDelaySeconds: 5.0 },
    ],
  },
  {
    waveNumber: 4,
    description: 'Flanking Claws - Dual Alzabo assault packs',
    rewardGold: 95,
    rewardScore: 250,
    spawnGroups: [
      { creepType: 'fast', count: 12, intervalSeconds: 0.4, startDelaySeconds: 0 },
      { creepType: 'tank', count: 3, intervalSeconds: 1.6, startDelaySeconds: 5.0 },
      { creepType: 'fast', count: 8, intervalSeconds: 0.35, startDelaySeconds: 10.0 },
    ],
  },
  {
    waveNumber: 5,
    description: 'Heavy Convoy - Armored cacogen wall supported by infantry',
    rewardGold: 110,
    rewardScore: 320,
    spawnGroups: [
      { creepType: 'basic', count: 12, intervalSeconds: 0.5, startDelaySeconds: 0 },
      { creepType: 'tank', count: 5, intervalSeconds: 1.5, startDelaySeconds: 6.0 },
      { creepType: 'basic', count: 8, intervalSeconds: 0.5, startDelaySeconds: 13.0 },
    ],
  },
  {
    waveNumber: 6,
    description: 'Ravine Swarm - Massive wave of striders and iron tanks',
    rewardGold: 130,
    rewardScore: 420,
    spawnGroups: [
      { creepType: 'fast', count: 16, intervalSeconds: 0.35, startDelaySeconds: 0 },
      { creepType: 'tank', count: 5, intervalSeconds: 1.4, startDelaySeconds: 5.5 },
      { creepType: 'basic', count: 12, intervalSeconds: 0.45, startDelaySeconds: 12.0 },
    ],
  },
  {
    waveNumber: 7,
    description: 'Siege Vanguard - Pre-boss armored onslaught of ancient metal',
    rewardGold: 150,
    rewardScore: 550,
    spawnGroups: [
      { creepType: 'tank', count: 6, intervalSeconds: 1.3, startDelaySeconds: 0 },
      { creepType: 'fast', count: 14, intervalSeconds: 0.35, startDelaySeconds: 7.0 },
      { creepType: 'basic', count: 14, intervalSeconds: 0.4, startDelaySeconds: 12.0 },
      { creepType: 'tank', count: 4, intervalSeconds: 1.2, startDelaySeconds: 18.0 },
    ],
  },
  {
    waveNumber: 8,
    description: 'Crag Colossus - The Mountain War Engine awakens from deep sleep',
    rewardGold: 200,
    rewardScore: 800,
    spawnGroups: [
      { creepType: 'tank', count: 5, intervalSeconds: 1.4, startDelaySeconds: 0 },
      { creepType: 'boss', count: 1, intervalSeconds: 1.0, startDelaySeconds: 7.0 },
      { creepType: 'fast', count: 16, intervalSeconds: 0.35, startDelaySeconds: 10.0 },
      { creepType: 'basic', count: 14, intervalSeconds: 0.4, startDelaySeconds: 15.0 },
      { creepType: 'tank', count: 5, intervalSeconds: 1.2, startDelaySeconds: 21.0 },
    ],
  },
];

// ==========================================
// Level 4: Iron Stronghold (Difficulty: 4 / 5)
// ==========================================
const LEVEL_4_TILES = [
  '##############################',
  '#............................#',
  '#.....PPPPPPPPPPP............#',
  '#.....P.........P............#',
  '#.....P.........P............#',
  '#.....P..###....P............#',
  '#.....P..###....P............#',
  '#.....P.........P............#',
  '#.....P...PPPPPPP.......PPPPPP',
  '#.....P...P.............P....#',
  'PPPPPPP...P.............P....#',
  '#.........P.............P....#',
  '#.........P...###.......P....#',
  '#.........P...###.......P....#',
  '#.........P.............P....#',
  '#.........P.............P....#',
  '#.........PPPPPPPPPPPPPPP....#',
  '#............................#',
  '#............................#',
  '##############################',
];

const LEVEL_4_WAYPOINTS = [
  { x: 0, y: 10 },
  { x: 6, y: 10 },
  { x: 6, y: 2 },
  { x: 16, y: 2 },
  { x: 16, y: 8 },
  { x: 10, y: 8 },
  { x: 10, y: 16 },
  { x: 24, y: 16 },
  { x: 24, y: 8 },
  { x: 29, y: 8 },
];

const LEVEL_4_WAVES: WaveDefinition[] = [
  {
    waveNumber: 1,
    description: 'Citadel Breachers - Fast ascidian vanguard probing outer bastions',
    rewardGold: 55,
    rewardScore: 90,
    spawnGroups: [
      { creepType: 'basic', count: 10, intervalSeconds: 0.9, startDelaySeconds: 0 },
      { creepType: 'fast', count: 6, intervalSeconds: 0.5, startDelaySeconds: 5.0 },
    ],
  },
  {
    waveNumber: 2,
    description: 'Fuligin Vanguard - Armored legion marching from the voidship gate',
    rewardGold: 70,
    rewardScore: 140,
    spawnGroups: [
      { creepType: 'tank', count: 3, intervalSeconds: 1.8, startDelaySeconds: 0 },
      { creepType: 'basic', count: 10, intervalSeconds: 0.6, startDelaySeconds: 5.0 },
      { creepType: 'fast', count: 6, intervalSeconds: 0.45, startDelaySeconds: 10.0 },
    ],
  },
  {
    waveNumber: 3,
    description: 'Courtyard Blitz - High-density swarm of bio-stalkers',
    rewardGold: 90,
    rewardScore: 200,
    spawnGroups: [
      { creepType: 'fast', count: 14, intervalSeconds: 0.4, startDelaySeconds: 0 },
      { creepType: 'basic', count: 10, intervalSeconds: 0.5, startDelaySeconds: 5.0 },
    ],
  },
  {
    waveNumber: 4,
    description: 'Heavy Siege - Dual armored tank cohorts pounding bulwarks',
    rewardGold: 105,
    rewardScore: 280,
    spawnGroups: [
      { creepType: 'tank', count: 4, intervalSeconds: 1.5, startDelaySeconds: 0 },
      { creepType: 'basic', count: 12, intervalSeconds: 0.5, startDelaySeconds: 5.5 },
      { creepType: 'tank', count: 3, intervalSeconds: 1.4, startDelaySeconds: 11.0 },
    ],
  },
  {
    waveNumber: 5,
    description: 'Rampart Storm - Mixed heavy siege engines and hunting packs',
    rewardGold: 125,
    rewardScore: 360,
    spawnGroups: [
      { creepType: 'fast', count: 16, intervalSeconds: 0.35, startDelaySeconds: 0 },
      { creepType: 'tank', count: 4, intervalSeconds: 1.4, startDelaySeconds: 5.5 },
      { creepType: 'basic', count: 14, intervalSeconds: 0.45, startDelaySeconds: 11.0 },
    ],
  },
  {
    waveNumber: 6,
    description: 'Iron Legion - Relentless ancient armored cohort',
    rewardGold: 145,
    rewardScore: 460,
    spawnGroups: [
      { creepType: 'tank', count: 6, intervalSeconds: 1.3, startDelaySeconds: 0 },
      { creepType: 'basic', count: 16, intervalSeconds: 0.4, startDelaySeconds: 7.0 },
      { creepType: 'fast', count: 12, intervalSeconds: 0.35, startDelaySeconds: 13.0 },
    ],
  },
  {
    waveNumber: 7,
    description: 'Catapult Guard - Armored heavy battalion of forgotten wars',
    rewardGold: 170,
    rewardScore: 600,
    spawnGroups: [
      { creepType: 'tank', count: 6, intervalSeconds: 1.2, startDelaySeconds: 0 },
      { creepType: 'fast', count: 18, intervalSeconds: 0.3, startDelaySeconds: 7.0 },
      { creepType: 'basic', count: 16, intervalSeconds: 0.4, startDelaySeconds: 12.0 },
      { creepType: 'tank', count: 4, intervalSeconds: 1.1, startDelaySeconds: 18.0 },
    ],
  },
  {
    waveNumber: 8,
    description: 'Citadel Gatecrashers - Pre-boss devastating onslaught upon the keep',
    rewardGold: 195,
    rewardScore: 750,
    spawnGroups: [
      { creepType: 'tank', count: 7, intervalSeconds: 1.1, startDelaySeconds: 0 },
      { creepType: 'fast', count: 20, intervalSeconds: 0.3, startDelaySeconds: 7.5 },
      { creepType: 'basic', count: 18, intervalSeconds: 0.35, startDelaySeconds: 13.0 },
      { creepType: 'tank', count: 5, intervalSeconds: 1.0, startDelaySeconds: 19.0 },
    ],
  },
  {
    waveNumber: 9,
    description: 'The Autarch\'s Warlord - Grand Colossus War Engine of the Guild',
    rewardGold: 260,
    rewardScore: 1000,
    spawnGroups: [
      { creepType: 'tank', count: 6, intervalSeconds: 1.2, startDelaySeconds: 0 },
      { creepType: 'boss', count: 1, intervalSeconds: 1.0, startDelaySeconds: 7.0 },
      { creepType: 'fast', count: 18, intervalSeconds: 0.3, startDelaySeconds: 9.5 },
      { creepType: 'basic', count: 16, intervalSeconds: 0.4, startDelaySeconds: 14.5 },
      { creepType: 'tank', count: 6, intervalSeconds: 1.1, startDelaySeconds: 20.0 },
    ],
  },
];

// ==========================================
// Level 5: Infernal Caldera (Difficulty: 5 / 5)
// ==========================================
const LEVEL_5_TILES = [
  '##P###########################',
  '#.P..........................#',
  '#.P..................PPPPPPP.#',
  '#.P..................P.....P.#',
  '#.P.....PPPPPPPP.....P.....P.#',
  '#.P.....P......P.....P.....P.#',
  '#.P..##.P......P..##.P.....P.#',
  '#.P..##.P......P..##.P.....P.#',
  '#.P.....P......P.....P.....P.#',
  '#.P.....P......P.....P.....P.#',
  '#.P.....P......P.....P.....P.#',
  '#.P.....P......P.....P.....P.#',
  '#.P.....P......P.....P.....P.#',
  '#.P.....P......P.....P.....P.#',
  '#.P.....P......PPPPPPP.....P.#',
  '#.P.....P..................P.#',
  '#.PPPPPPP..................P.#',
  '#..........................P.#',
  '#..........................P.#',
  '###########################P##',
];

const LEVEL_5_WAYPOINTS = [
  { x: 2, y: 0 },
  { x: 2, y: 16 },
  { x: 8, y: 16 },
  { x: 8, y: 4 },
  { x: 15, y: 4 },
  { x: 15, y: 14 },
  { x: 21, y: 14 },
  { x: 21, y: 2 },
  { x: 27, y: 2 },
  { x: 27, y: 19 },
];

const LEVEL_5_WAVES: WaveDefinition[] = [
  {
    waveNumber: 1,
    description: 'Crucible Scouts - Rapid biomechanical vanguard from geothermal vents',
    rewardGold: 60,
    rewardScore: 100,
    spawnGroups: [
      { creepType: 'basic', count: 10, intervalSeconds: 0.8, startDelaySeconds: 0 },
      { creepType: 'fast', count: 8, intervalSeconds: 0.5, startDelaySeconds: 4.5 },
    ],
  },
  {
    waveNumber: 2,
    description: 'Ash Striders - Dense fast flanking packs across obsidian crust',
    rewardGold: 75,
    rewardScore: 160,
    spawnGroups: [
      { creepType: 'fast', count: 14, intervalSeconds: 0.4, startDelaySeconds: 0 },
      { creepType: 'basic', count: 10, intervalSeconds: 0.5, startDelaySeconds: 5.0 },
    ],
  },
  {
    waveNumber: 3,
    description: 'Obsidian Juggernauts - Armored magma-forged cacogens',
    rewardGold: 95,
    rewardScore: 240,
    spawnGroups: [
      { creepType: 'tank', count: 4, intervalSeconds: 1.5, startDelaySeconds: 0 },
      { creepType: 'basic', count: 12, intervalSeconds: 0.5, startDelaySeconds: 5.5 },
      { creepType: 'fast', count: 8, intervalSeconds: 0.4, startDelaySeconds: 11.0 },
    ],
  },
  {
    waveNumber: 4,
    description: 'Pyroclastic Blitz - Double speed swarm assault through volcanic fog',
    rewardGold: 115,
    rewardScore: 320,
    spawnGroups: [
      { creepType: 'fast', count: 18, intervalSeconds: 0.35, startDelaySeconds: 0 },
      { creepType: 'tank', count: 4, intervalSeconds: 1.4, startDelaySeconds: 5.5 },
      { creepType: 'basic', count: 12, intervalSeconds: 0.4, startDelaySeconds: 11.0 },
    ],
  },
  {
    waveNumber: 5,
    description: 'Molten Brigade - Heavily armored frontline of basalt and steel',
    rewardGold: 135,
    rewardScore: 420,
    spawnGroups: [
      { creepType: 'basic', count: 14, intervalSeconds: 0.45, startDelaySeconds: 0 },
      { creepType: 'tank', count: 6, intervalSeconds: 1.3, startDelaySeconds: 6.0 },
      { creepType: 'fast', count: 12, intervalSeconds: 0.35, startDelaySeconds: 13.0 },
    ],
  },
  {
    waveNumber: 6,
    description: 'Infernal Swarm - High-intensity swarm incursion from the planet\'s core',
    rewardGold: 160,
    rewardScore: 550,
    spawnGroups: [
      { creepType: 'fast', count: 20, intervalSeconds: 0.3, startDelaySeconds: 0 },
      { creepType: 'tank', count: 5, intervalSeconds: 1.3, startDelaySeconds: 5.5 },
      { creepType: 'basic', count: 16, intervalSeconds: 0.35, startDelaySeconds: 11.5 },
    ],
  },
  {
    waveNumber: 7,
    description: 'Basalt Wall - Armored war engines and support thralls',
    rewardGold: 185,
    rewardScore: 700,
    spawnGroups: [
      { creepType: 'tank', count: 7, intervalSeconds: 1.2, startDelaySeconds: 0 },
      { creepType: 'fast', count: 16, intervalSeconds: 0.35, startDelaySeconds: 7.5 },
      { creepType: 'basic', count: 16, intervalSeconds: 0.35, startDelaySeconds: 12.5 },
      { creepType: 'tank', count: 5, intervalSeconds: 1.1, startDelaySeconds: 18.0 },
    ],
  },
  {
    waveNumber: 8,
    description: 'Caldera Onslaught - Combined arms assault under dying red skies',
    rewardGold: 210,
    rewardScore: 880,
    spawnGroups: [
      { creepType: 'tank', count: 8, intervalSeconds: 1.1, startDelaySeconds: 0 },
      { creepType: 'fast', count: 22, intervalSeconds: 0.3, startDelaySeconds: 8.0 },
      { creepType: 'basic', count: 18, intervalSeconds: 0.35, startDelaySeconds: 14.0 },
      { creepType: 'tank', count: 6, intervalSeconds: 1.0, startDelaySeconds: 20.0 },
    ],
  },
  {
    waveNumber: 9,
    description: 'Vanguard of Doom - The elite crucible guard of Typhon',
    rewardGold: 240,
    rewardScore: 1100,
    spawnGroups: [
      { creepType: 'tank', count: 9, intervalSeconds: 1.0, startDelaySeconds: 0 },
      { creepType: 'fast', count: 24, intervalSeconds: 0.28, startDelaySeconds: 8.5 },
      { creepType: 'basic', count: 20, intervalSeconds: 0.3, startDelaySeconds: 14.5 },
      { creepType: 'tank', count: 7, intervalSeconds: 0.95, startDelaySeconds: 20.5 },
    ],
  },
  {
    waveNumber: 10,
    description: 'Typhon\'s Avatar - The Sovereign Colossus Titan and Grand Crucible Legion',
    rewardGold: 350,
    rewardScore: 1500,
    spawnGroups: [
      { creepType: 'tank', count: 8, intervalSeconds: 1.1, startDelaySeconds: 0 },
      { creepType: 'boss', count: 1, intervalSeconds: 1.0, startDelaySeconds: 8.0 },
      { creepType: 'fast', count: 24, intervalSeconds: 0.28, startDelaySeconds: 10.5 },
      { creepType: 'basic', count: 20, intervalSeconds: 0.3, startDelaySeconds: 16.5 },
      { creepType: 'tank', count: 8, intervalSeconds: 1.0, startDelaySeconds: 22.5 },
    ],
  },
];

export const LEVEL_1: LevelDefinition = {
  id: 'level-1',
  number: 1,
  name: 'Emerald Plains',
  subtitle: 'Verdant Necropolis of Gyoll',
  description: 'Ancient terraces and overgrown monoliths under the dim red sun. Biomechanical scavengers wander the forgotten lanes.',
  difficulty: 1,
  difficultyLabel: 'Beginner',
  theme: {
    buildable: '#1b3b2b',
    buildableBorder: '#0f241a',
    path: '#7c5335',
    pathBorder: '#543620',
    blocked: '#2b2938',
    blockedBorder: '#161420',
    occupied: '#1e3a5f',
    occupiedBorder: '#0f1f33',
    gridLine: 'rgba(255, 200, 150, 0.06)',
    gridLineWidth: 1,
  },
  mapConfig: {
    width: 30,
    height: 20,
    tileSize: 32,
    tiles: LEVEL_1_TILES,
    waypoints: LEVEL_1_WAYPOINTS,
  },
  gridWaypoints: LEVEL_1_WAYPOINTS,
  worldWaypoints: gridWaypointsToWorld(LEVEL_1_WAYPOINTS, 32),
  waves: LEVEL_1_WAVES,
  initialGold: 300,
  initialLives: 20,
};

export const LEVEL_2: LevelDefinition = {
  id: 'level-2',
  number: 2,
  name: 'Sunbaked Dunes',
  subtitle: 'Salt Wastes of Nessus',
  description: 'Vast ochre sands littered with buried titanium starship hulls. Swift predatory beasts flank across the dunes.',
  difficulty: 2,
  difficultyLabel: 'Easy',
  theme: {
    buildable: '#6e4a2f',
    buildableBorder: '#4a301c',
    path: '#a8825c',
    pathBorder: '#7d5e3f',
    blocked: '#3a2b22',
    blockedBorder: '#221812',
    occupied: '#2e4a42',
    occupiedBorder: '#1a2e28',
    gridLine: 'rgba(255, 200, 150, 0.06)',
    gridLineWidth: 1,
  },
  mapConfig: {
    width: 30,
    height: 20,
    tileSize: 32,
    tiles: LEVEL_2_TILES,
    waypoints: LEVEL_2_WAYPOINTS,
  },
  gridWaypoints: LEVEL_2_WAYPOINTS,
  worldWaypoints: gridWaypointsToWorld(LEVEL_2_WAYPOINTS, 32),
  waves: LEVEL_2_WAVES,
  initialGold: 320,
  initialLives: 20,
};

export const LEVEL_3: LevelDefinition = {
  id: 'level-3',
  number: 3,
  name: 'Crag Canyon',
  subtitle: 'Sanguine Gorge of Thrax',
  description: 'Chasm walls carved by ancient energy cutters. Chthonic armored war-automata march through narrow switchbacks.',
  difficulty: 3,
  difficultyLabel: 'Medium',
  theme: {
    buildable: '#5c2016',
    buildableBorder: '#3b120a',
    path: '#94533b',
    pathBorder: '#693624',
    blocked: '#221715',
    blockedBorder: '#120b0a',
    occupied: '#1f3847',
    occupiedBorder: '#0f1f28',
    gridLine: 'rgba(255, 200, 150, 0.06)',
    gridLineWidth: 1,
  },
  mapConfig: {
    width: 30,
    height: 20,
    tileSize: 32,
    tiles: LEVEL_3_TILES,
    waypoints: LEVEL_3_WAYPOINTS,
  },
  gridWaypoints: LEVEL_3_WAYPOINTS,
  worldWaypoints: gridWaypointsToWorld(LEVEL_3_WAYPOINTS, 32),
  waves: LEVEL_3_WAVES,
  initialGold: 350,
  initialLives: 20,
};

export const LEVEL_4: LevelDefinition = {
  id: 'level-4',
  number: 4,
  name: 'Iron Stronghold',
  subtitle: 'Citadel of the Guild',
  description: 'A colossal starship grounded upright for millennia, now a fortified bastion of stone, fuligin, and adamantine steel.',
  difficulty: 4,
  difficultyLabel: 'Hard',
  theme: {
    buildable: '#1e293b',
    buildableBorder: '#0f172a',
    path: '#576579',
    pathBorder: '#3b4656',
    blocked: '#090d16',
    blockedBorder: '#020617',
    occupied: '#0369a1',
    occupiedBorder: '#082f49',
    gridLine: 'rgba(255, 200, 150, 0.06)',
    gridLineWidth: 1,
  },
  mapConfig: {
    width: 30,
    height: 20,
    tileSize: 32,
    tiles: LEVEL_4_TILES,
    waypoints: LEVEL_4_WAYPOINTS,
  },
  gridWaypoints: LEVEL_4_WAYPOINTS,
  worldWaypoints: gridWaypointsToWorld(LEVEL_4_WAYPOINTS, 32),
  waves: LEVEL_4_WAVES,
  initialGold: 380,
  initialLives: 20,
};

export const LEVEL_5: LevelDefinition = {
  id: 'level-5',
  number: 5,
  name: 'Infernal Caldera',
  subtitle: 'Typhon\'s Crucible',
  description: 'The subterranean magma heart of Urth. Relentless cacogen legions and the ultimate Colossus Titan arise from the core.',
  difficulty: 5,
  difficultyLabel: 'Expert',
  theme: {
    buildable: '#161214',
    buildableBorder: '#26181b',
    path: '#b93809',
    pathBorder: '#882604',
    blocked: '#43061f',
    blockedBorder: '#240210',
    occupied: '#881337',
    occupiedBorder: '#4c051e',
    gridLine: 'rgba(255, 120, 50, 0.08)',
    gridLineWidth: 1,
  },
  mapConfig: {
    width: 30,
    height: 20,
    tileSize: 32,
    tiles: LEVEL_5_TILES,
    waypoints: LEVEL_5_WAYPOINTS,
  },
  gridWaypoints: LEVEL_5_WAYPOINTS,
  worldWaypoints: gridWaypointsToWorld(LEVEL_5_WAYPOINTS, 32),
  waves: LEVEL_5_WAVES,
  initialGold: 400,
  initialLives: 20,
};

export const LEVEL_LIST: LevelDefinition[] = [
  LEVEL_1,
  LEVEL_2,
  LEVEL_3,
  LEVEL_4,
  LEVEL_5,
];

export const LEVEL_CATALOG: Record<string, LevelDefinition> = {
  'level-1': LEVEL_1,
  'level-2': LEVEL_2,
  'level-3': LEVEL_3,
  'level-4': LEVEL_4,
  'level-5': LEVEL_5,
};

export function getLevel(id: string): LevelDefinition {
  const level = LEVEL_CATALOG[id];
  if (!level) {
    throw new Error(`Unknown level ID: ${id}`);
  }
  return level;
}

export function getLevelByNumber(num: number): LevelDefinition | undefined {
  return LEVEL_LIST.find((lvl) => lvl.number === num);
}

export function getNextLevel(currentId: string): LevelDefinition | undefined {
  const currentIndex = LEVEL_LIST.findIndex((lvl) => lvl.id === currentId);
  if (currentIndex >= 0 && currentIndex < LEVEL_LIST.length - 1) {
    return LEVEL_LIST[currentIndex + 1];
  }
  return undefined;
}

export function getDefaultLevel(): LevelDefinition {
  return LEVEL_1;
}
