declare const Buffer: {
  from(data: string | ArrayBuffer, encoding?: string): any;
  alloc?(size: number): any;
};

declare const process: {
  env: Record<string, string | undefined>;
};

declare module 'node:crypto' {
  export type BinaryLike = string | ArrayBuffer | ArrayBufferView;
  export interface Hash {
    update(data: BinaryLike): Hash;
    digest(): any;
    digest(encoding: 'hex'): string;
  }
  export interface Hmac {
    update(data: BinaryLike): Hmac;
    digest(): any;
    digest(encoding: 'hex'): string;
  }
  export function createHash(algorithm: string): Hash;
  export function createHmac(algorithm: string, key: BinaryLike): Hmac;
  export function timingSafeEqual(a: any, b: any): boolean;
}
