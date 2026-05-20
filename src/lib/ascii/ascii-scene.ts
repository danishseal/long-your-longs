/**
 * ASCII Animation Scene - ported from animation_v2.js
 * Sets up all sprites, handles camera, and runs the animation loop.
 */

import {
  animation,
  type RenderBuffer,
  type RenderContext,
  Sprite,
} from "./animascii";
import { flyingbirdSequence } from "./sequences";
import { desktopFontSize, mobileFontSize, scale } from "./settings";
import { checkMobile } from "./utils";

// Extend window for global mouse/touch tracking
declare global {
  interface Window {
    userX: number;
    userY: number;
    userDown: number;
    sharedAssets: Record<string, string>;
  }
}

const ASCII_ASSET_FILES = [
  "ballon.txt",
  "boat.txt",
  "bridge2.txt",
  "bridge.txt",
  "carfar.txt",
  "cars2.txt",
  "cars3.txt",
  "cars.txt",
  "cloud0.txt",
  "cloud1.txt",
  "cloud2.txt",
  "cloud3.txt",
  "cloud4.txt",
  "cowA.txt",
  "cowB.txt",
  "cowC.txt",
  "cowD.txt",
  "cowE.txt",
  "farmCar.txt",
  "flyingbird1.txt",
  "flyingbird.txt",
  "forest1.txt",
  "forest2.txt",
  "forest.txt",
  "frontHill2.txt",
  "groundB.txt",
  "ground.txt",
  "hillA0.txt",
  "hillA1.txt",
  "hillA2.txt",
  "horizon.txt",
  "islandA0.txt",
  "islandA1.txt",
  "islandA2.txt",
  "islandB0.txt",
  "islandB1.txt",
  "islandB2.txt",
  "islandB3.txt",
  "landA0.txt",
  "landA1.txt",
  "plane.txt",
  "corporate_plane.txt",
  "shar.txt",
  "sheep_cloud.txt",
  "sign1.txt",
  "sign2.txt",
  "sign3.txt",
  "sig.txt",
  "sky.txt",
  "spaceship.txt",
  "sun.txt",
  "title.txt",
  "train.txt",
  "transition.txt",
  "witch.txt",
] as const;

export class ASCIIAnimation {
  elementId: string;
  mobile: boolean;
  sprites: Sprite[] = [];
  fragSprites: Sprite[] = [];
  clouds: Sprite[] = [];
  birds: Sprite[] = [];
  birds2: Sprite[] = [];
  slowAnim: Sprite[] = [];
  assets: Record<string, string> = {};
  noncommercial = 0;
  inertia = 0.1;
  initialScrollTop: number | null = null;

  // Dimensions
  fontSize = 0;
  width = 0;
  height = 0;
  size = 0;
  output: HTMLElement | null = null;
  camera: number[] = [0, 0, 0, 0];
  titleCamera: number[] = [0, 0, 0, 0];

  // Animated objects
  plane?: Sprite;
  witch?: Sprite;
  spaceship?: Sprite;
  boat?: Sprite;
  shark?: Sprite;
  farmCar?: Sprite;
  carFar?: Sprite;
  train?: Sprite;
  car?: Sprite;
  car2?: Sprite;
  cat?: Sprite;
  cowA?: Sprite;
  cowB?: Sprite;
  cowC?: Sprite;
  cowD?: Sprite;
  cowE?: Sprite;

  // Cow stealing state
  cowAsteal = 0;
  cowBsteal = 0;
  cowCsteal = 0;
  cowDsteal = 0;
  cowEsteal = 0;
  cowAX = 0;
  cowBX = 0;
  cowCX = 0;
  cowDX = 0;
  cowEX = 0;

  animationId: number | null = null;
  private resizeHandler: (() => void) | null = null;
  private mousedownHandler: (() => void) | null = null;
  private mouseupHandler: (() => void) | null = null;
  private mousemoveHandler: ((e: MouseEvent) => void) | null = null;
  private touchstartHandler: ((e: TouchEvent) => void) | null = null;
  private touchendHandler: (() => void) | null = null;

  constructor(elementId: string) {
    this.elementId = elementId;
    this.mobile = checkMobile();

    this.initSizes();
    this.setupEventListeners();
  }

  async init() {
    await this.loadAssets();
    this.initSprites();
    this.startAnimation();
  }

  initSizes() {
    const outputElement = document.getElementById(this.elementId);
    if (!outputElement) {
      throw new Error(`Element with id ${this.elementId} not found`);
    }

    this.fontSize = this.mobile ? mobileFontSize : desktopFontSize;

    this.width = Math.floor(
      window.innerWidth / ((this.fontSize / 2) * scale) - 1,
    );
    this.height = Math.floor(
      (window.innerHeight + 100) / (this.fontSize * scale),
    );
    this.size = this.width * this.height;

    this.output = outputElement;
    this.output.style.lineHeight = `${this.fontSize * scale}px`;
    this.output.style.fontSize = `${this.fontSize * scale}px`;

    this.camera = [0, 0, this.width / 2, this.height - this.height / 16];
    this.titleCamera = [0, 0, this.width / 2, this.height - this.height / 2];

    console.log(
      `ASCII Scene initialized: ${this.width}x${this.height}, fontSize: ${this.fontSize}`,
    );
  }

