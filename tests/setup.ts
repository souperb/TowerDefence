import { vi } from 'vitest';

// Canvas 2D Context Mock for jsdom testing
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  lineWidth = 1;
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  font = '10px sans-serif';
  textAlign: CanvasTextAlign = 'start';
  textBaseline: CanvasTextBaseline = 'alphabetic';
  globalAlpha = 1.0;
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  shadowBlur = 0;
  shadowColor = 'rgba(0, 0, 0, 0)';
  shadowOffsetX = 0;
  shadowOffsetY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  fillRect = vi.fn();
  clearRect = vi.fn();
  strokeRect = vi.fn();
  beginPath = vi.fn();
  closePath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  arc = vi.fn();
  ellipse = vi.fn();
  rect = vi.fn();
  fill = vi.fn();
  stroke = vi.fn();
  save = vi.fn();
  restore = vi.fn();
  translate = vi.fn();
  rotate = vi.fn();
  scale = vi.fn();
  setTransform = vi.fn();
  resetTransform = vi.fn();
  transform = vi.fn();
  clip = vi.fn();
  drawImage = vi.fn();
  fillText = vi.fn();
  strokeText = vi.fn();

  measureText = vi.fn((text: string) => ({
    width: text.length * 8,
    actualBoundingBoxAscent: 8,
    actualBoundingBoxDescent: 2,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: text.length * 8,
    fontBoundingBoxAscent: 10,
    fontBoundingBoxDescent: 2,
    emHeightAscent: 8,
    emHeightDescent: 2,
    alphabeticBaseline: 0,
  }));

  createLinearGradient = vi.fn(() => ({
    addColorStop: vi.fn(),
  }));

  createRadialGradient = vi.fn(() => ({
    addColorStop: vi.fn(),
  }));

  createPattern = vi.fn(() => null);
  getImageData = vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
    colorSpace: 'srgb',
  }));
  putImageData = vi.fn();
  setLineDash = vi.fn();
  getLineDash = vi.fn(() => []);
}

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    ..._args: unknown[]
  ): any {
    if (contextId === '2d') {
      return new MockCanvasRenderingContext2D(this);
    }
    return null;
  } as any;
}

// Polyfill PointerEvent for jsdom testing if not present
if (typeof window !== 'undefined' && typeof window.PointerEvent === 'undefined') {
  class MockPointerEvent extends MouseEvent {
    readonly pointerId: number;
    readonly width: number;
    readonly height: number;
    readonly pressure: number;
    readonly tiltX: number;
    readonly tiltY: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
      this.pressure = params.pressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
      this.isPrimary = params.isPrimary ?? true;
    }
  }

  (window as any).PointerEvent = MockPointerEvent;
  (globalThis as any).PointerEvent = MockPointerEvent;
}

// Polyfill Web Audio API for jsdom testing
class MockAudioParam {
  value = 1;
  setValueAtTime = vi.fn((val: number) => { this.value = val; });
  linearRampToValueAtTime = vi.fn((val: number) => { this.value = val; });
  exponentialRampToValueAtTime = vi.fn((val: number) => { this.value = val; });
  setTargetAtTime = vi.fn();
  setValueCurveAtTime = vi.fn();
  cancelScheduledValues = vi.fn();
}

class MockAudioNode {
  connect = vi.fn((dest: any) => dest);
  disconnect = vi.fn();
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockOscillatorNode extends MockAudioNode {
  frequency = new MockAudioParam();
  type: OscillatorType = 'sine';
  start = vi.fn();
  stop = vi.fn();
}

class MockBiquadFilterNode extends MockAudioNode {
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
  type: BiquadFilterType = 'lowpass';
}

class MockAudioBufferSourceNode extends MockAudioNode {
  buffer: any = null;
  playbackRate = new MockAudioParam();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioBuffer {
  numberOfChannels = 1;
  length: number;
  sampleRate: number;
  duration: number;
  private channelData: Float32Array;

  constructor(options: { numberOfChannels?: number; length: number; sampleRate: number }) {
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.duration = options.length / options.sampleRate;
    this.channelData = new Float32Array(this.length);
  }

  getChannelData = vi.fn(() => this.channelData);
}

class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  state: AudioContextState = 'running';
  destination = new MockAudioNode();

  createGain = vi.fn(() => new MockGainNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());
  createBuffer = vi.fn((channels: number, length: number, sampleRate: number) =>
    new MockAudioBuffer({ numberOfChannels: channels, length, sampleRate })
  );

  resume = vi.fn(async () => {
    this.state = 'running';
  });
  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
}

if (typeof window !== 'undefined') {
  (window as any).AudioContext = MockAudioContext;
  (window as any).webkitAudioContext = MockAudioContext;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).AudioContext = MockAudioContext;
  (globalThis as any).webkitAudioContext = MockAudioContext;
}

