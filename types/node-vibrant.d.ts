declare module 'node-vibrant' {
  interface VibrantOptions {
    quality?: number;
    maxColorSize?: number;
    region?: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
    quantizer?: any;
    generator?: any;
  }

  interface Swatch {
    getHsl(): { h: number; s: number; l: number };
    getRgb(): { r: number; g: number; b: number };
    getPopulation(): number;
    getHex(): string;
  }

  interface Palette {
    Vibrant: Swatch | null;
    DarkVibrant: Swatch | null;
    LightVibrant: Swatch | null;
    Muted: Swatch | null;
    DarkMuted: Swatch | null;
    LightMuted: Swatch | null;
  }

  export default class Vibrant {
    static from(source: any): Vibrant;
    getPalette(): Promise<Palette>;
    swatches(): Palette;
    getPalette(callback: (err: Error, palette: Palette) => void): this;
  }
}