  async loadAssets() {
    // First try to read from DOM (hidden <pre> elements)
    if (!window.sharedAssets) {
      window.sharedAssets = {};
      const assetsElements = document.getElementsByClassName("ascii_asset");
      for (let i = 0; i < assetsElements.length; i++) {
        const el = assetsElements[i];
        window.sharedAssets[el.id] = `${el.textContent}\n`;
      }
    }

    // If no DOM assets, fetch the required asset set in parallel.
    if (Object.keys(window.sharedAssets).length === 0) {
      const responses = await Promise.allSettled(
        ASCII_ASSET_FILES.map(async (filename) => {
          const response = await fetch(`/assets/${filename}`);
          if (!response.ok) {
            throw new Error(`Failed to load asset: ${filename}`);
          }

          return {
            filename,
            content: `${await response.text()}\n`,
          };
        }),
      );

      for (const response of responses) {
        if (response.status === "fulfilled") {
          window.sharedAssets[response.value.filename] = response.value.content;
          continue;
        }

        console.warn(response.reason);
      }
    }

    this.assets = window.sharedAssets;
  }

  setupEventListeners() {
    window.userX = window.userX || 0;
    window.userY = window.userY || 0;
    window.userDown = window.userDown || 0;

    this.mousedownHandler = () => {
      window.userDown++;
    };
    this.mouseupHandler = () => {
      window.userDown = 0;
    };
    this.mousemoveHandler = (e: MouseEvent) => {
      window.userX = Math.floor(e.clientX / ((this.fontSize / 2) * scale));
      window.userY = Math.floor(e.clientY / (this.fontSize * scale));
    };
    this.touchstartHandler = (e: TouchEvent) => {
      window.userDown++;
      window.userX = Math.floor(
        e.touches[0].clientX / ((this.fontSize / 2) * scale),
      );
      window.userY = Math.floor(e.touches[0].clientY / (this.fontSize * scale));
    };
    this.touchendHandler = () => {
      window.userDown = 0;
    };

    document.addEventListener("mousedown", this.mousedownHandler);
    document.addEventListener("mouseup", this.mouseupHandler);
    document.addEventListener("mousemove", this.mousemoveHandler);
    document.addEventListener("touchstart", this.touchstartHandler);
    document.addEventListener("touchend", this.touchendHandler);

    this.resizeHandler = () => {
      this.width = Math.floor(
        window.innerWidth / ((this.fontSize / 2) * scale) - 1,
      );
      this.height = Math.floor(
        (window.innerHeight + 100) / (this.fontSize * scale) - 1,
      );
      this.size = this.width * this.height;
    };
    window.addEventListener("resize", this.resizeHandler);
  }

