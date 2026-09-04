# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tower-lifecycle.spec.ts >> Tower Lifecycle (Inspect, Upgrade, Target Strategy, Sell) >> should sell tower, refund 70% of invested cost, hide panel, and free the tile
- Location: e2e/tower-lifecycle.spec.ts:75:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#game-canvas')
    - locator resolved to <canvas width="958" height="638" id="game-canvas"></canvas>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" data-ref="btnLevels" aria-label="Open Level Select Menu" class="btn btn-secondary btn-levels" title="Choose Mission / Adventure Mode">…</button> from <div id="ui-layer" class="ui-layer">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" data-ref="btnLevels" aria-label="Open Level Select Menu" class="btn btn-secondary btn-levels" title="Choose Mission / Adventure Mode">…</button> from <div id="ui-layer" class="ui-layer">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    41 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button type="button" data-ref="btnLevels" aria-label="Open Level Select Menu" class="btn btn-secondary btn-levels" title="Choose Mission / Adventure Mode">…</button> from <div id="ui-layer" class="ui-layer">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic:
      - banner [ref=e5]:
        - 'generic "Level 1: Emerald Plains (Adventure Mode)" [ref=e6]':
          - generic [ref=e7]: 🏰
          - generic [ref=e8]: "Level:"
          - generic [ref=e9]: Adv 1
        - generic "Remaining Core Lives" [ref=e10]:
          - generic [ref=e11]: ❤️
          - generic [ref=e12]: "Lives:"
          - generic [ref=e13]: "20"
        - generic "Current Gold Balance" [ref=e14]:
          - generic [ref=e15]: 🪙
          - generic [ref=e16]: "Gold:"
          - generic [ref=e17]: "300"
        - generic "Current Wave Progression" [ref=e18]:
          - generic [ref=e19]: 🌊
          - generic [ref=e20]: "Wave:"
          - generic [ref=e21]: 1 / 6
        - generic "Current Score" [ref=e22]:
          - generic [ref=e23]: ⭐
          - generic [ref=e24]: "Score:"
          - generic [ref=e25]: "0"
      - generic [ref=e26]:
        - button "Open Level Select Menu" [ref=e27] [cursor=pointer]:
          - generic [ref=e28]: 🗺️
          - generic [ref=e29]: Levels
        - button "Toggle Audio Sound and Music" [ref=e30] [cursor=pointer]:
          - generic [ref=e31]: 🔊
          - generic [ref=e32]: Sound
        - button "Toggle Soundtrack (Modern Electro / Retro 8-Bit)" [ref=e33] [cursor=pointer]:
          - generic [ref=e34]: 🎧
          - generic [ref=e35]: "OST: Modern"
        - button "Toggle Auto Wave" [ref=e36] [cursor=pointer]:
          - generic [ref=e37]: ⚡
          - generic [ref=e38]: "Auto: OFF"
        - button "Start Wave" [ref=e39] [cursor=pointer]:
          - generic [ref=e40]: ▶
        - button "Toggle Simulation Speed" [ref=e42] [cursor=pointer]:
          - generic [ref=e43]: 1x
        - button "Pause / Resume" [ref=e44] [cursor=pointer]:
          - generic [ref=e45]: Pause
    - navigation "Tower Build Toolbar" [ref=e46]:
      - generic [ref=e47]:
        - button "Build Energy Lance (100 Gold)" [active] [pressed] [ref=e48] [cursor=pointer]:
          - generic [ref=e49]: "1"
          - generic [ref=e63]:
            - generic [ref=e64]: Energy Lance
            - generic [ref=e65]: 100g
        - button "Build Plasma Mortar (150 Gold)" [ref=e66] [cursor=pointer]:
          - generic [ref=e67]: "2"
          - generic [ref=e80]:
            - generic [ref=e81]: Plasma Mortar
            - generic [ref=e82]: 150g
        - button "Build Void Pylon (200 Gold)" [ref=e83] [cursor=pointer]:
          - generic [ref=e84]: "3"
          - generic [ref=e97]:
            - generic [ref=e98]: Void Pylon
            - generic [ref=e99]: 200g
