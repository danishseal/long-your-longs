/**
 * Core ASCII animation engine - ported from animascii.js
 * Handles sprite rendering, compositing, and animation loop.
 */

export class Trigger {
  value: number;

  constructor(value: number) {
    this.value = value;
  }

  update(value: number): boolean {
    if (value !== this.value) {
      this.value = value;
      return true;
    }
    return false;
  }
}

// Render buffer type: [data array, width, height]
export type RenderBuffer = [number[], number, number];

export interface RenderContext {
  i: number;
  x: number;
  y: number;
  width: number;
  height: number;
  time: number;
  data: number[];
  code: number;
}

export class Sprite {
  frames: number[][] = [[]];
  sequence: number[];
  sequenceIndex = 0;
  sequenceFrame = 0;
  width = 0;
  height = 0;
  gapX = Infinity;
  gapY = Infinity;
  extendUp = 0;
  extendRight = 0;
  extendDown = 0;
  extendLeft = 0;
  repeatUp = 1;
  repeatRight = 1;
  repeatDown = 1;
  repeatLeft = 1;
  x = 0;
  y = 0;
  z = 1;
  camera: number[];
  elementId: number | string | null;
  maxExtendY?: number;

  animationTrigger = new Trigger(0);
  moveXTrigger = new Trigger(0);
  moveYTrigger = new Trigger(0);
  speedX = 1;
  speedY = 1;

  private _lastCameraY?: number;

  constructor(
    spriteSheet: string,
    sequence: number[],
    camera: number[],
    elementId: number | string | null = null,
  ) {
    this.sequence = sequence;
    this.camera = camera;
    this.elementId = elementId;

    // Handle undefined or empty spriteSheet
    if (!spriteSheet) {
      console.warn("Empty or undefined spriteSheet provided");
      this.frames = [[0]];
      this.width = 0;
      this.height = 0;
      return;
    }

    // Parse sprite sheet
    let nfd = 0; // new frame detector (consecutive newlines)
    let nlc = 0; // new line counter
    for (let i = 0; i < spriteSheet.length; i++) {
      const charCode = spriteSheet[i].charCodeAt(0);
      const nl = charCode === 10; // newline

      if (!nl) {
        // charCode 9617 = ░ (light shade) = transparent (0)
        this.frames[this.frames.length - 1].push(
          charCode === 9617 ? 0 : charCode,
        );
      }

      nfd = nl ? nfd + 1 : 0;
      nlc = nl ? nlc + 1 : nlc;

      if (!this.width && nlc) {
        this.width = i;
      }

      if (nfd > 1) {
        this.frames.push([]);
        this.height = !this.height ? nlc - 1 : this.height;
      }
    }
    this.height = !this.height ? nlc : this.height;
  }

  move(time: number, dir: [number, number]) {
    if (!this.moveXTrigger.value) {
      this.moveXTrigger.value = time;
    }
    if (!this.moveYTrigger.value) {
      this.moveYTrigger.value = time;
    }

    const movingX = this.moveXTrigger.update(Math.floor(time * this.speedX));
    if (movingX) {
      this.x += dir[0];
    }

    const movingY = this.moveYTrigger.update(Math.floor(time * this.speedY));
    if (movingY) {
      this.y += dir[1];
    }
  }

  animate(time: number, offset: number) {
    if (!this.animationTrigger.value) {
      this.animationTrigger.value = time;
    }

    const shouldAnimate = this.animationTrigger.update(time);
    this.sequenceIndex = shouldAnimate
      ? this.sequenceIndex + 1
      : this.sequenceIndex;
    this.sequenceFrame = (this.sequenceIndex + offset) % this.sequence.length;
  }

  displayX(): number {
    return (this.x + this.camera[0]) / this.z + this.camera[2];
  }

  displayY(): number {
    return (this.y + this.camera[1]) / this.z + this.camera[3];
  }

  dataAt(x: number, y: number): number {
    return this.fragment({ x, y } as RenderContext);
  }

  fragment(ctx: Pick<RenderContext, "x" | "y">): number {
    const aWidth = this.width + this.gapX;
    const aHeight = this.height + this.gapY;
    const x = ctx.x - Math.floor(this.displayX());
    const y = ctx.y - Math.floor(this.displayY());

    // data x
    let dx: number;
    if (x < 0) {
      dx = this.extendLeft
        ? 0
        : this.repeatLeft
          ? aWidth + ((x + 1) % aWidth) - 1
          : -1;
    } else if (x >= aWidth) {
      dx = this.extendRight
        ? this.width - 1
        : this.repeatRight
          ? x % aWidth
          : -1;
    } else {
      dx = x;
    }
    if (dx < 0) return 0;

    // data y
    let dy: number;
    if (y < 0) {
      dy = this.extendUp
        ? 0
        : this.repeatUp
          ? aHeight + ((y + 1) % aHeight) - 1
          : -1;
    } else if (y >= aHeight) {
      dy = this.extendDown
        ? y > (this.maxExtendY ?? Infinity)
          ? -1
          : this.height - 1
        : this.repeatDown
          ? y % aHeight
          : -1;
    } else {
      dy = y;
    }
    if (dy < 0) return 0;

    // Get data from current frame
    const frameData = this.frames[this.sequence[this.sequenceFrame]];
    if (!frameData) return 0;
    const index =
      dx >= this.width || dy >= this.height ? -1 : dx + dy * this.width;
    return index >= 0 ? frameData[index] || 0 : 0;
  }

  drawTo(render: RenderBuffer) {
    const data = this.frames[this.sequence[this.sequenceFrame]];
    if (data === undefined) return;

    for (let y = 0; y < this.height; y++) {
      const renderY = Math.floor(this.displayY()) + y;
      if (renderY < 0 || renderY > render[2] - 1) continue;

      for (let x = 0; x < this.width; x++) {
        const renderX = Math.floor(this.displayX()) + x;
        if (renderX < 0 || renderX > render[1] - 1) continue;

        const renderDataIndex = renderX + renderY * render[1];
        const charCode = data[x + y * this.width];
        if (charCode) {
          render[0][renderDataIndex] = charCode;
        }
      }
    }
  }
}

export function createRender(
  data: number[],
  time: number,
  width: number,
  height: number,
  main: (ctx: RenderContext) => number,
): RenderBuffer {
  let i = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[i] = main({
        i,
        x,
        y,
        width,
        height,
        time,
        data,
        code: data[i],
      });
      i++;
    }
  }
  return [data, width, height];
}

export function renderToStr(render: RenderBuffer): string {
  let str = "";
  for (let i = 0; i < render[0].length; i++) {
    str +=
      String.fromCharCode(render[0][i]) +
      ((i + 1) % render[1] === 0 ? "\n" : "");
  }
  return str;
}

/**
 * Repeat helper: creates an array of `n` deep clones of `foo`.
 * Used to build animation sequences.
 */
export function r(foo: unknown, n: number): unknown[] {
  const result: unknown[] = [];
  for (let i = 0; i < n; i++) {
    result.push(structuredClone(foo));
  }
  return result;
}

/**
 * Main animation loop. Calls setup and main each frame,
 * then writes the rendered string to the output element.
 */
export function animation(
  setup: (time: number, render: RenderBuffer) => void,
  main: (ctx: RenderContext) => number,
  width: number,
  height: number,
  output: HTMLElement,
): number {
  const time = Date.now();
  const data: number[] = [];
  const render = createRender(data, time, width, height, main);
  setup(time, render);
  output.textContent = renderToStr(render);

  const animationId = requestAnimationFrame(() => {
    animation(setup, main, width, height, output);
  });
  return animationId;
}