  initSprites() {
    console.log("Initializing sprites...");
    let sprite: Sprite;

    // Clouds type 0
    for (let i = 0; i < this.width / 60; i++) {
      sprite = new Sprite(
        this.assets["cloud0.txt"] || "",
        [0],
        this.camera,
        this.elementId,
      );
      sprite.repeatUp = 0;
      sprite.extendDown = 1;
      sprite.z = 3 + Math.random() * 2;
      sprite.y = (Math.random() * 50 + 50) * -1;
      sprite.x =
        Math.random() * this.width * sprite.z -
        Math.random() * this.width * sprite.z -
        (sprite.width / 2) * sprite.z;
      this.sprites.push(sprite);
      this.clouds.push(sprite);
    }

    // Sheep cloud
    sprite = new Sprite(this.assets["sheep_cloud.txt"] || "", [0], this.camera);
    sprite.repeatUp = 0;
    sprite.extendDown = 1;
    sprite.z = 5 + Math.random() * 2;
    sprite.y = (Math.random() * 50 + 50) * -1;
    sprite.x =
      Math.random() * this.width * sprite.z -
      Math.random() * this.width * sprite.z -
      (sprite.width / 2) * sprite.z;
    this.sprites.push(sprite);
    this.clouds.push(sprite);

    // Clouds type 1
    for (let i = 0; i < this.width / 50; i++) {
      sprite = new Sprite(this.assets["cloud1.txt"] || "", [0], this.camera);
      sprite.repeatUp = 0;
      sprite.extendDown = 1;
      sprite.z = 5 + Math.random() * 2;
      sprite.y = (Math.random() * 50 + 50) * -1;
      sprite.x =
        Math.random() * this.width * sprite.z -
        Math.random() * this.width * sprite.z -
        (sprite.width / 2) * sprite.z;
      this.sprites.push(sprite);
      this.clouds.push(sprite);
    }

    // Clouds type 2
    for (let i = 0; i < this.width / 40; i++) {
      sprite = new Sprite(this.assets["cloud2.txt"] || "", [0], this.camera);
      sprite.repeatUp = 0;
      sprite.extendDown = 1;
      sprite.z = 7 + Math.random() * 2;
      sprite.y = (Math.random() * 50 + 50) * -1;
      sprite.x =
        Math.random() * this.width * sprite.z -
        Math.random() * this.width * sprite.z -
        (sprite.width / 2) * sprite.z;
      this.sprites.push(sprite);
      this.clouds.push(sprite);
    }

    // Clouds type 3
    for (let i = 0; i < this.width / 30; i++) {
      sprite = new Sprite(this.assets["cloud3.txt"] || "", [0], this.camera);
      sprite.repeatUp = 0;
      sprite.extendDown = 1;
      sprite.z = 9 + Math.random() * 2;
      sprite.y = (Math.random() * 50 + 75) * -1.5;
      sprite.x =
        Math.random() * this.width * sprite.z -
        Math.random() * this.width * sprite.z -
        (sprite.width / 2) * sprite.z;
      this.sprites.push(sprite);
      this.clouds.push(sprite);
    }

    // Clouds type 4
    for (let i = 0; i < this.width / 20; i++) {
      sprite = new Sprite(this.assets["cloud4.txt"] || "", [0], this.camera);
      sprite.repeatUp = 0;
      sprite.extendDown = 1;
      sprite.z = 11;
      sprite.y = (Math.random() * 50 + 75) * -1.5;
      sprite.x =
        Math.random() * this.width * sprite.z -
        Math.random() * this.width * sprite.z -
        (sprite.width / 2) * sprite.z;
      this.sprites.push(sprite);
      this.clouds.push(sprite);
    }

    // Plane
    this.plane = new Sprite(
      this.assets[this.noncommercial ? "plane.txt" : "corporate_plane.txt"] ||
        "",
      [0, 1, 2, 3],
      this.camera,
    );
    this.plane.repeatUp = 0;
    this.plane.extendDown = 1;
    this.plane.z = 3;
    this.plane.speedX = 6;
    this.plane.y =
      (-this.height / 2) * this.plane.z +
      (this.plane.height / 2) * this.plane.z;
    this.plane.x = (this.width / 2) * this.plane.z;
    this.sprites.push(this.plane);

    // Birds
    for (let i = 0; i < Math.ceil(this.width / 40); i++) {
      sprite = new Sprite(
        this.assets["flyingbird.txt"] || "",
        flyingbirdSequence,
        this.camera,
      );
      sprite.repeatUp = 0;
      sprite.extendDown = 1;
      sprite.z = 1 + Math.random();
      sprite.y = Math.random() * 250;
      sprite.x =
        Math.random() * this.width * sprite.z -
        Math.random() * this.width * sprite.z -
        (sprite.width / 2) * sprite.z;
      this.sprites.push(sprite);
      this.birds.push(sprite);
    }

    // Birds group 2
    for (let i = 0; i < Math.ceil(this.width / 40); i++) {
      sprite = new Sprite(
        this.assets["flyingbird1.txt"] || "",
        [0, 1, 2, 1],
        this.camera,
      );
      sprite.repeatUp = 0;
      sprite.extendDown = 1;
      sprite.z = 5 + 5 * Math.random();
      sprite.y = -50;
      sprite.x =
        Math.random() * this.width * sprite.z -
        Math.random() * this.width * sprite.z -
        (sprite.width / 2) * sprite.z;
      this.sprites.push(sprite);
      this.birds2.push(sprite);
    }

    // Witch
    this.witch = new Sprite(this.assets["witch.txt"] || "", [0], this.camera);
    this.witch.z = 1;
    this.witch.y = 400;
    this.witch.x = 0;
    this.witch.speedX = 1;
    this.sprites.push(this.witch);
    this.birds.push(this.witch);

    // Title
    sprite = new Sprite(this.assets["title.txt"] || "", [0], this.titleCamera);
    sprite.x = (sprite.width / 2) * -1;
    sprite.y = -1;
    sprite.z = 1;
    this.sprites.push(sprite);

    // Sun
    sprite = new Sprite(this.assets["sun.txt"] || "", [0], this.camera);
    sprite.gapX = Infinity;
    sprite.gapY = Infinity;
    sprite.y = this.height * 15 * -1;
    sprite.z = 20;
    sprite.x = (this.width / 2) * sprite.z - sprite.width * 1.5 * sprite.z;
    this.fragSprites.push(sprite);

    // Sky
    sprite = new Sprite(this.assets["sky.txt"] || "", [0], this.camera);
    sprite.repeatUp = 0;
    sprite.extendDown = 1;
    sprite.extendUp = 1;
    sprite.gapX = 0;
    sprite.gapY = 0;
    sprite.y = this.height * 18 * -1;
    sprite.z = 20;
    this.fragSprites.push(sprite);

    // Horizon
    sprite = new Sprite(this.assets["horizon.txt"] || "", [0], this.camera);
    sprite.repeatUp = 0;
    sprite.extendDown = 1;
    sprite.gapX = 0;
    sprite.gapY = 0;
    sprite.y = -90;
    sprite.z = 10;
    this.fragSprites.push(sprite);

    // Boat
    this.boat = new Sprite(this.assets["boat.txt"] || "", [0], this.camera);
    this.boat.z = 9.2;
    this.boat.x =
      Math.random() * (this.width / 2) * this.boat.z -
      Math.random() * (this.width / 2) * this.boat.z;
    this.boat.y = -15;
    this.sprites.push(this.boat);

    // Ground
    sprite = new Sprite(this.assets["ground.txt"] || "", [0], this.camera);
    sprite.repeatUp = 0;
    sprite.extendDown = 1;
    sprite.maxExtendY = 10;
    sprite.gapX = 0;
    sprite.gapY = 0;
    sprite.y = 50;
    sprite.z = 9;
    this.fragSprites.push(sprite);

    // Ground B
    sprite = new Sprite(this.assets["groundB.txt"] || "", [0], this.camera);
    sprite.repeatUp = 0;
    sprite.extendDown = 1;
    sprite.maxExtendY = 10;
    sprite.gapX = 0;
    sprite.gapY = 0;
    sprite.y = 175;
    sprite.z = 6;
    this.fragSprites.push(sprite);

    // Far islands
    sprite = new Sprite(this.assets["islandB0.txt"] || "", [0], this.camera);
    sprite.z = 9;
    sprite.y = -20;
    sprite.x = -200;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["islandB1.txt"] || "", [0], this.camera);
    sprite.z = 9;
    sprite.y = -15;
    sprite.x = -800;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["islandB2.txt"] || "", [0], this.camera);
    sprite.z = 9;
    sprite.y = -20;
    sprite.x = 400;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["islandB3.txt"] || "", [0], this.camera);
    sprite.z = 8.5;
    sprite.y = -10;
    sprite.x = -1400;
    this.sprites.push(sprite);

    // Shark
    this.shark = new Sprite(this.assets["shar.txt"] || "", [0], this.camera);
    this.shark.z = 9;
    this.shark.y = 30;
    this.shark.x = 270;
    this.sprites.push(this.shark);

    // Close islands
    sprite = new Sprite(this.assets["islandA0.txt"] || "", [0], this.camera);
    sprite.z = 8;
    sprite.x = 300;
    sprite.y = 10;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["islandA1.txt"] || "", [0], this.camera);
    sprite.z = 8;
    sprite.x = -700;
    sprite.y = 10;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["islandA2.txt"] || "", [0], this.camera);
    sprite.z = 7.5;
    sprite.x = -1200;
    sprite.y = 40;
    this.sprites.push(sprite);

    // Land
    sprite = new Sprite(this.assets["landA1.txt"] || "", [0], this.camera);
    sprite.z = 6.5;
    sprite.x = -sprite.width * 1.75;
    sprite.y = 50;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["landA0.txt"] || "", [0], this.camera);
    sprite.z = 6;
    sprite.x = -sprite.width * 5;
    sprite.y = 80;
    this.sprites.push(sprite);

    // Balloons
    sprite = new Sprite(this.assets["ballon.txt"] || "", [0], this.camera);
    sprite.z = 7;
    sprite.x = -sprite.width * 5;
    sprite.y = 0;
    sprite.speedX = 0.125;
    this.sprites.push(sprite);
    this.clouds.push(sprite);

    sprite = new Sprite(this.assets["ballon.txt"] || "", [0], this.camera);
    sprite.z = 7.5;
    sprite.x = -sprite.width * 40;
    sprite.y = -100;
    sprite.speedX = 0.125;
    this.sprites.push(sprite);
    this.clouds.push(sprite);

    // Hills
    sprite = new Sprite(this.assets["hillA1.txt"] || "", [0], this.camera);
    sprite.z = 5;
    sprite.x = -sprite.width * 5;
    sprite.y = 120;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["hillA2.txt"] || "", [0], this.camera);
    sprite.z = 5.5;
    sprite.x = 0;
    sprite.y = 110;
    this.sprites.push(sprite);

    sprite = new Sprite(
      this.assets["hillA0.txt"] || "",
      [0, 1, 2, 3, 4, 3, 2, 1],
      this.camera,
    );
    sprite.z = 4.5;
    sprite.x = (-sprite.width / 2) * sprite.z;
    sprite.y = 190;
    this.sprites.push(sprite);
    this.slowAnim.push(sprite);

    // Cows
    this.cowA = new Sprite(
      this.assets["cowA.txt"] || "",
      [0, 1, 2, 3, 4, 3, 2, 1],
      this.camera,
    );
    this.cowA.z = 4.5;
    this.cowA.x = (-this.cowA.width / 2) * this.cowA.z;
    this.cowA.y = 190;
    this.sprites.push(this.cowA);
    this.slowAnim.push(this.cowA);

    this.cowB = new Sprite(
      this.assets["cowB.txt"] || "",
      [0, 1, 2, 3, 4, 3, 2, 1],
      this.camera,
    );
    this.cowB.z = 4.5;
    this.cowB.x = (-this.cowB.width / 2) * this.cowB.z;
    this.cowB.y = 190;
    this.sprites.push(this.cowB);
    this.slowAnim.push(this.cowB);

    this.cowC = new Sprite(
      this.assets["cowC.txt"] || "",
      [0, 1, 2, 3, 4, 3, 2, 1],
      this.camera,
    );
    this.cowC.z = 4.5;
    this.cowC.x = (-this.cowC.width / 2) * this.cowC.z;
    this.cowC.y = 190;
    this.sprites.push(this.cowC);
    this.slowAnim.push(this.cowC);

    this.cowD = new Sprite(
      this.assets["cowD.txt"] || "",
      [0, 1, 2, 3, 4, 3, 2, 1],
      this.camera,
    );
    this.cowD.z = 4.5;
    this.cowD.x = (-this.cowD.width / 2) * this.cowD.z;
    this.cowD.y = 190;
    this.sprites.push(this.cowD);
    this.slowAnim.push(this.cowD);

    this.cowE = new Sprite(
      this.assets["cowE.txt"] || "",
      [0, 1, 2, 3, 4, 3, 2, 1],
      this.camera,
    );
    this.cowE.z = 4.5;
    this.cowE.x = (-this.cowE.width / 2) * this.cowE.z;
    this.cowE.y = 190;
    this.sprites.push(this.cowE);
    this.slowAnim.push(this.cowE);

    // Spaceship
    this.spaceship = new Sprite(
      this.assets["spaceship.txt"] || "",
      [0],
      this.titleCamera,
    );
    this.spaceship.z = 1;
    this.spaceship.x = -this.width / 2 - this.spaceship.width;
    this.spaceship.y = -this.height / 2;
    this.sprites.push(this.spaceship);

    // Farm car
    this.farmCar = new Sprite(
      this.assets["farmCar.txt"] || "",
      [0],
      this.camera,
    );
    this.farmCar.z = 4.5;
    this.farmCar.x = 325;
    this.farmCar.y = 280;
    this.sprites.push(this.farmCar);

    // Car far
    this.carFar = new Sprite(this.assets["carfar.txt"] || "", [0], this.camera);
    this.carFar.z = 4.5;
    this.carFar.x = -60;
    this.carFar.y = 265;
    this.sprites.push(this.carFar);

    // Forest
    sprite = new Sprite(this.assets["forest.txt"] || "", [0], this.camera);
    sprite.z = 3;
    sprite.x = (-sprite.width / 2) * sprite.z;
    sprite.y = 315;
    this.sprites.push(sprite);

    // Signs
    if (!this.noncommercial) {
      sprite = new Sprite(this.assets["sign1.txt"] || "", [0], this.camera);
      sprite.z = 3;
      sprite.x = (-sprite.width / 2) * sprite.z;
      sprite.y = 336;
      this.sprites.push(sprite);
    }

    // Cars
    this.car = new Sprite(this.assets["cars.txt"] || "", [0], this.camera);
    this.car.z = 3;
    this.car.x =
      (-this.car.width * Math.random() + this.car.width * Math.random()) *
      this.car.z;
    this.car.y = 342;
    this.sprites.push(this.car);

    this.cat = new Sprite(
      this.assets["cars3.txt"] || "",
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      this.camera,
    );
    this.cat.z = 3;
    this.cat.x =
      (-this.cat.width * Math.random() + this.cat.width * Math.random()) *
      this.cat.z;
    this.cat.y = 343.5;
    this.sprites.push(this.cat);

    this.car2 = new Sprite(this.assets["cars2.txt"] || "", [0], this.camera);
    this.car2.z = 3;
    this.car2.x =
      (-this.car.width * Math.random() + this.car.width * Math.random()) *
      this.car2.z;
    this.car2.y = 345;
    this.sprites.push(this.car2);

    // Bridge 2
    sprite = new Sprite(this.assets["bridge2.txt"] || "", [0], this.camera);
    sprite.z = 1.33;
    sprite.x = (-sprite.width / 2) * sprite.z;
    sprite.y = 375;
    this.sprites.push(sprite);

    // Forest 1
    for (let i = 0; i < 1; i++) {
      sprite = new Sprite(this.assets["forest1.txt"] || "", [0], this.camera);
      sprite.z = 2;
      sprite.x = (-sprite.width / 2) * sprite.z;
      sprite.y = 360 + i * (2 + Math.random());
      this.sprites.push(sprite);
    }

    // Sig
    sprite = new Sprite(this.assets["sig.txt"] || "", [0], this.camera);
    sprite.z = 2.75;
    sprite.x = (this.width / 2) * sprite.z - sprite.width * sprite.z;
    sprite.y = 347;
    this.sprites.push(sprite);

    // Front hill
    sprite = new Sprite(this.assets["frontHill2.txt"] || "", [0], this.camera);
    sprite.z = 1.5;
    sprite.x = (-sprite.width / 1.25) * sprite.z;
    sprite.y = 345;
    this.sprites.push(sprite);

    // Sign 2
    if (!this.noncommercial) {
      sprite = new Sprite(this.assets["sign2.txt"] || "", [0], this.camera);
      sprite.z = 1.33;
      sprite.x = (-sprite.width / 2) * sprite.z;
      sprite.y = 369;
      this.sprites.push(sprite);
    }

    // Bridge and train
    sprite = new Sprite(this.assets["bridge.txt"] || "", [0], this.camera);
    sprite.z = 1.33;
    sprite.x = (-sprite.width / 2) * sprite.z;
    sprite.y = 375;
    this.sprites.push(sprite);

    this.train = new Sprite(this.assets["train.txt"] || "", [0], this.camera);
    this.train.z = 1.33;
    this.train.x = (-this.train.width / 2) * this.train.z;
    this.train.y = 372.5;
    this.sprites.push(this.train);

    sprite = new Sprite(this.assets["bridge2.txt"] || "", [0], this.camera);
    sprite.z = 1.33;
    sprite.x = (-sprite.width / 2) * sprite.z;
    sprite.y = 375;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["frontHill2.txt"] || "", [0], this.camera);
    sprite.z = 1.25;
    sprite.x = (-sprite.width / 4) * sprite.z;
    sprite.y = 370;
    this.sprites.push(sprite);

    // Sign 3
    if (!this.noncommercial) {
      sprite = new Sprite(this.assets["sign3.txt"] || "", [0], this.camera);
      sprite.z = 1.25;
      sprite.x = (-sprite.width / 2) * sprite.z;
      sprite.y = 394;
      this.sprites.push(sprite);
    }

    // Front forest
    for (let i = 0; i < 2; i++) {
      sprite = new Sprite(this.assets["forest2.txt"] || "", [0], this.camera);
      sprite.z = 1.4;
      sprite.x =
        (-sprite.width / (2 + Math.random() * 2 - Math.random() * 2)) *
        sprite.z;
      sprite.y = 380 + i * (2 + Math.random());
      this.sprites.push(sprite);
    }

    for (let i = 0; i < 2; i++) {
      sprite = new Sprite(this.assets["forest2.txt"] || "", [0], this.camera);
      sprite.z = 1.3;
      sprite.x =
        (-sprite.width / (2 + Math.random() * 2 - Math.random() * 2)) *
        sprite.z;
      sprite.y = 390.5 + i * (2 + Math.random());
      this.sprites.push(sprite);
    }

    sprite = new Sprite(this.assets["forest2.txt"] || "", [0], this.camera);
    sprite.z = 1.15;
    sprite.x = -100;
    sprite.y = 393.5;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["forest2.txt"] || "", [0], this.camera);
    sprite.z = 1.15;
    sprite.x = -400;
    sprite.y = 392;
    this.sprites.push(sprite);

    // Transition
    sprite = new Sprite(this.assets["transition.txt"] || "", [0], this.camera);
    sprite.z = 1.2;
    sprite.x = (-sprite.width / 2) * sprite.z;
    sprite.y = 400;
    this.sprites.push(sprite);

    sprite = new Sprite(this.assets["transition.txt"] || "", [0], this.camera);
    sprite.z = 1;
    sprite.x = (-sprite.width / 2) * sprite.z;
    sprite.y = 410;
    this.sprites.push(sprite);

    // Sort: sprites by descending Z, fragSprites by ascending Z
    this.sprites.sort((a, b) => b.z - a.z);
    this.fragSprites.sort((a, b) => a.z - b.z);

    console.log(
      `Initialized ${this.sprites.length} sprites, ${this.clouds.length} clouds`,
    );
  }

  private setup = (time: number, render: RenderBuffer) => {
    // Animate spaceship
    this.spaceship?.animate(Math.floor(time / 100), 0);

    // Handle cow stealing
    this.handleCowStealing();

    // Update camera from page scroll
    const scrollTop = document.scrollingElement
      ? document.scrollingElement.scrollTop
      : window.pageYOffset;
    this.camera[1] = scrollTop * -(1 / (this.mobile ? 8 : 16));

    // Animate objects
    this.animateObjects(time);

    // Draw all sprites
    for (const sprite of this.sprites) {
      sprite.drawTo(render);
    }
  };

  private main = (ctx: RenderContext): number => {
    // Check if animation element is in viewport
    const mainElement = document.getElementById(`animASCII_${this.elementId}`);
    if (mainElement) {
      const mainRect = mainElement.getBoundingClientRect();
      if (mainRect.bottom < 0 || mainRect.top > window.innerHeight) {
        return 32; // Space for out-of-viewport
      }
    }

    for (const sprite of this.fragSprites) {
      const spritePrint = sprite.fragment(ctx);
      if (spritePrint) return spritePrint;
    }
    return 32; // Space
  };

  handleCowStealing() {
    // COW A
    if (
      window.userDown &&
      !this.cowAsteal &&
      !this.cowBsteal &&
      !this.cowCsteal &&
      !this.cowDsteal &&
      !this.cowEsteal
    ) {
      const data = this.cowA?.dataAt(window.userX, window.userY);
      if (data && data !== 9608) {
        this.cowAsteal = 1;
        this.cowAX = window.userX;
        document.body.style.overflow = "hidden";
      }
    }
    if (this.cowAsteal === 1 && this.spaceship) {
      if (this.spaceship.displayX() + this.spaceship.width / 2 < this.cowAX) {
        this.spaceship.x +=
          (this.cowAX -
            (this.spaceship.displayX() + this.spaceship.width / 2)) /
            10 +
          0.1;
      } else {
        this.spaceship.sequence = [1, 2, 3, 4];
        this.cowAsteal = 2;
        if (this.cowA) this.cowA.sequence = [0];
      }
    }
    if (this.cowAsteal === 2 && this.cowA) {
      if (this.cowA.displayY() > -25) {
        this.cowA.y -= this.inertia;
        this.inertia *= 1.03;
      } else {
        this.cowAsteal = 3;
        if (this.spaceship) {
          this.spaceship.sequence = [0];
          this.spaceship.sequenceIndex = 0;
          this.spaceship.sequenceFrame = 0;
        }
      }
    }
    if (this.cowAsteal === 3 && this.spaceship) {
      if (this.spaceship.x < this.width / 2) {
        this.spaceship.x +=
          (this.spaceship.displayX() + this.spaceship.width / 2 - this.cowAX) /
            10 +
          0.1;
      } else {
        this.cowAsteal = 0;
        this.inertia = 0.1;
        if (this.cowA) this.cowA.y = Infinity;
        this.spaceship.x = -this.width / 2 - this.spaceship.width;
        document.body.style.overflow = "initial";
      }
    }

    // COW B (same pattern)
    if (
      window.userDown &&
      !this.cowAsteal &&
      !this.cowBsteal &&
      !this.cowCsteal &&
      !this.cowDsteal &&
      !this.cowEsteal
    ) {
      const data = this.cowB?.dataAt(window.userX, window.userY);
      if (data && data !== 9608) {
        this.cowBsteal = 1;
        this.cowBX = window.userX;
        document.body.style.overflow = "hidden";
      }
    }
    if (this.cowBsteal === 1 && this.spaceship) {
      if (this.spaceship.displayX() + this.spaceship.width / 2 < this.cowBX) {
        this.spaceship.x +=
          (this.cowBX -
            (this.spaceship.displayX() + this.spaceship.width / 2)) /
            10 +
          0.1;
      } else {
        this.spaceship.sequence = [1, 2, 3, 4];
        this.cowBsteal = 2;
        if (this.cowB) this.cowB.sequence = [0];
      }
    }
    if (this.cowBsteal === 2 && this.cowB) {
      if (this.cowB.displayY() > -25) {
        this.cowB.y -= this.inertia;
        this.inertia *= 1.03;
      } else {
        this.cowBsteal = 3;
        this.inertia = 0.1;
        if (this.spaceship) {
          this.spaceship.sequence = [0];
          this.spaceship.sequenceIndex = 0;
          this.spaceship.sequenceFrame = 0;
        }
      }
    }
    if (this.cowBsteal === 3 && this.spaceship) {
      if (this.spaceship.x < this.width / 2) {
        this.spaceship.x +=
          (this.spaceship.displayX() + this.spaceship.width / 2 - this.cowBX) /
            10 +
          0.1;
      } else {
        this.cowBsteal = 0;
        if (this.cowB) this.cowB.y = Infinity;
        this.spaceship.x = -this.width / 2 - this.spaceship.width;
        document.body.style.overflow = "initial";
      }
    }

    // COW C
    if (
      window.userDown &&
      !this.cowAsteal &&
      !this.cowBsteal &&
      !this.cowCsteal &&
      !this.cowDsteal &&
      !this.cowEsteal
    ) {
      const data = this.cowC?.dataAt(window.userX, window.userY);
      if (data && data !== 9608) {
        this.cowCsteal = 1;
        this.cowCX = window.userX;
        document.body.style.overflow = "hidden";
      }
    }
    if (this.cowCsteal === 1 && this.spaceship) {
      if (this.spaceship.displayX() + this.spaceship.width / 2 < this.cowCX) {
        this.spaceship.x +=
          (this.cowCX -
            (this.spaceship.displayX() + this.spaceship.width / 2)) /
            10 +
          0.1;
      } else {
        this.spaceship.sequence = [1, 2, 3, 4];
        this.cowCsteal = 2;
        if (this.cowC) this.cowC.sequence = [0];
      }
    }
    if (this.cowCsteal === 2 && this.cowC) {
      if (this.cowC.displayY() > -25) {
        this.cowC.y -= this.inertia;
        this.inertia *= 1.03;
      } else {
        this.cowCsteal = 3;
        if (this.spaceship) {
          this.spaceship.sequence = [0];
          this.spaceship.sequenceIndex = 0;
          this.spaceship.sequenceFrame = 0;
        }
      }
    }
    if (this.cowCsteal === 3 && this.spaceship) {
      if (this.spaceship.x < this.width / 2) {
        this.spaceship.x +=
          (this.spaceship.displayX() + this.spaceship.width / 2 - this.cowCX) /
            10 +
          0.1;
      } else {
        this.cowCsteal = 0;
        this.inertia = 0.1;
        if (this.cowC) this.cowC.y = Infinity;
        this.spaceship.x = -this.width / 2 - this.spaceship.width;
        document.body.style.overflow = "initial";
      }
    }

    // COW D
    if (
      window.userDown &&
      !this.cowAsteal &&
      !this.cowBsteal &&
      !this.cowCsteal &&
      !this.cowDsteal &&
      !this.cowEsteal
    ) {
      const data = this.cowD?.dataAt(window.userX, window.userY);
      if (data && data !== 9608) {
        this.cowDsteal = 1;
        this.cowDX = window.userX;
        document.body.style.overflow = "hidden";
      }
    }
    if (this.cowDsteal === 1 && this.spaceship) {
      if (this.spaceship.displayX() + this.spaceship.width / 2 < this.cowDX) {
        this.spaceship.x +=
          (this.cowDX -
            (this.spaceship.displayX() + this.spaceship.width / 2)) /
            10 +
          0.1;
      } else {
        this.spaceship.sequence = [1, 2, 3, 4];
        this.cowDsteal = 2;
        if (this.cowD) this.cowD.sequence = [0];
      }
    }
    if (this.cowDsteal === 2 && this.cowD) {
      if (this.cowD.displayY() > -25) {
        this.cowD.y -= this.inertia;
        this.inertia *= 1.03;
      } else {
        this.cowDsteal = 3;
        if (this.spaceship) {
          this.spaceship.sequence = [0];
          this.spaceship.sequenceIndex = 0;
          this.spaceship.sequenceFrame = 0;
        }
      }
    }
    if (this.cowDsteal === 3 && this.spaceship) {
      if (this.spaceship.x < this.width / 2) {
        this.spaceship.x +=
          (this.spaceship.displayX() + this.spaceship.width / 2 - this.cowDX) /
            10 +
          0.1;
      } else {
        this.cowDsteal = 0;
        this.inertia = 0.1;
        if (this.cowD) this.cowD.y = Infinity;
        this.spaceship.x = -this.width / 2 - this.spaceship.width;
        document.body.style.overflow = "initial";
      }
    }

    // COW E
    if (
      window.userDown &&
      !this.cowAsteal &&
      !this.cowBsteal &&
      !this.cowCsteal &&
      !this.cowDsteal &&
      !this.cowEsteal
    ) {
      const data = this.cowE?.dataAt(window.userX, window.userY);
      if (data && data !== 9608) {
        this.cowEsteal = 1;
        this.cowEX = window.userX;
        document.body.style.overflow = "hidden";
      }
    }
    if (this.cowEsteal === 1 && this.spaceship) {
      if (this.spaceship.displayX() + this.spaceship.width / 2 < this.cowEX) {
        this.spaceship.x +=
          (this.cowEX -
            (this.spaceship.displayX() + this.spaceship.width / 2)) /
            10 +
          0.1;
      } else {
        this.spaceship.sequence = [1, 2, 3, 4];
        this.cowEsteal = 2;
        if (this.cowE) this.cowE.sequence = [0];
      }
    }
    if (this.cowEsteal === 2 && this.cowE) {
      if (this.cowE.displayY() > -25) {
        this.cowE.y -= this.inertia;
        this.inertia *= 1.03;
      } else {
        this.cowEsteal = 3;
        if (this.spaceship) {
          this.spaceship.sequence = [0];
          this.spaceship.sequenceIndex = 0;
          this.spaceship.sequenceFrame = 0;
        }
      }
    }
    if (this.cowEsteal === 3 && this.spaceship) {
      if (this.spaceship.x < this.width / 2) {
        this.spaceship.x +=
          (this.spaceship.displayX() + this.spaceship.width / 2 - this.cowEX) /
            10 +
          0.1;
      } else {
        this.cowEsteal = 0;
        this.inertia = 0.1;
        if (this.cowE) this.cowE.y = Infinity;
        this.spaceship.x = -this.width / 2 - this.spaceship.width;
        document.body.style.overflow = "initial";
      }
    }
  }

  animateObjects(time: number) {
    // Clouds
    for (const cloud of this.clouds) {
      cloud.move(time / 50, [-1, 0]);
      cloud.x =
        cloud.x < (-this.width / 2 - cloud.width) * cloud.z
          ? (this.width / 2) * cloud.z
          : cloud.x;
    }

    // Plane
    if (this.plane) {
      this.plane.animate(Math.floor(time / 200), 0);
      this.plane.move(time, [-0.5, 0]);
      this.plane.x =
        this.plane.x < (-this.width / 2 - this.plane.width) * this.plane.z
          ? (this.width / 2) * this.plane.z
          : this.plane.x;
    }

    // Birds
    for (let i = 0; i < this.birds.length; i++) {
      this.birds[i].animate(Math.floor(time / 75), (i + 1) ** (i + 1));
      this.birds[i].move(time / 30, [-1, 0]);
      this.birds[i].x =
        this.birds[i].x <
        (-this.width / 2 - this.birds[i].width) * this.birds[i].z
          ? (this.width / 2) * this.birds[i].z
          : this.birds[i].x;
    }

    // Birds 2
    for (let i = 0; i < this.birds2.length; i++) {
      this.birds2[i].animate(Math.floor(time / 150), (i + 1) ** (i + 1));
      this.birds2[i].move(time / 30, [-1, 0]);
      this.birds2[i].x =
        this.birds2[i].x <
        (-this.width / 2 - this.birds2[i].width) * this.birds2[i].z
          ? (this.width / 2) * this.birds2[i].z
          : this.birds2[i].x;
    }

    // Witch
    if (this.witch) {
      this.witch.y = 400 + Math.floor(Math.sin(time / 400) * 2);
    }

    // Train
    if (this.train) {
      this.train.move(time / 15, [1, 0]);
      this.train.x =
        this.train.x > (this.width / 2 + this.train.width) * this.train.z
          ? (-this.width / 2 - this.train.width) * this.train.z
          : this.train.x;
    }

    // Cat (car3)
    if (this.cat) {
      this.cat.move(time / 15, [1.5, 0]);
      this.cat.animate(Math.floor(time / 60), 0);
      this.cat.x =
        this.cat.x > (this.width / 2 + this.cat.width) * this.cat.z
          ? (-this.width / 2 - this.cat.width) * this.cat.z
          : this.cat.x;
    }

    // Boat
    if (this.boat) {
      this.boat.move(time / 120, [1, 0]);
      this.boat.x =
        this.boat.x > (this.width / 2 + this.boat.width) * this.boat.z
          ? (-this.width / 2 - this.boat.width) * this.boat.z
          : this.boat.x;
    }

    // Cars
    if (this.car) {
      this.car.move(time / 15, [1, 0]);
      this.car.x =
        this.car.x > (this.width / 2 + this.car.width) * this.car.z
          ? (-this.width / 2 - this.car.width) * this.car.z
          : this.car.x;
    }
    if (this.car2) {
      this.car2.move(time / 15, [-1, 0]);
      this.car2.x =
        this.car2.x < (-this.width / 2 - this.car2.width) * this.car2.z
          ? (this.width / 2) * this.car2.z
          : this.car2.x;
    }

    // Shark
    if (this.shark) {
      this.shark.move(time / 120, [Math.sin(time / 1000) * 2, 0]);
    }

    // Farm car
    if (this.farmCar) {
      this.farmCar.move(time / 60, [Math.sin(time / 1000) * 2, 0]);
    }

    // Car far
    if (this.carFar) {
      this.carFar.move(time / 60, [Math.sin(time / 1000) * 6, 0]);
    }

    // Slow animations
    for (const anim of this.slowAnim) {
      anim.animate(Math.floor(time / 200), 0);
    }
  }

  startAnimation() {
    if (this.output) {
      console.log("Starting ASCII animation loop...");
      this.animationId = animation(
        this.setup,
        this.main,
        this.width,
        this.height,
        this.output,
      );
    } else {
      console.error("Output element is null, cannot start animation");
    }
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stopAnimation();
    if (this.resizeHandler)
      window.removeEventListener("resize", this.resizeHandler);
    if (this.mousedownHandler)
      document.removeEventListener("mousedown", this.mousedownHandler);
    if (this.mouseupHandler)
      document.removeEventListener("mouseup", this.mouseupHandler);
    if (this.mousemoveHandler)
      document.removeEventListener("mousemove", this.mousemoveHandler);
    if (this.touchstartHandler)
      document.removeEventListener("touchstart", this.touchstartHandler);
    if (this.touchendHandler)
      document.removeEventListener("touchend", this.touchendHandler);
  }
}