```

# Test source

```ts
  1  | import { Locator, Page } from '@playwright/test';
  2  | import { HudPage } from './HudPage';
  3  | import { BuildBarPage, TowerType } from './BuildBarPage';
  4  | import { TowerDetailPage } from './TowerDetailPage';
  5  | import { ModalPage } from './ModalPage';
  6  | 
  7  | export class GamePage {
  8  |   readonly gameContainer: Locator;
  9  |   readonly canvas: Locator;
  10 |   readonly uiLayer: Locator;
  11 | 
  12 |   readonly hud: HudPage;
  13 |   readonly buildBar: BuildBarPage;
  14 |   readonly towerDetail: TowerDetailPage;
  15 |   readonly modal: ModalPage;
  16 | 
  17 |   constructor(readonly page: Page) {
  18 |     this.gameContainer = page.locator('#game-container');
  19 |     this.canvas = page.locator('#game-canvas');
  20 |     this.uiLayer = page.locator('#ui-layer');
  21 | 
  22 |     this.hud = new HudPage(page);
  23 |     this.buildBar = new BuildBarPage(page);
  24 |     this.towerDetail = new TowerDetailPage(page);
  25 |     this.modal = new ModalPage(page);
  26 |   }
  27 | 
  28 |   async goto(): Promise<void> {
  29 |     await this.page.goto('/');
  30 |     await this.canvas.waitFor({ state: 'visible' });
  31 |   }
  32 | 
  33 |   /**
  34 |    * Calculates the client/CSS coordinates of a tile (col, row) on the canvas
  35 |    * considering letterbox offsets and scaling.
  36 |    */
  37 |   private async getTileCoordinates(col: number, row: number): Promise<{ x: number; y: number }> {
  38 |     const box = await this.canvas.boundingBox();
  39 |     if (!box) {
  40 |       throw new Error('Canvas bounding box could not be determined');
  41 |     }
  42 | 
  43 |     const virtualWidth = 960;
  44 |     const virtualHeight = 640;
  45 |     const tileSize = 32;
  46 | 
  47 |     const scaleX = box.width / virtualWidth;
  48 |     const scaleY = box.height / virtualHeight;
  49 |     const scale = Math.min(scaleX, scaleY);
  50 | 
  51 |     const offsetX = (box.width - virtualWidth * scale) / 2;
  52 |     const offsetY = (box.height - virtualHeight * scale) / 2;
  53 | 
  54 |     const worldX = col * tileSize + tileSize / 2;
  55 |     const worldY = row * tileSize + tileSize / 2;
  56 | 
  57 |     const x = offsetX + worldX * scale;
  58 |     const y = offsetY + worldY * scale;
  59 | 
  60 |     return { x, y };
  61 |   }
  62 | 
  63 |   async clickTile(col: number, row: number): Promise<void> {
  64 |     const coords = await this.getTileCoordinates(col, row);
> 65 |     await this.canvas.click({ position: { x: coords.x, y: coords.y } });
     |                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  66 |   }
  67 | 
  68 |   async hoverTile(col: number, row: number): Promise<void> {
  69 |     const coords = await this.getTileCoordinates(col, row);
  70 |     await this.canvas.hover({ position: { x: coords.x, y: coords.y } });
  71 |   }
  72 | 
  73 |   async placeTower(towerType: TowerType, col: number, row: number): Promise<void> {
  74 |     await this.buildBar.selectTower(towerType);
  75 |     await this.clickTile(col, row);
  76 |   }
  77 | 
  78 |   async selectPlacedTower(col: number, row: number): Promise<void> {
  79 |     await this.clickTile(col, row);
  80 |   }
  81 | 
  82 |   async pressKey(key: string): Promise<void> {
  83 |     await this.page.keyboard.press(key);
  84 |   }
  85 | 
  86 |   async pressSpace(): Promise<void> {
  87 |     await this.pressKey(' ');
  88 |   }
  89 | 
  90 |   async pressEscape(): Promise<void> {
  91 |     await this.pressKey('Escape');
  92 |   }
  93 | 
  94 |   async pressHotkey(key: '1' | '2' | '3' | 'Escape' | 'Enter' | 's' | '[' | ']'): Promise<void> {
  95 |     await this.pressKey(key);
  96 |   }
  97 | }
  98 | 
```